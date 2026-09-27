import { expect, test } from '@playwright/test';

test('work index uses the same honest, measured previews as the homepage', async ({ page }) => {
  await page.goto('/work');

  await expect(
    page.getByRole('heading', { level: 1, name: 'See the thinking behind each approach.' }),
  ).toBeVisible();
  await expect(page.locator('main')).toContainText('not client results');

  const cards = page.locator('main a[href^="/work/"]');
  expect(await cards.count()).toBeGreaterThan(0);
  await expect(cards.first()).toContainText('The friction');
  await expect(cards.first()).toContainText('Proposed approach');
  await expect(cards.first()).not.toContainText('~2 hours');

  const firstHref = await cards.first().getAttribute('href');
  await cards.first().click();
  await expect(page).toHaveURL(new RegExp(`${firstHref}$`));
  await expect(page.getByRole('heading', { name: 'Illustrative outcomes' })).toBeVisible();
  await expect(page.getByText('Hypothetical, not verified client results.')).toBeVisible();
});
