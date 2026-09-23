import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Footprints, User, BarChart3 } from 'lucide-react-native';
import { useAppStore } from '../../../store/useAppStore';
import { appThemes } from '../../data/storeCatalog';

// سطح شريط التبويب: يتبع وضع العرض (بطاقة داكنة/فاتحة)، وتبقى ألوان التمييز للمظهر
const TAB_BAR_BG_DARK = '#1E293B';
const TAB_BAR_BG_LIGHT = '#FFFFFF';

export default function TabLayout() {
  const themeMode = useAppStore((state) => state.themeMode);
  const currentThemeId = useAppStore((state) => state.currentThemeId);

  const currentTheme =
    appThemes.find((t) => t.id === currentThemeId) ?? appThemes[0];
  const isDark = themeMode === 'dark';
  const tabBarBg = isDark ? TAB_BAR_BG_DARK : TAB_BAR_BG_LIGHT;
  const inactiveColor = isDark ? '#8B949E' : '#94A3B8';

  return (
    <View className={isDark ? 'dark flex-1' : 'flex-1'}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: currentTheme.accent,
          tabBarInactiveTintColor: inactiveColor,
          tabBarStyle: {
            backgroundColor: tabBarBg,
            borderTopColor: tabBarBg,
            height: 65,
            paddingBottom: 10,
            paddingTop: 5,
          },
          sceneStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'الرئيسية',
            tabBarIcon: ({ color, size }) => <Footprints color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="History"
          options={{
            title: 'السجل',
            tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="Profile"
          options={{
            title: 'الملف الشخصي',
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
        />
      </Tabs>
    </View>
  );
}