import type { Block } from '@beekal/contracts';

/**
 * Article bodies, written as text.
 *
 * The stored shape is a list of typed blocks, which is right: it validates, and
 * the renderer decides how each type looks so a change to the type scale changes
 * every article rather than none. But nobody should author JSON, and a rich-text
 * editor buys a sanitising problem that lasts forever.
 *
 * So the editor speaks a small, familiar convention and converts:
 *
 *     ## A heading            →  h2
 *     - an item               →  list (consecutive lines merge into one)
 *     > a quote               →  quote
 *     > a quote — Someone     →  quote with attribution
 *     anything else           →  paragraph (blank line ends it)
 *
 * It round-trips: `toText(toBlocks(x))` returns `x` for anything the convention
 * can express, so opening an article to fix a typo does not rewrite it.
 *
 * Deliberately not Markdown. Supporting a subset of a format people know well
 * invites the rest of it — links, bold, tables — and each one is a renderer case
 * and a sanitising question. Four block types is the whole language, and it is
 * short enough to explain above the box.
 */

const QUOTE_ATTRIBUTION = /\s+[—-]\s+(?=[^—-]+$)/;

export function toBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = (): void => {
    if (paragraph.length === 0) return;
    blocks.push({ type: 'p', text: paragraph.join(' ').trim() });
    paragraph = [];
  };

  const flushList = (): void => {
    if (list.length === 0) return;
    blocks.push({ type: 'list', items: list });
    list = [];
  };

  for (const raw of text.split('\n')) {
    const line = raw.trim();

    if (line === '') {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.startsWith('## ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'h2', text: line.slice(3).trim() });
      continue;
    }

    if (line.startsWith('- ')) {
      flushParagraph();
      list.push(line.slice(2).trim());
      continue;
    }

    if (line.startsWith('> ')) {
      flushParagraph();
      flushList();
      const body = line.slice(2).trim();
      const split = body.split(QUOTE_ATTRIBUTION);
      blocks.push(
        split.length === 2 && split[0] && split[1]
          ? { type: 'quote', text: split[0].trim(), attribution: split[1].trim() }
          : { type: 'quote', text: body },
      );
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}

export function toText(blocks: Block[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'h2':
          return `## ${block.text}`;
        case 'list':
          return block.items.map((i) => `- ${i}`).join('\n');
        case 'quote':
          return block.attribution ? `> ${block.text} — ${block.attribution}` : `> ${block.text}`;
        default:
          return block.text;
      }
    })
    .join('\n\n');
}
