/**
 * Procedural postage-stamp silhouette.
 *
 * `buildStampPath` returns an SVG `d` string for a rectangle of the given pixel
 * size whose four edges are lined with evenly-spaced semicircular perforations
 * that bite *inward*, producing the classic torn stamp edge. Generating the path
 * at the frame's real pixel size keeps every perforation perfectly circular at
 * any aspect ratio (portrait / square / landscape), which is what the camera
 * screen's aspect toggle relies on.
 *
 * The geometry mirrors the reference design (~10px perforation radius, ~35px
 * pitch in the Figma mock).
 */
export type StampAspect = 'portrait' | 'square' | 'landscape';

/** height / width for each aspect option. */
export const STAMP_ASPECT_RATIO: Record<StampAspect, number> = {
  portrait: 4 / 3,
  square: 1,
  landscape: 3 / 4,
};

type BuildOptions = {
  /** Target spacing between perforation centers, in px. */
  pitch?: number;
  /** Perforation radius as a fraction of the cell size. */
  radiusRatio?: number;
};

export function buildStampPath(
  width: number,
  height: number,
  { pitch = 34, radiusRatio = 0.3 }: BuildOptions = {}
): string {
  const cols = Math.max(2, Math.round(width / pitch));
  const rows = Math.max(2, Math.round(height / pitch));
  const cw = width / cols;
  const ch = height / rows;
  const r = Math.min(cw, ch) * radiusRatio;
  const n = (v: number) => v.toFixed(2);
  const arc = `A${n(r)} ${n(r)} 0 0 0`; // semicircle, sweep=0 → bulges inward

  const d: string[] = ['M0 0'];
  // Top edge, left → right.
  for (let i = 0; i < cols; i++) {
    const cx = (i + 0.5) * cw;
    d.push(`L${n(cx - r)} 0`, `${arc} ${n(cx + r)} 0`);
  }
  d.push(`L${n(width)} 0`);
  // Right edge, top → bottom.
  for (let j = 0; j < rows; j++) {
    const cy = (j + 0.5) * ch;
    d.push(`L${n(width)} ${n(cy - r)}`, `${arc} ${n(width)} ${n(cy + r)}`);
  }
  d.push(`L${n(width)} ${n(height)}`);
  // Bottom edge, right → left.
  for (let i = cols - 1; i >= 0; i--) {
    const cx = (i + 0.5) * cw;
    d.push(`L${n(cx + r)} ${n(height)}`, `${arc} ${n(cx - r)} ${n(height)}`);
  }
  d.push(`L0 ${n(height)}`);
  // Left edge, bottom → top.
  for (let j = rows - 1; j >= 0; j--) {
    const cy = (j + 0.5) * ch;
    d.push(`L0 ${n(cy + r)}`, `${arc} 0 ${n(cy - r)}`);
  }
  d.push('Z');
  return d.join(' ');
}
