import { expect, test } from '@playwright/test';

test('home separates symptoms, the decision path, and delivery options', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Stop running six systems to run one business.' }),
  ).toBeVisible();
  await expect(page.getByRole('group', { name: /your business today/i })).toBeVisible();

  const problems = page.locator('#problems ol a[href^="/problems/"]');
  const solutions = page.locator('#solutions a[href^="/solutions/"]');
  expect(await problems.count()).toBeGreaterThan(0);
  expect(await solutions.count()).toBeGreaterThan(0);
  await expect(page.locator('#problems a[href="/score"]')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Know the next move before you pay to build it.' }),
  ).toBeVisible();
  await expect(page.locator('#outcome a[href="/assessment"]')).toBeVisible();
  await expect(page.locator('#outcome')).toContainText('The plan stays yours.');

  const firstProblem = await problems.first().getAttribute('href');
  await problems.first().click();
  await expect(page).toHaveURL(new RegExp(`${firstProblem}$`));
  await page.goBack();

  const firstSolution = await solutions.first().getAttribute('href');
  await solutions.first().click();
  await expect(page).toHaveURL(new RegExp(`${firstSolution}$`));
});

test('home illustrations do not cause narrow-screen overflow', async ({ page }) => {
  for (const width of [320, 412, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const { viewport, pageWidth } = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      pageWidth: document.documentElement.scrollWidth,
    }));
    expect(pageWidth, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(viewport);
  }
});
