import { describe, expect, it } from 'vitest';
import { calculateScore, generateShareCode, hasEnoughAnswers } from './scoring.js';

const WEIGHTS = [
  { key: 'process', weight: 1 },
  { key: 'technology', weight: 1 },
  { key: 'data', weight: 1.2 },
  { key: 'automation', weight: 1.2 },
  { key: 'ai', weight: 0.8 },
  { key: 'security', weight: 1.1 },
  { key: 'integration', weight: 1.2 },
  { key: 'reporting', weight: 1 },
  { key: 'scalability', weight: 1 },
];

const all = (value: number): Record<string, number> =>
  Object.fromEntries(WEIGHTS.map((w) => [w.key, value]));

describe('calculateScore', () => {
  it('scores a uniformly manual business at level 1', () => {
    const result = calculateScore(all(1), WEIGHTS);
    expect(result.level).toBe(1);
    expect(result.totalScore).toBe(1);
  });

  it('scores a uniformly intelligent business at level 5', () => {
    const result = calculateScore(all(5), WEIGHTS);
    expect(result.level).toBe(5);
  });

  it('ignores dimensions that were not answered', () => {
    // Six answers, three left blank. The mean must be over the six, not
    // dragged down by treating the blanks as zero.
    const result = calculateScore(
      { process: 4, technology: 4, data: 4, automation: 4, ai: 4, security: 4 },
      WEIGHTS,
    );
    expect(result.totalScore).toBe(4);
    expect(result.level).toBe(4);
  });

  it('weights data, automation and integration more heavily', () => {
    // Same raw numbers, swapped between a heavy and a light dimension. The
    // heavier one being low must pull the score down further.
    const heavyLow = calculateScore({ ...all(5), data: 1, integration: 1 }, WEIGHTS);
    const lightLow = calculateScore({ ...all(5), ai: 1, reporting: 1 }, WEIGHTS);
    expect(heavyLow.totalScore).toBeLessThan(lightLow.totalScore);
  });

  it('names the two weakest dimensions', () => {
    const result = calculateScore({ ...all(5), data: 1, automation: 2 }, WEIGHTS);
    expect(result.weakest).toEqual(['data', 'automation']);
  });

  it('breaks a tie toward the dimension that matters more', () => {
    // ai (0.8) and integration (1.2) both score 1. Integration should be named
    // first, because fixing it unblocks more.
    const result = calculateScore({ ...all(5), ai: 1, integration: 1 }, WEIGHTS);
    expect(result.weakest[0]).toBe('integration');
  });

  it('returns zero rather than NaN when nothing is answered', () => {
    const result = calculateScore({}, WEIGHTS);
    expect(result.totalScore).toBe(0);
    expect(result.level).toBe(1);
  });

  it('rounds the score to two decimals', () => {
    const result = calculateScore({ process: 3, technology: 4, data: 2 }, WEIGHTS);
    expect(result.totalScore.toString()).toMatch(/^\d+(\.\d{1,2})?$/);
  });
});

describe('hasEnoughAnswers', () => {
  it('requires six, so a level is never drawn from two sliders', () => {
    expect(hasEnoughAnswers({ a: 1, b: 2, c: 3, d: 4, e: 5 })).toBe(false);
    expect(hasEnoughAnswers({ a: 1, b: 2, c: 3, d: 4, e: 5, f: 1 })).toBe(true);
  });
});

describe('generateShareCode', () => {
  it('is eight characters long', () => {
    expect(generateShareCode()).toHaveLength(8);
  });

  it('excludes characters that are misread when retyped', () => {
    // No 0/o, 1/l/i. A code gets read aloud and typed by a colleague.
    const codes = Array.from({ length: 200 }, () => generateShareCode()).join('');
    expect(codes).not.toMatch(/[01ilo]/);
  });

  it('produces different codes on successive calls', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateShareCode()));
    expect(codes.size).toBeGreaterThan(95);
  });
});
