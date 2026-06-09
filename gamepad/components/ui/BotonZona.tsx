import { useRef } from 'react';
import { View, Text, StyleSheet, PanResponder, Vibration } from 'react-native';
import { COLOR_BTN, COLOR_BORDE } from '../../constants/colors';

type Accion = 'left' | 'right' | 'jump';

interface Props {
  accion: Accion;
  label: string;
  activo: boolean;
  color?: string;
  esCirculo?: boolean;
  onPress: (accion: Accion, valor: boolean) => void;
}

export function BotonZona({ accion, label, activo, color, esCirculo, onPress }: Props) {
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => false,
      onPanResponderGrant:     () => { Vibration.vibrate(15); onPress(accion, true);  },
      onPanResponderRelease:   () => onPress(accion, false),
      onPanResponderTerminate: () => onPress(accion, false),
    })
  ).current;

  const btnStyle = esCirculo
    ? [s.btnSalto, { backgroundColor: color }, activo ? s.btnSaltoActivo : undefined]
    : [s.btnDir,                                activo ? s.btnDirActivo   : undefined];

  return (
    <View style={s.zona} {...responder.panHandlers}>
      <View style={btnStyle as any}>
        <Text style={esCirculo ? s.lblSalto : s.lblDir}>{label}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  zona:     { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 12 },
  btnDir:   { width: 100, height: 100, backgroundColor: COLOR_BTN, borderRadius: 14, borderWidth: 2, borderColor: COLOR_BORDE, alignItems: 'center', justifyContent: 'center' },
  btnDirActivo:   { backgroundColor: '#5a5aaa', borderColor: '#aaaaff' },
  lblDir:         { color: '#fff', fontSize: 34 },
  btnSalto:       { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', elevation: 6 },
  btnSaltoActivo: { opacity: 0.75, transform: [{ scale: 0.93 }] },
  lblSalto:       { color: '#1a1a2e', fontSize: 40, fontWeight: 'bold' },
});