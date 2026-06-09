const COLORES      = ['#e74c3c', '#3498db', '#2ecc71', '#f0c040'];
const ANCHO        = 900;
const ALTO         = 500;
const VEL_MOV      = 5;
const FUERZA_SALTO = -16;
const TAM_JUGADOR  = 35;
const GRAVEDAD     = 2.5;

let engine, render, runner;
let jugadoresBody = [];
let llave, puerta;
let llaveRecogida   = false;
let portadorLlave   = -1;
let nivelActual     = 1;
let nivelCompletado = false;
let faseActual      = 'espera';
let cursorNivel     = 1;
let inputs          = [{}, {}, {}, {}];
const jumpAnterior  = [false, false, false, false];
const saltosExtra   = [0, 0, 0, 0];

const socket = io({ query: { tipo: 'host' } });

socket.on('estadoCompleto', (data) => {
  inputs = data.inputs || [{}, {}, {}, {}];
  const nuevaFase = data.fase || 'seleccion';
  if (data.nivelCursor !== cursorNivel) { cursorNivel = data.nivelCursor; actualizarCursorUI(); }
  if (nuevaFase !== faseActual) { faseActual = nuevaFase; aplicarFase(faseActual, data.nivel); }
  data.jugadores.forEach((j, i) => {
    const el = document.getElementById(`hud-${i}`);
    if (!el) return;
    j ? el.classList.add('conectado') : el.classList.remove('conectado');
  });
  const hayAlguien = data.jugadores.some(j => j !== null);
  mostrarPantalla(hayAlguien ? nuevaFase : 'espera');
});

socket.on('ipServidor', (ip) => { document.getElementById('ip-display').textContent = ip; });
socket.on('jugadorConectado',    ({ indice }) => agregarJugador(indice));
socket.on('jugadorDesconectado', ({ indice }) => { quitarJugador(indice); if (portadorLlave === indice) respawnLlave(); });
socket.on('inputDirecto', ({ indice, accion, valor }) => { if (inputs[indice]) inputs[indice][accion] = valor; });
socket.on('iniciarNivel', ({ nivel }) => { faseActual = 'jugando'; cargarNivel(nivel); mostrarPantalla('jugando'); });

function mostrarPantalla(fase) {
  document.getElementById('pantalla-espera').style.display    = fase === 'espera'    ? 'flex' : 'none';
  document.getElementById('pantalla-seleccion').style.display = fase === 'seleccion' ? 'flex' : 'none';
  document.getElementById('canvas').style.opacity             = fase === 'jugando'   ? '1'    : '0.15';
  document.getElementById('nivel-label').textContent          = fase === 'jugando'   ? `Nivel ${nivelActual}` : '';
}

function aplicarFase(fase, nivel) {
  if (fase === 'seleccion') { mostrarPantalla('seleccion'); actualizarCursorUI(); }
  else if (fase === 'jugando') { cargarNivel(nivel); mostrarPantalla('jugando'); }
}

function actualizarCursorUI() {
  [1, 2, 3].forEach(n => document.getElementById(`card-${n}`)?.classList.toggle('seleccionado', n === cursorNivel));
}

function iniciarMotor() {
  engine = Matter.Engine.create();
  engine.gravity.y = GRAVEDAD;
  const canvas = document.getElementById('canvas');
  render = Matter.Render.create({ canvas, engine, options: { width: ANCHO, height: ALTO, wireframes: false, background: '#1a1a2e' } });
  runner = Matter.Runner.create();
  Matter.Render.run(render);
  Matter.Runner.run(runner, engine);
  setInterval(procesarInputs, 1000 / 60);
  mostrarPantalla('espera');
}

function agregarJugador(indice) {
  if (jugadoresBody[indice]) return;
  const cuerpo = Matter.Bodies.rectangle(80 + indice * 60, ALTO - 100, TAM_JUGADOR, TAM_JUGADOR, {
    label: 'jugador', friction: 0.05, frictionAir: 0.01, restitution: 0,
    inertia: Infinity, inverseInertia: 0,
    collisionFilter: { category: 0x0001, mask: 0xFFFF },
    render: { fillStyle: COLORES[indice] }
  });
  cuerpo.indice = indice; cuerpo.enPuerta = false; cuerpo.enSuelo = false;
  Matter.World.add(engine.world, cuerpo);
  jugadoresBody[indice] = cuerpo;
}

function quitarJugador(indice) {
  const c = jugadoresBody[indice];
  if (!c) return;
  Matter.World.remove(engine.world, c);
  jugadoresBody[indice] = null;
  inputs[indice] = {};
  saltosExtra[indice] = 0;
  actualizarHUDLlave();
}

