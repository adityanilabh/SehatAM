import { INDIA_FOODS, type Food, type ServingKind } from './food-list';

/**
 * Works out the calories in a line of food text, such as "3 egg white and 1 whole
 * egg" or "2 roti with ghee". The text is read left to right as a series of parts,
 * each an optional amount followed by a food. Foods are looked up first in what the
 * user has taught the app (its memory) and then in the built-in list.
 */

/** Something the app has learned from a calorie figure the user entered or pasted. */
export type MemoryEntry = {
  /** Normalised text: a whole item ("2 chilka moong") or a food name ("chilka moong"). */
  key: string;
  kcal: number;
  /** `item`: the calories for that exact text. `unit`: the calories for one of that food. */
  per: 'item' | 'unit';
};

export type CaloriePart = {
  /** How the part reads back, for example "3 egg white". */
  label: string;
  /** Null when the food is not known. */
  kcal: number | null;
  from: 'list' | 'memory' | null;
  /** The food's name in normalised form, used when remembering a correction. */
  nameKey: string;
  /** How many servings the amount came to. */
  servings: number;
};

export type CalorieEstimate = {
  /** Null when any part is unknown, so a partial sum is never passed off as the total. */
  total: number | null;
  parts: CaloriePart[];
  source: 'list' | 'memory' | null;
};

type Unit =
  | 'piece'
  | 'bowl'
  | 'plate'
  | 'glass'
  | 'cup'
  | 'tsp'
  | 'tbsp'
  | 'handful'
  | 'g'
  | 'ml';

const UNIT_WORDS: Record<string, { unit: Unit; scale?: number }> = {
  piece: { unit: 'piece' },
  pc: { unit: 'piece' },
  pcs: { unit: 'piece' },
  nos: { unit: 'piece' },
  slice: { unit: 'piece' },
  packet: { unit: 'piece' },
  pack: { unit: 'piece' },
  scoop: { unit: 'piece' },
  peg: { unit: 'piece' },
  katori: { unit: 'bowl' },
  bowl: { unit: 'bowl' },
  vati: { unit: 'bowl' },
  plate: { unit: 'plate' },
  thali: { unit: 'plate' },
  glass: { unit: 'glass' },
  cup: { unit: 'cup' },
  mug: { unit: 'glass' },
  tsp: { unit: 'tsp' },
  teaspoon: { unit: 'tsp' },
  tbsp: { unit: 'tbsp' },
  tablespoon: { unit: 'tbsp' },
  spoon: { unit: 'tbsp' },
  handful: { unit: 'handful' },
  g: { unit: 'g' },
  gm: { unit: 'g' },
  gms: { unit: 'g' },
  gram: { unit: 'g' },
  kg: { unit: 'g', scale: 1000 },
  ml: { unit: 'ml' },
  l: { unit: 'ml', scale: 1000 },
  litre: { unit: 'ml', scale: 1000 },
  liter: { unit: 'ml', scale: 1000 },
};

const NUMBER_WORDS: Record<string, number> = {
  half: 0.5,
  quarter: 0.25,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  double: 2,
};

/** Words that end one part and start the next. */
const JOINERS = new Set(['and', 'with', 'plus', 'aur']);
/** Words that carry no meaning for the estimate. */
const FILLERS = new Set(['of', 'a', 'an', 'the', 'some', 'x']);

const SEPARATOR = ',';

/** Lower-cases a word and removes a plural "s", so "rotis" and "roti" match. */
function normaliseWord(word: string): string {
  const lower = word.toLowerCase();
  return lower.length > 3 && lower.endsWith('s') && !lower.endsWith('ss')
    ? lower.slice(0, -1)
    : lower;
}

function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[+&;()\n]/g, ` ${SEPARATOR} `)
    .replace(/,/g, ` ${SEPARATOR} `)
    // "100g" and "250ml" are an amount and a unit.
    .replace(/(\d)([a-z])/g, '$1 $2')
    .replace(/[^a-z0-9./, ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => (token === SEPARATOR ? token : normaliseWord(token)));
}

/** The form text is stored and compared in: lower case, singular, single spaces. */
export function normaliseFoodText(text: string): string {
  return tokenise(text)
    .filter((token) => token !== SEPARATOR)
    .join(' ');
}

function readNumber(token: string): number | null {
  if (token in NUMBER_WORDS) return NUMBER_WORDS[token];
  const fraction = /^(\d+)\/(\d+)$/.exec(token);
  if (fraction) return Number(fraction[2]) === 0 ? null : Number(fraction[1]) / Number(fraction[2]);
  return /^\d+(\.\d+)?$/.test(token) ? Number(token) : null;
}

type Candidate = {
  words: string[];
  kcal: number;
  kind: ServingKind;
  grams: number | null;
  name: string;
  from: 'list' | 'memory';
};

