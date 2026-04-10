# Final Words — Project Progress

Last updated: April 10, 2026

---

## Design & Aesthetic

### Philosophy

Final Words is an act of agency — someone choosing, while alive, to reach across death. The design should reflect that. It is not a grief app or a memorial; it is a private, deliberate, dignified act. The visual language should feel like a well-made legal document or a handwritten letter on good paper: formal, considered, and human. Nothing should feel rushed, cute, or casual.

### Color Palette

| Role | Name | Hex |
|---|---|---|
| Background | Warm white | `#F7F5F2` |
| Surface (cards, forms) | Off-white | `#EDEAE5` |
| Border | Stone | `#D4D0CA` |
| Body text | Near-black | `#1A1A1A` |
| Secondary text | Warm grey | `#6B6560` |
| Primary accent | Midnight navy | `#1C3554` |
| Primary accent hover | Deep navy | `#142844` |
| Secondary accent | Antique gold | `#B8962E` |
| Danger | Dark burgundy | `#7A1F2E` |
| Status — draft | Warm grey | `#8A8680` |
| Status — active | Midnight navy | `#1C3554` |
| Status — delivered | Forest | `#2D5016` |
| Status — cancelled | Dark burgundy | `#7A1F2E` |

The gold is used sparingly — only for the most significant moments (e.g. the "Activate" button, a confirmed registration). It should feel like the wax seal on a letter, not a highlight color.

### Typography

| Role | Font | Notes |
|---|---|---|
| Headings | Cormorant Garamond | Classical, high-contrast, editorial. Suggests permanence. |
| Body / UI | Inter | Clean humanist sans. Readable at all sizes. |
| Monospace | JetBrains Mono | For tokens, IDs, code if needed. |

Both are available on Google Fonts. Heading weights should stay at 400–500 — never bold. The elegance of Cormorant Garamond comes from restraint, not weight.

Line height: 1.6 for body, 1.2 for headings. Generous letter-spacing on headings at display sizes (~0.02em). Maximum content width: 720px. Never center-align body text.

### Layout Principles

- Whitespace is respect. Margins should be generous — nothing cramped.
- Single-column layouts for all forms and reading views.
- Left-aligned text throughout. Centered text only for the sign-in page heading.
- No more than one primary action visible at a time.
- Squared or very slightly rounded corners (2px max) — pill shapes are too casual.
- No drop shadows. Separation through background color and border, not depth effects.
- No gradients.

### UI Components

**Buttons**
- Primary: midnight navy background, warm white text — used for "Activate", "Send sign-in link"
- Secondary: transparent with stone border, near-black text — used for "Save as draft", "Cancel"
- Gold: antique gold background, near-black text — used only for the single most important confirmation (e.g. final death registration confirm)
- Danger: dark burgundy background, white text — "Cancel message", "Remove executor"
- All buttons: 2px border-radius, generous padding, no shadows, uppercase tracking on label text

**Form fields**
- 1px stone border, off-white background
- On focus: midnight navy border, no glow/shadow
- Generous padding (12px 16px)
- Error states: dark burgundy border and text, no icons

**Status badges**
- Small caps or slightly tracked uppercase text
- Filled pill shape — the one exception to the squared-corner rule, since badges are small labels
- Colors from the palette table above

**Navigation**
- Dark background (near-black `#1A1A1A`), warm white text
- No icons — text links only
- Active link: antique gold underline or left border
- Simple, minimal — the nav should recede, not compete

### Imagery

All images should be AI-generated or photographic. Suggested directions:

- A sealed envelope on a dark, textured surface — candlelight optional
- Aged paper with handwriting, slightly out of focus
- A single candle flame against dark background
- A fountain pen resting on paper
- Stone, marble texture — not as background but as accent or header image
- Autumn light through a window onto a writing desk

**Avoid:** flowers, hearts, clocks, hourglasses, angels, any iconography that reads as greeting card or sympathy card. No icons in the UI at all — text and typography carry the weight.

### Copy & Voice

- Formal but warm. Never clinical, never breezy.
- Second person, direct: "Your messages", "Your executors"
- No exclamation points anywhere in the UI
- No cutesy error messages — "Something went wrong. Please try again." not "Oops!"
- Confirmation language should be solemn: "This cannot be undone" not "Are you sure?"
- Empty states should be gentle invitations: "You haven't written any messages yet." with a quiet link, not a big cheerful CTA button

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
- [x] Build `/executors` page — manage designated executors
- [x] Build `/executor` dashboard — executor-facing view
- [ ] Set up Resend for email
- [ ] Write Edge Functions for delivery and check-in pipeline
- [x] Deploy to Vercel — https://final-words-git-main-rob-kurzbans-projects.vercel.app
  - App loads correctly
  - SPA routing fixed via `vercel.json` rewrite rule
  - Magic link sign-in working (Supabase free tier caps auth emails at 2/hr)
  - Full design system implemented — Cormorant Garamond + Inter, navy/gold/burgundy palette
  - Auth bypassed for demo (`AUTH_REQUIRED = false` in AppShell — flip to re-enable)
  - Demo data shown to unauthenticated visitors (4 messages, 2 executors)
