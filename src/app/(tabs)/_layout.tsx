import { Tabs } from 'expo-router';
import { Footprints, User, BarChart3 } from 'lucide-react-native';

const COLORS = {
  bg: '#0B0F19',
  card: '#1A1A2E',
  border: '#27293D',
  orangeDark: '#EA6113',
  textSub: '#8A8F9E',
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.orangeDark,
        tabBarInactiveTintColor: COLORS.textSub,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
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