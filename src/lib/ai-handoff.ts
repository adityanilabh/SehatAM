/**
 * Getting calories from an AI app the user already has (ChatGPT, Claude, Gemini and
 * so on). The app writes a prompt, the user sends it in that app, copies the reply
 * and pastes it back here. The prompt asks for a fixed format so the reply can be
 * read by a program.
 */

/** The prompt for a numbered list of foods. Item 1 is `foods[0]`. */
export function buildCaloriePrompt(foods: string[]): string {
  const list = foods.map((food, index) => `${index + 1}. ${food}`).join('\n');
  const example = foods.map((_, index) => `${index + 1} | ${180 + index * 40}`).slice(0, 3);

  return [
    'Estimate the calories (kcal) for each numbered food below.',
    'Assume typical Indian home cooking and usual serving sizes unless an amount is given.',
    '',
    list,
    '',
    'Reply with ONLY a code block in exactly this format: one line per food, the',
    'number, a vertical bar, then the calories as a whole number. No other text.',
    '',
    '```',
    ...example,
    '```',
  ].join('\n');
}

/**
 * Reads the pasted reply. Returns the calories for each food by position, with
 * null where the reply had no usable line. Chat apps do not always follow the
 * format, so this accepts "1 | 240", "1. 240 kcal", "1) 200-250" and the like,
 * taking the middle of a range and ignoring everything else.
 */
export function parseCalorieReply(reply: string, count: number): (number | null)[] {
  const results: (number | null)[] = Array<null>(count).fill(null);

  for (const rawLine of reply.split('\n')) {
    const line = rawLine.replace(/[*`_]/g, '').trim();
    const match =
      /^(\d{1,3})\s*[|:.)\-–—]\s*(?:[^0-9|]*\|\s*)?~?\s*(\d+(?:\.\d+)?)(?:\s*(?:-|–|—|to)\s*(\d+(?:\.\d+)?))?/.exec(
        line
      );
    if (!match) continue;

    const position = Number(match[1]);
    if (position < 1 || position > count) continue;

    const low = Number(match[2]);
    const high = match[3] === undefined ? low : Number(match[3]);
    results[position - 1] = Math.round((low + high) / 2);
  }

  return results;
}
