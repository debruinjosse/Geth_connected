alter type recognition_status add value if not exists 'pending_verification';
alter type recognition_status add value if not exists 'approved';

create index if not exists recognition_giver_status_idx
on recognition_events(giver_user_id, status, created_at desc);
