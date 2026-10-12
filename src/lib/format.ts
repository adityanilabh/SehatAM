/** A whole number with thousands separators: 1020 becomes "1,020". */
export function formatNumber(value: number): string {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
