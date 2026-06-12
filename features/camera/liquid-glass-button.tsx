import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Springs } from '@/constants/motion';

type LiquidGlassButtonProps = {
  symbol: IconSymbolName;
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
  loading?: boolean;
  selected?: boolean;
  size?: number;
};

export function LiquidGlassButton({
  symbol,
  onPress,
  accessibilityLabel,
  disabled = false,
  loading = false,
  selected = false,
  size = 54,
}: LiquidGlassButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const isNativeGlass = Platform.OS === 'ios' && isGlassEffectAPIAvailable();
  const radius = size / 2;
  const iconColor = selected ? '#ffffff' : '#1a1a1a';

  const content = loading ? (
    <ActivityIndicator color={iconColor} />
  ) : (
    <IconSymbol name={symbol} size={size * 0.45} color={iconColor} weight="semibold" />
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, selected }}
      android_ripple={{ color: 'rgba(0,0,0,0.12)', borderless: true, radius }}
      disabled={disabled || loading}
      hitSlop={10}
      onPressIn={() => {
        scale.value = withSpring(0.9, Springs.press);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, Springs.release);
      }}
      onPress={() => {
        if (process.env.EXPO_OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress();
      }}>
      <Animated.View
        style={[
          styles.shadow,
          { width: size, height: size, borderRadius: radius },
          selected && styles.selectedShadow,
          animatedStyle,
        ]}>
        {isNativeGlass ? (
          <GlassView
            isInteractive
            glassEffectStyle="regular"
            tintColor={selected ? '#111111' : '#ffffff'}
            style={[styles.surface, { width: size, height: size, borderRadius: radius }]}>
            {content}
          </GlassView>
        ) : (
          <BlurView
            intensity={70}
            tint="systemThickMaterialLight"
            experimentalBlurMethod="dimezisBlurView"
            style={[styles.surface, { width: size, height: size, borderRadius: radius }]}>
            {selected ? <View style={[StyleSheet.absoluteFillObject, styles.selectedOverlay]} /> : null}
            {content}
          </BlurView>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadow: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  selectedShadow: {
    backgroundColor: 'rgba(0,0,0,0.72)',
    shadowOpacity: 0.2,
  },
  surface: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.72)',
  },
  selectedOverlay: { backgroundColor: 'rgba(0,0,0,0.72)' },
});
