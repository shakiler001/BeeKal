import type { Metadata } from 'next';
import { BeeMark } from '@/components/brand';
import { LoginForm } from '@/features/admin/login-form';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * Outside the admin layout on purpose: that layout calls requireSession(),
 * which would redirect here and loop.
 */
export default function LoginPage() {
  return (
    <main id="main" className="bg-bg-alt grid min-h-dvh place-items-center px-5 py-12">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <BeeMark title={null} className="mx-auto h-12 w-auto" />
          <h1 className="font-display mt-5 text-2xl font-bold tracking-tight">Beekal Admin</h1>
          <p className="text-ink-2 mt-1.5 text-[0.95rem]">Sign in to continue.</p>
        </div>

        <LoginForm />

        <p className="text-ink-2 mt-6 text-center text-[0.85rem]">
          Trouble signing in? Contact whoever set up your account.
        </p>
      </div>
    </main>
  );
}
