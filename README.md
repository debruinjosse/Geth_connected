# GETH Connected

GETH Connected is a role-based recognition platform that links physical QR cards to a digital recognition, culture, and analytics experience.

## Stack

- Next.js App Router
- React
- TypeScript
- Supabase Auth, Postgres, Storage, and RLS
- next-intl message files for English, Dutch, French, and Danish

## Local Development

```bash
npm install
npm run dev
```

Create `.env.local` from `.env.example` before running authenticated or Supabase-backed flows.

## Production Build

```bash
npm run build
npm run start
```

The build script is platform-neutral and does not push database migrations.

## Database Migrations

Run migrations from a trusted local or CI environment with Supabase credentials available:

```bash
npm run db:push
```

Required values can be provided through `.env.local` locally or through environment variables in CI.

## Translation Maintenance

Message files live in `messages/`. To regenerate Danish and French UI translations with Groq:

```bash
npm run translate:messages
```

Translation generation is a maintenance task only. The website does not translate through Groq at runtime.
