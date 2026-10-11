import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from './app-text';
import { Button } from './button';
import { confirm } from './confirm';
import { DayStepper } from './day-stepper';
import { Field } from './field';
import { Segmented } from './segmented';
import { Sheet } from './sheet';

import { Spacing } from '@/constants/theme';
import { useDb } from '@/db/provider';
import { updateSettings } from '@/db/settings';
import {
  deleteWeight,
  isValidWeight,
  logWeight,
  MAX_WEIGHT_KG,
  MIN_WEIGHT_KG,
  type WeightEntry,
} from '@/db/weight';
import { shortDate, type LogDate } from '@/lib/day';
import {
  formatWeight,
  formatWeightWithUnit,
  fromKg,
  parseNumber,
  toKg,
  WEIGHT_UNITS,
  type WeightUnit,
} from '@/lib/weight-unit';

export type WeightSheetProps = {
  /** The entry being changed, or null to log a new weight. */
  entry: WeightEntry | null;
  today: LogDate;
  onClose: () => void;
};

/** Log a weight in kilograms or pounds, or change or delete an existing one. */
export function WeightSheet({ entry, today, onClose }: WeightSheetProps) {
  const { db, settings, invalidate } = useDb();
  const unit = settings.weightUnit;
  const [text, setText] = useState(entry ? formatWeight(entry.weightKg, unit) : '');
  const [logDate, setLogDate] = useState(entry?.logDate ?? today);
  const [error, setError] = useState<string | null>(null);

  // Switching unit converts what is already typed and becomes the app-wide choice.
  const changeUnit = async (next: WeightUnit) => {
    if (next === unit) return;
    const typed = parseNumber(text);
    if (typed !== null) {
      setText(fromKg(toKg(typed, unit), next).toFixed(1));
    }
    setError(null);
    await updateSettings(db, { weightUnit: next });
    invalidate();
  };

  const save = async () => {
    const typed = parseNumber(text);
    const weightKg = typed === null ? null : toKg(typed, unit);
    if (weightKg === null || !isValidWeight(weightKg)) {
      const low = Math.ceil(fromKg(MIN_WEIGHT_KG, unit));
      const high = Math.floor(fromKg(MAX_WEIGHT_KG, unit));
      setError(`Enter a weight between ${low} and ${high} ${unit}.`);
      return;
    }
    await logWeight(db, { logDate, weightKg });
    invalidate();
    onClose();
  };

  const remove = async () => {
    if (!entry) return;
    const confirmed = await confirm({
      title: 'Delete this weight?',
      message: `${formatWeightWithUnit(entry.weightKg, unit)} on ${shortDate(entry.logDate)}`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!confirmed) return;

    await deleteWeight(db, entry.id);
    invalidate();
    onClose();
  };

  return (
    <Sheet visible title={entry ? 'Edit weight' : 'Log weight'} onClose={onClose}>
      <View style={styles.weightRow}>
        <View style={styles.weightField}>
          <Field
            label={`Weight (${unit})`}
            value={text}
            onChangeText={setText}
            placeholder={unit === 'kg' ? '74.2' : '163.5'}
            keyboardType="decimal-pad"
            inputMode="decimal"
            autoFocus={!entry}
            error={error}
          />
        </View>
        <View style={styles.unit}>
          <Segmented label="Unit" options={WEIGHT_UNITS} value={unit} onChange={changeUnit} />
        </View>
      </View>
      {entry ? (
        <AppText type="caption">For {shortDate(entry.logDate)}</AppText>
      ) : (
        <DayStepper label="Date" value={logDate} today={today} onChange={setLogDate} />
      )}
      <View style={styles.actions}>
        {entry ? <Button label="Delete" tone="danger" onPress={remove} /> : null}
        <Button label="Save" tone="accent" style={styles.save} onPress={save} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  weightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  weightField: {
    flex: 1,
  },
  unit: {
    // Lines the switch up with the input, below the field's label.
    marginTop: 26,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: Spacing.one,
  },
  save: {
    flex: 1,
  },
});
