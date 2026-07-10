# GETH UAT Summary

Generated for local Phase 1 testing. These are demo credentials only. Rotate/delete them before production.

## Seeded Test Credentials

All seeded users use this password:

```text
GethDemo!2026
```

| Role | Email | Dashboard |
| --- | --- | --- |
| Super Admin | super.admin@geth-demo.com | /admin |
| Company Admin | company.admin@geth-demo.com | /company |
| Manager | manager@geth-demo.com | /manager |
| Employee 1 | employee1@geth-demo.com | /employee |
| Employee 2 | employee2@geth-demo.com | /employee |
| Employee 3 | employee3@geth-demo.com | /employee |
| Employee 4 | employee4@geth-demo.com | /employee |

CSV files for Excel:

- `GETH_TEST_CREDENTIALS.csv`
- `GETH_UAT_USE_CASES.csv`
- `GETH_UAT_RESULTS.csv`

## Feature Differences By Role

### Super Admin

- Accesses `/admin`.
- Sees real platform counts from Supabase:
  - companies
  - users/profiles
  - recognition events
  - card library count
- Can inspect live companies at `/admin/companies`.
- Has quick links for companies, cards, QR routes, analytics, subscriptions, and settings.

### Company Admin

- Accesses `/company`.
- Sees company-scoped dashboard data from Supabase.
- Can create/edit/delete teams at `/company/teams`.
- Can invite employees at `/company/employees`.
- Can invite managers at `/company/managers`.
- Can assign people to teams, disable/reactivate profiles, revoke pending invites.

### Manager

- Accesses `/manager`.
- Sees team-scoped recognitions, team members, signals, trends, and quality bars.
- Data is based on teams where `teams.manager_id = auth.uid()`.

### Employee

- Accesses `/employee`.
- Sees personal recognitions from `recognition_events`.
- Can browse `/cards`.
- Can claim cards through `/claim-card/[slug]`.
- Claim flow inserts into `recognition_events` when authenticated.

## Changes Completed In This Pass

- Added show/hide password toggle to login, signup, and reset password.
- Added logged-in homepage header state:
  - Shows `Hi, {name}`
  - Shows `Open dashboard`
  - Shows `Sign out`
- Added `/auth/signout` server route.
- Seeded real Supabase UAT accounts, teams, and recognitions.
- Upgraded `/admin` to use real Supabase platform data.
- Upgraded `/admin/companies` to use real Supabase company/profile/team counts.
- Created repeatable seed script:
  - `npm.cmd run seed:uat`
- Created repeatable auth/route UAT script:
  - `npm.cmd run test:uat-auth`

## UAT Status

Latest automated UAT:

- Supabase password login for all seeded roles: PASS
- Role profile checks: PASS
- Public route smoke checks: PASS
- Protected routes respond with redirect when no browser session exists: PASS

Playwright MCP note:

- The Playwright MCP connector returned `unsupported call` for browser commands in this session, so browser form-click automation could not be completed through MCP.
- Auth verification was completed through Supabase API checks instead.

## Production Notes

- Demo test credentials should not remain in production.
- SMTP/email templates still need production provider setup for real user emails.
- Stripe/billing, export reports, and real notification storage are Phase 2 unless you add those tables and workflows.
