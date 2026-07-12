# Architecture

## Stack
- **Frontend:** Next.js 14 (App Router, TypeScript, Tailwind CSS)
- **Backend/DB:** Supabase (Postgres, RLS, Storage for attachments)
- **Hosting:** Vercel
- **Auth:** Supabase Auth — added in Lock-Down sprint, NOT Sprint 1

## What Gets Built Now vs Later

| Now (Sprints 1–4) | Later (Sprint 6+) |
|---|---|
| All domain tables + seed data | Auth, per-user RLS |
| Visit report CRUD + convert flow | File upload (Supabase Storage) |
| Enquiry / RFQ / Quotation CRUD | AI opportunity scoring |
| 14-stage opportunity funnel | Map view, mobile |
| Sales Engineer KPI dashboard | CEO / Director dashboard |

## Key User Action — Step by Step
1. Sales engineer opens **New Visit Report** form
2. Selects account (autocomplete from `accounts` table), fills structured fields
3. Form submits → `visit_reports` row inserted via Supabase client
4. Visit detail page renders; "Convert to Enquiry" button appears
5. Click → pre-filled `enquiry` form opens (account, equipment type, process data copied)
6. User confirms → `enquiries` row inserted, `visit_reports.converted_to_enquiry = true`
7. Enquiry list and opportunity funnel both update immediately (Supabase realtime or re-fetch)
8. Audit log row written: `action=create, table=enquiries, row_id=...`

## Layer Plan
1. **Data layer** — Postgres tables + RLS (core truth; survives any UI change)
2. **App logic layer** — Next.js server actions / API routes for all writes; validation before DB insert
3. **Intelligence layer** — opportunity scoring, auto-tags — reads DB, writes back score fields; core works without it

## Core Without AI
All CRUD, the conversion chain, and dashboards are pure DB queries. Remove AI scoring and the app still runs completely.
