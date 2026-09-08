import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useColorScheme } from '@/hooks/use-color-scheme';

const DURATION = 600;

export function AnimatedSplashOverlay({ ready }: { ready: boolean }) {
  const isDark = useColorScheme() === 'dark';
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);
  const [laidOut, setLaidOut] = useState(false);
  const [imageSettled, setImageSettled] = useState(false);

  useEffect(() => {
    if (!ready || !laidOut || !imageSettled) return;
    let active = true;
    void SplashScreen.hideAsync().then(
      () => {
        if (active) setAnimate(true);
      },
      () => {
        if (active) setVisible(false);
      },
    );
    return () => {
      active = false;
    };
  }, [ready, laidOut, imageSettled]);

  if (!visible) return null;

  const splashKeyframe = new Keyframe({
    0: {
      transform: [{ scale: 1 }],
      opacity: 1,
    },
    20: {
      opacity: 1,
    },
    70: {
      opacity: 0,
      easing: Easing.elastic(0.7),
    },
    100: {
      opacity: 0,
      transform: [{ scale: 1 }],
      easing: Easing.elastic(0.7),
    },
  });

  const overlayStyle = [styles.splashOverlay, { backgroundColor: isDark ? '#071529' : '#FFFFFF' }];
  const image = (
    <Image
      testID="splash-artwork"
      style={StyleSheet.absoluteFill}
      source={isDark ? require('@/assets/splash-dark.png') : require('@/assets/splash-light.png')}
      contentFit="cover"
      onDisplay={() => setImageSettled(true)}
      // A failed image must not trap the participant behind the native splash.
      onError={() => setImageSettled(true)}
    />
  );

  return animate ? (
    <Animated.View
      entering={splashKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={overlayStyle}>
      {image}
    </Animated.View>
  ) : (
    <View testID="splash-overlay" onLayout={() => setLaidOut(true)} style={overlayStyle}>
      {image}
    </View>
  );
}

const styles = StyleSheet.create({
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
  },
});
