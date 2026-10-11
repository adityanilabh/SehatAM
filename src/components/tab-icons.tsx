import { type ReactNode } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export type TabIconProps = {
  color: string;
};

function Icon({ color, children }: TabIconProps & { children: ReactNode }) {
  return (
    <Svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round">
      {children}
    </Svg>
  );
}

export function HomeIcon({ color }: TabIconProps) {
  return (
    <Icon color={color}>
      <Path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
    </Icon>
  );
}

export function FoodIcon({ color }: TabIconProps) {
  return (
    <Icon color={color}>
      <Path d="M3 11h18a9 9 0 0 1-18 0z" />
      <Path d="M12 3v4M8 4v3M16 4v3" />
    </Icon>
  );
}

export function WeightIcon({ color }: TabIconProps) {
  return (
    <Icon color={color}>
      <Path d="M3 17l6-6 4 4 8-8" />
      <Path d="M15 7h6v6" />
    </Icon>
  );
}

export function SettingsIcon({ color }: TabIconProps) {
  return (
    <Icon color={color}>
      <Path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h8M16 18h4" />
      <Circle cx={16} cy={6} r={2} />
      <Circle cx={8} cy={12} r={2} />
      <Circle cx={14} cy={18} r={2} />
    </Icon>
  );
}
