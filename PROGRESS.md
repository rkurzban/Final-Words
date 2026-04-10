# Final Words — Project Progress

Last updated: April 10, 2026 (updated)

---

## What This App Does

Final Words lets users compose messages to loved ones, to be delivered after they die. Each message is tied to a specific recipient. The author chooses:
- **One-time delivery** — sent when they die
- **Recurring delivery** — an annual message (e.g. a birthday wish) sent for up to 5 years

Built by Rob Kurzban for Nada. Once MVP is complete, the project will be replicated under her account for her ownership.

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React + Vite | Deployed on Vercel |
| Hosting | Vercel | Auto-deploys from GitHub |
| Backend / DB | Supabase | Auth, Postgres, RLS, Edge Functions |
| Email | Resend | Transactional email + scheduled sends |
| Scheduled jobs | Supabase pg_cron + Edge Functions | Monthly check-in loop; daily delivery check |
| Auth | Supabase magic link | No passwords |
| Local dev email | Mailpit | Catches all outbound email at localhost:54324 |

---

## Database Tables

All tables use UUID primary keys and timestamptz (UTC) timestamps. Row Level Security is enabled on all tables.

### `profiles`
Extends `auth.users`. One row per registered user. Auto-created by trigger on sign-up.
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | References auth.users.id |
| full_name | text | |
| created_at | timestamptz | |

### `messages`
Core content. One row = one message from one author to one recipient.
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| author_id | uuid FK | References profiles.id |
| recipient_name | text | |
| recipient_email | text | |
| subject | text | Optional |
| body | text | |
| delivery_type | text | 'one_time' or 'recurring' |
| recurring_month | int | 1–12. Null if one_time |
| recurring_day | int | 1–31. Null if one_time |
| recurring_years | int | 1–5. Null if one_time |
| status | text | 'draft', 'active', 'delivered', 'cancelled' |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `executors`
People designated by an author to confirm their death. `executor_user_id` is null until they accept their invitation.
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| author_id | uuid FK | References profiles.id |
| executor_user_id | uuid FK | Nullable. Populated on invitation acceptance |
| name | text | |
| email | text | |
| is_backup | bool | false = primary, true = backup |
| invite_sent_at | timestamptz | Nullable |
| accepted_at | timestamptz | Nullable |
| created_at | timestamptz | |

### `death_registrations`
Created when an executor confirms a death. `cancel_token` powers the author's 72-hour kill-switch link — no authentication required, just the token. `grace_period_ends_at` is auto-set to `registered_at + 72 hours` by a trigger.
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| author_id | uuid FK | References profiles.id |
| registered_by_executor_id | uuid FK | References executors.id |
| registered_at | timestamptz | |
| grace_period_ends_at | timestamptz | Auto-set by trigger |
| cancel_token | uuid | Random UUID for kill-switch link |
| cancelled_at | timestamptz | Nullable. Set if author cancels |
| deliveries_sent_at | timestamptz | Nullable. Set when messages are dispatched |

### `checkin_log`
Records each inactivity check-in email sent to an author. Up to 3 attempts before the executor is alerted.
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| author_id | uuid FK | References profiles.id |
| attempt_number | int | 1, 2, or 3 |
| sent_at | timestamptz | |
| responded_at | timestamptz | Nullable. Set when author clicks check-in link |

### `delivery_log`
Append-only audit trail of every message delivery attempt.
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| message_id | uuid FK | References messages.id |
| status | text | 'sent' or 'failed' |
| error_message | text | Nullable |
| attempted_at | timestamptz | |

---

## Seed Data (local dev only)

Three fictitious users for testing:
- **Alice Author** — author only. Has messages in all 4 status states. Carol is her executor.
- **Bob Author** — author only. Carol is his primary executor, with one pending backup.
- **Carol Both** — both an author AND an executor (for Alice and Bob).

Test emails use `@example.com` addresses and are never sent in local dev (Mailpit catches all outbound mail).

---

## User Flows (planned)

1. **Onboarding** — Sign up via magic link, designate at least one executor, then create messages.
2. **Message management** — Create, edit, draft, activate, or cancel messages.
3. **Executor management** — View/resend/swap executors from a settings screen.
4. **Death registration (executor-facing)** — Two-step confirmation. Triggers 72-hour grace period and kill-switch email to author.
5. **Check-in pipeline** — Monthly pg_cron job emails the author. After 3 non-responses, executor is alerted.

---

## Routing Plan

| Route | Description |
|---|---|
| /auth | Magic link entry |
| /auth/callback | Supabase redirect handler |
| /messages | Author home — message list |
| /messages/new | Message creation form |
| /messages/:id | Message edit form |
| /executors | Executor management (author-facing) |
| /executor | Executor dashboard |

---

## What's Done

- [x] Project design document
- [x] Local dev environment (Node, Git, Docker, Supabase CLI)
- [x] React + Vite scaffold
- [x] Supabase local stack running
- [x] `.env.local` configured
- [x] All 6 database tables migrated
- [x] Seed data loaded
- [x] `.gitignore` in place
- [x] All files committed and pushed to `claude/check-local-directory-MWqPC`

## What's Next

- [x] Wire up Supabase client in the React app (`src/lib/supabase.js`)
  - `.env.local` uses standard local dev defaults — replace `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with real project credentials before deploying to Vercel
- [x] Build `AppShell` — nav, auth guard, role detection
- [x] Build `/auth` page — magic link sign-in form
- [x] Build `/messages` page — message list with status badges
- [x] Build `MessageForm` — create/edit with recurring fields
- [ ] Build `/executors` page — manage designated executors
- [ ] Build `/executor` dashboard — executor-facing view
- [ ] Set up Resend for email
- [ ] Write Edge Functions for delivery and check-in pipeline
- [ ] Deploy to Vercel
