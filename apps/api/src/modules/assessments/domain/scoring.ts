/**
 * Maturity scoring.
 *
 * Pure functions over plain data. The weights and level copy live in the
 * database (they will change), but the arithmetic lives here so it can be
 * tested without one and produces the same answer on the server as it does in
 * the browser.
 */

export interface DimensionWeight {
  key: string;
  weight: number;
}

export interface ScoreOutcome {
  totalScore: number;
  level: 1 | 2 | 3 | 4 | 5;
  /** The two lowest-scoring dimensions, which is where to look first. */
  weakest: string[];
}

export const MIN_ANSWERS = 6;

export function calculateScore(
  answers: Record<string, number>,
  weights: DimensionWeight[],
): ScoreOutcome {
  const answered = weights.filter((w) => typeof answers[w.key] === 'number');

  const weightSum = answered.reduce((sum, w) => sum + w.weight, 0);
  const weighted = answered.reduce((sum, w) => sum + (answers[w.key] ?? 0) * w.weight, 0);

  // Weighted mean rather than a plain average: Data, Automation and
  // Integration carry more because they are what actually gate the others.
  const totalScore = weightSum > 0 ? weighted / weightSum : 0;
  const level = Math.max(1, Math.min(5, Math.round(totalScore))) as 1 | 2 | 3 | 4 | 5;

  const weakest = [...answered]
    .sort((a, b) => {
      const diff = (answers[a.key] ?? 0) - (answers[b.key] ?? 0);
      // Stable tie-break on weight, so equal scores rank the dimension that
      // matters more as the one to look at first.
      return diff !== 0 ? diff : b.weight - a.weight;
    })
    .slice(0, 2)
    .map((w) => w.key);

  return { totalScore: Math.round(totalScore * 100) / 100, level, weakest };
}

export function hasEnoughAnswers(answers: Record<string, number>): boolean {
  return Object.keys(answers).length >= MIN_ANSWERS;
}

/**
 * A short, shareable code.
 *
 * Deliberately not the row id: a UUID in a URL someone forwards to their CEO
 * looks like a tracking link. Ambiguous characters are excluded so the code
 * survives being read aloud or retyped.
 */
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

export function generateShareCode(random: () => number = Math.random): string {
  let code = '';
  for (let i = 0; i < 8; i += 1) {
    code += ALPHABET[Math.floor(random() * ALPHABET.length)];
  }
  return code;
}
