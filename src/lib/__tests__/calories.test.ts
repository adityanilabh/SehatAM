import { buildCaloriePrompt, parseCalorieReply } from '../ai-handoff';
import {
  describeEstimate,
  estimateCalories,
  memoryFor,
  normaliseFoodText,
  type MemoryEntry,
} from '../calories';
import { INDIA_FOODS } from '../food-list';

const total = (text: string, memory: MemoryEntry[] = []) => estimateCalories(text, memory).total;

describe('the built-in food list', () => {
  it('has a few hundred foods with sensible figures', () => {
    expect(INDIA_FOODS.length).toBeGreaterThan(200);
    for (const food of INDIA_FOODS) {
      expect(food.kcal).toBeGreaterThan(0);
      expect(food.kcal).toBeLessThan(700);
      expect(food.names.length).toBeGreaterThan(0);
    }
  });

  it('does not list the same name twice', () => {
    const names = INDIA_FOODS.flatMap((food) => food.names.map(normaliseFoodText));
    const repeated = names.filter((name, index) => names.indexOf(name) !== index);
    expect(repeated).toEqual([]);
  });
});

describe('estimateCalories', () => {
  it('adds up amounts and foods joined by "and"', () => {
    const estimate = estimateCalories('3 egg white and 1 egg whole');

    expect(estimate.total).toBe(3 * 17 + 72);
    expect(estimate.source).toBe('list');
    expect(describeEstimate(estimate)).toBe('3 egg white: 51 · 1 egg: 72');
  });

  it('assumes one serving when no amount is given', () => {
    expect(total('roti')).toBe(80);
    expect(total('dal rice')).toBe(150 + 200);
  });

  it('understands plurals, capitals, commas and plus signs', () => {
    expect(total('2 Rotis')).toBe(160);
    expect(total('Poha, chai')).toBe(180 + 90);
    expect(total('2 idli + sambar')).toBe(90 + 130);
  });

  it('prefers the longest matching name', () => {
    expect(total('masala dosa')).toBe(330);
    expect(total('aloo paratha')).toBe(250);
    expect(total('chai with sugar')).toBe(90);
    expect(total('greek yogurt')).toBe(120);
  });

  it('treats "with" as joining two foods', () => {
    // One roti is 80; ghee defaults to one teaspoon.
    expect(total('2 roti with ghee')).toBe(160 + 45);
  });

  it('reads number words, fractions and decimals', () => {
    expect(total('two roti')).toBe(160);
    expect(total('half paratha')).toBe(90);
    expect(total('1/2 paratha')).toBe(90);
    expect(total('1.5 katori dal')).toBe(225);
  });

  it('converts units for the kind of food', () => {
    expect(total('1 plate rice')).toBe(300); // a plate is one and a half katori
    expect(total('2 katori dal')).toBe(300);
    expect(total('1 tbsp ghee')).toBe(135); // three teaspoons
    expect(total('100 g paneer')).toBe(260); // listed as 130 per 50 g
    expect(total('100g paneer')).toBe(260);
    expect(total('500 ml milk')).toBe(300);
    expect(total('1 glass milk')).toBe(150);
    expect(total('handful of nuts')).toBe(180);
    expect(total('2 slice bread')).toBe(140);
  });

  it('gives no total when any part is not known, and says which', () => {
    const estimate = estimateCalories('2 chilka moong + 1 greek yogurt');

    expect(estimate.total).toBeNull();
    expect(estimate.source).toBeNull();
    expect(estimate.parts.map((part) => [part.label, part.kcal])).toEqual([
      ['2 chilka moong', null],
      ['1 greek yogurt', 120],
    ]);
  });

  it('cannot use grams for a food listed only by the piece', () => {
    expect(total('100 g samosa')).toBeNull();
  });

  it('returns nothing for empty text', () => {
    expect(estimateCalories('   ')).toEqual({ total: null, parts: [], source: null });
  });
});

