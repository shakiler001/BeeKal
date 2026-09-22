'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { LeadStage } from '@beekal/contracts';
import { Button, Card, Field, Select } from '@/components/ui';

/** The pipeline stages, in the order a deal actually moves. */
const STAGES: Array<{ value: LeadStage; label: string }> = [
  { value: 'NEW', label: 'New' },
  { value: 'QUALIFYING', label: 'Qualifying' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'ASSESSMENT_PROPOSED', label: 'Assessment proposed' },
  { value: 'ASSESSMENT_BOOKED', label: 'Assessment booked' },
  { value: 'ASSESSMENT_DELIVERED', label: 'Assessment delivered' },
  { value: 'PROJECT_PROPOSED', label: 'Project proposed' },
  { value: 'WON', label: 'Won' },
  { value: 'LOST', label: 'Lost' },
  { value: 'NURTURE', label: 'Nurture' },
  { value: 'DISQUALIFIED', label: 'Disqualified' },
];

export function LeadStageControl({ leadId, stage }: { leadId: string; stage: LeadStage }) {
  const router = useRouter();
  const [value, setValue] = useState<LeadStage>(stage);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save(next: LeadStage) {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: next }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(body.message ?? 'Could not update the stage');
        setValue(stage);
        return;
      }
      router.refresh();
    } catch {
      setError('Could not reach the server.');
      setValue(stage);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <h2 className="text-ink-2 text-[0.78rem] font-bold tracking-[0.09em] uppercase">Stage</h2>
      <div className="mt-3 grid gap-3">
        <Field label="Where is this in the pipeline?" htmlFor="lead-stage">
          <Select
            id="lead-stage"
            value={value}
            onChange={(e) => setValue(e.target.value as LeadStage)}
            disabled={saving}
          >
            {STAGES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
        <Button onClick={() => void save(value)} disabled={saving || value === stage} full>
          {saving ? 'Saving…' : 'Update stage'}
        </Button>
        {error && (
          <p role="alert" className="text-danger text-[0.9rem] font-medium">
            {error}
          </p>
        )}
      </div>
    </Card>
  );
}
