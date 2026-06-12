/**
 * StampFrame clips its children (a photo or a live camera preview) to a classic
 * postage-stamp silhouette with perforated (scalloped) edges.
 *
 * The silhouette is generated at the frame's real pixel size by `buildStampPath`
 * and used as a MaskedView mask, so the children are physically clipped to the
 * stamp shape — the perforations cut straight into the image and read correctly
 * over any background (matching the Figma design's edge-to-edge stamp).
 */
import MaskedView from '@react-native-masked-view/masked-view';
import { ReactNode, useMemo } from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { buildStampPath } from './stamp-path';

type StampFrameProps = {
  width: number;
  height: number;
  children: ReactNode;
  style?: ViewStyle;
};

export function StampFrame({ width, height, children, style }: StampFrameProps) {
  const path = useMemo(() => buildStampPath(width, height), [width, height]);

  return (
    <MaskedView
      style={[{ width, height }, style]}
      maskElement={
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <Path d={path} fill="#fff" />
        </Svg>
      }>
      <View style={{ width, height }}>{children}</View>
    </MaskedView>
  );
}
