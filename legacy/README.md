# Legacy

## `beekal-website-demo.html`

The original single-file website demo, exactly as delivered. It was the repository
root's `index.html` until the monorepo restructure.

**It is kept, not archived.** It remains the reference implementation for a number
of things the production site must not regress:

- The design token system, including the dark theme and the verified contrast
  pairs (`--field` exists specifically to satisfy WCAG 1.4.11)
- The hero before/after animation — timing, the `prefers-reduced-motion` handling,
  the IntersectionObserver trigger and its 6-second fallback
- The nine-dimension maturity score tool, its radar chart and its live regions
- Form validation behaviour: inline errors, focus management, `role="alert"`
- The no-JavaScript fallbacks throughout
- The copy, which is the source for the seeded content rows

When porting a component, read the original here first. The accessibility work in
this file is careful and easy to lose in a rewrite.

## Recovering the original layout

The exact pre-restructure state — `index.html` at the repository root — is tagged:

```bash
git show demo-v1:index.html > index.html
```

## Related

- Port targets and behaviour checklist: [`../docs/03-system-architecture.md`](../docs/03-system-architecture.md) section 4
- Where each section's content goes: [`../docs/02-information-architecture.md`](../docs/02-information-architecture.md) section 4
