'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { InviteUserSchema, UserUpdateSchema, type AdminUser, type Role } from '@beekal/contracts';
import { Button, Card, Field, Input, Select } from '@/components/ui';

type MutationResponse = { id?: string; setupUrl?: string; message?: string };

async function mutate(path: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown) {
  const response = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const payload = (await response.json().catch(() => ({}))) as MutationResponse;
  if (!response.ok) throw new Error(payload.message ?? `Request failed (${response.status})`);
  return payload;
}

function RoleChoices({
  roles,
  selected,
  onChange,
}: {
  roles: Role[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 font-semibold">Roles</legend>
      {roles.map((role) => (
        <label key={role.id} className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={selected.includes(role.id)}
            onChange={(event) =>
              onChange(
                event.target.checked
                  ? [...selected, role.id]
                  : selected.filter((id) => id !== role.id),
              )
            }
          />
          <span>
            {role.name}
            {role.isOwner ? ' (Owner)' : ''}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

export function PeopleManager({
  users,
  roles,
  actorId,
  canCreate,
  canUpdate,
  canDelete,
}: {
  users: AdminUser[];
  roles: Role[];
  actorId: string;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [showInvite, setShowInvite] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [inviteError, setInviteError] = useState('');
  const [setupUrl, setSetupUrl] = useState('');
  const [busy, setBusy] = useState(false);

  async function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInviteError('');
    const parsed = InviteUserSchema.safeParse({ name, email, roleIds });
    if (!parsed.success) {
      setInviteError(parsed.error.issues[0]?.message ?? 'Check the details');
      return;
    }
    setBusy(true);
    try {
      const result = await mutate('/api/admin/users', 'POST', parsed.data);
      setSetupUrl(result.setupUrl ?? '');
      setName('');
      setEmail('');
      setRoleIds([]);
      setShowInvite(false);
      router.refresh();
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : 'Could not invite this person');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold tracking-tight">Users</h2>
        {canCreate && roles.length > 0 && (
          <Button type="button" onClick={() => setShowInvite((shown) => !shown)}>
            {showInvite ? 'Cancel invitation' : 'Invite person'}
          </Button>
        )}
      </div>

      {showInvite && canCreate && (
        <Card padding="sm" className="mb-4">
          <form onSubmit={(event) => void invite(event)} className="grid max-w-xl gap-4">
            <Field label="Name" htmlFor="invite-name">
              <Input
                id="invite-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </Field>
            <Field label="Email" htmlFor="invite-email">
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </Field>
            <RoleChoices roles={roles} selected={roleIds} onChange={setRoleIds} />
            <p className="text-ink-2 text-sm">
              An invitation link expires after 48 hours. Only give Owner access to someone who
              should control the whole site.
            </p>
            {inviteError && (
              <p role="alert" className="text-danger text-sm">
                {inviteError}
              </p>
            )}
            <Button type="submit" disabled={busy}>
              {busy ? 'Inviting…' : 'Send invitation'}
            </Button>
          </form>
        </Card>
      )}

      {setupUrl && (
        <Card padding="sm" className="mb-4">
          <p className="font-semibold">Local development invitation link</p>
          <p className="text-ink-2 mt-1 text-sm">
            The console mail driver did not send email. Copy this link once and share it securely
            with the invitee.
          </p>
          <a href={setupUrl} className="text-brand mt-2 block break-all underline">
            {setupUrl}
          </a>
          <Button type="button" onClick={() => setSetupUrl('')} className="mt-3">
            Dismiss link
          </Button>
        </Card>
      )}

      <div className="grid gap-3">
        {users.map((user) => (
          <PersonCard
            key={user.id}
            user={user}
            roles={roles}
            isSelf={user.id === actorId}
            canUpdate={canUpdate}
            canDelete={canDelete}
            onChanged={() => router.refresh()}
          />
        ))}
      </div>
    </section>
  );
}

function PersonCard({
  user,
  roles,
  isSelf,
  canUpdate,
  canDelete,
  onChanged,
}: {
  user: AdminUser;
  roles: Role[];
  isSelf: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [roleIds, setRoleIds] = useState(user.roles.map((role) => role.id));
  const [status, setStatus] = useState(user.status);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isOwner = user.roles.some((role) => roles.find((r) => r.id === role.id)?.isOwner);
  const [setupUrl, setSetupUrl] = useState('');

  useEffect(() => {
    setName(user.name);
    setRoleIds(user.roles.map((role) => role.id));
    setStatus(user.status);
  }, [user]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const parsed = UserUpdateSchema.safeParse({ name, roleIds, status });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the details');
      return;
    }
    setBusy(true);
    try {
      await mutate(`/api/admin/users/${user.id}`, 'PATCH', parsed.data);
      setEditing(false);
      onChanged();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not save this person');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (
      !window.confirm(
        `Delete ${user.name}'s account? Their sessions will end. This cannot be undone from the admin.`,
      )
    )
      return;
    setError('');
    setBusy(true);
    try {
      await mutate(`/api/admin/users/${user.id}`, 'DELETE');
      onChanged();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not delete this person');
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setError('');
    setBusy(true);
    try {
      const result = await mutate(`/api/admin/users/${user.id}/reinvite`, 'POST');
      setSetupUrl(result.setupUrl ?? '');
      onChanged();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not renew invitation');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card padding="sm" data-testid={`person-${user.email}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">
            {user.name}
            {isSelf ? ' (you)' : ''}
          </p>
          <p className="text-ink-2 text-sm">{user.email}</p>
          <p className="text-ink-2 mt-1 text-sm">
            {user.roles.map((role) => role.name).join(', ')} · {user.status.toLowerCase()}
          </p>
          <p className="text-ink-2 mt-1 text-xs">
            Last sign-in:{' '}
            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'} · MFA:{' '}
            {user.mfaEnabled ? 'on' : 'off'}
          </p>
        </div>
        {canUpdate && roles.length > 0 && (
          <Button type="button" onClick={() => setEditing((value) => !value)}>
            {editing ? 'Cancel' : 'Edit'}
          </Button>
        )}
      </div>
      {editing && canUpdate && (
        <form
          onSubmit={(event) => void save(event)}
          className="border-line mt-5 grid max-w-xl gap-4 border-t pt-5"
        >
          <Field label="Name" htmlFor={`name-${user.id}`}>
            <Input
              id={`name-${user.id}`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </Field>
          <RoleChoices roles={roles} selected={roleIds} onChange={setRoleIds} />
          <Field
            label="Status"
            htmlFor={`status-${user.id}`}
            hint="Suspending ends active sessions immediately."
          >
            <Select
              id={`status-${user.id}`}
              value={status}
              onChange={(event) => setStatus(event.target.value as AdminUser['status'])}
            >
              {user.status === 'INVITED' && <option value="INVITED">Invited</option>}
              <option value="ACTIVE">Active</option>
              {!isSelf && <option value="SUSPENDED">Suspended</option>}
            </Select>
          </Field>
          {isOwner && (
            <p className="text-ink-2 text-sm">
              The last active Owner cannot be suspended, deleted, or lose the Owner role.
            </p>
          )}
          {error && (
            <p role="alert" className="text-danger text-sm">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save changes'}
            </Button>
            {user.status === 'INVITED' && (
              <Button type="button" disabled={busy} onClick={() => void resend()}>
                Renew invitation
              </Button>
            )}
            {canDelete && !isSelf && (
              <Button type="button" disabled={busy} onClick={() => void remove()}>
                Delete account
              </Button>
            )}
          </div>
        </form>
      )}
      {setupUrl && (
        <p className="mt-3 text-sm">
          Local development link:{' '}
          <a href={setupUrl} className="text-brand break-all underline">
            {setupUrl}
          </a>
        </p>
      )}
      {!editing && error && (
        <p role="alert" className="text-danger mt-3 text-sm">
          {error}
        </p>
      )}
    </Card>
  );
}
