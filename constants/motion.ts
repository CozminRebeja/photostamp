/**
 * Shared motion tokens so micro-interactions feel like one consistent, natural
 * system. These only describe *how* things move — they never change any resting
 * layout, size, or color.
 */
import type { WithSpringConfig } from 'react-native-reanimated';

export const Springs = {
  /** Quick, crisp finger-down response. */
  press: { mass: 0.6, damping: 18, stiffness: 380 } satisfies WithSpringConfig,
  /** Soft, slightly rounded release back to rest. */
  release: { mass: 0.8, damping: 15, stiffness: 220 } satisfies WithSpringConfig,
  /** Gentle settle for size/position changes (e.g. the sliding pill). */
  settle: { mass: 0.9, damping: 17, stiffness: 200 } satisfies WithSpringConfig,
};
