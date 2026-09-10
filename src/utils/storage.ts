import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV();

export const getStoredSteps = (): number => storage.getNumber('daily_steps') ?? 0;
export const setStoredSteps = (steps: number) => storage.set('daily_steps', steps);

// النقاط والشارات
export const getStoredCoins = (): number => storage.getNumber('khuta_coins') ?? 0;
export const setStoredCoins = (coins: number) => storage.set('khuta_coins', coins);