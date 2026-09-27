import { expect, test } from '@playwright/test';

test('method reads as one connected five-step process', async ({ page }) => {
  await page.goto('/method');

  const flow = page.getByRole('list', { name: 'Five-step Beekal method' });
  await expect(flow.locator('li')).toHaveCount(5);
  for (const step of ['Understand', 'Simplify', 'Systemize', 'Automate', 'Improve']) {
    await expect(flow.getByRole('heading', { name: step })).toBeVisible();
  }
  await expect(flow.locator('svg')).toHaveCount(5);
  await expect(page.getByRole('link', { name: 'How the assessment works' })).toHaveAttribute(
    'href',
    '/assessment',
  );
});

test('assessment makes the sample and all owned deliverables scannable', async ({ page }) => {
  await page.goto('/assessment');

  await expect(page.getByText('Illustrative format, not client data')).toBeVisible();
  const documents = page.getByRole('list', { name: 'Assessment documents' });
  await expect(documents.locator('li')).toHaveCount(11);
  await expect(documents).toContainText('Prioritized roadmap');
  await expect(page.getByRole('link', { name: 'Request an assessment' }).first()).toHaveAttribute(
    'href',
    '/contact?intent=assessment',
  );
});

test('inner landing pages keep clear next-step actions', async ({ page }) => {
  await page.goto('/solutions/build');
  await expect(page.getByRole('link', { name: 'Describe your problem' })).toHaveAttribute(
    'href',
    '/contact?intent=talk',
  );

  await page.goto('/problems/legacy-software');
  await expect(page.getByRole('link', { name: 'Score your business' })).toHaveAttribute(
    'href',
    '/score',
  );
});
