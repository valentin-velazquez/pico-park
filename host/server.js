const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const path       = require('path');
const { networkInterfaces } = require('os');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*' },
  // Reducir latencia de socket.io
  pingInterval: 2000,
  pingTimeout: 5000,
});

app.use(express.static(path.join(__dirname, 'public')));

const COLORES       = ['#e74c3c', '#3498db', '#2ecc71', '#f0c040'];
const MAX_JUGADORES = 4;

const jugadores = [null, null, null, null];
const inputs    = [{}, {}, {}, {}];

let nivelActual    = 1;
let nivelCursor    = 1;
const TOTAL_NIVELES = 3;
let fase       = 'seleccion';
let hostSocket = null;

function ipLocal() {
  const nets = networkInterfaces();
  for (const iface of Object.values(nets)) {
    for (const net of iface || []) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}

function indiceLibre() {
  return jugadores.findIndex(j => j === null);
}

// Estado completo — solo para sincronización periódica (jugadores conectados, nivel, etc.)
function emitirEstado() {
  if (!hostSocket) return;
  hostSocket.emit('estadoCompleto', { jugadores, inputs, nivel: nivelActual, nivelCursor, fase });
}
setInterval(emitirEstado, 1000 / 30);

// Navegación en pantalla de selección
function procesarNavegacion() {
  if (fase !== 'seleccion') return;
  for (let i = 0; i < MAX_JUGADORES; i++) {
    const inp = inputs[i];
    if (inp._leftUsado === undefined)  inp._leftUsado  = false;
    if (inp._rightUsado === undefined) inp._rightUsado = false;
    if (inp._jumpUsado === undefined)  inp._jumpUsado  = false;

    if (inp.left && !inp._leftUsado) {
      inp._leftUsado = true;
      nivelCursor = nivelCursor > 1 ? nivelCursor - 1 : TOTAL_NIVELES;
    } else if (!inp.left) { inp._leftUsado = false; }

    if (inp.right && !inp._rightUsado) {
      inp._rightUsado = true;
      nivelCursor = nivelCursor < TOTAL_NIVELES ? nivelCursor + 1 : 1;
    } else if (!inp.right) { inp._rightUsado = false; }

    if (inp.jump && !inp._jumpUsado) {
      inp._jumpUsado = true;
      nivelActual = nivelCursor;
      fase = 'jugando';
      if (hostSocket) hostSocket.emit('iniciarNivel', { nivel: nivelActual });
    } else if (!inp.jump) { inp._jumpUsado = false; }
  }
}
setInterval(procesarNavegacion, 1000 / 30);

io.on('connection', socket => {
  const tipo = socket.handshake.query.tipo;

  if (tipo === 'host') {
    hostSocket = socket;
    console.log('Host conectado');
    socket.emit('ipServidor', `${ipLocal()}:3000`);
    jugadores.forEach((j, i) => {
      if (j) socket.emit('jugadorConectado', { indice: i, color: j.color });
    });
    socket.on('nivelCompletado', () => {
      fase = 'seleccion';
      for (let i = 0; i < MAX_JUGADORES; i++) {
        inputs[i]._leftUsado  = false;
        inputs[i]._rightUsado = false;
        inputs[i]._jumpUsado  = false;
      }
    });
    socket.on('disconnect', () => { hostSocket = null; });
    return;
  }

  if (tipo !== 'gamepad') return;

  const indice = indiceLibre();
  if (indice === -1) {
    socket.emit('sala-llena');
    socket.disconnect(true);
    return;
  }

  jugadores[indice] = { id: socket.id, color: COLORES[indice] };
  console.log(`Jugador ${indice + 1} conectado`);
  socket.emit('asignacion', { indice, color: COLORES[indice] });
  if (hostSocket) hostSocket.emit('jugadorConectado', { indice, color: COLORES[indice] });

  socket.on('input', ({ accion, valor }) => {
    inputs[indice][accion] = valor;

    // ── Reenvío inmediato al host — elimina el delay del intervalo ──
    if (hostSocket && fase === 'jugando') {
      hostSocket.emit('inputDirecto', { indice, accion, valor });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Jugador ${indice + 1} desconectado`);
    jugadores[indice] = null;
    inputs[indice]    = {};
    if (hostSocket) hostSocket.emit('jugadorDesconectado', { indice });
  });
});

server.listen(3000, '0.0.0.0', () => {
  const ip = ipLocal();
  console.log(`Servidor en http://${ip}:3000`);
  console.log(`IP para el gamepad: ${ip}:3000`);
});