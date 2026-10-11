/**
 * Design values taken from the approved mockups. Every screen reads from here
 * so the look stays consistent. Phase 1 is light mode only.
 */

export const Colors = {
  ground: '#EEF1F6',
  card: '#FFFFFF',
  ink: '#111B3A',
  muted: '#5B6478',
  accent: '#2447E0',
  accentSoft: '#E8ECFD',
  onAccent: '#FFFFFF',
  onAccentMuted: '#DCE3FF',
  line: '#E6EAF2',
  border: '#D5DBE7',
  danger: '#B42318',
} as const;

export const Fonts = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semiBold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 14,
  four: 20,
  five: 28,
} as const;

export const Radius = {
  small: 12,
  field: 16,
  row: 20,
  card: 24,
  hero: 28,
  pill: 999,
} as const;

export const Shadows = {
  card: '0 4px 14px rgba(17, 27, 58, 0.05)',
  raised: '0 8px 24px rgba(17, 27, 58, 0.10)',
  accent: '0 14px 28px rgba(36, 71, 224, 0.28)',
} as const;

/** Content stays a phone-width column, centred on wide screens. */
export const MaxContentWidth = 480;

export const TabBar = {
  height: 68,
  margin: 16,
} as const;
