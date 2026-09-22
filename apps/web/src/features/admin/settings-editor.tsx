'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Card, Field, Input } from '@/components/ui';

interface SettingRow {
  key: string;
  value: unknown;
  group: string;
  label: string;
  helpText: string | null;
}

/**
 * Grouped and labelled with help text, not a bare key-value table.
 *
 * This is the screen where the founder edits the Assessment price and the
 * reply-time promise. A raw JSON blob invites the kind of mistake that ends up
 * on the homepage (docs/04 section 4).
 */
export function SettingsEditor({
  settings,
  canEdit,
}: {
  settings: SettingRow[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map((s) => [s.key, typeof s.value === 'string' ? s.value : ''])),
  );
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [error, setError] = useState('');

  const groups = [...new Set(settings.map((s) => s.group))];

  async function save(key: string) {
    setSavingKey(key);
    setError('');
    setSavedKey(null);
    try {
      const res = await fetch(`/api/admin/settings/${key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: values[key] ?? '' }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(body.message ?? 'Could not save that');
        return;
      }
      setSavedKey(key);
      router.refresh();
    } catch {
      setError('Could not reach the server.');
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="grid gap-5">
      {groups.map((group) => (
        <Card key={group}>
          <h2 className="font-display text-[1.05rem] font-bold tracking-tight">{group}</h2>
          <div className="mt-4 grid gap-5">
            {settings
              .filter((s) => s.group === group)
              .map((setting) => {
                const dirty = (values[setting.key] ?? '') !== (setting.value ?? '');
                return (
                  <div
                    key={setting.key}
                    className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end"
                  >
                    <Field
                      label={setting.label}
                      htmlFor={`setting-${setting.key}`}
                      hint={setting.helpText ?? undefined}
                    >
                      <Input
                        id={`setting-${setting.key}`}
                        value={values[setting.key] ?? ''}
                        onChange={(e) =>
                          setValues((prev) => ({ ...prev, [setting.key]: e.target.value }))
                        }
                        disabled={!canEdit}
                      />
                    </Field>
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void save(setting.key)}
                        disabled={!dirty || savingKey === setting.key}
                      >
                        {savingKey === setting.key
                          ? 'Saving…'
                          : savedKey === setting.key && !dirty
                            ? 'Saved'
                            : 'Save'}
                      </Button>
                    )}
                  </div>
                );
              })}
          </div>
        </Card>
      ))}

      {error && (
        <p role="alert" className="text-danger text-[0.92rem] font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
