/**
 * Weight units. Weights are always stored in kilograms; pounds are only a way of
 * showing and typing them, so switching units never changes the stored data.
 */

export type WeightUnit = 'kg' | 'lb';

export const WEIGHT_UNITS: { value: WeightUnit; label: string }[] = [
  { value: 'kg', label: 'kg' },
  { value: 'lb', label: 'lb' },
];

const KG_PER_LB = 0.45359237;

export function isWeightUnit(value: unknown): value is WeightUnit {
  return value === 'kg' || value === 'lb';
}

/** A stored weight, or a difference between two, as a number in the chosen unit. */
export function fromKg(weightKg: number, unit: WeightUnit): number {
  return unit === 'lb' ? weightKg / KG_PER_LB : weightKg;
}

/** A number typed in the chosen unit, as kilograms. */
export function toKg(value: number, unit: WeightUnit): number {
  return unit === 'lb' ? value * KG_PER_LB : value;
}

/** "74.2" or "163.6": the weight in the chosen unit, to one decimal place. */
export function formatWeight(weightKg: number, unit: WeightUnit): string {
  return fromKg(weightKg, unit).toFixed(1);
}

/** "74.2 kg" or "163.6 lb". */
export function formatWeightWithUnit(weightKg: number, unit: WeightUnit): string {
  return `${formatWeight(weightKg, unit)} ${unit}`;
}

/** Reads a typed number, accepting a comma as the decimal mark. Null if not a number. */
export function parseNumber(input: string): number | null {
  const text = input.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(text)) return null;
  return Number(text);
}
