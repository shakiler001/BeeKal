import { expect, test, type Page } from '@playwright/test';

const email = process.env['E2E_ADMIN_EMAIL'];
const password = process.env['E2E_ADMIN_PASSWORD'];

test.skip(!email || !password, 'Requires a disposable local administrator');

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ChromeGeometry {
  header: Box;
  brand: Box;
  theme: Box;
  main: Box;
  viewportWidth: number;
  scrollWidth: number;
  marker: string | null;
}

async function geometry(page: Page): Promise<ChromeGeometry> {
  return page.evaluate(() => {
    const box = (selector: string) => {
      const node = document.querySelector(selector);
      if (!node) throw new Error(`Missing admin chrome element: ${selector}`);
      const { x, y, width, height } = node.getBoundingClientRect();
      return { x, y, width, height };
    };

    return {
      header: box('header'),
      brand: box('header a[href="/admin"]'),
      theme: box('header button[aria-label^="Switch to"]'),
      main: box('main'),
      viewportWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      marker: document.querySelector('header')?.getAttribute('data-a1-marker') ?? null,
    };
  });
}

function expectStable(before: ChromeGeometry, after: ChromeGeometry) {
  for (const part of ['header', 'brand', 'theme'] as const) {
    for (const axis of ['x', 'y', 'width', 'height'] as const) {
      expect(after[part][axis], `${part}.${axis} moved`).toBeCloseTo(before[part][axis], 0);
    }
  }
  expect(after.main.y, 'content moved vertically').toBeCloseTo(before.main.y, 0);
  expect(after.scrollWidth, 'page gained horizontal overflow').toBeLessThanOrEqual(
    after.viewportWidth,
  );
}

async function navigate(page: Page, name: string, href: string) {
  const desktopNav = page.getByRole('navigation', { name: 'Admin', exact: true });
  if (await desktopNav.isVisible()) {
    await desktopNav.getByRole('link', { name }).click();
  } else {
    await page.getByRole('button', { name: 'Menu' }).click();
    await page
      .getByRole('navigation', { name: 'Admin, mobile' })
      .getByRole('link', { name })
      .click();
    await expect(page.getByRole('button', { name: 'Menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  }
  await expect.poll(() => new URL(page.url()).pathname).toBe(href);
  if (!(await desktopNav.isVisible())) {
    await page.getByRole('button', { name: 'Menu' }).click();
  }
  await expect(page.locator('header nav a[aria-current="page"]:visible')).toHaveAttribute(
    'href',
    href,
  );
  if (!(await desktopNav.isVisible())) {
    await page.getByRole('button', { name: 'Close menu' }).click();
  }
}

test('admin chrome keeps its geometry across routes and interaction states', async ({
  page,
}, testInfo) => {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill(email!);
  await page.getByLabel('Password').fill(password!);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/admin(?:\?|$)/);
  await page.evaluate(() => document.fonts.ready);
  await page.locator('header').evaluate((node) => node.setAttribute('data-a1-marker', 'persist'));

  const initial = await geometry(page);
  for (const [name, href] of [
    ['Leads', '/admin/leads'],
    ['Content', '/admin/content'],
    ['People', '/admin/people'],
    ['Settings', '/admin/settings'],
    ['Audit', '/admin/audit'],
    ['Dashboard', '/admin'],
  ] as const) {
    if (testInfo.project.name === 'mobile') {
      await page.getByRole('button', { name: 'Menu' }).click();
      expectStable(initial, await geometry(page));
      await expect(page.getByRole('navigation', { name: 'Admin, mobile' })).toBeVisible();
      await page.getByRole('button', { name: 'Close menu' }).click();
    }
    await navigate(page, name, href);
    const current = await geometry(page);
    expect(current.marker, 'shared layout remounted').toBe('persist');
    expectStable(initial, current);
  }

  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expectStable(initial, await geometry(page));
  await navigate(page, 'People', '/admin/people');
  expectStable(initial, await geometry(page));
  await page.getByRole('button', { name: 'Switch to light theme' }).click();

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await navigate(page, 'Dashboard', '/admin');
  expectStable(initial, await geometry(page));

  if (testInfo.project.name === 'mobile') {
    for (const width of [768, 320]) {
      await page.setViewportSize({ width, height: 900 });
      const resized = await geometry(page);
      expect(resized.scrollWidth).toBeLessThanOrEqual(resized.viewportWidth);
      await page.getByRole('button', { name: 'Menu' }).focus();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('button', { name: 'Close menu' })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
      expectStable(resized, await geometry(page));
      await page.getByRole('button', { name: 'Close menu' }).press('Enter');
      await navigate(page, 'Content', '/admin/content');
      expectStable(resized, await geometry(page));
      await navigate(page, 'Dashboard', '/admin');
    }
  }

  const beforeReload = await geometry(page);
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  expectStable(beforeReload, await geometry(page));
});
