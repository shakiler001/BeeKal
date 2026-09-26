import { expect, test } from '@playwright/test';

/**
 * The paths that cost money when they break.
 *
 * Deliberately not a click-through of every page — these are the four journeys
 * where a failure means a lost customer or an exposed admin.
 */

test.describe('the site works without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('content and navigation are still there', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('six systems');

    // A marketing site that needs JS to show text is a marketing site that
    // sometimes shows nothing.
    await page.goto('/assessment');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Native <details> means FAQ answers are readable and findable with no JS.
    const faq = page.locator('details').first();
    await expect(faq).toBeVisible();
  });
});

test.describe('hero transformation', () => {
  test('Today and Tomorrow move the diagram between scattered and connected states', async ({
    page,
  }) => {
    await page.goto('/');
    const control = page.getByRole('group', { name: /your business today/i });
    const today = control.getByRole('button', { name: 'Today' });
    const tomorrow = control.getByRole('button', { name: 'Tomorrow' });
    const hub = page.getByRole('img', { name: /six scattered tools/i }).locator('[class*="hub"]');

    await today.click();
    await expect(today).toHaveAttribute('aria-pressed', 'true');
    await expect
      .poll(() => hub.evaluate((element) => Number((element as HTMLElement).style.opacity)))
      .toBe(0);

    await tomorrow.click();
    await expect(tomorrow).toHaveAttribute('aria-pressed', 'true');
    await expect
      .poll(() => hub.evaluate((element) => Number((element as HTMLElement).style.opacity)))
      .toBeGreaterThan(0.99);
  });
});

test.describe('hero with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('starts in the connected Tomorrow state without waiting for animation', async ({ page }) => {
    await page.goto('/');
    const control = page.getByRole('group', { name: /your business today/i });
    await expect(control.getByRole('button', { name: 'Tomorrow' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const hub = page.getByRole('img', { name: /six scattered tools/i }).locator('[class*="hub"]');
    await expect
      .poll(() => hub.evaluate((element) => Number((element as HTMLElement).style.opacity)))
      .toBe(1);
  });
});

test.describe('lead form', () => {
  test('rejects an incomplete submission and says why', async ({ page }) => {
    await page.goto('/contact');

    await page.getByRole('button', { name: /request an assessment|send this/i }).click();

    // Inline, specific, and announced — not a browser tooltip.
    await expect(page.getByRole('alert').first()).toBeVisible();
  });

  test('keeps marketing consent separate and unticked', async ({ page }) => {
    await page.goto('/contact');

    const checkboxes = page.getByRole('checkbox');
    await expect(checkboxes).toHaveCount(2);

    // The privacy copy promises no mailing list. Silence must mean no.
    for (const box of await checkboxes.all()) {
      await expect(box).not.toBeChecked();
    }
  });

  test('carries the intent through from the CTA that was clicked', async ({ page }) => {
    await page.goto('/contact?intent=talk');
    await expect(page.getByRole('radio', { name: /describe a problem/i })).toBeChecked();
  });
});

test.describe('maturity score', () => {
  test('withholds a result until six are answered, then shows one', async ({ page }) => {
    await page.goto('/score');

    // The progress line, not the empty-result note — both mention the six.
    await expect(page.getByText(/answer at least 6 to see your level/i)).toBeVisible();

    const sliders = page.getByRole('slider');
    const count = await sliders.count();
    expect(count).toBe(9);

    // Answer six. A level drawn from two sliders would be meaningless.
    // Uses 4 rather than 3 so the value genuinely changes from the default —
    // the "answer 3" case is covered by the commit-on-release handler.
    for (let i = 0; i < 6; i += 1) {
      await sliders.nth(i).fill('4');
    }

    await expect(page.getByText(/level \d/i).first()).toBeVisible();
  });

  test('says plainly that no email is required', async ({ page }) => {
    await page.goto('/score');
    await expect(page.getByText(/no email is required/i)).toBeVisible();
  });
});

test.describe('admin is closed', () => {
  const PROTECTED = ['/admin', '/admin/leads', '/admin/people', '/admin/settings', '/admin/audit'];

  for (const path of PROTECTED) {
    test(`${path} redirects to login when signed out`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/admin\/login/);
    });
  }

  test('the login page itself is reachable', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.getByRole('heading', { name: /beekal admin/i })).toBeVisible();
  });

  test('admin pages are not indexable', async ({ page }) => {
    const response = await page.goto('/admin/login');
    expect(response?.headers()['x-robots-tag']).toContain('noindex');
  });
});

test.describe('proof stays honest', () => {
  test('every illustrative case study says so', async ({ page }) => {
    await page.goto('/work');

    // The badge renders from a database flag, so this failing means either the
    // flag or the rendering broke — both worth knowing immediately.
    const badges = page.getByText('Example scenario');
    expect(await badges.count()).toBeGreaterThan(0);
  });

  test('an illustrative case study is noindex', async ({ page }) => {
    const response = await page.goto('/work/garment-exporter-order-visibility');
    const html = (await response?.text()) ?? '';
    expect(html).toContain('noindex');
  });
});
