# GETH Connected Cards — MVP Starter

A Next.js + TypeScript starter for the GETH physical-to-digital recognition platform.

## Pages included

- `/` — marketing landing page
- `/claim-card/[slug]` — QR claim flow
- `/employee` — employee dashboard
- `/manager` — manager dashboard
- `/company` — company admin dashboard
- `/cards` — 53-card library
- `/login` — auth placeholder

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Connect Supabase

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Add your Supabase URL and anon key.
4. Run `supabase/migrations/001_geth_schema.sql` in Supabase SQL editor.
5. Replace the demo server action in `app/actions/claimRecognition.ts` with the commented Supabase insert.

## Suggested next build order

1. Auth + profile creation
2. Company/team/employee management
3. Claim-card insert into Supabase
4. Replace demo dashboard data with SQL aggregations
5. Super admin card and company management
bbbbh