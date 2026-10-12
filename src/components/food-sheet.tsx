import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from './app-text';
import { Button } from './button';
import { confirm } from './confirm';
import { DayStepper } from './day-stepper';
import { Field } from './field';
import { MealChips } from './meal-chips';
import { Sheet } from './sheet';

import { Fonts, Spacing } from '@/constants/theme';
import { deleteFood, updateFood, type CalorieSource, type FoodEntry } from '@/db/food';
import { estimateFor, rememberCalories } from '@/db/memory';
import { useDb, useDbQuery } from '@/db/provider';
import { describeEstimate } from '@/lib/calories';
import { parseClockTime, type LogDate } from '@/lib/day';

export type FoodSheetProps = {
  entry: FoodEntry;
  today: LogDate;
  onClose: () => void;
};

const SOURCE_NOTE: Record<CalorieSource, string> = {
  list: 'Worked out from the food list',
  memory: 'From a figure you gave before',
  ai: 'From an AI app',
  manual: 'Typed by you',
};

/** Edit or delete one food item. Mount it with `key={entry.id}` so each item starts fresh. */
export function FoodSheet({ entry, today, onClose }: FoodSheetProps) {
  const { db, invalidate } = useDb();
  const [foodText, setFoodText] = useState(entry.foodText);
  const [quantity, setQuantity] = useState(entry.quantity ?? '');
  const [time, setTime] = useState(entry.eatenAt ?? '');
  const [meal, setMeal] = useState(entry.meal);
  const [logDate, setLogDate] = useState(entry.logDate);
  // Null until the calories field is typed in; until then it follows the food text.
  const [typedCalories, setTypedCalories] = useState<string | null>(null);
  const [foodError, setFoodError] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [caloriesError, setCaloriesError] = useState<string | null>(null);

  const estimate = useDbQuery(`estimate:${foodText}`, (source) => estimateFor(source, foodText));
  const textChanged = foodText.trim() !== entry.foodText;
  // What the app would fill in by itself: the saved figure while the food is
  // unchanged, otherwise a fresh estimate for the new text.
  const automatic: { calories: number | null; source: CalorieSource | null } =
    !textChanged && entry.calories !== null
      ? { calories: entry.calories, source: entry.calorieSource }
      : { calories: estimate?.total ?? null, source: estimate?.source ?? null };
  const caloriesText =
    typedCalories ?? (automatic.calories === null ? '' : String(automatic.calories));

  const hint =
    typedCalories !== null
      ? 'Your figure will be remembered for this food'
      : automatic.calories === null
        ? estimate && estimate.parts.length > 0
          ? `Not known: ${estimate.parts
              .filter((part) => part.kcal === null)
              .map((part) => part.label)
              .join(', ')}. Type the calories, or use "Ask an AI app" on the Food screen.`
          : 'Type the calories if you know them'
        : automatic.source === 'list' && estimate && estimate.total !== null
          ? `${SOURCE_NOTE.list}: ${describeEstimate(estimate)}`
          : automatic.source
            ? SOURCE_NOTE[automatic.source]
            : undefined;

  const save = async () => {
    const eatenAt = time.trim() === '' ? null : parseClockTime(time);
    const badFood = foodText.trim() === '';
    const badTime = time.trim() !== '' && eatenAt === null;

    let calories = automatic.calories;
    let calorieSource = automatic.source;
    let badCalories = false;
    if (typedCalories !== null) {
      const text = typedCalories.trim();
      if (text === '') {
        calories = null;
        calorieSource = null;
      } else if (/^\d{1,5}$/.test(text)) {
        calories = Number(text);
        calorieSource = 'manual';
      } else {
        badCalories = true;
      }
    }

    setFoodError(badFood ? 'Enter what you ate.' : null);
    setTimeError(badTime ? 'Enter a time like 08:30, or leave it empty.' : null);
    setCaloriesError(badCalories ? 'Enter a whole number, or leave it empty.' : null);
    if (badFood || badTime || badCalories) return;

    await updateFood(db, entry.id, {
      logDate,
      foodText,
      meal,
      quantity,
      eatenAt,
      calories,
      calorieSource,
    });
    if (calorieSource === 'manual' && calories !== null) {
      // Next time this food is typed, the app fills the figure in by itself.
      await rememberCalories(db, foodText, calories);
    }
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
      <View style={styles.field}>
        <Field
          label="Calories (kcal)"
          value={caloriesText}
          onChangeText={setTypedCalories}
          placeholder="Not known"
          keyboardType="number-pad"
          inputMode="numeric"
          error={caloriesError}
        />
        {hint && !caloriesError ? <AppText type="caption">{hint}</AppText> : null}
      </View>
      <View style={styles.field}>
        <AppText type="caption" style={styles.label}>
          Meal (optional)
        </AppText>
        <MealChips value={meal} onChange={setMeal} wrap />
      </View>
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
  field: {
    gap: Spacing.two,
  },
  label: {
    fontFamily: Fonts.semiBold,
  },
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
