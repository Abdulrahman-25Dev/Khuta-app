import { createMMKV} from 'react-native-mmkv';

export const storage = createMMKV();

export const getStoredSteps = (): number => storage.getNumber('daily_steps') ?? 0;
export const setStoredSteps = (steps: number) => storage.set('daily_steps', steps);
export const removeStoredSteps = () => storage.remove('daily_steps');