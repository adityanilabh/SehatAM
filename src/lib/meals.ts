/** The meals a food item can be filed under. An item may also have no meal. */
export const MEALS = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'snack', label: 'Evening snack' },
  { id: 'dinner', label: 'Dinner' },
] as const;

export type Meal = (typeof MEALS)[number]['id'];

/** Heading for items that were not filed under a meal. */
export const NO_MEAL_LABEL = 'Other';

export function isMeal(value: unknown): value is Meal {
  return MEALS.some((meal) => meal.id === value);
}

export function mealLabel(meal: Meal | null): string {
  return MEALS.find((candidate) => candidate.id === meal)?.label ?? NO_MEAL_LABEL;
}

/** The meal most likely being eaten at an hour of the day (0 to 23). */
export function mealForHour(hour: number): Meal {
  if (hour >= 4 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 16) return 'lunch';
  if (hour >= 16 && hour < 19) return 'snack';
  return 'dinner';
}

/**
 * Splits a day's items into sections in meal order, with unfiled items last.
 * Sections with no items are left out; the order of items inside each is kept.
 */
export function groupByMeal<T extends { meal: Meal | null }>(
  items: T[]
): { meal: Meal | null; label: string; items: T[] }[] {
  const order: (Meal | null)[] = [...MEALS.map((meal) => meal.id), null];
  return order
    .map((meal) => ({
      meal,
      label: mealLabel(meal),
      items: items.filter((item) => item.meal === meal),
    }))
    .filter((section) => section.items.length > 0);
}
