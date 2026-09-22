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
    <p className="flex flex-wrap items-center gap-2 text-[0.78rem]">
      <span className="bg-accent text-on-accent rounded-full px-2.5 py-1 font-bold tracking-wide uppercase">
        Example scenario
      </span>
      <span className="text-ink-2">Named clients replace these as they approve.</span>
    </p>
  );
}
