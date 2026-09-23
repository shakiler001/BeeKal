import { describe, expect, it } from 'vitest';
import { toBlocks, toText } from './blocks';

describe('article body text', () => {
  it('reads paragraphs, headings, lists and quotes', () => {
    const text = [
      '## Where the time goes',
      '',
      'Most of it is not in the work.',
      'It is in the handover between two systems.',
      '',
      '- The re-keying',
      '- The chasing',
      '',
      '> You cannot automate a process nobody has written down. — Every assessment',
    ].join('\n');

    expect(toBlocks(text)).toEqual([
      { type: 'h2', text: 'Where the time goes' },
      {
        type: 'p',
        text: 'Most of it is not in the work. It is in the handover between two systems.',
      },
      { type: 'list', items: ['The re-keying', 'The chasing'] },
      {
        type: 'quote',
        text: 'You cannot automate a process nobody has written down.',
        attribution: 'Every assessment',
      },
    ]);
  });

  it('round-trips, so opening an article to fix a typo does not rewrite it', () => {
    const text = [
      '## A heading',
      '',
      'A paragraph.',
      '',
      '- One',
      '- Two',
      '',
      '> A quote — Someone',
    ].join('\n');

    expect(toText(toBlocks(text))).toBe(text);
  });

  it('keeps a dash inside a quote that is not an attribution', () => {
    // "a well-known problem" must not be split on its hyphen.
    const [block] = toBlocks('> This is a well-known problem');
    expect(block).toEqual({ type: 'quote', text: 'This is a well-known problem' });
  });

  it('ignores blank lines rather than emitting empty blocks', () => {
    expect(toBlocks('\n\n\n')).toEqual([]);
  });
});
