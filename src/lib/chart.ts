import { diffDays, type LogDate } from './day';

export type ChartPoint = {
  date: LogDate;
  value: number;
};

export type ChartSize = {
  width: number;
  height: number;
};

export type LineChart = {
  /** SVG path through every point; empty when there are fewer than two. */
  line: string;
  /** The same path closed down to the baseline, for the shaded area. */
  area: string;
  /** Where each point sits, in the same order as the input. */
  dots: { x: number; y: number }[];
};

const round = (value: number) => Math.round(value * 10) / 10;

/**
 * Lays out dated points as a line chart. Each point is placed by its date within
 * the range, so days with no entry leave a gap in time and the line simply joins
 * the neighbouring points. Points outside the range are ignored.
 */
export function buildLineChart(
  points: ChartPoint[],
  range: { from: LogDate; to: LogDate },
  size: ChartSize,
  inset = 8
): LineChart {
  const visible = points
    .filter((point) => point.date >= range.from && point.date <= range.to)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (visible.length === 0 || size.width <= 0 || size.height <= 0) {
    return { line: '', area: '', dots: [] };
  }

  const span = Math.max(1, diffDays(range.from, range.to));
  const values = visible.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const usableWidth = size.width - inset * 2;
  const usableHeight = size.height - inset * 2;

  const dots = visible.map((point) => ({
    x: round(inset + (diffDays(range.from, point.date) / span) * usableWidth),
    // With a single value (or all equal) the line sits in the middle.
    y: round(max === min ? size.height / 2 : inset + ((max - point.value) / (max - min)) * usableHeight),
  }));

  if (dots.length < 2) {
    return { line: '', area: '', dots };
  }

  const line = dots.map((dot, index) => `${index === 0 ? 'M' : 'L'}${dot.x} ${dot.y}`).join(' ');
  const first = dots[0];
  const last = dots[dots.length - 1];
  const area = `${line} L${last.x} ${size.height} L${first.x} ${size.height} Z`;

  return { line, area, dots };
}

/**
 * Heights for a row of bars, scaled so the largest value fills `maxHeight`.
 * Zero stays zero; any other value gets at least `minHeight` so it remains visible.
 */
export function barHeights(values: number[], maxHeight: number, minHeight = 4): number[] {
  const largest = Math.max(0, ...values);
  if (largest === 0) return values.map(() => 0);
  return values.map((value) =>
    value <= 0 ? 0 : Math.max(minHeight, Math.round((value / largest) * maxHeight))
  );
}

/**
 * Bar heights for values that sit in a narrow band, such as body weight: the
 * smallest value gets `minHeight` and the largest `maxHeight`, so small changes
 * are visible.
 */
export function spreadBarHeights(values: number[], maxHeight: number, minHeight: number): number[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => Math.round((maxHeight + minHeight) / 2));
  return values.map((value) =>
    Math.round(minHeight + ((value - min) / (max - min)) * (maxHeight - minHeight))
  );
}
