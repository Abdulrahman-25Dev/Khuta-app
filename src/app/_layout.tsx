import './global.css';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colorScheme } from 'nativewind';

import { useAppStore } from '../../store/useAppStore';

export default function RootLayout() {
  const themeMode = useAppStore((state) => state.themeMode);
  const isDark = themeMode === 'dark';

  useEffect(() => {
    colorScheme.set(themeMode);
  }, [themeMode]);

  return (
    <SafeAreaProvider>
      <View className={`flex-1 ${isDark ? 'dark bg-appBg-dark' : 'bg-appBg-light'}`}>
        <GestureHandlerRootView className="flex-1">
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: 'transparent' },
            }}
          >
            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false,
                contentStyle: { backgroundColor: 'transparent' },
              }}
            />
          </Stack>
        </GestureHandlerRootView>
      </View>
    </SafeAreaProvider>
  );
}