export type WeightPoint = {
  logDate: string;
  weightKg: number;
};

export type WeightSummary = {
  /** The most recent weight in the range, or null when the range is empty. */
  latest: WeightPoint | null;
  /** Latest minus earliest in the range, in kilograms. Null with fewer than two entries. */
  change: number | null;
  /** How far the latest weight is from the target, in kilograms, always positive. */
  toGo: number | null;
  /** True when the target has been met or passed, judged from the starting weight. */
  reached: boolean;
};

/**
 * Figures for the weight screen, all in kilograms. `inRange` is oldest first.
 * `start` is the first weight ever logged, which decides whether the goal is to
 * lose or to gain.
 */
export function summariseWeights(
  inRange: WeightPoint[],
  start: WeightPoint | null,
  targetKg: number | null
): WeightSummary {
  const latest = inRange.length > 0 ? inRange[inRange.length - 1] : null;
  const change = inRange.length > 1 ? latest!.weightKg - inRange[0].weightKg : null;

  if (!latest || targetKg === null) {
    return { latest, change, toGo: null, reached: false };
  }

  const losing = (start?.weightKg ?? latest.weightKg) >= targetKg;
  const reached = losing ? latest.weightKg <= targetKg : latest.weightKg >= targetKg;

  return {
    latest,
    change,
    toGo: reached ? 0 : Math.abs(latest.weightKg - targetKg),
    reached,
  };
}
