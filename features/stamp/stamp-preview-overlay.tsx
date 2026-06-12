/**
 * StampPreviewOverlay presents a single stamp full-width over a blurred backdrop,
 * with the same handle-it-in-3D interaction (InteractiveStamp). Used when tapping a
 * gallery stamp, and right after capture to let the new stamp float in the air.
 *
 * Dismiss by tapping the backdrop around the stamp. The stamp itself is dedicated
 * to the 3D tilt, so it never competes with the dismiss target.
 */
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { ReactNode, useEffect } from 'react';
import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { InteractiveStamp } from './interactive-stamp';
import { STAMP_ASPECT_RATIO, type StampAspect } from './stamp-path';

const HORIZONTAL_PADDING = 28;

type StampPreviewOverlayProps = {
  uri?: string | null;
  visible: boolean;
  onClose: () => void;
  aspect?: StampAspect;
  /** Optional content rendered behind the blur (e.g. the live camera). */
  background?: ReactNode;
};

export function StampPreviewOverlay({
  uri,
  visible,
  onClose,
  aspect = 'portrait',
  background,
}: StampPreviewOverlayProps) {
  const { width, height } = useWindowDimensions();
  const stampWidth = width - HORIZONTAL_PADDING * 2;
  const stampHeight = stampWidth * STAMP_ASPECT_RATIO[aspect];

  // 0 = hidden, 1 = fully presented. Drives blur + scale/fade.
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      if (process.env.EXPO_OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      progress.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
    } else {
      progress.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.cubic) });
    }
  }, [visible, progress]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  const stampStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.85 + progress.value * 0.15 }],
  }));

  if (!visible || !uri) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, backdropStyle]}>
      {background}
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View pointerEvents="box-none" style={[styles.center, { width, height }, stampStyle]}>
        <InteractiveStamp width={stampWidth} height={stampHeight}>
          <Image source={{ uri }} style={styles.image} contentFit="cover" />
        </InteractiveStamp>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { zIndex: 10, alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  image: { flex: 1 },
});
