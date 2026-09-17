import './global.css';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from 'nativewind';

import { useAppStore } from '../../store/useAppStore';

export default function RootLayout() {
  const themeMode = useAppStore((state) => state.themeMode);
  const { colorScheme: activeScheme, setColorScheme } = useColorScheme();
  const isDark = themeMode === 'dark';

  // مزامنة colorScheme الأصيلة مع المتجر عند أي اختلاف فقط (التبديل نفسه يتم في المتجر)
  useEffect(() => {
    if (activeScheme !== themeMode) {
      setColorScheme(themeMode);
    }
  }, [themeMode, activeScheme, setColorScheme]);

  return (
    <SafeAreaProvider>
      <View className={isDark ? 'dark flex-1' : 'flex-1'}>
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