function estaEnSuelo(cuerpo) {
  const { x, y } = cuerpo.position;
  const mitad = TAM_JUGADOR / 2;
  const puntos = [
    { x: x - mitad + 4, y: y + mitad + 6 },
    { x: x,             y: y + mitad + 6 },
    { x: x + mitad - 4, y: y + mitad + 6 },
  ];
  const cuerpos = Matter.Composite.allBodies(engine.world);
  return puntos.some(p => cuerpos.some(b => {
    if (b === cuerpo) return false;
    if (!b.isStatic && b.label !== 'jugador' && b.label !== 'caja') return false;
    return Matter.Bounds.contains(b.bounds, p);
  }));
}

let llavePosOriginal = { x: 0, y: 0 };

function crearLlave(x, y) {
  llavePosOriginal = { x, y };
  llave = Matter.Bodies.circle(x, y, 14, { isStatic: true, isSensor: true, label: 'llave', render: { fillStyle: '#f0c040' } });
  Matter.World.add(engine.world, llave);
  llaveRecogida = false; portadorLlave = -1;
  actualizarHUDLlave();
}

function respawnLlave() {
  if (llave && Matter.Composite.allBodies(engine.world).includes(llave)) Matter.World.remove(engine.world, llave);
  if (puerta) puerta.render.fillStyle = '#888';
  crearLlave(llavePosOriginal.x, llavePosOriginal.y);
}

function actualizarHUDLlave() {
  for (let i = 0; i < 4; i++) {
    const el = document.getElementById(`hud-${i}`);
    if (!el) continue;
    i === portadorLlave ? el.classList.add('tiene-llave') : el.classList.remove('tiene-llave');
  }
}

function plat(x, y, w, color = '#6a6aaa') {
  return Matter.Bodies.rectangle(x, y, w, 20, { isStatic: true, label: 'plataforma', render: { fillStyle: color } });
}

function crearCaja(x, y) {
  return Matter.Bodies.rectangle(x, y, 45, 45, {
    label: 'caja', friction: 0.3, frictionAir: 0.02, restitution: 0.1,
    density: 0.002, inertia: Infinity, inverseInertia: 0,
    render: { fillStyle: '#a0522d' }
  });
}

function limpiarEscenario() {
  const cuerposJug = jugadoresBody.filter(Boolean);
  Matter.Composite.allBodies(engine.world).forEach(b => { if (!cuerposJug.includes(b)) Matter.World.remove(engine.world, b); });
  Matter.Events.off(engine, 'collisionStart');
  llaveRecogida = false; portadorLlave = -1; nivelCompletado = false;
  jugadoresBody.forEach(j => { if (!j) return; j.enPuerta = false; Matter.Body.setVelocity(j, { x: 0, y: 0 }); });
  saltosExtra.fill(0);
  actualizarHUDLlave();
}

