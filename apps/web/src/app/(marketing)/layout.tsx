import { SiteFooter, SiteHeader, StickyDock } from '@/components/patterns';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
      <StickyDock />
    </>
  );
}
