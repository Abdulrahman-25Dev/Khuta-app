import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { useTheme } from '../context/ThemeContext';

const SPLASH_DURATION = 2500;
const LOGO_SIZE = 124;

export default function SplashScreenRoute() {
  const router = useRouter();
  const { accent, bg, subText } = useTheme();
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const glowScale = useSharedValue(0.78);
  const glowOpacity = useSharedValue(0.12);

  useEffect(() => {
    logoOpacity.value = withSpring(1, {
      damping: 16,
      stiffness: 120,
      mass: 1.1,
    });
    logoScale.value = withSpring(1.08, {
      damping: 13,
      stiffness: 150,
      mass: 1,
    });

    glowScale.value = withRepeat(
      withTiming(1.12, {
        duration: 1800,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
    glowOpacity.value = withRepeat(
      withTiming(0.45, {
        duration: 1800,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    const navigationTimer = setTimeout(() => {
      void SplashScreen.hideAsync().then(() => {
        router.replace('/(tabs)');
      });
    }, SPLASH_DURATION);

    return () => clearTimeout(navigationTimer);
  }, [glowOpacity, glowScale, logoOpacity, logoScale, router]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],  
  }));

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.glow,
            {
              backgroundColor: `${accent}1F`,
              borderColor: `${accent}80`,
              shadowColor: accent,
            },
            glowAnimatedStyle,
          ]}
          pointerEvents="none"
        />
        <Animated.Text
          style={[
            styles.logo,
            {
              color: accent,
              textShadowColor: accent,
            },
            logoAnimatedStyle,
          ]}
          numberOfLines={1}
        >
          خطى
        </Animated.Text>
        <Text style={[styles.tagline, { color: subText }]}>حُركتك.. ثروتك</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  glow: {
    position: 'absolute',
    width: LOGO_SIZE + 56,
    height: LOGO_SIZE + 56,
    borderRadius: (LOGO_SIZE + 56) / 2,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 28,
  },
  logo: {
    fontSize: 70,
    fontWeight: '700',
    lineHeight: 72,
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.75,
    shadowRadius: 16,
    letterSpacing: -2,
  },
  tagline: {
    marginTop: 24,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