const LIST_CANDIDATES: Candidate[] = INDIA_FOODS.flatMap((food: Food) =>
  food.names.map((name) => ({
    words: name.split(' ').map(normaliseWord),
    kcal: food.kcal,
    kind: food.kind,
    grams: food.grams,
    name: food.name,
    from: 'list' as const,
  }))
);

function buildIndex(candidates: Candidate[]): Map<string, Candidate[]> {
  const index = new Map<string, Candidate[]>();
  for (const candidate of candidates) {
    const bucket = index.get(candidate.words[0]) ?? [];
    bucket.push(candidate);
    index.set(candidate.words[0], bucket);
  }
  // Longest first, so "egg white" wins over "egg".
  for (const bucket of index.values()) {
    bucket.sort((a, b) => b.words.length - a.words.length);
  }
  return index;
}

const LIST_INDEX = buildIndex(LIST_CANDIDATES);

function matchAt(
  tokens: string[],
  position: number,
  index: Map<string, Candidate[]>
): Candidate | null {
  for (const candidate of index.get(tokens[position]) ?? []) {
    if (candidate.words.every((word, offset) => tokens[position + offset] === word)) {
      return candidate;
    }
  }
  return null;
}

/** How many of the food's servings an amount comes to, or null if it cannot be worked out. */
function servingsFor(candidate: Candidate, amount: number, unit: Unit | null): number | null {
  const { kind, grams } = candidate;
  switch (unit) {
    case null:
    case 'piece':
      return amount;
    case 'g':
    case 'ml':
      return grams ? amount / grams : null;
    case 'tsp':
      if (kind === 'tsp') return amount;
      if (kind === 'tbsp') return amount / 3;
      return grams ? (amount * 5) / grams : null;
    case 'tbsp':
      if (kind === 'tbsp') return amount;
      if (kind === 'tsp') return amount * 3;
      return grams ? (amount * 15) / grams : null;
    case 'plate':
      return kind === 'bowl' ? amount * 1.5 : amount;
    case 'bowl':
      if (kind === 'plate') return amount * (2 / 3);
      if (kind === 'glass') return amount * 0.6;
      return amount;
    case 'cup':
      return kind === 'glass' ? amount * 0.6 : amount;
    case 'glass':
      return kind === 'cup' ? amount * 1.6 : amount;
    case 'handful':
      return kind === 'grams' && grams ? (amount * 30) / grams : amount;
  }
}

const formatAmount = (amount: number) => String(Math.round(amount * 100) / 100);

/** A run of words with no number, comma or joining word inside it: one thing eaten. */
type Segment = {
  words: string[];
  amount: number;
  /** True when the amount came with a unit, such as "1 plate". */
  hasUnit: boolean;
};

