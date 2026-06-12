import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Button,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { Springs } from '@/constants/motion';
import { AspectControl } from '@/features/camera/aspect-control';
import { LiquidGlassButton } from '@/features/camera/liquid-glass-button';
import { StampFrame } from '@/features/stamp/stamp-frame';
import { StampPreviewOverlay } from '@/features/stamp/stamp-preview-overlay';
import { STAMP_ASPECT_RATIO, type StampAspect } from '@/features/stamp/stamp-path';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { saveStamp } from '@/lib/stamps';
import type { Stamp } from '@/types/stamp';

export default function StampCameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [aspect, setAspect] = useState<StampAspect>('portrait');
  const [busy, setBusy] = useState(false);
  const [captured, setCaptured] = useState<Stamp | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { width } = useWindowDimensions();
  const frameWidth = width - 32;
  const frameHeight = frameWidth * STAMP_ASPECT_RATIO[aspect];

  const flash = useSharedValue(0);
  const frameScale = useSharedValue(1);

  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));
  const frameStyle = useAnimatedStyle(() => ({ transform: [{ scale: frameScale.value }] }));

  // Gently settle the stamp whenever the aspect ratio changes.
  useEffect(() => {
    frameScale.value = withSequence(
      withTiming(0.97, { duration: 110 }),
      withSpring(1, Springs.settle)
    );
  }, [aspect, frameScale]);

  if (!permission) {
    return <View style={[styles.fill, { backgroundColor: colors.background }]} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>PhotoStamp</Text>
        <Text style={[styles.message, { color: colors.icon }]}>
          We need access to your camera to take stamp photos.
        </Text>
        <Button title="Grant permission" onPress={requestPermission} color={colors.tint} />
      </SafeAreaView>
    );
  }

  async function capture() {
    const camera = cameraRef.current;
    if (!camera || busy) return;
    try {
      setBusy(true);
      if (process.env.EXPO_OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      flash.value = withSequence(withTiming(0.6, { duration: 60 }), withTiming(0, { duration: 260 }));
      const photo = await camera.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) {
        const stamp = saveStamp(photo.uri, aspect);
        // Let the fresh stamp float in the air before continuing to the gallery.
        setCaptured(stamp);
      }
    } finally {
      setBusy(false);
    }
  }

  function dismissPreview() {
    setCaptured(null);
    router.navigate('/gallery');
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.frameArea}>
        <Animated.View entering={FadeIn.duration(500)} style={frameStyle}>
          <StampFrame width={frameWidth} height={frameHeight}>
            <CameraView ref={cameraRef} style={styles.fill} facing={facing} />
          </StampFrame>
        </Animated.View>
      </View>

      <View style={styles.shutterControl}>
        <LiquidGlassButton
          symbol="camera.fill"
          accessibilityLabel="Take stamp photo"
          onPress={capture}
          disabled={busy}
          loading={busy}
          size={78}
        />
      </View>

      <View style={styles.controls}>
        <LiquidGlassButton
          symbol="photo.on.rectangle"
          accessibilityLabel="Open gallery"
          onPress={() => router.navigate('/gallery')}
        />
        <AspectControl value={aspect} onChange={setAspect} />
        <LiquidGlassButton
          symbol="arrow.triangle.2.circlepath"
          accessibilityLabel="Flip camera"
          onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
        />
      </View>

      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.flash, flashStyle]} />

      <StampPreviewOverlay
        uri={captured?.uri}
        visible={!!captured}
        onClose={dismissPreview}
        aspect={captured?.aspect}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  title: { fontSize: 28, fontWeight: '700' },
  message: { fontSize: 16, textAlign: 'center' },
  frameArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  shutterControl: { alignSelf: 'center', marginBottom: 20 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  flash: { backgroundColor: '#fff' },
});
