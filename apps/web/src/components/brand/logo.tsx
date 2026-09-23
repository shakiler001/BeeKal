import { cn } from '@/lib/cn';

/**
 * The Beekal SVG sprite, lifted verbatim from the demo.
 *
 * It is inlined rather than served as an external sprite file on purpose: the
 * bee fills use `var(--lg-a)` and `var(--lg-b)`, and a `<use>` pointing at an
 * external document does not inherit CSS custom properties from the host page.
 * That is what makes the mark flip correctly in dark mode - the wing goes white
 * on navy - so an external sprite would silently break theming.
 *
 * Rendered once in the root layout. Components reference symbols by id.
 *
 * One trap worth naming: a component's outer <svg> viewBox is NOT the symbol's
 * viewBox. A <use> draws the symbol into a nested viewport at (0,0), so the
 * outer element must start at the origin - "0 0 W H" - and only the width and
 * height are shared. Copying the symbol's own "34 112 1198 352" onto the outer
 * svg shifts the artwork up and left by (34,112) and clips it. The demo had
 * this right; the first port of it did not.
 */
const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
<defs>
<clipPath id="bk-clip"><path d="M-176,0 C-146,-6 -118,-42 -72,-42 C-36,-42 -10,-34 -10,0 C-10,34 -36,42 -72,42 C-118,42 -146,6 -176,0Z"/></clipPath>
<g id="bk-ring"><path d="M431.96,323.27 A134,134 0 1 1 386.13,197.35" fill="none" stroke="#FFB81C" stroke-width="15" stroke-linecap="round"/></g>
<g id="bk-bee-art"><g transform="translate(300,300) rotate(-16)"><path d="M-176,0 C-146,-6 -118,-42 -72,-42 C-36,-42 -10,-34 -10,0 C-10,34 -36,42 -72,42 C-118,42 -146,6 -176,0Z" fill="var(--lg-a,#1F4FE0)" stroke="var(--lg-b,#FFFFFF)" stroke-width="16" stroke-linejoin="round"/><path d="M-176,0 C-146,-6 -118,-42 -72,-42 C-36,-42 -10,-34 -10,0 C-10,34 -36,42 -72,42 C-118,42 -146,6 -176,0Z" fill="var(--lg-a,#1F4FE0)"/><g clip-path="url(#bk-clip)"><rect x="-76" y="-60" width="20" height="120" fill="#FFB81C" transform="rotate(22 -66 0)"/><rect x="-114" y="-60" width="20" height="120" fill="#FFB81C" transform="rotate(22 -104 0)"/><rect x="-152" y="-60" width="20" height="120" fill="#FFB81C" transform="rotate(22 -142 0)"/></g><circle cx="0" cy="0" r="51" fill="var(--lg-b,#FFFFFF)"/><circle cx="55" cy="-6" r="31" fill="var(--lg-b,#FFFFFF)"/><circle cx="0" cy="0" r="44" fill="var(--lg-a,#1F4FE0)"/><circle cx="55" cy="-6" r="24" fill="var(--lg-a,#1F4FE0)"/><path d="M64,-26 C76,-46 96,-56 118,-54" fill="none" stroke="var(--lg-a,#1F4FE0)" stroke-width="7" stroke-linecap="round"/><circle cx="118" cy="-54" r="7" fill="var(--lg-a,#1F4FE0)"/><path d="M-196,10 L-268,15 L-196,20Z" fill="#FFB81C" stroke="#FFB81C" stroke-width="2" stroke-linejoin="round"/><path d="M-196,-10 L-240,-6 L-196,-2Z" fill="#FFB81C" stroke="#FFB81C" stroke-width="2" stroke-linejoin="round"/></g>
<path d="M0,0 C34.2,-31.0 129.2,-28.5 190.0,0 C129.2,12.4 34.2,14.0 0,0Z" transform="translate(300,300) rotate(-110)" fill="#FFB81C" stroke="var(--lg-b,#FFFFFF)" stroke-width="7" stroke-linejoin="round"/><path d="M0,0 C23.4,-28.0 88.4,-25.8 130.0,0 C88.4,11.2 23.4,12.6 0,0Z" transform="translate(300,300) rotate(-134)" fill="#FFB81C" stroke="var(--lg-b,#FFFFFF)" stroke-width="7" stroke-linejoin="round"/><circle cx="300" cy="300" r="11" fill="var(--lg-b,#FFFFFF)"/><circle cx="300" cy="300" r="5.5" fill="var(--lg-a,#1F4FE0)"/></g>
<g id="bk-word"><path d="M622 191Q622 103 560.5 51.5Q499 0 389 0H62V702H378Q485 702 545.5 653.0Q606 604 606 520Q606 458 573.5 417.0Q541 376 487 360Q548 347 585.0 299.5Q622 252 622 191ZM233 418H345Q387 418 409.5 436.5Q432 455 432 491Q432 527 409.5 546.0Q387 565 345 565H233ZM449 214Q449 251 424.5 272.0Q400 293 357 293H233V138H359Q402 138 425.5 157.5Q449 177 449 214Z" transform="translate(600.00,300) scale(0.19000,-0.19000)" fill="var(--lg-a,#1F4FE0)"/><path d="M585 238H198Q202 186 231.5 158.5Q261 131 304 131Q368 131 393 185H575Q561 130 524.5 86.0Q488 42 433.0 17.0Q378 -8 310 -8Q228 -8 164.0 27.0Q100 62 64.0 127.0Q28 192 28 279Q28 366 63.5 431.0Q99 496 163.0 531.0Q227 566 310 566Q391 566 454.0 532.0Q517 498 552.5 435.0Q588 372 588 288Q588 264 585 238ZM413 333Q413 377 383.0 403.0Q353 429 308 429Q265 429 235.5 404.0Q206 379 199 333Z" transform="translate(718.56,300) scale(0.19000,-0.19000)" fill="var(--lg-a,#1F4FE0)"/><path d="M585 238H198Q202 186 231.5 158.5Q261 131 304 131Q368 131 393 185H575Q561 130 524.5 86.0Q488 42 433.0 17.0Q378 -8 310 -8Q228 -8 164.0 27.0Q100 62 64.0 127.0Q28 192 28 279Q28 366 63.5 431.0Q99 496 163.0 531.0Q227 566 310 566Q391 566 454.0 532.0Q517 498 552.5 435.0Q588 372 588 288Q588 264 585 238ZM413 333Q413 377 383.0 403.0Q353 429 308 429Q265 429 235.5 404.0Q206 379 199 333Z" transform="translate(828.95,300) scale(0.19000,-0.19000)" fill="var(--lg-a,#1F4FE0)"/><path d="M469 0 233 310V0H62V702H233V394L467 702H668L396 358L678 0Z" transform="translate(937.44,300) scale(0.19000,-0.19000)" fill="#FFB81C"/><path d="M274 566Q333 566 377.5 542.0Q422 518 446 479V558H617V0H446V79Q421 40 376.5 16.0Q332 -8 273 -8Q205 -8 149.0 27.5Q93 63 60.5 128.5Q28 194 28 280Q28 366 60.5 431.0Q93 496 149.0 531.0Q205 566 274 566ZM324 417Q273 417 237.5 380.5Q202 344 202 280Q202 216 237.5 178.5Q273 141 324 141Q375 141 410.5 178.0Q446 215 446 279Q446 343 410.5 380.0Q375 417 324 417Z" transform="translate(1059.42,300) scale(0.19000,-0.19000)" fill="#FFB81C"/><path d="M233 740V0H62V740Z" transform="translate(1181.78,300) scale(0.19000,-0.19000)" fill="#FFB81C"/></g>
<g id="bk-tag"><path d="M581 187Q581 134 553.5 91.5Q526 49 474.0 24.5Q422 0 353 0H75V695H340Q411 695 462.0 671.0Q513 647 539.0 606.5Q565 566 565 516Q565 456 533.0 416.0Q501 376 447 357Q503 347 542.0 298.0Q581 249 581 187ZM189 403H330Q386 403 417.5 428.5Q449 454 449 502Q449 549 417.5 575.5Q386 602 330 602H189ZM467 199Q467 250 432.0 280.0Q397 310 339 310H189V93H343Q401 93 434.0 121.0Q467 149 467 199Z" transform="translate(606.00,372) scale(0.03300,-0.03300)" fill="var(--lg-a,#1F4FE0)"/><path d="M189 603V399H429V306H189V93H459V0H75V696H459V603Z" transform="translate(638.01,372) scale(0.03300,-0.03300)" fill="var(--lg-a,#1F4FE0)"/><path d="M524 695V602H339V0H225V602H39V695Z" transform="translate(666.52,372) scale(0.03300,-0.03300)" fill="var(--lg-a,#1F4FE0)"/><path d="M524 695V602H339V0H225V602H39V695Z" transform="translate(696.35,372) scale(0.03300,-0.03300)" fill="var(--lg-a,#1F4FE0)"/><path d="M189 603V399H429V306H189V93H459V0H75V696H459V603Z" transform="translate(726.19,372) scale(0.03300,-0.03300)" fill="var(--lg-a,#1F4FE0)"/><path d="M436 0 276 278H189V0H75V695H315Q395 695 450.5 667.0Q506 639 533.5 592.0Q561 545 561 487Q561 419 521.5 363.5Q482 308 400 288L572 0ZM189 369H315Q379 369 411.5 401.0Q444 433 444 487Q444 541 412.0 571.5Q380 602 315 602H189Z" transform="translate(754.70,372) scale(0.03300,-0.03300)" fill="var(--lg-a,#1F4FE0)"/><path d="M524 695V602H339V0H225V602H39V695Z" transform="translate(806.57,372) scale(0.03300,-0.03300)" fill="var(--lg-a,#1F4FE0)"/><path d="M37 349Q37 451 84.5 532.0Q132 613 213.5 658.5Q295 704 392 704Q490 704 571.5 658.5Q653 613 700.0 532.0Q747 451 747 349Q747 247 700.0 165.5Q653 84 571.5 38.5Q490 -7 392 -7Q295 -7 213.5 38.5Q132 84 84.5 165.5Q37 247 37 349ZM630 349Q630 426 599.5 484.0Q569 542 515.0 573.0Q461 604 392 604Q323 604 269.0 573.0Q215 542 184.5 484.0Q154 426 154 349Q154 272 184.5 213.5Q215 155 269.0 123.5Q323 92 392 92Q461 92 515.0 123.5Q569 155 599.5 213.5Q630 272 630 349Z" transform="translate(836.41,372) scale(0.03300,-0.03300)" fill="var(--lg-a,#1F4FE0)"/><path d="M807 695V0H693V476L481 0H402L189 476V0H75V695H198L442 150L685 695Z" transform="translate(873.50,372) scale(0.03300,-0.03300)" fill="var(--lg-a,#1F4FE0)"/><path d="M37 349Q37 451 84.5 532.0Q132 613 213.5 658.5Q295 704 392 704Q490 704 571.5 658.5Q653 613 700.0 532.0Q747 451 747 349Q747 247 700.0 165.5Q653 84 571.5 38.5Q490 -7 392 -7Q295 -7 213.5 38.5Q132 84 84.5 165.5Q37 247 37 349ZM630 349Q630 426 599.5 484.0Q569 542 515.0 573.0Q461 604 392 604Q323 604 269.0 573.0Q215 542 184.5 484.0Q154 426 154 349Q154 272 184.5 213.5Q215 155 269.0 123.5Q323 92 392 92Q461 92 515.0 123.5Q569 155 599.5 213.5Q630 272 630 349Z" transform="translate(913.82,372) scale(0.03300,-0.03300)" fill="var(--lg-a,#1F4FE0)"/><path d="M436 0 276 278H189V0H75V695H315Q395 695 450.5 667.0Q506 639 533.5 592.0Q561 545 561 487Q561 419 521.5 363.5Q482 308 400 288L572 0ZM189 369H315Q379 369 411.5 401.0Q444 433 444 487Q444 541 412.0 571.5Q380 602 315 602H189Z" transform="translate(950.92,372) scale(0.03300,-0.03300)" fill="var(--lg-a,#1F4FE0)"/><path d="M436 0 276 278H189V0H75V695H315Q395 695 450.5 667.0Q506 639 533.5 592.0Q561 545 561 487Q561 419 521.5 363.5Q482 308 400 288L572 0ZM189 369H315Q379 369 411.5 401.0Q444 433 444 487Q444 541 412.0 571.5Q380 602 315 602H189Z" transform="translate(982.99,372) scale(0.03300,-0.03300)" fill="var(--lg-a,#1F4FE0)"/><path d="M37 349Q37 451 84.5 532.0Q132 613 213.5 658.5Q295 704 392 704Q490 704 571.5 658.5Q653 613 700.0 532.0Q747 451 747 349Q747 247 700.0 165.5Q653 84 571.5 38.5Q490 -7 392 -7Q295 -7 213.5 38.5Q132 84 84.5 165.5Q37 247 37 349ZM630 349Q630 426 599.5 484.0Q569 542 515.0 573.0Q461 604 392 604Q323 604 269.0 573.0Q215 542 184.5 484.0Q154 426 154 349Q154 272 184.5 213.5Q215 155 269.0 123.5Q323 92 392 92Q461 92 515.0 123.5Q569 155 599.5 213.5Q630 272 630 349Z" transform="translate(1015.07,372) scale(0.03300,-0.03300)" fill="var(--lg-a,#1F4FE0)"/><path d="M980 695 774 0H645L499 526L344 0L216 -1L19 695H140L284 129L440 695H568L713 132L858 695Z" transform="translate(1052.16,372) scale(0.03300,-0.03300)" fill="var(--lg-a,#1F4FE0)"/></g>
<symbol id="bk-bee" viewBox="40 127 372 268"><use href="#bk-bee-art"/></symbol>
<symbol id="bk-mark" viewBox="40 127 406 320"><use href="#bk-ring"/><use href="#bk-bee-art"/></symbol>
<symbol id="bk-lockup" viewBox="34 112 1198 352"><g transform="translate(-9.20,-28.00) scale(1.1)"><use href="#bk-ring"/><use href="#bk-bee-art"/></g><use href="#bk-word"/></symbol>
<symbol id="bk-lockup-tag" viewBox="34 112 1198 352"><g transform="translate(-9.20,-28.00) scale(1.1)"><use href="#bk-ring"/><use href="#bk-bee-art"/></g><use href="#bk-word"/><use href="#bk-tag"/></symbol>
<symbol id="i-check" viewBox="0 0 20 20"><path d="M4.5 10.5l3.6 3.6 7.4-8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
</defs></svg>`;

export function BrandSprite() {
  return <div aria-hidden dangerouslySetInnerHTML={{ __html: SPRITE }} />;
}

type LogoProps = {
  className?: string;
  /** Accessible name. Pass null when the logo sits next to visible text. */
  title?: string | null;
};

/** The bee and ring, no wordmark. For avatars, the favicon slot, tight spaces. */
export function BeeMark({ className, title = 'Beekal' }: LogoProps) {
  return (
    <svg
      viewBox="0 0 406 320"
      className={cn('h-8 w-auto', className)}
      role={title ? 'img' : 'presentation'}
      aria-label={title ?? undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <use href="#bk-mark" />
    </svg>
  );
}

/** Horizontal lockup: mark plus the Beekal wordmark. */
export function Logo({ className, title = 'Beekal' }: LogoProps) {
  return (
    <svg
      viewBox="0 0 1198 352"
      className={cn('h-9 w-auto', className)}
      role={title ? 'img' : 'presentation'}
      aria-label={title ?? undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <use href="#bk-lockup" />
    </svg>
  );
}

/** Lockup with the "Better Tomorrow" tagline. Footer and print use this one. */
export function LogoWithTagline({ className, title = 'Beekal, Better Tomorrow' }: LogoProps) {
  return (
    <svg
      viewBox="0 0 1198 352"
      className={cn('h-12 w-auto', className)}
      role={title ? 'img' : 'presentation'}
      aria-label={title ?? undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <use href="#bk-lockup-tag" />
    </svg>
  );
}

/** Just the bee, no ring. The hub of the hero animation. */
export function Bee({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 372 268" className={className} aria-hidden focusable="false">
      <use href="#bk-bee" />
    </svg>
  );
}

/** Checkmark for the deliverables lists. Inherits currentColor. */
export function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={cn('size-5', className)} aria-hidden focusable="false">
      <use href="#i-check" />
    </svg>
  );
}