function cargarNivel(numero) {
  if (engine) limpiarEscenario();
  nivelActual = numero;
  document.getElementById('nivel-label').textContent = `Nivel ${numero}`;

  const { Bodies, World } = Matter;
  const base = [
    Bodies.rectangle(ANCHO/2,  ALTO+25,  ANCHO+100, 50, { isStatic:true, label:'piso',  render:{fillStyle:'#4a4a8a'} }),
    Bodies.rectangle(-25,       ALTO/2,  50, ALTO+100,   { isStatic:true, label:'pared', render:{fillStyle:'#4a4a8a'} }),
    Bodies.rectangle(ANCHO+25,  ALTO/2,  50, ALTO+100,   { isStatic:true, label:'pared', render:{fillStyle:'#4a4a8a'} }),
    Bodies.rectangle(ANCHO/2,   -25,     ANCHO+100, 50,  { isStatic:true, label:'techo', render:{fillStyle:'#4a4a8a'} }),
  ];

  let extras = [], llaveX, llaveY;

  if (numero === 1) {
    /*
      NIVEL 1 — Muy fácil
      Todo casi al ras del piso. La llave está en una plataforma baja
      accesible con un salto corto. La puerta al lado.
      Ideal para demostrar la mecánica de la llave al profe.

      [spawn]──────plat──[llave]    [puerta]
                   (baja, fácil de llegar)
    */
    puerta = Bodies.rectangle(750, ALTO - 75, 40, 80, {
      isStatic:true, isSensor:true, label:'puerta', render:{fillStyle:'#888'}
    });
    extras = [
      plat(350, 360, 200),        // plataforma baja con la llave
      plat(600, 380, 180),        // puente hacia la puerta
      crearCaja(180, ALTO - 65),  // caja empujable de demostración
      puerta,
    ];
    llaveX = 350; llaveY = 328;   // encima de la plataforma baja

  } else if (numero === 2) {
    /*
      NIVEL 2 — Medio
      Dos escalones. La llave está en el segundo escalón.
      Con la caja podés subir al segundo escalón sin saltar tanto.
      En grupo: uno se sube al otro.
    */
    puerta = Bodies.rectangle(ANCHO - 55, ALTO - 75, 40, 80, {
      isStatic:true, isSensor:true, label:'puerta', render:{fillStyle:'#888'}
    });
    extras = [
      plat(250, 360, 180),              // escalón 1
      plat(500, 250, 180, '#8a5aee'),   // escalón 2 — llave acá
      plat(730, 360, 160),              // puente puerta
      crearCaja(420, ALTO - 65),        // caja para subir al escalón 2
      puerta,
    ];
    llaveX = 500; llaveY = 218;

  } else if (numero === 3) {
    /*
      NIVEL 3 — Difícil
      Tres escalones, cajas que bloquean, requiere coordinación.
      La llave está arriba. Doble salto necesario o apilarse.
    */
    puerta = Bodies.rectangle(ANCHO - 55, ALTO - 75, 40, 80, {
      isStatic:true, isSensor:true, label:'puerta', render:{fillStyle:'#888'}
    });
    extras = [
      plat(220, 370, 150),
      plat(420, 270, 140),
      plat(640, 170, 150, '#8a5aee'),  // llave acá
      plat(800, 320, 130),             // puente puerta
      crearCaja(300, ALTO - 65),
      crearCaja(360, ALTO - 65),
      puerta,
    ];
    llaveX = 640; llaveY = 138;
  }

  World.add(engine.world, [...base, ...extras]);
  crearLlave(llaveX, llaveY);

  jugadoresBody.forEach((j, i) => {
    if (!j) return;
    Matter.Body.setPosition(j, { x: 60 + i * 55, y: ALTO - 100 });
    Matter.Body.setVelocity(j, { x: 0, y: 0 });
    j.enPuerta = false;
  });

  registrarColisiones();
}

function registrarColisiones() {
  Matter.Events.on(engine, 'collisionStart', (ev) => {
    ev.pairs.forEach(par => { chequear(par.bodyA, par.bodyB); chequear(par.bodyB, par.bodyA); });
  });
}

function chequear(a, b) {
  if (a.label === 'llave' && b.label === 'jugador' && !llaveRecogida) {
    llaveRecogida = true;
    portadorLlave = b.indice;
    Matter.World.remove(engine.world, llave);
    puerta.render.fillStyle = '#2ecc71';
    actualizarHUDLlave();
  }
  if (a.label === 'puerta' && b.label === 'jugador' && llaveRecogida) {
    b.enPuerta = true;
    verificarVictoria();
  }
}

function verificarVictoria() {
  const activos = jugadoresBody.filter(Boolean);
  if (activos.length === 0) return;
  if (activos.every(j => j.enPuerta) && !nivelCompletado) {
    nivelCompletado = true;
    faseActual = 'seleccion';
    setTimeout(() => {
      socket.emit('nivelCompletado');
      mostrarPantalla('seleccion');
      actualizarCursorUI();
    }, 800);
  }
}

function procesarInputs() {
  if (faseActual !== 'jugando') return;

  jugadoresBody.forEach((cuerpo, i) => {
    if (!cuerpo) return;
    const inp = inputs[i] || {};
    const vel = cuerpo.velocity;
    const enSuelo = estaEnSuelo(cuerpo);
    cuerpo.enSuelo = enSuelo;

    if (enSuelo) saltosExtra[i] = 1;

    if (inp.left) {
      Matter.Body.setVelocity(cuerpo, { x: -VEL_MOV, y: vel.y });
    } else if (inp.right) {
      Matter.Body.setVelocity(cuerpo, { x: VEL_MOV, y: vel.y });
    } else {
      Matter.Body.setVelocity(cuerpo, { x: vel.x * 0.7, y: vel.y });
    }

    const jumpAhora = !!inp.jump;
    const flancoSalto = jumpAhora && !jumpAnterior[i];

    if (flancoSalto) {
      if (enSuelo) {
        Matter.Body.setVelocity(cuerpo, { x: cuerpo.velocity.x, y: FUERZA_SALTO });
      } else if (saltosExtra[i] > 0) {
        saltosExtra[i]--;
        Matter.Body.setVelocity(cuerpo, { x: cuerpo.velocity.x, y: FUERZA_SALTO * 0.85 });
      }
    }

    jumpAnterior[i] = jumpAhora;
  });
}

iniciarMotor();