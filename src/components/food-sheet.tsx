import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from './button';
import { confirm } from './confirm';
import { DayStepper } from './day-stepper';
import { Field } from './field';
import { Sheet } from './sheet';

import { Spacing } from '@/constants/theme';
import { deleteFood, updateFood, type FoodEntry } from '@/db/food';
import { useDb } from '@/db/provider';
import { parseClockTime, type LogDate } from '@/lib/day';

export type FoodSheetProps = {
  entry: FoodEntry;
  today: LogDate;
  onClose: () => void;
};

/** Edit or delete one food item. Mount it with `key={entry.id}` so each item starts fresh. */
export function FoodSheet({ entry, today, onClose }: FoodSheetProps) {
  const { db, invalidate } = useDb();
  const [foodText, setFoodText] = useState(entry.foodText);
  const [quantity, setQuantity] = useState(entry.quantity ?? '');
  const [time, setTime] = useState(entry.eatenAt ?? '');
  const [logDate, setLogDate] = useState(entry.logDate);
  const [foodError, setFoodError] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);

  const save = async () => {
    const eatenAt = time.trim() === '' ? null : parseClockTime(time);
    const badFood = foodText.trim() === '';
    const badTime = time.trim() !== '' && eatenAt === null;
    setFoodError(badFood ? 'Enter what you ate.' : null);
    setTimeError(badTime ? 'Enter a time like 08:30, or leave it empty.' : null);
    if (badFood || badTime) return;

    await updateFood(db, entry.id, { logDate, foodText, quantity, eatenAt });
    invalidate();
    onClose();
  };

  const remove = async () => {
    const confirmed = await confirm({
      title: 'Delete this item?',
      message: entry.foodText,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!confirmed) return;

    await deleteFood(db, entry.id);
    invalidate();
    onClose();
  };

  return (
    <Sheet visible title="Edit item" onClose={onClose}>
      <Field
        label="Food"
        value={foodText}
        onChangeText={setFoodText}
        error={foodError}
        returnKeyType="done"
      />
      <View style={styles.row}>
        <View style={styles.half}>
          <Field
            label="Quantity (optional)"
            value={quantity}
            onChangeText={setQuantity}
            placeholder="2 pieces"
          />
        </View>
        <View style={styles.half}>
          <Field
            label="Time (optional)"
            value={time}
            onChangeText={setTime}
            placeholder="08:30"
            keyboardType="numbers-and-punctuation"
            error={timeError}
          />
        </View>
      </View>
      <DayStepper label="Counts for" value={logDate} today={today} onChange={setLogDate} />
      <View style={styles.actions}>
        <Button label="Delete" tone="danger" onPress={remove} />
        <Button label="Save" tone="accent" style={styles.save} onPress={save} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
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
