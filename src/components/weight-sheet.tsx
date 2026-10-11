import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from './app-text';
import { Button } from './button';
import { confirm } from './confirm';
import { DayStepper } from './day-stepper';
import { Field } from './field';
import { Sheet } from './sheet';

import { Spacing } from '@/constants/theme';
import { useDb } from '@/db/provider';
import {
  deleteWeight,
  isValidWeight,
  logWeight,
  MAX_WEIGHT_KG,
  MIN_WEIGHT_KG,
  type WeightEntry,
} from '@/db/weight';
import { shortDate, type LogDate } from '@/lib/day';
import { formatKg, parseKg } from '@/lib/weight-stats';

export type WeightSheetProps = {
  /** The entry being changed, or null to log a new weight. */
  entry: WeightEntry | null;
  today: LogDate;
  onClose: () => void;
};

/** Log a weight, or change or delete an existing one. */
export function WeightSheet({ entry, today, onClose }: WeightSheetProps) {
  const { db, invalidate } = useDb();
  const [text, setText] = useState(entry ? formatKg(entry.weightKg) : '');
  const [logDate, setLogDate] = useState(entry?.logDate ?? today);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const weightKg = parseKg(text);
    if (weightKg === null || !isValidWeight(weightKg)) {
      setError(`Enter a weight between ${MIN_WEIGHT_KG} and ${MAX_WEIGHT_KG} kg.`);
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
      message: `${formatKg(entry.weightKg)} kg on ${shortDate(entry.logDate)}`,
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
      <Field
        label="Weight (kg)"
        value={text}
        onChangeText={setText}
        placeholder="74.2"
        keyboardType="decimal-pad"
        inputMode="decimal"
        autoFocus={!entry}
        error={error}
      />
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
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: Spacing.one,
  },
  save: {
    flex: 1,
  },
});
