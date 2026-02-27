# Style Migration — Phase 0 + Phase 1 (2026-02-27)

## Scope
Apply the provided frontend style guide to Mission Control without changing the core app behavior.

## Phase 0 — Baseline & Safety

- [x] Create dedicated branch: `chore/style-alignment-phase0-phase1-20260227`
- [x] Capture current build status (`npm run build`)
- [x] Record known technical baseline:
  - Current app is Vite + React 19 + TypeScript (not Next.js yet)
  - Existing UI remains shell + content model, but with inline styles and legacy tokens
- [x] Capture UI screenshots for verification (desktop + mobile)
  - `docs/phase1-desktop.png`
  - `docs/phase1-mobile.png`

## Phase 1 — Design-system normalization

### Tokens & typography
- [x] Normalize core palette to TokyoNight values in `src/index.css`
- [x] Add semantic utility classes (`text-neon-*`, `text-foreground`, `text-muted-foreground`)
- [x] Add shared status color mapping in `src/styles/tokens.ts`
- [x] Set default body font to JetBrains Mono, keep Geist for headings/sans usage

### Replace hardcoded legacy palette
- [x] Replace old neon palette values to the new palette equivalents
- [x] Start replacing direct hex colors with semantic CSS variables in component styles
- [x] Finish replacing remaining non-token hardcoded colors (no hardcoded hex left in `src/**/*.ts(x)` outside token source)

### Build verification
- [x] Build passes after migration pass
- [x] Visual pass verification with screenshots

## Notes
- Next.js + shadcn New York migration is intentionally deferred to later phases to minimize risk.
- This phase focuses on visual consistency and token alignment while preserving runtime behavior.
