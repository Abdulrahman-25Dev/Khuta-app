import './global.css';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { vars } from 'nativewind';

import { useAppStore, colorPalettes } from '../../store/useAppStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  const accentColor = useAppStore((state) => state.accentColor);
  const themeMode = useAppStore((state) => state.themeMode);

  const activePalette = colorPalettes[accentColor] ?? colorPalettes.sunset;
  const currentTheme = themeMode === 'dark' ? activePalette : activePalette.light;

  const themeVariables = vars({
    '--color-bg': currentTheme.bg,
    '--color-card': currentTheme.card,
    '--color-border': currentTheme.border,
    '--color-text': currentTheme.text,
    '--color-subtext': currentTheme.subtext,
    '--color-primary': activePalette.primary,
    '--color-secondary': activePalette.secondary,
  });

  return (
    <SafeAreaProvider>
      <View
        key={`root-theme-${themeMode}-${accentColor}`}
        style={themeVariables}
        className="flex-1 bg-appBg"
      >
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