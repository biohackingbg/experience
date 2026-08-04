# This is NOT the Next.js you know

This project runs **Next.js 16** (App Router, React 19, Tailwind v4). APIs,
conventions, and file structure may differ from older Next.js. Read the relevant
guide in `node_modules/next/dist/docs/` before writing framework code, and heed
deprecation notices.

## Project

Standalone marketing site for **Biohacking Experience** — the consumer program of
Sofia Life Summit (07–08 November 2026, Grand Hotel Millennium, Sofia). Single
long-form landing page assembled from section components in
`src/components/summit/`. Content is in Bulgarian.

- **Fonts:** Unbounded (display), Inter (body), Geist Mono (labels) via `next/font`.
- **Palette:** `bh-lime` / `bh-forest` / `bh-ink` / `bh-paper` / `bh-stone`,
  defined as theme tokens in `src/app/globals.css`.
- **Dev/preview:** launched via `.claude/launch.json` → `scripts/dev-entry.cjs`,
  forced to **webpack** (Turbopack panics in the preview sandbox).
