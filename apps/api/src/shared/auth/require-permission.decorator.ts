import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'beekal:permission';

/**
 * Declares what a route needs.
 *
 * Authorization is never a hand-written `if` in a controller. It is declared
 * here and evaluated in one place, so the whole policy is greppable and no
 * endpoint can quietly forget to check (docs/04 section 3).
 */
export const RequirePermission = (permission: string) => SetMetadata(PERMISSION_KEY, permission);

export const PUBLIC_KEY = 'beekal:public';

/** Opts a route out of authentication entirely. Used sparingly and visibly. */
export const Public = () => SetMetadata(PUBLIC_KEY, true);
