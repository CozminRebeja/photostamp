import type { StampAspect } from '@/features/stamp/stamp-path';

/** A single stamp photo stored locally on the device. */
export type Stamp = {
  /** Stable id, also the filename stem (e.g. `stamp-1718045400000`). */
  id: string;
  /** `file://` uri of the saved image in the app's document directory. */
  uri: string;
  /** Creation time in epoch milliseconds. */
  createdAt: number;
  /** Stamp frame ratio selected when the photo was taken. */
  aspect: StampAspect;
};
