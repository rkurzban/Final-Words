-- ============================================================
-- 1. PROFILES
-- Extends auth.users. Created automatically via trigger.
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  created_at  timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- 2. MESSAGES
-- Core content. One row = one message from one author.
-- ============================================================
create table public.messages (
  id               uuid primary key default gen_random_uuid(),
  author_id        uuid not null references public.profiles(id) on delete cascade,
  recipient_name   text not null,
  recipient_email  text not null,
  subject          text,
  body             text not null,
  delivery_type    text not null check (delivery_type in ('one_time', 'recurring')),
  recurring_month  int  check (recurring_month between 1 and 12),
  recurring_day    int  check (recurring_day between 1 and 31),
  recurring_years  int  check (recurring_years between 1 and 5),
  status           text not null default 'draft'
                        check (status in ('draft', 'active', 'delivered', 'cancelled')),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Authors manage own messages"
  on public.messages for all
  using (auth.uid() = author_id);


-- ============================================================
-- 3. EXECUTORS
-- People designated by an author to confirm their death.
-- executor_user_id is null until the executor accepts.
-- ============================================================
create table public.executors (
  id                uuid primary key default gen_random_uuid(),
  author_id         uuid not null references public.profiles(id) on delete cascade,
  executor_user_id  uuid references public.profiles(id),
  name              text not null,
  email             text not null,
  is_backup         bool not null default false,
  invite_sent_at    timestamptz,
  accepted_at       timestamptz,
  created_at        timestamptz default now()
);

alter table public.executors enable row level security;

create policy "Authors manage own executors"
  on public.executors for all
  using (auth.uid() = author_id);

create policy "Executors can view their own executor record"
  on public.executors for select
  using (auth.uid() = executor_user_id);


-- ============================================================
-- 4. DEATH_REGISTRATIONS
-- Created when an executor confirms a death.
-- cancel_token powers the author's 72-hour kill-switch link.
-- grace_period_ends_at is set automatically by trigger.
-- ============================================================
create table public.death_registrations (
  id                        uuid primary key default gen_random_uuid(),
  author_id                 uuid not null references public.profiles(id) on delete cascade,
  registered_by_executor_id uuid not null references public.executors(id),
  registered_at             timestamptz default now(),
  grace_period_ends_at      timestamptz,
  cancel_token              uuid not null default gen_random_uuid(),
  cancelled_at              timestamptz,
  deliveries_sent_at        timestamptz
);

-- Trigger: auto-set grace_period_ends_at = registered_at + 72 hours
create or replace function public.set_grace_period()
returns trigger language plpgsql
as $$
begin
  new.grace_period_ends_at := new.registered_at + interval '72 hours';
  return new;
end;
$$;

create trigger set_grace_period_on_insert
  before insert on public.death_registrations
  for each row execute procedure public.set_grace_period();

alter table public.death_registrations enable row level security;

create policy "Authors can view own death registrations"
  on public.death_registrations for select
  using (auth.uid() = author_id);

create policy "Executors can insert death registrations"
  on public.death_registrations for insert
  with check (
    exists (
      select 1 from public.executors
      where id = registered_by_executor_id
        and executor_user_id = auth.uid()
    )
  );


-- ============================================================
-- 5. CHECKIN_LOG
-- Records each monthly inactivity check-in email (up to 3).
-- ============================================================
create table public.checkin_log (
  id              uuid primary key default gen_random_uuid(),
  author_id       uuid not null references public.profiles(id) on delete cascade,
  attempt_number  int not null check (attempt_number between 1 and 3),
  sent_at         timestamptz default now(),
  responded_at    timestamptz
);

alter table public.checkin_log enable row level security;

create policy "Authors can view own checkin log"
  on public.checkin_log for select
  using (auth.uid() = author_id);


-- ============================================================
-- 6. DELIVERY_LOG
-- Append-only audit trail of every message delivery attempt.
-- ============================================================
create table public.delivery_log (
  id             uuid primary key default gen_random_uuid(),
  message_id     uuid not null references public.messages(id) on delete cascade,
  status         text not null check (status in ('sent', 'failed')),
  error_message  text,
  attempted_at   timestamptz default now()
);

alter table public.delivery_log enable row level security;

create policy "Authors can view delivery log for own messages"
  on public.delivery_log for select
  using (
    exists (
      select 1 from public.messages
      where id = message_id
        and author_id = auth.uid()
    )
  );
