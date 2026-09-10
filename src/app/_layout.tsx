import './global.css'
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from "expo-router";
export default function RootLayout() {
  return( 
  <SafeAreaProvider>
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  </SafeAreaProvider>
  
  )
}
