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

test('solution cards make the capability clearer than the brand prefix', async ({ page }) => {
  await page.goto('/');

  for (const capability of ['Build', 'Modernize', 'Automate', 'AI', 'Care']) {
    const link = page.locator(`#solutions a[href="/solutions/${capability.toLowerCase()}"]`);
    const brand = link.getByText('Beekal', { exact: true });
    const name = link.getByText(capability, { exact: true });
    await expect(brand).toBeVisible();
    await expect(name).toBeVisible();
    const sizes = await Promise.all([
      brand.evaluate((element) => parseFloat(getComputedStyle(element).fontSize)),
      name.evaluate((element) => parseFloat(getComputedStyle(element).fontSize)),
    ]);
    expect(sizes[1]).toBeGreaterThan(sizes[0]);
  }
});

test('home example scenarios are readable and do not present illustrative results as proof', async ({
  page,
}) => {
  await page.goto('/');
  const proof = page.locator('#proof');
  await expect(proof.getByText('Example scenario', { exact: true })).toHaveCount(2);
  await expect(proof).toContainText('not verified client results');
  await expect(proof).not.toContainText('~2 hours');
  await expect(proof.getByRole('link', { name: /see all case studies/i })).toBeVisible();

  const steps = page.locator('#problems ol').last().locator('li');
  await expect(steps).toHaveCount(4);
  await expect(page.locator('#problems')).toContainText('Three manual handoffs for one answer.');
});
