import { useRef, useState, type ReactNode } from 'react';
import { Keyboard, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

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
  value: number | null;
  placeholder: string;
  /** Returns the number to store, null to clear it, or undefined if the text is not valid. */
  parse: (text: string) => number | null | undefined;
  /** Shown under the label when what was typed cannot be saved. */
  invalidHint: string;
  onSave: (value: number | null) => void;
  last?: boolean;
};

/**
 * A number typed straight into the row. A Save button appears as soon as the value
 * is changed; leaving the field or pressing "done" on the keyboard saves as well.
 */
export function NumberSetting({
  label,
  hint,
  unit,
  value,
  placeholder,
  parse,
  invalidHint,
  onSave,
  last,
}: NumberSettingProps) {
  const stored = value === null ? '' : String(value);
  // `draft` is only set while the user is typing; otherwise the stored value shows.
  const [draft, setDraft] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'saved' | 'invalid'>('idle');
  const unsaved = draft !== null && draft.trim() !== stored;
  // Pressing Save also takes focus from the field, so `commit` can run twice for
  // the same text. This remembers what was last handled.
  const handled = useRef<string | null>(null);

  const commit = () => {
    if (draft === null || handled.current === draft) return;
    handled.current = draft;
    if (!unsaved) {
      setDraft(null);
      return;
    }
    const parsed = parse(draft);
    if (parsed === undefined) {
      // Keep what was typed on screen so it can be corrected.
      setStatus('invalid');
      return;
    }
    onSave(parsed);
    setDraft(null);
    setStatus('saved');
  };

  return (
    <SettingRow
      label={label}
      hint={status === 'invalid' ? invalidHint : status === 'saved' ? 'Saved' : hint}
      hintTone={status === 'invalid' ? 'danger' : status === 'saved' ? 'accent' : undefined}
      last={last}>
      <View style={styles.numberBox}>
        <TextInput
          aria-label={label}
          value={draft ?? stored}
          onChangeText={(text) => {
            handled.current = null;
            setDraft(text);
            setStatus('idle');
          }}
          onBlur={commit}
          onSubmitEditing={commit}
          placeholder={placeholder}
          placeholderTextColor={Colors.muted}
          keyboardType="decimal-pad"
          inputMode="decimal"
          returnKeyType="done"
          selectTextOnFocus
          style={[styles.numberInput, status === 'invalid' && styles.numberInputInvalid]}
        />
        {unsaved ? (
          <Pressable
            role="button"
            aria-label={`Save ${label.toLowerCase()}`}
            onPress={() => {
              commit();
              Keyboard.dismiss();
            }}
            style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}>
            <AppText style={styles.saveText}>Save</AppText>
          </Pressable>
        ) : (
          <AppText type="caption" style={styles.unit}>
            {unit}
          </AppText>
        )}
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
  saveButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.onAccent,
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
