import { barHeights, buildLineChart, spreadBarHeights } from '../chart';
import { formatKg, parseKg, summariseWeights } from '../weight-stats';

const range = { from: '2026-10-01', to: '2026-10-11' };
const size = { width: 116, height: 66 };

describe('buildLineChart', () => {
  it('draws nothing when there is no data', () => {
    expect(buildLineChart([], range, size)).toEqual({ line: '', area: '', dots: [] });
  });

  it('shows a single entry as a dot in the middle, with no line', () => {
    const chart = buildLineChart([{ date: '2026-10-06', value: 74 }], range, size);

    expect(chart.line).toBe('');
    expect(chart.dots).toEqual([{ x: 58, y: 33 }]);
  });

  it('places points by date and puts the highest value at the top', () => {
    const chart = buildLineChart(
      [
        { date: '2026-10-01', value: 76 },
        { date: '2026-10-06', value: 75 },
        { date: '2026-10-11', value: 74 },
      ],
      range,
      size
    );

    expect(chart.dots).toEqual([
      { x: 8, y: 8 },
      { x: 58, y: 33 },
      { x: 108, y: 58 },
    ]);
    expect(chart.line).toBe('M8 8 L58 33 L108 58');
    expect(chart.area).toBe('M8 8 L58 33 L108 58 L108 66 L8 66 Z');
  });

  it('joins across days with no entry', () => {
    const chart = buildLineChart(
      [
        { date: '2026-10-01', value: 76 },
        { date: '2026-10-11', value: 74 },
      ],
      range,
      size
    );

    expect(chart.line).toBe('M8 8 L108 58');
  });

  it('ignores entries outside the range and sorts the rest', () => {
    const chart = buildLineChart(
      [
        { date: '2026-10-11', value: 74 },
        { date: '2026-09-20', value: 80 },
        { date: '2026-10-01', value: 76 },
      ],
      range,
      size
    );

    expect(chart.dots).toHaveLength(2);
    expect(chart.dots[0].x).toBe(8);
  });

  it('draws a flat line when every value is the same', () => {
    const chart = buildLineChart(
      [
        { date: '2026-10-01', value: 74 },
        { date: '2026-10-11', value: 74 },
      ],
      range,
      size
    );

    expect(chart.line).toBe('M8 33 L108 33');
  });
});

describe('bar heights', () => {
  it('scales to the largest value and keeps small values visible', () => {
    expect(barHeights([0, 1, 5, 10], 40)).toEqual([0, 4, 20, 40]);
  });

  it('is all zero when there is nothing to show', () => {
    expect(barHeights([0, 0, 0], 40)).toEqual([0, 0, 0]);
  });

  it('spreads a narrow band of values across the full height', () => {
    expect(spreadBarHeights([75, 74.5, 74], 40, 20)).toEqual([40, 30, 20]);
    expect(spreadBarHeights([74, 74], 40, 20)).toEqual([30, 30]);
    expect(spreadBarHeights([], 40, 20)).toEqual([]);
  });
});

describe('summariseWeights', () => {
  const start = { logDate: '2026-09-01', weightKg: 76 };

  it('is empty when nothing has been logged', () => {
    expect(summariseWeights([], null, 70)).toEqual({
      latest: null,
      change: null,
      toGo: null,
      reached: false,
    });
  });

  it('has no change figure from a single entry', () => {
    const only = { logDate: '2026-10-11', weightKg: 74.2 };

    expect(summariseWeights([only], start, 70)).toEqual({
      latest: only,
      change: null,
      toGo: 4.2,
      reached: false,
    });
  });

  it('reports the change across the range and the distance to the target', () => {
    const summary = summariseWeights(
      [
        { logDate: '2026-10-01', weightKg: 76 },
        { logDate: '2026-10-11', weightKg: 74.2 },
      ],
      start,
      70
    );

    expect(summary.change).toBe(-1.8);
    expect(summary.toGo).toBe(4.2);
  });

  it('leaves the target figures empty when no target is set', () => {
    const summary = summariseWeights([{ logDate: '2026-10-11', weightKg: 74.2 }], start, null);

    expect(summary.toGo).toBeNull();
    expect(summary.reached).toBe(false);
  });

  it('recognises a reached target when losing and when gaining', () => {
    expect(summariseWeights([{ logDate: 'd', weightKg: 69.8 }], start, 70)).toMatchObject({
      reached: true,
      toGo: 0,
    });
    const lightStart = { logDate: '2026-09-01', weightKg: 50 };
    expect(summariseWeights([{ logDate: 'd', weightKg: 53 }], lightStart, 55)).toMatchObject({
      reached: false,
      toGo: 2,
    });
    expect(summariseWeights([{ logDate: 'd', weightKg: 55.5 }], lightStart, 55)).toMatchObject({
      reached: true,
    });
  });
});

describe('weight text', () => {
  it('formats to one decimal place', () => {
    expect(formatKg(74)).toBe('74.0');
    expect(formatKg(74.25)).toBe('74.3');
  });

  it('reads typed weights and rejects anything else', () => {
    expect(parseKg('74.2')).toBe(74.2);
    expect(parseKg(' 74,2 ')).toBe(74.2);
    expect(parseKg('74')).toBe(74);
    expect(parseKg('74kg')).toBeNull();
    expect(parseKg('')).toBeNull();
    expect(parseKg('-5')).toBeNull();
  });
});
