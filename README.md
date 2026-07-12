# IndustrialCRM — complete-enterprise-crm

Enterprise CRM for industrial sales teams (pumps, seals, heat exchangers, valves):
structured visit reports, an enquiry → RFQ → quotation → opportunity conversion chain,
and role dashboards replacing spreadsheets. Demo-first: the homepage is the working app,
no login wall (auth arrives in the lock-down sprint).

Plan and specs live in [`/docs`](docs/PRD.md). Stack: Next.js 15 (App Router, Server
Actions) + Supabase (Postgres) + Tailwind v4, deployed on Vercel from `main`.

## One-time database setup

The schema + seed live in [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
If the app shows a "Database not initialized" banner, paste that file into the Supabase
SQL editor (Dashboard → SQL Editor → Run). That's the only manual step — the app lights
up with seed data immediately.

## Core flow (the PRD success scenario)

1. `/visits/new` — log a structured visit report (mandatory fields enforced)
2. Visit detail → **Convert to Enquiry** → confirm the pre-filled modal
3. The enquiry appears in `/enquiries` (numbered `ENQ-YYYY-NNNN`, linked to the visit)
   and as a linked opportunity in the 14-stage funnel at `/opportunities`
4. Enquiry → **Create RFQ** (pre-filled) → RFQ → **Create Quotation** →
   draft → submitted → won/lost feeds the `/dashboard/se` KPIs

Every create/update/delete writes an `audit_logs` row. Opportunities are scored by a
rule engine (`rule_engine_v1`) on each save; a human override marks them reviewed.

## Local development

```bash
npm install
npx vercel link && npx vercel env pull .env.local   # Supabase URL + anon key
npm run dev
```

Deploy by git only: `git push` to `main` → Vercel builds. Never `vercel deploy`.
