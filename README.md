# FreelanceTrack

A full-stack dashboard for freelancers to manage clients, projects, time tracking, invoices, and expenses — all in one place. Built solo with Next.js, Supabase, and Clerk.

## Features

- **Clients** — Add and manage client profiles with contact details and default currency
- **Projects** — Hourly and fixed-price projects linked to clients, with status tracking
- **Time Tracking** — Log billable and non-billable hours per project per day
- **Invoices** — Create invoices with line items, tax rate, and auto-calculated totals. Status lifecycle: `draft → sent → paid / overdue / cancelled`. Auto-detects overdue invoices on page load.
- **Payments** — Record payments against invoices and mark them as paid
- **Expenses** — Track business expenses by category with optional receipt upload
- **Reports** — Earnings by month, earnings by client, expenses by category, billable vs non-billable hours
- **Public Share Links** — Generate a secure share link for any project. The public page shows hours, earnings, and project details — no login required
- **Export** — Download any data table as Excel or CSV

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.1.6 (App Router), React 19, TypeScript 5 |
| Styling | Tailwind CSS 4, shadcn/ui (New York style) |
| Auth | Clerk v7 + Svix webhooks |
| Database | Supabase (PostgreSQL) |
| Tables | TanStack Table v8 |
| Charts | Recharts v3 |
| Validation | Zod v4 |
| Export | xlsx + custom CSV formatter |

## Project Structure

```
app/
├── (dashboard)/          # Protected routes (all require login)
│   ├── page.tsx          # Dashboard overview
│   ├── clients/
│   ├── projects/
│   ├── time/
│   ├── invoices/
│   ├── expenses/
│   └── reports/
├── share/[token]/        # Public project share page (no login)
├── sign-in/
├── sign-up/
└── api/                  # API routes
    ├── clients/
    ├── projects/
    ├── time-entries/
    ├── invoices/
    ├── payments/
    ├── expenses/
    ├── shares/
    ├── reports/
    ├── upload/
    └── webhooks/clerk/

components/
├── ui/                   # shadcn/ui components
├── clients/
├── projects/
├── time/
├── invoices/
├── expenses/
├── reports/
└── app-sidebar.tsx

lib/
├── schemas.ts            # All Zod schemas + parseBody helper
├── supabase/
│   ├── admin.ts          # Server-side admin client (bypasses RLS)
│   └── client.ts         # Browser client
```

## Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd freelancer-tracker
npm install
```

### 2. Environment variables

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_publishable_key
SUPABASE_SECRET_KEY=your_supabase_secret_key

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Clerk redirect URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Supabase — Create tables

Run the following SQL in your Supabase project's **SQL Editor**:

```sql
-- Users (synced from Clerk via webhook)
create table users (
  id text primary key,
  email text not null,
  name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Clients
create table clients (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  company text,
  address text,
  currency char(3) not null default 'USD',
  created_at timestamptz default now()
);

-- Projects
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active','paused','completed','cancelled')),
  type text not null default 'hourly' check (type in ('hourly','fixed')),
  hourly_rate numeric(10,2),
  fixed_amount numeric(10,2),
  currency char(3) not null default 'USD',
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

-- Time entries
create table time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  description text,
  hours numeric(5,2) not null,
  date date not null,
  billable boolean not null default true,
  created_at timestamptz default now()
);

-- Invoices
create table invoices (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  invoice_number text not null,
  status text not null default 'draft' check (status in ('draft','sent','paid','overdue','cancelled')),
  issue_date date not null,
  due_date date not null,
  currency char(3) not null default 'USD',
  notes text,
  subtotal numeric(12,2) not null default 0,
  tax_rate numeric(5,2),
  tax_amount numeric(12,2),
  total numeric(12,2) not null default 0,
  created_at timestamptz default now()
);

-- Invoice line items
create table invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null,
  unit_price numeric(12,2) not null,
  amount numeric(12,2) not null
);

-- Payments
create table payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  amount numeric(12,2) not null,
  payment_date date not null,
  payment_method text not null default 'bank_transfer'
    check (payment_method in ('bank_transfer','cash','check','credit_card','paypal','stripe','other')),
  notes text,
  created_at timestamptz default now()
);

-- Expenses
create table expenses (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  description text not null,
  amount numeric(12,2) not null,
  date date not null,
  category text not null default 'other'
    check (category in ('software','hardware','travel','marketing','other')),
  currency char(3) not null default 'USD',
  receipt_url text,
  created_at timestamptz default now()
);

-- Project share links
create table project_shares (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  token text not null unique,
  label text,
  created_at timestamptz default now()
);
```

### 4. Clerk — Webhook setup (for production)

In your Clerk dashboard, create a webhook pointing to:

```
https://your-domain.com/api/webhooks/clerk
```

Subscribe to these events: `user.created`, `user.updated`, `user.deleted`

Copy the **Signing Secret** and set it as `CLERK_WEBHOOK_SECRET` in your env.

> **Note:** In local development, webhooks can't reach localhost. User data is synced automatically on every dashboard visit via a non-blocking background task instead.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment (Vercel)

1. Push your repo to GitHub
2. Import the project on [Vercel](https://vercel.com)
3. Add all environment variables from `.env.local` (update `NEXT_PUBLIC_APP_URL` to your production domain)
4. Deploy

After deploying, update the Clerk webhook URL to your production domain and re-copy the signing secret.

## Architecture Notes

**Server Components first** — Data-heavy pages fetch directly from Supabase on the server. No loading spinners on initial render.

**Manual user scoping** — A single server-side Supabase admin client bypasses RLS. Every query is manually scoped with `.eq('user_id', userId)` where `userId` always comes from Clerk's `auth()` on the server, never from the request body.

**Pagination + full export** — Tables load only the visible rows. Export fires a separate unlimited query without slowing the UI.

**Single schema file** — All Zod schemas live in `lib/schemas.ts`. Every API route uses the same `parseBody()` helper.

**Auto overdue detection** — Invoices past their due date are automatically flipped to `overdue` on page load using `after()` (non-blocking, runs after response is sent).
