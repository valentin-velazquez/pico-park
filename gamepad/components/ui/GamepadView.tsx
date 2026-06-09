import { View, Text, StyleSheet, PanResponder, Vibration } from 'react-native';

type Accion = 'left' | 'right' | 'jump';

interface Props {
  indice: number;
  color: string;
  activoUI: { left: boolean; right: boolean; jump: boolean };
  onInput: (accion: Accion, valor: boolean) => void;
}

// BotonZona inline — sin imports externos
function BotonZona({ accion, label, activo, color, esCirculo, onPress }: {
  accion: Accion;
  label: string;
  activo: boolean;
  color?: string;
  esCirculo?: boolean;
  onPress: (accion: Accion, valor: boolean) => void;
}) {
  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  () => false,
    onPanResponderGrant:     () => { Vibration.vibrate(15); onPress(accion, true); },
    onPanResponderRelease:   () => onPress(accion, false),
    onPanResponderTerminate: () => onPress(accion, false),
  });

  const zonaStyle = { flex: 1, alignItems: 'center' as const, justifyContent: 'flex-end' as const, paddingBottom: 12 };

  const btnStyle = esCirculo
    ? { width: 120, height: 120, borderRadius: 60, backgroundColor: color ?? '#e74c3c',
        alignItems: 'center' as const, justifyContent: 'center' as const,
        opacity: activo ? 0.75 : 1 }
    : { width: 100, height: 100, borderRadius: 14, borderWidth: 2,
        backgroundColor: activo ? '#5a5aaa' : '#2a2a4e',
        borderColor: activo ? '#aaaaff' : '#4a4a8a',
        alignItems: 'center' as const, justifyContent: 'center' as const };

  return (
    <View style={zonaStyle} {...responder.panHandlers}>
      <View style={btnStyle}>
        <Text style={{ color: esCirculo ? '#1a1a2e' : '#fff', fontSize: esCirculo ? 40 : 34, fontWeight: 'bold' }}>
          {label}
        </Text>
      </View>
    </View>
  );
}

export function GamepadView({ indice, color, activoUI, onInput }: Props) {
  if (!activoUI) return null;

  const NOMBRES = ['Jugador 1', 'Jugador 2', 'Jugador 3', 'Jugador 4'];
  const nombre = NOMBRES[indice] ?? `Jugador ${indice + 1}`;

  return (
    <View style={s.gamepad}>
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
          <BotonZona accion="left"  label="◀" activo={activoUI.left}  onPress={onInput} />
          <BotonZona accion="right" label="▶" activo={activoUI.right} onPress={onInput} />
        </View>
        <BotonZona accion="jump" label="A" activo={activoUI.jump} color={color} esCirculo onPress={onInput} />
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
});