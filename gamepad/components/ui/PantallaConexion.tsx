import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { COLOR_FONDO } from '../../constants/colors';

interface Props {
  error: string;
  conectando: boolean;
  onConectar: (ip: string) => void;
}

export function PantallaConexion({ error, conectando, onConectar }: Props) {
  const [ip, setIp] = useState('');

  return (
    <SafeAreaView style={s.fondo}>
      <StatusBar barStyle="light-content" backgroundColor={COLOR_FONDO} />
      <Text style={s.titulo}>🎮 PICO PARK</Text>
      <Text style={s.subtitulo}>Gamepad</Text>

      {!!error && <Text style={s.error}>{error}</Text>}

      <TextInput
        style={s.inputIp}
        placeholder="192.168.x.x:3000"
        placeholderTextColor="#555"
        value={ip}
        onChangeText={setIp}
        autoCapitalize="none"
        keyboardType="url"
        editable={!conectando}
      />

      <TouchableOpacity
        style={[s.btnConectar, conectando && s.btnDisabled]}
        onPress={() => onConectar(ip)}
        disabled={conectando}
      >
        <Text style={s.btnTxt}>{conectando ? 'Conectando...' : 'Conectar'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  fondo:     { flex: 1, backgroundColor: COLOR_FONDO, alignItems: 'center', justifyContent: 'center', padding: 32 },
  titulo:    { fontSize: 38, fontWeight: 'bold', color: '#f0c040', marginBottom: 4 },
  subtitulo: { fontSize: 16, color: '#aaa', marginBottom: 36 },
  error:     { color: '#e74c3c', marginBottom: 12, fontSize: 14 },
  inputIp: {
    width: '100%', backgroundColor: '#2a2a4e', color: '#fff',
    fontSize: 16, padding: 14, borderRadius: 10,
    borderWidth: 1, borderColor: '#4a4a8a', marginBottom: 16,
  },
  btnConectar: { width: '100%', backgroundColor: '#f0c040', padding: 16, borderRadius: 10, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnTxt:      { color: '#1a1a2e', fontSize: 18, fontWeight: 'bold' },
});