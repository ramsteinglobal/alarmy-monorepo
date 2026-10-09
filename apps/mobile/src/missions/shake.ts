// Shake mission placeholder.
// Real implementation uses expo-sensors Accelerometer to count shakes.
// MVP: count N shakes above a threshold; only then resolve dismiss().
export const DEFAULT_SHAKE_TARGET = 20;

export function isShakeComplete(count: number, target: number = DEFAULT_SHAKE_TARGET): boolean {
  return count >= target;
}
