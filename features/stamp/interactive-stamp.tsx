/**
 * InteractiveStamp turns a stamp into a physical object you can handle: it floats
 * gently in the air, tilts in 3D when you drag it (springing back on release), and
 * carries a shimmer — a specular highlight that slides across the surface as it
 * tilts, selling the holographic / foil-sticker feel.
 *
 * It owns the `StampFrame` masking, so callers just pass the photo (or camera) as
 * `children`. The shimmer lives *inside* the frame, so it's clipped to the
 * perforated silhouette automatically.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { DeviceMotion } from 'expo-sensors';
import { ReactNode, useEffect, useRef } from 'react';
import { Image, StyleSheet, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Springs } from '@/constants/motion';
import { StampFrame } from './stamp-frame';

/** Max tilt in degrees — keep it subtle ("slightly drag it around"). */
const MAX_TILT = 12;
/** Device tilt matches the direct drag range after the latest sensitivity pass. */
const GYRO_MAX_TILT = MAX_TILT;
/** Degrees of physical device tilt needed to reach max gyro tilt. */
const GYRO_INPUT_RANGE = 30;
/** How far a drag has to travel (px) to reach max tilt. */
const DRAG_RANGE = 140;
/** Gentle vertical bob amplitude (px). */
const FLOAT_AMPLITUDE = 6;

function clampTilt(v: number) {
  'worklet';
  return Math.max(-MAX_TILT, Math.min(MAX_TILT, v));
}

function clampGyroTilt(v: number) {
  'worklet';
  return Math.max(-GYRO_MAX_TILT, Math.min(GYRO_MAX_TILT, v));
}

type InteractiveStampProps = {
  width: number;
  height: number;
  children: ReactNode;
  /** Continuous vertical bob at rest. Default true. */
  float?: boolean;
  /** Tilt-tracking specular highlight. Default true. */
  shimmer?: boolean;
  style?: ViewStyle;
};

export function InteractiveStamp({
  width,
  height,
  children,
  float = true,
  shimmer = true,
  style,
}: InteractiveStampProps) {
  // Tilt in degrees, driven by drag; springs back to 0 on release.
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);
  // Tilt in degrees, driven by device motion; capped at half the drag tilt.
  const gyroRotateX = useSharedValue(0);
  const gyroRotateY = useSharedValue(0);
  // Slow idle bob, -1..1 → mapped to ±FLOAT_AMPLITUDE.
  const bob = useSharedValue(0);
  const gyroBaseline = useRef<{ beta: number; gamma: number } | null>(null);

  useEffect(() => {
    if (!float) return;
    bob.value = withRepeat(withTiming(1, { duration: 1400 }), -1, true);
    return () => cancelAnimation(bob);
  }, [float, bob]);

  useEffect(() => {
    let mounted = true;
    let subscription: { remove: () => void } | null = null;

    DeviceMotion.setUpdateInterval(80);
    DeviceMotion.isAvailableAsync().then(async (available) => {
      if (!mounted || !available) return;

      const permission = await DeviceMotion.getPermissionsAsync();
      if (!mounted) return;

      const granted = permission.granted
        ? true
        : (await DeviceMotion.requestPermissionsAsync()).granted;
      if (!mounted || !granted) return;

      subscription = DeviceMotion.addListener(({ rotation }) => {
        if (!rotation) return;

        gyroBaseline.current ??= { beta: rotation.beta, gamma: rotation.gamma };

        const { beta, gamma } = gyroBaseline.current;
        const nextX = clampGyroTilt((-(rotation.beta - beta) / GYRO_INPUT_RANGE) * GYRO_MAX_TILT);
        const nextY = clampGyroTilt(((rotation.gamma - gamma) / GYRO_INPUT_RANGE) * GYRO_MAX_TILT);

        gyroRotateX.value = withTiming(nextX, { duration: 120 });
        gyroRotateY.value = withTiming(nextY, { duration: 120 });
      });

      if (!mounted) subscription.remove();
    });

    return () => {
      mounted = false;
      subscription?.remove();
      gyroBaseline.current = null;
      cancelAnimation(gyroRotateX);
      cancelAnimation(gyroRotateY);
      gyroRotateX.value = 0;
      gyroRotateY.value = 0;
    };
  }, [gyroRotateX, gyroRotateY]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      rotateY.value = clampTilt((e.translationX / DRAG_RANGE) * MAX_TILT);
      rotateX.value = clampTilt((-e.translationY / DRAG_RANGE) * MAX_TILT);
    })
    .onEnd(() => {
      rotateX.value = withSpring(0, Springs.release);
      rotateY.value = withSpring(0, Springs.release);
    });

  const cardStyle = useAnimatedStyle(() => {
    const floatY = float ? interpolate(bob.value, [0, 1], [-FLOAT_AMPLITUDE, FLOAT_AMPLITUDE]) : 0;
    const totalRotateX = clampTilt(rotateX.value + gyroRotateX.value);
    const totalRotateY = clampTilt(rotateY.value + gyroRotateY.value);
    // Tilt deepens the lift shadow a touch so the 3D reads.
    const tiltMag = (Math.abs(totalRotateX) + Math.abs(totalRotateY)) / (MAX_TILT * 2);
    return {
      transform: [
        { perspective: 800 },
        { translateY: floatY },
        { rotateX: `${totalRotateX}deg` },
        { rotateY: `${totalRotateY}deg` },
      ],
      shadowOpacity: 0.18 + tiltMag * 0.12,
      shadowRadius: 18 + tiltMag * 10,
    };
  });

  // Soft, diffuse sheen sliding with the tilt — matte paper catching light, not gloss.
  const shimmerStyle = useAnimatedStyle(() => {
    const totalRotateX = clampTilt(rotateX.value + gyroRotateX.value);
    const totalRotateY = clampTilt(rotateY.value + gyroRotateY.value);
    const tx = interpolate(totalRotateY, [-MAX_TILT, MAX_TILT], [width * 0.6, -width * 0.6]);
    const ty = interpolate(totalRotateX, [-MAX_TILT, MAX_TILT], [-height * 0.4, height * 0.4]);
    const tiltMag = (Math.abs(totalRotateX) + Math.abs(totalRotateY)) / (MAX_TILT * 2);
    return {
      opacity: 0.1 + tiltMag * 0.22,
      transform: [{ translateX: tx }, { translateY: ty }, { rotateZ: '25deg' }],
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, cardStyle, style]}>
        <StampFrame width={width} height={height}>
          {children}
          {shimmer ? (
            <Animated.View
              pointerEvents="none"
              style={[styles.shimmerWrap, { width: width * 2, height: height * 2 }, shimmerStyle]}>
              <LinearGradient
                colors={['transparent', 'rgba(255,248,232,0.22)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                locations={[0.2, 0.5, 0.8]}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          ) : null}
          {/* Matte paper tooth: tiling grain that takes the digital sheen off. */}
          <Image
            source={require('../../assets/images/paper-grain.png')}
            resizeMode="repeat"
            style={[StyleSheet.absoluteFill, styles.grain]}
          />
        </StampFrame>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
  },
  shimmerWrap: {
    position: 'absolute',
    top: '-50%',
    left: '-50%',
  },
  grain: { width: '100%', height: '100%', opacity: 0.6 },
});
