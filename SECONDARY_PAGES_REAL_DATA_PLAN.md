# Secondary Pages Real Data Plan

Generated: 2026-07-10

## Audit

| Page | Current status | Real data source | Implementation approach | Priority | Limitations |
| --- | --- | --- | --- | --- | --- |
| `/employee/cards` | Demo recognitions from `lib/demo-data.ts` | `recognition_events`, `card_library`, `profiles` | Show received/given card history for current user | 1 | No separate send-card workflow yet; given cards depend on `giver_user_id` |
| `/employee/growth` | Demo chart/category arrays | `recognition_events`, `card_library` | Calculate monthly trend and category/quality distribution | 2 | Empty state when no recognitions |
| `/employee/messages` | Demo messages | `recognition_events.personal_note`, `notifications` | Use appreciation notes as messages; show empty state if none | 3 | No standalone messages table yet |
| `/manager/team` | Demo `people` table | `teams`, `profiles`, `recognition_events`, `card_library` | List real managed team members with counts and last activity | 4 | Requires `teams.manager_id = auth.uid()` |
| `/manager/signals` | Demo signal list | `teams`, `profiles`, `recognition_events` | Calculate recognition gaps and positive momentum signals | 5 | No dedicated signals table; calculated only |
| `/manager/analytics` | Demo trend/quality arrays | `teams`, `recognition_events`, `card_library` | Calculate trend, quality mix, member comparison | 6 | Empty state when team has no recognition history |
| `/company/cards` | Already Supabase-backed cards, no usage count | `card_library`, `recognition_events` | Add company-scoped usage counts per card | 7 | Read-only for company admin |
| `/admin/cards` | Converted to Supabase-backed controls | `card_library`, `recognition_events` | Show real card deck with active/pause controls and usage counts | 8 | Create/edit card templates remains Phase 2 |
| `/admin/qr-routes` | Converted to Supabase-backed routes | `card_library`, `recognition_events` | Show real QR slugs, destinations, status, usage counts | 9 | QR asset generation remains Phase 2 |
| `/admin/analytics` | Demo platform charts | `companies`, `profiles`, `recognition_events`, `card_library`, `subscriptions` | Calculate platform metrics, trend, top companies, role distribution | 10 | Deeper cohort analytics remains Phase 2 |
| `/admin/settings` | Fake disabled toggles | Environment variables and platform data | Show production-safe read-only system status | 11 | No `platform_settings` table yet |

## Implementation Notes

- Use existing Supabase server client and existing RLS.
- Do not use service role in route pages.
- Keep demo fallback only when Supabase environment variables are missing.
- Prefer honest empty states over fake production data.

## Validation

- `npm.cmd run lint`: PASS
- `npm.cmd run build`: PASS

Known non-blocking warning:

```text
[webpack.cache.PackFileCacheStrategy] Caching failed for pack: Error: Unable to snapshot resolve dependencies
```

## Pages Converted

- `/employee/cards`: now reads received/given recognition cards from Supabase.
- `/employee/growth`: now calculates growth trend, category distribution, and quality mix from Supabase.
- `/employee/messages`: now uses real recognition personal notes as appreciation messages.
- `/manager/team`: now shows real managed team members and recognition counts.
- `/manager/signals`: now shows calculated team signals from real recognition activity.
- `/manager/analytics`: now shows real manager-scoped trend, qualities, and member comparison.
- `/company/cards`: now includes company-scoped card usage counts.
- `/admin/cards`: now uses real platform `card_library` rows with active/pause controls and usage counts.
- `/admin/qr-routes`: now uses real `card_library.qr_slug` mappings with usage counts.
- `/admin/analytics`: now uses real companies, profiles, recognition events, cards, and subscriptions.
- `/admin/settings`: now shows production-safe read-only environment/configuration status.

## Remaining Limitations

- `/employee/messages` does not use a dedicated messages table because none exists yet; it safely uses recognition notes.
- `/admin/settings` is read-only until a future `platform_settings` table exists.
- `/admin/cards` supports active/pause controls only; create/edit card templates remain Phase 2.
- `/admin/qr-routes` displays live route mappings only; QR image generation remains Phase 2.
- Marketing/static routes such as `/resources`, `/book-demo`, and `/pricing` remain outside this conversion pass.
