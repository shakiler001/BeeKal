import { expect, test } from '@playwright/test';

const email = process.env['E2E_EDITOR_EMAIL'];
const password = process.env['E2E_EDITOR_PASSWORD'];
const runId = process.env['E2E_CONTENT_RUN_ID'];

test.skip(!email || !password || !runId, 'Requires a disposable local Editor account');

test('an editor can publish articles and deliver gated and ungated resources', async ({ page }) => {
  test.setTimeout(180_000);
  const articleSlug = `verify-article-${runId}`;
  const resourceSlug = `verify-resource-${runId}`;
  const articleBody = [
    'An opening paragraph about an operational bottleneck.',
    '',
    '## A clear heading',
    '',
    '- First practical step',
    '- Second practical step',
    '',
    '> A useful observation — Beekal',
  ].join('\n');
  let articleId: string | undefined;
  let resourceId: string | undefined;

  await page.goto('/admin/login');
  await page.getByLabel('Email').fill(email!);
  await page.getByLabel('Password').fill(password!);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/admin(?:\?|$)/);

  try {
    await page.goto('/admin/content/articles/new');
    await page.locator('#art-slug').fill(articleSlug);
    await page.locator('#art-title').fill('Verification article for the content pipeline');
    await page
      .locator('#art-excerpt')
      .fill('A temporary article that checks publishing and content block round-trips.');
    await page.locator('#art-tags').fill('Operations, Verification');
    await page.locator('#art-body').fill(articleBody);
    await page.locator('#art-seoTitle').fill('Verification article for the content pipeline');
    await page
      .locator('#art-seoDescription')
      .fill(
        'Temporary article used to verify publishing, editing, and public visibility through the content pipeline.',
      );
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/content\/articles\/(?!new$)[\w-]+$/);
    articleId = new URL(page.url()).pathname.split('/').pop();

    await page.reload();
    const roundTrip = await page.locator('#art-body').inputValue();
    expect(roundTrip).toContain('## A clear heading');
    expect(roundTrip).toContain('- First practical step');
    expect(roundTrip).toContain('> A useful observation — Beekal');

    const draftArticle = await page.request.get(`/insights/${articleSlug}`);
    expect(draftArticle.status()).toBe(404);
    expect(await (await page.request.get('/sitemap.xml')).text()).not.toContain(articleSlug);

    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    await expect(page.getByText('Status: PUBLISHED')).toBeVisible();
    await expect
      .poll(async () => (await page.request.get(`/insights/${articleSlug}`)).status(), {
        timeout: 30_000,
      })
      .toBe(200);
    await expect
      .poll(async () => (await page.request.get('/insights')).text(), { timeout: 30_000 })
      .toContain(articleSlug);
    const articleRows = (await (
      await page.request.get('http://localhost:4000/api/public/content/articles')
    ).json()) as Array<{ slug: string; publishedAt: string }>;
    const firstPublishedAt = articleRows.find((row) => row.slug === articleSlug)?.publishedAt;
    expect(firstPublishedAt).toBeTruthy();

    await page.locator('#art-body').fill(`${articleBody}\n\nA correction after publication.`);
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Saved.')).toBeVisible();
    await page.getByRole('button', { name: 'Unpublish' }).click();
    await expect(page.getByText('Status: DRAFT')).toBeVisible();
    await expect
      .poll(async () => (await page.request.get(`/insights/${articleSlug}`)).status(), {
        timeout: 30_000,
      })
      .toBe(404);
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    await expect(page.getByText('Status: PUBLISHED')).toBeVisible();
    await expect
      .poll(async () => (await page.request.get(`/insights/${articleSlug}`)).status(), {
        timeout: 30_000,
      })
      .toBe(200);
    const republishedRows = (await (
      await page.request.get('http://localhost:4000/api/public/content/articles')
    ).json()) as Array<{ slug: string; publishedAt: string }>;
    expect(republishedRows.find((row) => row.slug === articleSlug)?.publishedAt).toBe(
      firstPublishedAt,
    );

    await page.goto('/admin/content/resources/new');
    await page.locator('#res-slug').fill(resourceSlug);
    await page.locator('#res-kind').selectOption('guide');
    await page.locator('#res-title').fill('Verification resource for the content pipeline');
    await page
      .locator('#res-description')
      .fill('A temporary resource to verify the email gate and public download link.');
    await page.locator('#res-contents').fill('A useful first step\nA useful second step');
    await page.locator('#res-fileUrl').fill('/score');
    await page.locator('#res-seoTitle').fill('Verification resource for the content pipeline');
    await page
      .locator('#res-seoDescription')
      .fill(
        'Temporary resource used to verify gated and ungated public delivery through the content pipeline.',
      );
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/content\/resources\/(?!new$)[\w-]+$/);
    resourceId = new URL(page.url()).pathname.split('/').pop();

    const draftResource = await page.request.get(`/resources/${resourceSlug}`);
    expect(draftResource.status()).toBe(404);
    expect(await (await page.request.get('/sitemap.xml')).text()).not.toContain(resourceSlug);
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    await expect(page.getByText('Status: PUBLISHED')).toBeVisible();
    await expect
      .poll(async () => (await page.request.get(`/resources/${resourceSlug}`)).status(), {
        timeout: 30_000,
      })
      .toBe(200);
    await expect
      .poll(async () => (await page.request.get('/resources')).text(), { timeout: 30_000 })
      .toContain(resourceSlug);
    const publicResources = (await (
      await page.request.get('http://localhost:4000/api/public/content/resources')
    ).json()) as Array<{ slug: string; fileUrl: string | null; hasFile: boolean }>;
    expect(publicResources.find((row) => row.slug === resourceSlug)).toMatchObject({
      fileUrl: null,
      hasFile: true,
    });

    await page.goto(`/resources/${resourceSlug}`);
    await page.getByLabel('Your email address').fill('verification-reader@example.invalid');
    await page.getByRole('button', { name: 'Get the resource' }).click();
    await expect(
      page.getByRole('link', { name: /open or download the resource/i }),
    ).toHaveAttribute('href', '/score');

    await page.goto(`/admin/content/resources/${resourceId}`);
    await page.getByLabel(/ask for an email address first/i).uncheck();
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Saved.')).toBeVisible();
    await expect
      .poll(async () => {
        const rows = (await (
          await page.request.get('http://localhost:4000/api/public/content/resources')
        ).json()) as Array<{ slug: string; fileUrl: string | null }>;
        return rows.find((row) => row.slug === resourceSlug)?.fileUrl;
      })
      .toBe('/score');
    await expect
      .poll(async () => (await page.request.get('/resources')).text())
      .toContain(resourceSlug);
  } finally {
    if (resourceId) await page.request.delete(`/api/admin/resources/${resourceId}`);
    if (articleId) await page.request.delete(`/api/admin/articles/${articleId}`);
  }
});
