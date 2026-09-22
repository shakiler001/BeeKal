/**
 * The only place raw brand hex values live outside CSS.
 *
 * Components use design tokens (`bg-surface`, `text-ink`) and a lint rule
 * enforces that. But a few browser-level APIs — the theme-color meta tag, OG
 * image generation, manifest icons — take a literal colour and cannot read a
 * CSS custom property. They import from here.
 *
 * Values are ported from the demo and are contrast-verified. See
 * src/styles/globals.css before changing any of them.
 */
export const BRAND = {
  cobalt: '#1F4FE0',
  amber: '#FFB81C',
  navy: '#0A1640',
  white: '#FFFFFF',
  /** Dark-theme page background. */
  navyDeep: '#0A1235',
} as const;

/**
 * Theme colour for the browser chrome. Dark mode uses the page background
 * rather than the brand, because the chrome should recede, not glow.
 */
export const THEME_COLOR = {
  light: BRAND.cobalt,
  dark: BRAND.navyDeep,
} as const;