function scan(text: string, memory: MemoryEntry[]): { parts: CaloriePart[]; segments: Segment[] } {
  const memoryIndex = buildIndex(
    memory
      .filter((entry) => entry.per === 'unit' && entry.key !== '')
      .map((entry) => ({
        words: entry.key.split(' '),
        kcal: entry.kcal,
        kind: 'piece' as const,
        grams: null,
        name: entry.key,
        from: 'memory' as const,
      }))
  );

  const tokens = tokenise(text);
  const parts: CaloriePart[] = [];
  let amount: number | null = null;
  let unit: Unit | null = null;
  let unitWord = '';
  let unknown: string[] = [];
  let unknownAmount: number | null = null;
  const segments: Segment[] = [];
  let segmentStart = 0;
  let segmentWords: string[] = [];
  let segmentAmount: number | null = null;
  let segmentHasUnit = false;
  let segmentHasUnknownWord = false;

  const resetAmount = () => {
    amount = null;
    unit = null;
    unitWord = '';
  };
  const flushUnknown = () => {
    if (unknown.length === 0) return;
    const name = unknown.join(' ');
    const servings = unknownAmount ?? 1;
    parts.push({
      label: unknownAmount === null ? name : `${formatAmount(unknownAmount)} ${name}`,
      kcal: null,
      from: null,
      nameKey: name,
      servings,
    });
    unknown = [];
    unknownAmount = null;
  };
  // Called before the first word of a segment is taken, while the amount is still set.
  const beginSegment = () => {
    if (segmentWords.length > 0) return;
    segmentAmount = amount;
    segmentHasUnit = unit !== null;
  };
  const closeSegment = () => {
    flushUnknown();
    if (segmentWords.length > 0) {
      const count = parts.length - segmentStart;
      // A known food with unknown words beside it, like "paneer wrap", is its own
      // food, not paneer plus something. Count none of it rather than part of it.
      if (count > 1 && segmentHasUnknownWord) {
        const name = segmentWords.join(' ');
        parts.splice(segmentStart, count, {
          label: segmentAmount === null ? name : `${formatAmount(segmentAmount)} ${name}`,
          kcal: null,
          from: null,
          nameKey: name,
          servings: segmentAmount ?? 1,
        });
      }
      segments.push({ words: segmentWords, amount: segmentAmount ?? 1, hasUnit: segmentHasUnit });
    }
    segmentStart = parts.length;
    segmentWords = [];
    segmentAmount = null;
    segmentHasUnit = false;
    segmentHasUnknownWord = false;
  };

  for (let position = 0; position < tokens.length; ) {
    const token = tokens[position];

    // A comma, "+", "and" or "with" ends one part. A name that contains such a word,
    // like "chai with sugar", is matched whole from its first word, so it never
    // reaches this point.
    if (token === SEPARATOR || JOINERS.has(token)) {
      closeSegment();
      resetAmount();
      position += 1;
      continue;
    }

    const food = matchAt(tokens, position, memoryIndex) ?? matchAt(tokens, position, LIST_INDEX);
    if (food) {
      beginSegment();
      segmentWords.push(...food.words);
      flushUnknown();
      const servings = servingsFor(food, amount ?? 1, unit);
      const spoken = [amount === null ? null : formatAmount(amount), unitWord || null, food.name]
        .filter(Boolean)
        .join(' ');
      parts.push({
        label: spoken,
        kcal: servings === null ? null : Math.round(servings * food.kcal),
        from: servings === null ? null : food.from,
        nameKey: food.words.join(' '),
        servings: servings ?? 1,
      });
      resetAmount();
      position += food.words.length;
      continue;
    }

    const number = readNumber(token);
    if (number !== null) {
      closeSegment();
      resetAmount();
      amount = number;
      position += 1;
      continue;
    }

    const unitInfo = UNIT_WORDS[token];
    if (unitInfo && unknown.length === 0 && unit === null) {
      unit = unitInfo.unit;
      unitWord = token;
      amount = (amount ?? 1) * (unitInfo.scale ?? 1);
      if (unitInfo.scale) unitWord = unitInfo.unit;
      position += 1;
      continue;
    }

    if (FILLERS.has(token)) {
      position += 1;
      continue;
    }

    // A word that is not a known food: collect it with its neighbours.
    beginSegment();
    segmentWords.push(token);
    segmentHasUnknownWord = true;
    if (unknown.length === 0) {
      unknownAmount = amount;
      resetAmount();
    }
    unknown.push(token);
    position += 1;
  }
  closeSegment();

  return { parts, segments };
}

export function estimateCalories(text: string, memory: MemoryEntry[] = []): CalorieEstimate {
  const whole = normaliseFoodText(text);
  if (whole === '') return { total: null, parts: [], source: null };

  // The exact text has been given a figure before: use it as it stands.
  const remembered = memory.find((entry) => entry.per === 'item' && entry.key === whole);
  if (remembered) {
    return {
      total: remembered.kcal,
      parts: [
        { label: text.trim(), kcal: remembered.kcal, from: 'memory', nameKey: whole, servings: 1 },
      ],
      source: 'memory',
    };
  }

  const { parts } = scan(text, memory);
  const complete = parts.length > 0 && parts.every((part) => part.kcal !== null);
  return {
    total: complete ? parts.reduce((sum, part) => sum + (part.kcal ?? 0), 0) : null,
    parts,
    source: !complete ? null : parts.some((part) => part.from === 'memory') ? 'memory' : 'list',
  };
}

/**
 * What to remember when the user gives a calorie figure for some text. The exact
 * text is always remembered. If the text is a single food, the figure per one of
 * it is remembered too, so "3 chilka moong" can be worked out from "2 chilka moong".
 * A single food may be several words, some of them on the built-in list, as in
 * "paneer wrap".
 */
export function memoryFor(text: string, kcal: number): MemoryEntry[] {
  const whole = normaliseFoodText(text);
  if (whole === '' || !Number.isFinite(kcal) || kcal < 0) return [];

  const entries: MemoryEntry[] = [{ key: whole, kcal, per: 'item' }];
  const { parts, segments } = scan(text, []);
  if (segments.length === 1) {
    // One food: work out the figure for one of it. A single listed food knows how
    // many servings the amount was; otherwise the plain count is used, unless it
    // came with a unit the app cannot convert.
    const [segment] = segments;
    const servings =
      parts.length === 1 ? parts[0].servings : segment.hasUnit ? null : segment.amount;
    if (servings !== null && servings > 0) {
      entries.push({
        key: segment.words.join(' '),
        kcal: Math.round((kcal / servings) * 10) / 10,
        per: 'unit',
      });
    }
  }
  return entries;
}

/** "3 egg white 51 · 1 egg 72", or a note of what is not known. */
export function describeEstimate(estimate: CalorieEstimate): string {
  return estimate.parts
    .map((part) => (part.kcal === null ? `${part.label}: not known` : `${part.label}: ${part.kcal}`))
    .join(' · ');
}
