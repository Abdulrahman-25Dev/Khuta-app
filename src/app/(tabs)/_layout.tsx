import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Footprints, User, BarChart3 } from 'lucide-react-native';
import { useAppStore, colorPalettes } from '../../../store/useAppStore';

export default function TabLayout() {
  const accentColor = useAppStore((state) => state.accentColor);
  const themeMode = useAppStore((state) => state.themeMode);

  const activePalette = colorPalettes[accentColor] ?? colorPalettes.sunset;
  // قراءة مباشرة ومتزامنة من المتجر لتطبيق ألوان شريط التبويب مع الخلفية
  const isDark = themeMode === 'dark';
  const tabBgColor = isDark ? '#161B22' : '#FFFFFF'; // appCard-dark / appCard-light
  const tabBorderColor = isDark ? '#21262D' : '#E2E8F0'; // appBorder-dark / appBorder-light
  const inactiveColor = isDark ? '#8B949E' : '#64748B'; // appSubText-dark / appSubText-light

  return (
    <View className={isDark ? 'dark flex-1' : 'flex-1'}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: activePalette.primary,
          tabBarInactiveTintColor: inactiveColor,
          tabBarStyle: {
            backgroundColor: tabBgColor,
            borderTopColor: tabBorderColor,
            height: 65,
            paddingBottom: 10,
            paddingTop: 5,
          },
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