import { useEffect } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';

export function useOrientation(pantalla: string) {
  useEffect(() => {
    if (pantalla === 'gamepad') {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    } else {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }
  }, [pantalla]);

  useEffect(() => {
    return () => { ScreenOrientation.unlockAsync(); };
  }, []);
}