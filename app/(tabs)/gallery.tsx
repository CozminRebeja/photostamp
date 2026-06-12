import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { LiquidGlassButton } from '@/features/camera/liquid-glass-button';
import { StampFrame } from '@/features/stamp/stamp-frame';
import { StampPreviewOverlay } from '@/features/stamp/stamp-preview-overlay';
import { STAMP_ASPECT_RATIO } from '@/features/stamp/stamp-path';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { deleteStamp, listStamps } from '@/lib/stamps';
import type { Stamp } from '@/types/stamp';

const COLUMNS = 2;
const GAP = 16;

type GalleryColumnItem = {
  stamp: Stamp;
  index: number;
};

export default function GalleryScreen() {
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [preview, setPreview] = useState<Stamp | null>(null);
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { width } = useWindowDimensions();
  const router = useRouter();

  const tileWidth = (width - GAP * (COLUMNS + 1)) / COLUMNS;

  const getTileHeight = useCallback(
    (stamp: Stamp) => tileWidth * STAMP_ASPECT_RATIO[stamp.aspect],
    [tileWidth]
  );

  const columns = useMemo(() => {
    const nextColumns: GalleryColumnItem[][] = Array.from({ length: COLUMNS }, () => []);
    const columnHeights = Array.from({ length: COLUMNS }, () => 0);

    stamps.forEach((stamp, index) => {
      const columnIndex = columnHeights.indexOf(Math.min(...columnHeights));
      nextColumns[columnIndex].push({ stamp, index });
      columnHeights[columnIndex] += getTileHeight(stamp) + GAP;
    });

    return nextColumns;
  }, [getTileHeight, stamps]);

  const refresh = useCallback(() => setStamps(listStamps()), []);
  useFocusEffect(refresh);

  function confirmDelete(stamp: Stamp) {
    Alert.alert('Delete stamp?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteStamp(stamp.id);
          refresh();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <LiquidGlassButton
          symbol="camera.fill"
          size={44}
          accessibilityLabel="Back to camera"
          onPress={() => router.navigate('/')}
        />
        <Text style={[styles.title, { color: colors.text }]}>Your stamps</Text>
        <View style={styles.headerSpacer} />
      </View>

      {stamps.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.icon }]}>
            No stamps yet. Use the camera to take your first one.
          </Text>
        </View>
      ) : (
        <FlatList
          data={columns}
          keyExtractor={(_, index) => `column-${index}`}
          numColumns={COLUMNS}
          contentContainerStyle={{ padding: GAP, gap: GAP }}
          columnWrapperStyle={{ gap: GAP }}
          renderItem={({ item: column }) => (
            <View style={styles.column}>
              {column.map(({ stamp, index }) => {
                const tileHeight = getTileHeight(stamp);

                return (
                  <Animated.View
                    key={stamp.id}
                    entering={FadeInDown.duration(380)
                      .delay(Math.min(index, 10) * 45)
                      .springify()
                      .damping(16)}
                    exiting={FadeOut.duration(180)}
                    layout={LinearTransition.springify().damping(18)}>
                    <Pressable onPress={() => setPreview(stamp)} onLongPress={() => confirmDelete(stamp)}>
                      <StampFrame width={tileWidth} height={tileHeight}>
                        <Image
                          source={{ uri: stamp.uri }}
                          style={styles.image}
                          contentFit="cover"
                        />
                      </StampFrame>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          )}
        />
      )}

      <StampPreviewOverlay
        uri={preview?.uri}
        visible={!!preview}
        onClose={() => setPreview(null)}
        aspect={preview?.aspect}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: GAP,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: { fontSize: 22, fontWeight: '700' },
  headerSpacer: { width: 44 },
  column: { gap: GAP },
  image: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontSize: 16, textAlign: 'center' },
});
