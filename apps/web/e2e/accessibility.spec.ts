import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Accessibility, checked rather than asserted.
 *
 * The demo reported zero axe violations across four configurations. That is
 * easy to lose in a port and hard to notice, so every page is checked in both
 * themes at every run (docs/05 section 3).
 */

const PAGES = [
  { path: '/', name: 'home' },
  { path: '/assessment', name: 'assessment' },
  { path: '/solutions', name: 'solutions index' },
  { path: '/solutions/modernize', name: 'solution detail' },
  { path: '/problems/legacy-software', name: 'problem landing' },
  { path: '/work', name: 'work index' },
  { path: '/work/garment-exporter-order-visibility', name: 'case study' },
  { path: '/method', name: 'method' },
  { path: '/score', name: 'score tool' },
  { path: '/insights', name: 'insights index' },
  { path: '/insights/where-should-a-business-actually-use-ai', name: 'article' },
  { path: '/resources', name: 'resources' },
  { path: '/about', name: 'about' },
  { path: '/contact', name: 'contact' },
  { path: '/privacy', name: 'privacy' },
  { path: '/admin/login', name: 'admin login' },
];

const THEMES = ['light', 'dark'] as const;

for (const theme of THEMES) {
  test.describe(`${theme} theme`, () => {
    for (const page of PAGES) {
      test(`${page.name} has no accessibility violations`, async ({ page: browserPage }) => {
        await browserPage.goto(page.path);

        // Set the theme the way the app does, then reload so the pre-paint
        // script applies it exactly as a returning visitor would see it.
        await browserPage.evaluate((t) => localStorage.setItem('bk-theme', t), theme);
        await browserPage.reload();
        await browserPage.waitForLoadState('networkidle');

        const results = await new AxeBuilder({ page: browserPage })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();

        // Name the offending elements in the failure, or the report is useless.
        const summary = results.violations.map((v) => ({
          rule: v.id,
          impact: v.impact,
          help: v.help,
          nodes: v.nodes.map((n) => n.html.slice(0, 120)),
        }));

        expect(summary, `axe violations on ${page.path} (${theme})`).toEqual([]);
      });
    }
  });
}

test.describe('viewport extremes', () => {
  test('no horizontal overflow at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });

    for (const target of ['/', '/assessment', '/score', '/work']) {
      await page.goto(target);
      await page.waitForLoadState('networkidle');

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(overflow, `${target} overflows horizontally at 320px`).toBe(false);
    }
  });
});
