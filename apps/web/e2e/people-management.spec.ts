import { expect, test } from '@playwright/test';

const adminEmail = process.env['E2E_PEOPLE_EMAIL'];
const adminPassword = process.env['E2E_PEOPLE_PASSWORD'];
const runId = process.env['E2E_PEOPLE_RUN_ID'];

test.skip(!adminEmail || !adminPassword || !runId, 'Requires a disposable local administrator');

test('an administrator can invite, assign a custom role, and suspend a colleague', async ({
  page,
  browser,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Single-use invitation is exercised on desktop');
  test.setTimeout(180_000);
  const guestEmail = `codex-people-guest-${runId}@example.invalid`;
  const guestPassword = `Secure Guest 2026! ${runId}`;
  const roleName = `Verification ${runId}`;
  let roleId = '';

  await page.goto('/admin/login');
  await page.getByLabel('Email').fill(adminEmail!);
  await page.getByLabel('Password').fill(adminPassword!);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/admin(?:\?|$)/);

  try {
    await page.goto('/admin/people');
    await page.setViewportSize({ width: 768, height: 900 });
    await expect(page.getByRole('heading', { name: 'People' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const beforeTheme = await page.evaluate(() => document.documentElement.dataset['theme']);
    await page.getByRole('button', { name: /Switch to (dark|light) theme/ }).click();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.dataset['theme']))
      .not.toBe(beforeTheme);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.getByRole('button', { name: 'Invite person' }).click();
    await page.locator('#invite-name').fill('Temporary People Guest');
    await page.locator('#invite-email').fill(guestEmail);
    await page.getByRole('checkbox', { name: 'Editor' }).check();
    await page.getByRole('button', { name: 'Send invitation' }).click();
    const setupLink = page.locator('a[href*="/admin/setup?token="]').first();
    await expect(setupLink).toBeVisible();
    const href = await setupLink.getAttribute('href');
    expect(href).toBeTruthy();
    const token = new URL(href!).searchParams.get('token');
    expect(token).toBeTruthy();

    const setup = await page.request.post('/api/admin/setup', {
      data: { token, password: guestPassword, confirm: guestPassword },
    });
    expect(setup.ok()).toBeTruthy();
    const replay = await page.request.post('/api/admin/setup', {
      data: { token, password: guestPassword, confirm: guestPassword },
    });
    expect(replay.status()).toBe(400);

    const guestContext = await browser.newContext();
    try {
      const guest = await guestContext.newPage();
      await guest.goto(new URL('/admin/login', page.url()).href);
      await guest.getByLabel('Email').fill(guestEmail);
      await guest.getByLabel('Password').fill(guestPassword);
      await guest.getByRole('button', { name: 'Sign in' }).click();
      await expect(guest).toHaveURL(/\/admin(?:\?|$)/);

      await page.goto('/admin/people/roles/new');
      await page.locator('#role-name').fill(roleName);
      await page.getByRole('checkbox', { name: 'View roles' }).check();
      await page.getByRole('button', { name: 'Create role' }).click();
      await expect(page).toHaveURL(/\/admin\/people\/roles\/(?!new$)[\w-]+$/);
      roleId = new URL(page.url()).pathname.split('/').pop() ?? '';

      await page.goto('/admin/people');
      const person = page.getByTestId(`person-${guestEmail}`);
      await expect(person).toBeVisible();
      await person.getByRole('button', { name: 'Edit' }).click();
      await person.getByRole('checkbox', { name: 'Editor' }).uncheck();
      await person.getByRole('checkbox', { name: roleName }).check();
      await person.getByRole('button', { name: 'Save changes' }).click();
      await expect(person.getByText(roleName)).toBeVisible();

      // The guest's existing session picks up the new permissions immediately.
      await expect
        .poll(async () => {
          const response = await guest.request.get('http://localhost:4000/api/auth/me');
          if (!response.ok()) return [`HTTP ${response.status()}`];
          const session = (await response.json()) as { permissions: Record<string, string> };
          return Object.keys(session.permissions);
        })
        .toContain('role:read');
      await guest.goto(new URL('/admin/people', page.url()).href);
      await expect(guest.getByRole('heading', { name: 'Roles' })).toBeVisible();
      await expect(guest.getByRole('button', { name: 'Invite person' })).toHaveCount(0);
      await expect(guest.getByRole('link', { name: 'Create role' })).toHaveCount(0);
      await expect(guest.getByTestId(`person-${guestEmail}`)).toHaveCount(0);

      await person.getByRole('button', { name: 'Edit' }).click();
      await person.getByLabel('Status').selectOption('SUSPENDED');
      await person.getByRole('button', { name: 'Save changes' }).click();
      await expect(person.getByText('suspended')).toBeVisible();
      await guest.goto(new URL('/admin/people', page.url()).href);
      await expect(guest).toHaveURL(/\/admin\/login/);

      await person.getByRole('button', { name: 'Edit' }).click();
      page.once('dialog', (dialog) => void dialog.accept());
      await person.getByRole('button', { name: 'Delete account' }).click();
      await expect(person).toHaveCount(0);

      await page.goto(`/admin/people/roles/${roleId}`);
      page.once('dialog', (dialog) => void dialog.accept());
      await page.getByRole('button', { name: 'Delete role' }).click();
      await expect(page).toHaveURL(/\/admin\/people$/);
      roleId = '';

      const sessionCookie = (await page.context().cookies()).find(
        (cookie) => cookie.name === 'bk_session',
      );
      expect(sessionCookie?.value).toBeTruthy();
      await page.getByRole('button', { name: 'Sign out' }).click();
      await expect(page).toHaveURL(/\/admin\/login$/);
      const oldSession = await page.request.get('http://localhost:4000/api/auth/me', {
        headers: { cookie: `bk_session=${sessionCookie!.value}` },
      });
      expect(oldSession.status()).toBe(401);
    } finally {
      await guestContext.close();
    }
  } finally {
    // The orchestration also deletes exact disposable identifiers if a UI step fails.
    if (roleId) await page.request.delete(`/api/admin/roles/${roleId}`).catch(() => undefined);
  }
});
