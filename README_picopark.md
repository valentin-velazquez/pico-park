# Pico Park

Juego de plataformas cooperativo inspirado en Pico Park, desarrollado como proyecto escolar junto a un compañero. Se puede jugar en modo multijugador (cooperativo) o de a uno. El objetivo de cada nivel es agarrar la moneda para poder avanzar al siguiente.

## Tecnologías

**Host del juego (navegador)**
- Matter.js (motor de físicas)
- Socket.io (comunicación en tiempo real entre jugadores)

**Control (celular)**
- React Native (Expo) — funciona como gamepad/control remoto para jugar desde el celular

**Servidor**
- Alojado en una VM remota, administrada con pm2

## Cómo funciona

1. El juego corre en el navegador (host), que muestra el nivel y la física del juego usando Matter.js.
2. Cada jugador se conecta desde su celular con la app de Expo, que actúa como control (gamepad).
3. Socket.io mantiene sincronizados en tiempo real los movimientos de cada jugador entre el control y el host.
4. El objetivo de cada nivel es que el o los jugadores logren agarrar la moneda para pasar al siguiente nivel.

## Instalación y uso

### Host (navegador)
```bash
cd host
npm install
npm run dev
```

### Control (mobile)
```bash
cd mobile
npm install
npx expo start
```

## Estado del proyecto

Proyecto escolar desarrollado en equipo. Incluyó migración del servidor a una VM remota para que el juego esté disponible de forma estable, más allá de estar corriendo en una compu local.
