# StayHub — Hostel Booking & Management Platform

A production-ready hostel booking platform with a polished customer site and a full
back-office admin panel. Built with **Next.js 15 (App Router), TypeScript, Prisma,
SQLite (default), Tailwind CSS**, and a first-class UI for **English, French and
Arabic (RTL)**.

> **Payments:** the public booking flow is *pay-at-hostel* only. Customers are never
> shown card inputs and card data is never stored. The admin can record received
> payments against reservations for reconciliation.

---

## Key features

**Customer site (public)**
- Hostel / room browsing with filters, live availability and nightly price breakdown
- Booking wizard (`/book/[slug]`) — dates, room, promo code, guest details — creates a
  **PAY_AT_HOSTEL** reservation (confirmation email + notification)
- Account area: profile, language & currency preferences, reservations (cancel /
  review stays), notifications
- Auth: register, email verification, login (with lockout after failed attempts),
  forgot / reset password, Google OAuth sign-in (optional)
- i18n: EN / FR / AR with full RTL layout; multi-currency display with exchange rates

**Admin panel (`/admin`)**
- Role-based access (`SUPER_ADMIN`, `ADMIN`, `MANAGER`, `RECEPTIONIST`) with
  per-action permission checks
- Dashboard (revenue, occupancy, check-ins/outs, booking sources, recent bookings)
- Reservations: list/search, detail with price breakdown, guest overrides, internal
  notes, payment history, timeline; create reservations; status actions
  (confirm / check-in / check-out / cancel / no-show); record payments
- Calendar: month grid with per-room availability + an availability-override editor
- Hostels & Rooms CRUD (images, amenities, prices, taxes, slugs) + housekeeping status
- Customers: searchable directory with disable/enable
- Payments: summary cards + full history
- Reviews moderation (approve / hide / reject)
- Offers (promo codes) CRUD with applicable-hostel targeting
- Staff listing with enable/disable
- Email templates editor (subject + HTML body preview)
- Settings: site identity, brand colors, currency & language, reservation rules,
  payment toggles, tax, cancellation policy, email, notifications, maps, SEO
- Reports & audit log

---

## Getting started

Requirements: **Node.js 20+**.

```bash
npm install
npm run setup        # prisma generate + db push + seed demo data
npm run dev          # http://localhost:3000
```

`npm run setup` is idempotent. The default database is SQLite (`prisma/dev.db`).

### Demo accounts (seeded)

| Role            | Email                                | Password        |
| --------------- | ------------------------------------ | --------------- |
| Admin           | `admin@stayhub.com`                  | `Admin@12345`   |
| Manager         | `manager@stayhub.com`                | `Manager@123`   |
| Receptionist    | `reception@stayhub.com`              | `Recept@123`    |
| Customer        | `sophie.durand.0@demo.stayhub`       | `Customer@123`  |

### Useful scripts

| Script | Description |
| ------ | ----------- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm run start` | Production build & start |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:push` | Apply Prisma schema to the DB |
| `npm run db:seed` | (Re)seed demo data |
| `npm run db:studio` | Browse the database |

---

## Environment variables

Copy `.env.example` to `.env`. Everything is optional except `DATABASE_URL` and
`AUTH_SECRET` (for production, set a strong `AUTH_SECRET`).

| Var | Purpose |
| --- | ------- |
| `DATABASE_URL` | Prisma connection string (SQLite default; swap for Postgres/MySQL) |
| `AUTH_SECRET` | JWT signing secret for sessions |
| `NEXT_PUBLIC_APP_URL` | Public base URL (used in emails, sitemap, robots) |
| `AUTH_SESSION_HOURS` | Session lifetime in hours (default `168`) |
| `SMTP_*` | Outbound email; **not required** — without it, emails are logged to the console |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google sign-in (button hidden when absent) |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Optional gateway — the public site never uses cards |
| `MAP_PROVIDER` / `MAPBOX_TOKEN` / `GOOGLE_MAPS_KEY` | Map tiles; `osm` needs no key |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Admin bootstrap credentials for seeding |

---

## Project structure

```
prisma/            schema, seed data
src/app/
  (public)/        customer pages (/, /hostels, /rooms, /offers, /about, /contact, /book, /account)
  admin/           admin pages (dashboard, reservations, calendar, hostels, rooms,
                   housekeeping, customers, payments, reviews, offers, staff, emails,
                   notifications, settings, reports, audit)
  api/             route handlers (auth, reservations, reviews, preferences, admin/*)
src/components/
  ui/              design-system primitives (button, card, select, toast, badges, …)
  admin/           admin feature components
  account/         customer-account components
src/lib/
  i18n/            EN / FR / AR dictionaries + provider
  services/        reservation engine, payments, email, notifications, audit, reports
  validations/     Zod schemas (shared between forms and API routes)
  auth.ts          sessions, password hashing, guards
  permissions.ts   role → capability matrix
  settings.ts      site-wide settings with brand color CSS variables
```

Key conventions:
- Next 15 pages receive `params`/`searchParams` as **Promises** — always `await` them.
- Two guard flavors: `requireAuth()` / `requireAdmin()` (pages, redirects) and
  `requireApiAdmin()` (API routes → 401/403).
- All API handlers rate-limit per user and write an audit trail (`AuditLog`).
- The reservation engine rejects double bookings with a `409`.
- Toasts use `variant: "success" | "error" | "info" | "warning"`.

---

## Adding or changing the database

Edit `prisma/schema.prisma`, then:

```bash
npm run db:push          # applies to the current DB (dev-friendly)
```

For production, prefer migrations:

```bash
npm run db:migrate:dev   # create a migration
npm run db:migrate       # apply migrations
```

---

## Deployment

1. `npm ci`
2. Set a strong `AUTH_SECRET` and the correct `DATABASE_URL` (use a managed Postgres
   in production), plus `NEXT_PUBLIC_APP_URL`.
3. `npm run db:push` or apply migrations, then `npm run db:seed` if you want demo data.
4. `npm run build`
5. Serve with `npm run start`, or deploy the standalone build to Vercel / any Node
   host (`next start` works as-is).

Notes for production:
- The in-memory rate limiter is single-process; for multi-instance deployments swap
  `src/lib/rate-limit.ts` for a Redis-backed limiter.
- Exchange-rate, map, SMTP and OAuth integrations degrade gracefully when their env
  keys are absent.
- No credit-card data is ever stored; `cardLast4` is only the display suffix.

---

## License

This is a private demo project. Seeded hostels and images are illustrative.