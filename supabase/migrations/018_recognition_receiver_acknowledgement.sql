alter type recognition_status add value if not exists 'pending_acknowledgement';

create index if not exists recognition_receiver_status_idx
on recognition_events(receiver_user_id, status, created_at desc);
