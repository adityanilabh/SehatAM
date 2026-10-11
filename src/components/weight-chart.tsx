import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { AppText } from './app-text';

import { Colors } from '@/constants/theme';
import { buildLineChart, type ChartPoint } from '@/lib/chart';
import { addDays, dayAndMonth, diffDays, type LogDate } from '@/lib/day';

export type WeightChartProps = {
  points: ChartPoint[];
  from: LogDate;
  to: LogDate;
};

const HEIGHT = 130;

/** The weight line graph. It is drawn from `points`, so it changes with every entry. */
export function WeightChart({ points, from, to }: WeightChartProps) {
  // The chart fills its card, so its width is only known once laid out.
  const [width, setWidth] = useState(0);
  const chart = buildLineChart(points, { from, to }, { width, height: HEIGHT });
  const last = chart.dots[chart.dots.length - 1];
  const middle = addDays(from, Math.floor(diffDays(from, to) / 2));
  const summary =
    points.length === 0
      ? 'No weight logged in this period'
      : `Weight from ${dayAndMonth(from)} to ${dayAndMonth(to)}, ${points.length} entries`;

  return (
    <View style={styles.wrap}>
      <View
        style={styles.plot}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        role="img"
        aria-label={summary}>
        {width > 0 ? (
          <Svg width={width} height={HEIGHT}>
            <Path
              d={`M0 8 H${width} M0 ${HEIGHT / 2} H${width} M0 ${HEIGHT - 8} H${width}`}
              stroke={Colors.line}
              strokeWidth={1}
            />
            {chart.area ? <Path d={chart.area} fill={Colors.accentSoft} /> : null}
            {chart.line ? (
              <Path
                d={chart.line}
                fill="none"
                stroke={Colors.accent}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
            {last ? (
              <Circle
                cx={last.x}
                cy={last.y}
                r={5}
                fill={Colors.card}
                stroke={Colors.accent}
                strokeWidth={3}
              />
            ) : null}
          </Svg>
        ) : null}
      </View>
      <View style={styles.axis}>
        <AppText type="label">{dayAndMonth(from)}</AppText>
        <AppText type="label">{dayAndMonth(middle)}</AppText>
        <AppText type="label">{dayAndMonth(to)}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  plot: {
    height: HEIGHT,
  },
  axis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
