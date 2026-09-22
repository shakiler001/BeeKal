'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { Permission, Role, ScopeValue } from '@beekal/contracts';
import { Button, Card, Field, Input, Select } from '@/components/ui';
import { cn } from '@/lib/cn';

/**
 * The role editor.
 *
 * This is the screen the "multi user configurable for different roles"
 * requirement is really about. A permission matrix grouped by resource, a scope
 * selector on each grant, and a live plain-English summary beside it — because
 * a wall of checkboxes tells an administrator what they ticked, not what the
 * role can do (docs/04 section 4).
 */

const SCOPES: Array<{ value: ScopeValue; label: string; help: string }> = [
  { value: 'ALL', label: 'Everything', help: 'Every record of this type' },
  { value: 'OWN', label: 'Own only', help: 'Only records they created' },
  { value: 'ASSIGNED', label: 'Assigned only', help: 'Only records assigned to them' },
];

/** Scope is only meaningful where records have an owner or an assignee. */
const SCOPEABLE = new Set(['lead', 'lead_note', 'pipeline']);

export function RoleEditor({
  role,
  permissions,
  canEdit,
}: {
  role: Role;
  permissions: Permission[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description ?? '');
  const [grants, setGrants] = useState<Map<string, ScopeValue>>(
    new Map(role.grants.map((g) => [g.permissionKey, g.scope])),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const grouped = useMemo(() => {
    const byGroup = new Map<string, Map<string, Permission[]>>();
    for (const p of permissions) {
      if (!byGroup.has(p.group)) byGroup.set(p.group, new Map());
      const byResource = byGroup.get(p.group);
      if (!byResource) continue;
      if (!byResource.has(p.resource)) byResource.set(p.resource, []);
      byResource.get(p.resource)?.push(p);
    }
    return byGroup;
  }, [permissions]);

  function toggle(key: string, resource: string) {
    setSaved(false);
    setGrants((prev) => {
      const next = new Map(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.set(key, SCOPEABLE.has(resource) ? 'ALL' : 'ALL');
      }
      return next;
    });
  }

  function setScope(key: string, scope: ScopeValue) {
    setSaved(false);
    setGrants((prev) => new Map(prev).set(key, scope));
  }

  async function save() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/roles/${role.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || undefined,
          grants: [...grants].map(([permissionKey, scope]) => ({ permissionKey, scope })),
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(body.message ?? 'Could not save that');
        return;
      }

      setSaved(true);
      router.refresh();
    } catch {
      setError('Could not reach the server.');
    } finally {
      setSaving(false);
    }
  }

  const summary = useMemo(
    () => buildSummary([...grants.keys()], permissions),
    [grants, permissions],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
      <div className="grid gap-5">
        <Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Role name" htmlFor="role-name">
              <Input
                id="role-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSaved(false);
                }}
                disabled={!canEdit}
              />
            </Field>
            <Field label="Description" htmlFor="role-description" optional>
              <Input
                id="role-description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setSaved(false);
                }}
                disabled={!canEdit}
              />
            </Field>
          </div>

          {role.isOwner && (
            <p className="border-accent bg-bg-alt text-ink-2 mt-4 border-l-2 py-2 pl-3 text-[0.88rem]">
              This is the Owner role. It cannot be deleted and cannot lose user or role management —
              that is what makes locking everyone out impossible.
            </p>
          )}
        </Card>

        {[...grouped].map(([group, byResource]) => (
          <Card key={group}>
            <h2 className="font-display text-[1.05rem] font-bold tracking-tight">{group}</h2>
            <div className="mt-4 grid gap-5">
              {[...byResource].map(([resource, perms]) => (
                <fieldset key={resource}>
                  <legend className="text-ink-2 text-[0.78rem] font-bold tracking-[0.09em] uppercase">
                    {resource.replace(/_/g, ' ')}
                  </legend>
                  <div className="mt-2 grid gap-2">
                    {perms.map((p) => {
                      const granted = grants.has(p.key);
                      const scope = grants.get(p.key) ?? 'ALL';
                      return (
                        <div key={p.key} className="flex flex-wrap items-center gap-3">
                          <label className="flex min-h-9 flex-1 items-center gap-2.5 text-[0.95rem]">
                            <input
                              type="checkbox"
                              checked={granted}
                              onChange={() => toggle(p.key, p.resource)}
                              disabled={!canEdit}
                              className="accent-brand size-[18px] flex-none"
                            />
                            <span className={cn(granted ? 'text-ink' : 'text-ink-2')}>
                              {p.label}
                            </span>
                          </label>

                          {granted && SCOPEABLE.has(p.resource) && (
                            <Select
                              value={scope}
                              onChange={(e) => setScope(p.key, e.target.value as ScopeValue)}
                              disabled={!canEdit}
                              aria-label={`Scope for ${p.label}`}
                              className="min-h-9 w-auto py-1 text-[0.85rem]"
                            >
                              {SCOPES.map((s) => (
                                <option key={s.value} value={s.value}>
                                  {s.label}
                                </option>
                              ))}
                            </Select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:sticky lg:top-24">
        <Card>
          <h2 className="font-display text-[1.05rem] font-bold tracking-tight">This role can:</h2>
          {summary.length === 0 ? (
            <p className="text-ink-2 mt-3 text-[0.95rem]">Nothing yet. Tick some permissions.</p>
          ) : (
            <ul className="mt-3 grid gap-1.5 text-[0.92rem]">
              {summary.map((line) => (
                <li key={line} className="text-ink-2">
                  {line}
                </li>
              ))}
            </ul>
          )}

          <p className="border-line text-ink-2 mt-4 border-t pt-3 text-[0.85rem]">
            {role.userCount === 0
              ? 'Nobody holds this role yet.'
              : `${role.userCount} ${role.userCount === 1 ? 'person holds' : 'people hold'} this role. Saving changes what they can do immediately.`}
          </p>
        </Card>

        {canEdit && (
          <div className="grid gap-2">
            <Button onClick={() => void save()} disabled={saving} full>
              {saving ? 'Saving…' : 'Save role'}
            </Button>
            {saved && (
              <p role="status" className="text-brand text-center text-[0.9rem] font-medium">
                Saved. Everyone holding this role is updated.
              </p>
            )}
            {error && (
              <p role="alert" className="text-danger text-center text-[0.9rem] font-medium">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Turns ticked boxes into sentences an administrator can check. */
function buildSummary(keys: string[], permissions: Permission[]): string[] {
  const byResource = new Map<string, string[]>();
  const lookup = new Map(permissions.map((p) => [p.key, p]));

  for (const key of keys) {
    const p = lookup.get(key);
    if (!p) continue;
    const list = byResource.get(p.resource) ?? [];
    list.push(p.action);
    byResource.set(p.resource, list);
  }

  return [...byResource]
    .map(([resource, actions]) => {
      const noun = resource.replace(/_/g, ' ');
      const sorted = [...actions].sort();
      if (sorted.length === 1 && sorted[0] === 'read') return `View ${noun}s`;
      return `${sorted.join(', ')} ${noun}s`;
    })
    .sort();
}
