import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Footprints, User, BarChart3 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

// سطح شريط التبويب: يتبع السياق الذرّي (نفس إطار قراءة المتجر) فلا يتأخر
// لون الشريط عن لون الكروت والخلفية أثناء تبديل الوضع الفاتح/الداكن.
export default function TabLayout() {
  const { isDarkMode, accent, card, border } = useTheme();

  const inactiveColor = isDarkMode ? '#8B949E' : '#94A3B8';

  return (
    <View className={isDarkMode ? 'dark flex-1' : 'flex-1'}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: accent,
          tabBarInactiveTintColor: inactiveColor,
          tabBarStyle: {
            backgroundColor: card,
            borderTopColor: border,
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