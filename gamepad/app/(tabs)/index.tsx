import { useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useOrientation } from '../../hooks/useOrientation';
import { PantallaConexion } from '../../components/ui/PantallaConexion';
import { GamepadView } from '../../components/ui/GamepadView';

type Accion = 'left' | 'right' | 'jump';

export default function Index() {
  const { pantalla, error, conectando, indice, color, conectar, emitInput } = useSocket();
  const [activoUI, setActivoUI] = useState({ left: false, right: false, jump: false });

  useOrientation(pantalla);

  function handleInput(accion: Accion, valor: boolean) {
    setActivoUI(p => ({ ...p, [accion]: valor }));
    emitInput(accion, valor);
  }

  // Siempre mostrar conexión hasta que esté conectado
  if (pantalla !== 'gamepad') {
    return (
      <PantallaConexion
        error={error}
        conectando={conectando}
        onConectar={conectar}
      />
    );
  }

  return (
    <GamepadView
      indice={indice}
      color={color}
      activoUI={activoUI}
      onInput={handleInput}
    />
  );
}