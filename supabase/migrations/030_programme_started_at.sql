-- Backs the mobile "certificate" screen's programme-month progress, which today is a hardcoded
-- `_programmeMonth = 4` constant. No RLS change needed — the existing "users can read own
-- profile" policy already covers this column, and profile writes already happen client-side
-- elsewhere in the app (no side effects here, so no mobile API route is needed either).

alter table profiles
  add column if not exists programme_started_at timestamptz;

-- Backfill existing users so nobody's programme month jumps the day this ships.
update profiles set programme_started_at = created_at where programme_started_at is null;
