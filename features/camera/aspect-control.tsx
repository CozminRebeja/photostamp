import { StyleSheet, View } from 'react-native';

import { LiquidGlassButton } from '@/features/camera/liquid-glass-button';
import type { StampAspect } from '@/features/stamp/stamp-path';
import type { IconSymbolName } from '@/components/ui/icon-symbol';

const OPTIONS: { key: StampAspect; label: string; symbol: IconSymbolName }[] = [
  { key: 'portrait', label: 'Portrait stamp', symbol: 'rectangle.portrait' },
  { key: 'square', label: 'Square stamp', symbol: 'square' },
  { key: 'landscape', label: 'Landscape stamp', symbol: 'rectangle' },
];

type AspectControlProps = {
  value: StampAspect;
  onChange: (value: StampAspect) => void;
};

export function AspectControl({ value, onChange }: AspectControlProps) {
  return (
    <View style={styles.container}>
      {OPTIONS.map((option) => (
        <LiquidGlassButton
          key={option.key}
          symbol={option.symbol}
          accessibilityLabel={option.label}
          selected={option.key === value}
          size={44}
          onPress={() => onChange(option.key)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
