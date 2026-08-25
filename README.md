# Biohacking Experience

Marketing site for **Biohacking Experience** - the consumer program of Sofia Life
Summit (07-08 November 2026, Grand Hotel Millennium, Sofia).

Built with Next.js 16 (App Router), React 19, and Tailwind CSS v4.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Structure

- `src/app/page.tsx` - the single landing page, assembled from sections.
- `src/components/summit/` - section components (hero, concept, passport,
  program, tickets, register, footer, nav, ticker).
- `src/app/globals.css` - Tailwind import + event palette tokens + animations.

## Deployment

Deployed on Vercel. Push to `main` triggers a production deploy.
