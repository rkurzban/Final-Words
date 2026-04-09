-- ============================================================
-- SEED DATA — local development only
-- Three fictitious users covering all role combinations:
--   author1  — author only
--   author2  — author only
--   both1    — author AND executor
-- ============================================================

-- Create users in auth.users (local Supabase only)
insert into auth.users (id, email, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000001', 'rob+author1@example.com',  now(), now(), now(), '{"full_name": "Alice Author"}'::jsonb),
  ('00000000-0000-0000-0000-000000000002', 'rob+author2@example.com',  now(), now(), now(), '{"full_name": "Bob Author"}'::jsonb),
  ('00000000-0000-0000-0000-000000000003', 'rob+both1@example.com',    now(), now(), now(), '{"full_name": "Carol Both"}'::jsonb)
on conflict (id) do nothing;

-- Profiles are auto-created by the trigger, but seed them explicitly
-- in case the trigger hasn't fired yet in a fresh reset.
insert into public.profiles (id, full_name)
values
  ('00000000-0000-0000-0000-000000000001', 'Alice Author'),
  ('00000000-0000-0000-0000-000000000002', 'Bob Author'),
  ('00000000-0000-0000-0000-000000000003', 'Carol Both')
on conflict (id) do nothing;

-- ============================================================
-- MESSAGES for Alice (author1) — one in each status
-- ============================================================
insert into public.messages (id, author_id, recipient_name, recipient_email, subject, body, delivery_type, status)
values
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'David Recipient',
    'david@example.com',
    'A note for you',
    'Dear David, if you are reading this...',
    'one_time',
    'draft'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Eve Recipient',
    'eve@example.com',
    'Happy birthday, always',
    'Eve, I hope this finds you well each year.',
    'recurring',
    'active'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Frank Recipient',
    'frank@example.com',
    null,
    'Frank, thank you for everything.',
    'one_time',
    'delivered'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'Grace Recipient',
    'grace@example.com',
    'Just in case',
    'Grace, I changed my mind. Cancel.',
    'one_time',
    'cancelled'
  )
on conflict (id) do nothing;

-- Recurring fields for the active message
update public.messages
set recurring_month = 6, recurring_day = 15, recurring_years = 3
where id = 'aaaaaaaa-0000-0000-0000-000000000002';

-- ============================================================
-- EXECUTORS
-- Alice designates Carol (both1) as primary executor.
-- Bob designates Carol as primary, with a pending (unaccepted) backup.
-- ============================================================
insert into public.executors (id, author_id, executor_user_id, name, email, is_backup, invite_sent_at, accepted_at)
values
  (
    'eeeeeeee-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',  -- Alice is the author
    '00000000-0000-0000-0000-000000000003',  -- Carol is the executor
    'Carol Both',
    'rob+both1@example.com',
    false,
    now() - interval '7 days',
    now() - interval '6 days'
  ),
  (
    'eeeeeeee-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',  -- Bob is the author
    '00000000-0000-0000-0000-000000000003',  -- Carol is the executor
    'Carol Both',
    'rob+both1@example.com',
    false,
    now() - interval '3 days',
    now() - interval '2 days'
  ),
  (
    'eeeeeeee-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',  -- Bob also has a pending backup
    null,                                    -- not yet accepted
    'Pending Backup',
    'pending@example.com',
    true,
    now() - interval '3 days',
    null
  )
on conflict (id) do nothing;
