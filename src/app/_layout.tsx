import './global.css';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

// تأكد من مسار الاستيراد حسب هيكلة مجلداتك
import { useAppStore, colorPalettes } from '../../store/useAppStore'; 

export default function RootLayout() {
  const accentColor = useAppStore((state) => state.accentColor);
  const themeMode = useAppStore((state) => state.themeMode);
  
  // استدعاء الألوان للثيم النشط
  const activePalette = colorPalettes[accentColor];

  // ربط قيم Zustand بنفس المتغيرات الموجودة في tailwind.config.js
  const themeVariables = {
    '--color-bg': themeMode === 'dark' ? activePalette.bg : '#F8FAFC',
    '--color-card': themeMode === 'dark' ? activePalette.card : '#FFFFFF',
    '--color-border': themeMode === 'dark' ? activePalette.border : '#E2E8F0',
    '--color-text': themeMode === 'dark' ? activePalette.text : '#0F172A',
    '--color-subtext': themeMode === 'dark' ? activePalette.subtext : '#64748B',
    '--color-primary': activePalette.primary,
    '--color-secondary': activePalette.secondary,
    '--color-text-light': activePalette.text,
  } as any;

  return (
    <SafeAreaProvider>
      {/* تمرير المتغيرات هنا لتغذي كل شاشات التطبيق */}
      <View style={themeVariables} className="flex-1 bg-appBg">
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </View>
    </SafeAreaProvider>
  );
}