# Company Dashboard Monthly Insights

## Card Library Sync

The official English card source is `GETH_cards_full_English.xlsx`.

Excel mapping:

- `Card number` -> `card_library.card_number`
- `Name` -> `card_library.title`
- `Category` -> `card_library.category`
- `Quality` -> `card_library.description`
- `Recognition sentence` -> `card_library.recognition_sentence`

The importer is `scripts/sync-english-cards.mjs`.

It validates:

- all required columns exist
- exactly 53 cards are present
- card numbers normalize correctly from values such as `Card 01`
- card numbers are unique
- title, category, quality, and recognition sentence are not blank

Generated migration:

- `supabase/migrations/015_sync_english_card_library.sql`

Safety behavior:

- updates rows by `card_number`
- preserves existing `id`
- preserves existing `qr_slug`
- preserves existing `active`
- does not rewrite QR URLs
- does not break existing `recognition_events.card_id` references
- validates that recognition events still point to valid cards

Local fallback:

- `lib/cards.ts` is synchronized from the same workbook data.
- Existing local `id`, `slug`, and `active` values are preserved.

Run locally:

```powershell
npm run cards:sync:english -- "C:\Users\aynas\Downloads\GETH_cards_full_English.xlsx"
npm run db:push
```

## Company Dashboard Formulas

Helper:

- `lib/data/company-dashboard-insights.ts`

All reads use the normal server Supabase client and remain scoped to the authenticated company admin's `company_id`.

Employee-count definition:

- active profiles with role `employee` or `manager`
- excludes `company_admin`, `platform_admin`, and `super_admin`
- this same workforce definition is used for recognition rate and engagement score

Date windows:

- current period: now minus 30 days through now
- previous period: now minus 60 days through now minus 30 days

Engagement score:

- active workforce members who have received at least one recognition at any time
- divided by total active workforce
- multiplied by 100 and rounded

Engagement delta:

- current 30-day recognition rate minus previous 30-day recognition rate
- shown as percentage-point movement

Recognition rate:

- active workforce members who received at least one recognition in the current 30-day period
- divided by total active workforce
- multiplied by 100 and rounded

Recognition-rate delta:

- current 30-day recognition rate minus previous 30-day recognition rate
- shown as percentage-point movement

Recognition trend:

- current 30-day recognition event count compared with the previous 30-day recognition event count
- shown as a signed percentage when the previous period has data

Zero handling:

- previous `0` and current `0` shows `0%`
- previous `0` and current above `0` shows `New`
- no `NaN` or `Infinity` is displayed

Sparkline:

- six chronological buckets across the latest 30 days
- oldest bucket appears on the left
- newest bucket appears on the right
- counts come only from real company-scoped recognition events

Top qualities:

- calculated from real `recognition_events`
- joined to `card_library`
- grouped by `card_id` and card title
- displays top five English official card names
- shows each quality share as a percentage of total company recognitions
- does not translate official card titles through `next-intl`

## Files Changed

- `scripts/sync-english-cards.mjs`
- `supabase/migrations/015_sync_english_card_library.sql`
- `lib/cards.ts`
- `lib/data/company-dashboard-insights.ts`
- `app/[locale]/company/page.tsx`
- `app/globals.css`
- `messages/en.json`
- `messages/nl.json`
- `messages/fr.json`
- `messages/da.json`
- `package.json`
- `lib/demo-data.ts`

## Validation

Validation commands used for this implementation:

- `npm run lint` passed.
- `npm run build` passed.
- `npm run test:uat-auth` passed role-profile checks for all seeded accounts when run with network access. Local route smoke checks returned `500` because the UAT script expects a running local app server.
- `npm run db:push` pushed and applied `015_sync_english_card_library.sql`.

Post-migration read check:

- `card_library` contains 53 rows.
- First five rows are `Listener`, `Clear Communicator`, `Honest`, `Uniter`, and `Empathetic`.
- Existing QR slugs remained `luisteraar`, `helder`, `eerlijk`, `verbinder`, and `empathisch` for the first five cards.
- Sampled `recognition_events` returned zero invalid card references.
