import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { AppText } from './app-text';
import { Card } from './card';
import { IconButton } from './icon-button';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

/** A titled group of setting rows in one card. */
export function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <AppText type="caption" style={styles.groupTitle} accessibilityRole="header">
        {title}
      </AppText>
      <Card style={styles.card}>{children}</Card>
    </View>
  );
}

type RowProps = {
  label: string;
  /** Smaller text under the label. */
  hint?: string;
  /** Colours the hint, for an error or a confirmation. */
  hintTone?: 'danger' | 'accent';
  last?: boolean;
  children?: ReactNode;
};

/** A label on the left with a control on the right. */
export function SettingRow({ label, hint, hintTone, last, children }: RowProps) {
  return (
    <View style={[styles.row, !last && styles.divider]}>
      <View style={styles.rowText}>
        <AppText>{label}</AppText>
        {hint ? (
          <AppText type="label" color={hintTone} aria-live="polite">
            {hint}
          </AppText>
        ) : null}
      </View>
      {children}
    </View>
  );
}

type NumberSettingProps = {
  label: string;
  hint?: string;
  unit: string;
  /** What the field shows. The screen owns it and saves it. */
  text: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  /** Shown in red under the label, and marks the field invalid. */
  error?: string | null;
  last?: boolean;
};

/** A number typed straight into the row. Saving is up to the screen. */
export function NumberSetting({
  label,
  hint,
  unit,
  text,
  onChangeText,
  placeholder,
  error,
  last,
}: NumberSettingProps) {
  return (
    <SettingRow
      label={label}
      hint={error ?? hint}
      hintTone={error ? 'danger' : undefined}
      last={last}>
      <View style={styles.numberBox}>
        <TextInput
          aria-label={label}
          value={text}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.muted}
          keyboardType="decimal-pad"
          inputMode="decimal"
          returnKeyType="done"
          selectTextOnFocus
          style={[styles.numberInput, error ? styles.numberInputInvalid : null]}
        />
        <AppText type="caption" style={styles.unit}>
          {unit}
        </AppText>
      </View>
    </SettingRow>
  );
}

type StepperSettingProps = {
  label: string;
  hint?: string;
  text: string;
  onDecrease?: () => void;
  onIncrease?: () => void;
  decreaseLabel: string;
  increaseLabel: string;
  last?: boolean;
};

/** A value changed with back and forward buttons. */
export function StepperSetting({
  label,
  hint,
  text,
  onDecrease,
  onIncrease,
  decreaseLabel,
  increaseLabel,
  last,
}: StepperSettingProps) {
  return (
    <SettingRow label={label} hint={hint} last={last}>
      <View style={styles.stepper}>
        <IconButton
          icon={ChevronLeftIcon}
          label={decreaseLabel}
          tone="quiet"
          size={44}
          disabled={!onDecrease}
          onPress={onDecrease}
        />
        <AppText style={styles.stepperText}>{text}</AppText>
        <IconButton
          icon={ChevronRightIcon}
          label={increaseLabel}
          tone="quiet"
          size={44}
          disabled={!onIncrease}
          onPress={onIncrease}
        />
      </View>
    </SettingRow>
  );
}

type SwitchSettingProps = {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  last?: boolean;
};

/** An on/off setting. */
export function SwitchSetting({ label, hint, value, onChange, last }: SwitchSettingProps) {
  return (
    <SettingRow label={label} hint={hint} last={last}>
      <Switch
        aria-label={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: Colors.border, true: Colors.accent }}
        thumbColor={Colors.card}
      />
    </SettingRow>
  );
}

type ActionRowProps = {
  label: string;
  hint?: string;
  danger?: boolean;
  onPress: () => void;
  last?: boolean;
};

/** A whole row that acts as a button. */
export function ActionRow({ label, hint, danger, onPress, last }: ActionRowProps) {
  const color = danger ? Colors.danger : Colors.muted;

  return (
    <Pressable
      role="button"
      aria-label={label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, !last && styles.divider, pressed && styles.pressed]}>
      <View style={styles.rowText}>
        <AppText color={danger ? 'danger' : undefined}>{label}</AppText>
        {hint ? <AppText type="label">{hint}</AppText> : null}
      </View>
      <ChevronRightIcon color={color} size={16} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: Spacing.two,
  },
  groupTitle: {
    fontFamily: Fonts.bold,
    marginLeft: Spacing.one,
  },
  card: {
    paddingVertical: 0,
    paddingHorizontal: 16,
  },
  row: {
    minHeight: 60,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  pressed: {
    opacity: 0.6,
  },
  numberBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  numberInput: {
    width: 76,
    height: 44,
    borderRadius: Radius.small,
    backgroundColor: Colors.ground,
    paddingHorizontal: 10,
    textAlign: 'right',
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Colors.ink,
  },
  numberInputInvalid: {
    borderWidth: 1.5,
    borderColor: Colors.danger,
  },
  unit: {
    minWidth: 28,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  stepperText: {
    minWidth: 70,
    textAlign: 'center',
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
});
