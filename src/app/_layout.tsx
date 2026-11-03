import './global.css';
import { Suspense, useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Stack,
  ThemeProvider as NavigationThemeProvider,
  DarkTheme,
  DefaultTheme,
  type Theme,
} from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from 'nativewind';
import { useFonts } from 'expo-font';

import '../i18n/i18next';
import { useAppStore, getTodayKey } from '../../store/useAppStore';
import {
  ThemeProvider as AppThemeProvider,
  useTheme,
} from '../context/ThemeContext';
import { CustomModalHost } from '../components/CustomModal';
import {
  initializeNotifications,
  scheduleWaterReminders,
  syncEveningReminder,
} from '../services/notificationService';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Tajawal: require('../../assets/fonts/Tajawal-Regular.ttf'),
    'Tajawal-Bold': require('../../assets/fonts/Tajawal-Bold.ttf'),
    'Tajawal-Black': require('../../assets/fonts/Tajawal-Black.ttf'),
    Inter: require('../../assets/fonts/Inter-Regular.ttf'),
    'Inter-Bold': require('../../assets/fonts/Inter-Bold.ttf'),
  });

  if (fontError) throw fontError;
  if (!fontsLoaded) return null;

  return (
    <Suspense fallback={null}>
      <SafeAreaProvider>
        <AppThemeProvider>
          <RootNavigator />
        </AppThemeProvider>
      </SafeAreaProvider>
    </Suspense>
  );
}

// يستهلك سياق المظهر الذرّي فتُمرَّر الخلفية ولوحة التنقل وسمة React Navigation
// من نفس الكائن في نفس الإطار، فلا يتغير لون الكروت بعد الخلفية أثناء التبديل.
function RootNavigator() {
  const themeMode = useAppStore((state) => state.themeMode);
  const { colorScheme: activeScheme, setColorScheme } = useColorScheme();
  const { isDarkMode, accent, bg, card, border, text } = useTheme();

  // مزامنة colorScheme الأصيلة مع المتجر عند أي اختلاف فقط (التبديل نفسه يتم في المتجر)
  useEffect(() => {
    if (activeScheme !== themeMode) {
      setColorScheme(themeMode);
    }
  }, [themeMode, activeScheme, setColorScheme]);

  const navBase = isDarkMode ? DarkTheme : DefaultTheme;
  // سمة React Navigation الأصلية بنفس قيم لوحة المظهر حتى ترسم خلفية الشاشة
  // الأصلية وانتقالاتها متزامنة مع الكروت المخصصة دون وميض ألوان.
  const navTheme: Theme = {
    ...navBase,
    dark: isDarkMode,
    colors: {
      ...navBase.colors,
      primary: accent,
      background: bg,
      card,
      text,
      border,
      notification: accent,
    },
  };

  // تهيئة التنبيهات عالية الأولوية ومزامنة جدولة تذكير المساء مع حالة هدف اليوم
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await initializeNotifications();
      if (cancelled) return;
      const state = useAppStore.getState();
      const todayKey = getTodayKey();
      const todayLog = state.history.find((log) => log.date === todayKey);
      await syncEveningReminder({
        goalMetToday: todayLog?.goalReached ?? false,
        notificationsEnabled: state.notificationsEnabled,
        todayKey,
      });
      await scheduleWaterReminders({
        start: state.user.waterReminderStart,
        end: state.user.waterReminderEnd,
        interval: state.user.waterReminderInterval,
        enabled: state.user.waterNotificationsEnabled,
        goalReached:
          (todayLog?.waterCups ?? 0) >= state.user.waterGoalCups,
      }).catch((error) => {
        console.error('Failed to schedule water reminders on launch:', error);
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <NavigationThemeProvider value={navTheme}>
      <View
        className={isDarkMode ? 'dark flex-1' : 'flex-1'}
        style={{ backgroundColor: bg }}
      >
        <GestureHandlerRootView className="flex-1">
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: bg },
            }}
          >
            <Stack.Screen
              name="index"
              options={{
                headerShown: false,
                contentStyle: { backgroundColor: bg },
              }}
            />
            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false,
                contentStyle: { backgroundColor: bg },
              }}
            />
          </Stack>
          <CustomModalHost />
        </GestureHandlerRootView>
      </View>
    </NavigationThemeProvider>
  );
}
