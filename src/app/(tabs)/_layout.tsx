import { Tabs } from 'expo-router';
import { Footprints, User, BarChart3 } from 'lucide-react-native';
import { useAppStore, colorPalettes } from '../../../store/useAppStore';

export default function TabLayout() {
  const accentColor = useAppStore((state) => state.accentColor);
  const themeMode = useAppStore((state) => state.themeMode);

  const activePalette = colorPalettes[accentColor] ?? colorPalettes.sunset;
  const currentTheme = themeMode === 'dark' ? activePalette : activePalette.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activePalette.primary,
        tabBarInactiveTintColor: currentTheme.subtext,
        tabBarStyle: {
          backgroundColor: currentTheme.card,
          borderTopColor: currentTheme.border,
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
  );
}