import { useRef, type RefObject } from 'react';
import { View, Text, StyleSheet, Vibration } from 'react-native';

type Accion = 'left' | 'right' | 'jump';

interface Props {
  indice: number;
  color: string;
  activoUI: { left: boolean; right: boolean; jump: boolean };
  onInput: (accion: Accion, valor: boolean) => void;
}

interface Rect { x: number; y: number; width: number; height: number }

export function GamepadView({ indice, color, activoUI, onInput }: Props) {
  const refLeft  = useRef<View>(null);
  const refRight = useRef<View>(null);
  const refJump  = useRef<View>(null);
  const rects    = useRef<Record<Accion, Rect | null>>({ left: null, right: null, jump: null });
  const activos  = useRef<Set<Accion>>(new Set());

  if (!activoUI) return null;

  const NOMBRES = ['Jugador 1', 'Jugador 2', 'Jugador 3', 'Jugador 4'];
  const nombre = NOMBRES[indice] ?? `Jugador ${indice + 1}`;

  function medir(accion: Accion, ref: RefObject<View | null>) {
    return () => {
      ref.current?.measure((_x, _y, width, height, pageX, pageY) => {
        rects.current[accion] = { x: pageX, y: pageY, width, height };
      });
    };
  }

  function zonaEn(pageX: number, pageY: number): Accion | null {
    for (const accion of ['left', 'right', 'jump'] as Accion[]) {
      const r = rects.current[accion];
      if (r && pageX >= r.x && pageX <= r.x + r.width && pageY >= r.y && pageY <= r.y + r.height) {
        return accion;
      }
    }
    return null;
  }

  // Recalcula el set de botones activos a partir de TODOS los toques
  // vigentes en cada evento. Así, si se pierde un evento individual
  // (común con toques rápidos/repetidos), el siguiente evento corrige
  // el estado y ningún botón queda "trabado".
  function recalcular(e: any) {
    const nuevos = new Set<Accion>();
    for (const t of e.nativeEvent.touches) {
      const accion = zonaEn(t.pageX, t.pageY);
      if (accion) nuevos.add(accion);
    }
    for (const accion of ['left', 'right', 'jump'] as Accion[]) {
      const estaActivo    = nuevos.has(accion);
      const estabaActivo  = activos.current.has(accion);
      if (estaActivo && !estabaActivo) { Vibration.vibrate(15); onInput(accion, true); }
      else if (!estaActivo && estabaActivo) { onInput(accion, false); }
    }
    activos.current = nuevos;
  }

  return (
    <View style={s.gamepad} onTouchStart={recalcular} onTouchMove={recalcular} onTouchEnd={recalcular} onTouchCancel={recalcular}>
      <View style={s.topBar}>
        <View style={[s.badge, { backgroundColor: color }]}>
          <Text style={s.badgeTxt}>{nombre}</Text>
        </View>
        <View style={s.led}>
          <View style={s.ledDot} />
          <Text style={s.ledTxt}>Online</Text>
        </View>
      </View>

      <View style={s.controles}>
        <View style={s.mitadIzq}>
          <View ref={refLeft} style={s.zona} onLayout={medir('left', refLeft)}>
            <View style={[s.btnDir, activoUI.left && s.btnDirActivo]}>
              <Text style={s.lblDir}>◀</Text>
            </View>
          </View>
          <View ref={refRight} style={s.zona} onLayout={medir('right', refRight)}>
            <View style={[s.btnDir, activoUI.right && s.btnDirActivo]}>
              <Text style={s.lblDir}>▶</Text>
            </View>
          </View>
        </View>
        <View ref={refJump} style={s.zona} onLayout={medir('jump', refJump)}>
          <View style={[s.btnSalto, { backgroundColor: color }, activoUI.jump && s.btnSaltoActivo]}>
            <Text style={s.lblSalto}>A</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  gamepad:   { flex: 1, backgroundColor: '#1a1a2e', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  topBar:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 36, marginBottom: 4 },
  badge:     { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 14 },
  badgeTxt:  { color: '#1a1a2e', fontWeight: 'bold', fontSize: 13 },
  led:       { flexDirection: 'row', alignItems: 'center' },
  ledDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2ecc71', marginRight: 5 },
  ledTxt:    { color: '#2ecc71', fontSize: 12 },
  controles: { flex: 1, flexDirection: 'row' },
  mitadIzq:  { flex: 1, flexDirection: 'row' },
  zona:      { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 12 },
  btnDir:        { width: 100, height: 100, borderRadius: 14, borderWidth: 2, backgroundColor: '#2a2a4e', borderColor: '#4a4a8a', alignItems: 'center', justifyContent: 'center' },
  btnDirActivo:  { backgroundColor: '#5a5aaa', borderColor: '#aaaaff' },
  lblDir:        { color: '#fff', fontSize: 34, fontWeight: 'bold' },
  btnSalto:       { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
  btnSaltoActivo: { opacity: 0.75 },
  lblSalto:       { color: '#1a1a2e', fontSize: 40, fontWeight: 'bold' },
});
