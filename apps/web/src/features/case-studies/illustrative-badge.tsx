/**
 * Renders from the `isIllustrative` flag, never hand-written.
 *
 * Master prompt section 28 forbids inventing client results. Making this
 * automatic means nobody can publish a fabricated case as a real one by
 * forgetting to delete a line of markup. In Phase 3 a database check constraint
 * enforces the same rule at the storage layer (docs/04 section 2.3).
 */
export function IllustrativeBadge() {
  return (
    <p className="flex flex-wrap items-center gap-2.5 text-[0.82rem]">
      <span className="bg-brand-soft text-brand rounded-md px-2.5 py-1 text-[0.7rem] leading-none font-bold tracking-[0.08em] uppercase">
        Example scenario
      </span>
      <span className="text-ink-2">Illustrative, not a verified client result.</span>
    </p>
  );
}
