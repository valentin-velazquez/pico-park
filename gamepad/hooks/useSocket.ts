import { useState, useRef, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

type Pantalla = 'conexion' | 'gamepad';

export function useSocket() {
  const [pantalla, setPantalla]     = useState<Pantalla>('conexion');
  const [error, setError]           = useState('');
  const [conectando, setConectando] = useState(false);
  const [indice, setIndice]         = useState(0);
  const [color, setColor]           = useState('#e74c3c');

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      deactivateKeepAwake();
    };
  }, []);

  function conectar(ip: string) {
    if (!ip.trim()) return;
    setConectando(true);
    setError('');

    const s = io(`http://${ip.trim()}`, {
      transports: ['websocket'],
      timeout: 5000,
      query: { tipo: 'gamepad' },
    });
    socketRef.current = s;

    s.on('asignacion', ({ indice: i, color: c }: { indice: number; color: string }) => {
      setIndice(i);
      setColor(c);
      setConectando(false);
      setPantalla('gamepad');
      activateKeepAwakeAsync();
    });

    s.on('sala-llena', () => {
      setError('Sala llena (máx. 4 jugadores)');
      setConectando(false);
      s.disconnect();
    });

    s.on('connect_error', () => {
      setError('No se pudo conectar. Verificá la IP.');
      setConectando(false);
    });

    s.on('disconnect', () => {
      setPantalla('conexion');
      setConectando(false);
      deactivateKeepAwake();
    });
  }

  function emitInput(accion: string, valor: boolean) {
    socketRef.current?.emit('input', { accion, valor });
  }

  return { pantalla, error, conectando, indice, color, conectar, emitInput };
}