import type { Metadata } from 'next';
import { BeeMark } from '@/components/brand';
import { SetupForm } from '@/features/admin/setup-form';

export const metadata: Metadata = {
  title: 'Set up your account',
  robots: { index: false, follow: false },
};

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = '' } = await searchParams;
  return (
    <main id="main" className="bg-bg-alt grid min-h-dvh place-items-center px-5 py-12">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <BeeMark title={null} className="mx-auto h-12 w-auto" />
          <h1 className="font-display mt-5 text-2xl font-bold tracking-tight">Join Beekal</h1>
          <p className="text-ink-2 mt-1.5 text-[0.95rem]">
            Set a password to activate your invitation.
          </p>
        </div>
        <SetupForm token={token} />
      </div>
    </main>
  );
}
