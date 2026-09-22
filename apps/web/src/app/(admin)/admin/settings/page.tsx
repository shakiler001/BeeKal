import { adminApi } from '@/lib/admin/api';
import { can, requireSession } from '@/lib/admin/session';
import { AdminPageHeader } from '@/features/admin/page-header';
import { SettingsEditor } from '@/features/admin/settings-editor';

export const metadata = { title: 'Settings' };

export interface SettingRow {
  key: string;
  value: unknown;
  group: string;
  label: string;
  helpText: string | null;
}

export default async function SettingsPage() {
  const session = await requireSession();
  const settings = await adminApi.get<SettingRow[]>('/admin/settings');

  return (
    <>
      <AdminPageHeader
        title="Settings"
        description="The facts that appear across the site. Change them here — none of this needs a deploy."
      />
      <div className="mt-8">
        <SettingsEditor settings={settings} canEdit={can(session, 'setting:update')} />
      </div>
    </>
  );
}