describe('remembering what the user enters', () => {
  it('remembers the exact text and the figure for one of the food', () => {
    expect(memoryFor('2 chilka moong', 240)).toEqual([
      { key: '2 chilka moong', kcal: 240, per: 'item' },
      { key: 'chilka moong', kcal: 120, per: 'unit' },
    ]);
  });

  it('remembers only the exact text when there are several foods', () => {
    expect(memoryFor('2 chilka moong + 1 greek yogurt', 360)).toEqual([
      { key: '2 chilka moong 1 greek yogurt', kcal: 360, per: 'item' },
    ]);
  });

  it('uses a remembered food at any amount, and alongside listed foods', () => {
    const memory = memoryFor('2 chilka moong', 240);

    expect(total('2 chilka moong', memory)).toBe(240);
    expect(total('3 chilka moong', memory)).toBe(360);
    expect(total('3 chilka moong + 1 greek yogurt', memory)).toBe(480);
    expect(estimateCalories('3 chilka moong', memory).source).toBe('memory');
  });

  it("lets the user's own figure replace the built-in one", () => {
    const memory = memoryFor('1 roti', 110);

    expect(total('2 roti', memory)).toBe(220);
    expect(total('2 roti')).toBe(160);
  });

  it('does not remember an impossible figure', () => {
    expect(memoryFor('roti', -5)).toEqual([]);
    expect(memoryFor('  ', 100)).toEqual([]);
  });
});

describe('asking an AI app', () => {
  it('writes a numbered prompt that asks for a fixed format', () => {
    const prompt = buildCaloriePrompt(['2 chilka moong', 'paneer wrap']);

    expect(prompt).toContain('1. 2 chilka moong\n2. paneer wrap');
    expect(prompt).toContain('1 | 180\n2 | 220');
  });

  it('reads a reply in the requested format', () => {
    expect(parseCalorieReply('```\n1 | 240\n2 | 410\n```', 2)).toEqual([240, 410]);
  });

  it('copes with the ways chat apps drift from the format', () => {
    const reply = [
      'Here are the estimates:',
      '**1.** 240 kcal',
      '2) 200-250',
      '3 | Paneer wrap | ~410 kcal',
      '4: 95.4',
      'TOTAL | 995',
    ].join('\n');

    expect(parseCalorieReply(reply, 4)).toEqual([240, 225, 410, 95]);
  });

  it('leaves a food empty when the reply has no line for it', () => {
    expect(parseCalorieReply('1 | 240\n7 | 999', 3)).toEqual([240, null, null]);
    expect(parseCalorieReply('Sorry, I cannot help with that.', 2)).toEqual([null, null]);
  });
});

describe('foods made of several words', () => {
  it('treats a known word beside unknown words as one unknown food', () => {
    const estimate = estimateCalories('paneer wrap');

    expect(estimate.total).toBeNull();
    expect(estimate.parts.map((part) => [part.label, part.kcal])).toEqual([['paneer wrap', null]]);
  });

  it('still adds up two known foods written side by side', () => {
    expect(total('dal rice')).toBe(350);
    expect(total('2 idli sambar')).toBe(90 + 130);
  });

  it('remembers a several-word food and uses it at other amounts', () => {
    const memory = memoryFor('paneer wrap', 410);

    expect(memory).toEqual([
      { key: 'paneer wrap', kcal: 410, per: 'item' },
      { key: 'paneer wrap', kcal: 410, per: 'unit' },
    ]);
    expect(total('2 paneer wrap', memory)).toBe(820);
    expect(total('paneer wrap + chai', memory)).toBe(500);
    // Plain paneer is still the listed food.
    expect(total('100 g paneer', memory)).toBe(260);
  });

  it('keeps a merged food separate from its neighbours across a joiner', () => {
    const estimate = estimateCalories('2 paneer wrap and 1 roti');

    expect(estimate.parts.map((part) => [part.label, part.kcal])).toEqual([
      ['2 paneer wrap', null],
      ['1 roti', 80],
    ]);
  });

  it('does not guess a per-unit figure when the amount has a unit it cannot convert', () => {
    expect(memoryFor('1 plate paneer wrap', 600)).toEqual([
      { key: '1 plate paneer wrap', kcal: 600, per: 'item' },
    ]);
  });
});
