# Build Sprints

## Sprint 1 — Database + Seed Data + Read Views (Demo-First)
**Goal:** App loads with real-looking data, no login required.
- [ ] Run migration SQL against Supabase project
- [ ] Verify seed: 4 accounts, 4 contacts, 4 visit reports, 3 enquiries, 2 RFQs, 4 opportunities
- [ ] `/accounts` — table: name, industry, owner, last visit, annual target
- [ ] `/contacts` — table: name, account, title, influence level
- [ ] `/visits` — list: account, date, purpose, status, converted flag
- [ ] `/opportunities` — kanban/list by stage (14 stages)
- [ ] Global nav (Accounts / Visits / Enquiries / Opportunities / Dashboard)
- [ ] All pages: loading skeleton, empty state, error boundary
- **DoD:** Anonymous visitor sees populated app at `/`; no 404s; no login redirect.

## Sprint 2 — Core Engine: Visit CRUD + Convert to Enquiry ✦ v1 Functional Milestone ✦
**Goal:** End-to-end visit → enquiry flow works against live DB.
- [ ] New Visit Report form (all required fields, dropdowns for equipment/purpose)
- [ ] Form validation: block submit if mandatory fields empty
- [ ] Save → `visit_reports` row inserted; list updates
- [ ] Edit visit report; delete with confirmation dialog
- [ ] Visit detail page with "Convert to Enquiry" button (greyed out if already converted)
- [ ] Convert click → pre-filled Enquiry form modal; user edits and confirms
- [ ] Enquiry saved → `enquiries` row inserted; `converted_to_enquiry` flipped to true
- [ ] New enquiry appears in `/enquiries` list immediately
- [ ] Empty, error, loading states on all forms; success toast on save
- **DoD:** Create visit → convert → new enquiry visible in list, linked to visit, persisted after full page reload.

## Sprint 3 — RFQ + Opportunity CRUD
**Goal:** Full conversion chain from enquiry to funnel.
- [ ] New RFQ from enquiry (one-click pre-fill)
- [ ] RFQ detail page: all fields editable, clarification log append-only
- [ ] New / edit / delete Opportunity
- [ ] Stage selector: 14 stages; advance blocked if required fields missing
- [ ] Opportunity linked to enquiry and account
- [ ] Filter opportunities by stage, industry, product line
- **DoD:** Enquiry → RFQ → Opportunity created, each linked, all visible in list and funnel.

## Sprint 4 — Quotation + Sales Engineer Dashboard
**Goal:** Quotation object live; personal KPI dashboard pulls from DB.
- [ ] Quotation record: all fields, linked to RFQ and account
- [ ] Quotation status flow: draft → submitted → won/lost
- [ ] `/dashboard/se` — visits planned vs done (month), open RFQs count, open quotation value, hit rate, product-line mix bar chart
- [ ] All KPI cards: loading skeleton; empty state copy ("No visits logged this month")
- **DoD:** Log 2 visits + 1 quotation in app; dashboard reflects updated counts without manual refresh.

## Sprint 5 — Sales Manager Dashboard + Governance
**Goal:** Manager has visibility of team activity and white space.
- [ ] `/dashboard/manager` — team visit coverage by segment, white-space table (no visit 60+ days), overdue next-actions list
- [ ] Territory plan view per SE: target vs actual by product line
- [ ] Visit plan KPI: planned vs done by week/month/quarter
- [ ] Consultant / EPC influence count per account
- **DoD:** Manager view loads with real data; white-space list shows correct accounts.

## Sprint 6 — Lock It Down (Auth + Per-User RLS)
**Goal:** Real users, real data isolation.
- [ ] Supabase Auth: email/password sign-up, login, logout
- [ ] `users` table with role column; team membership
- [ ] Replace all v1 open RLS policies with owner-scoped policies
- [ ] Manager-scope policy: sales_manager sees all team rows
- [ ] Audit log write on every mutating server action
- [ ] Confirm unauthenticated POST blocked (403)
- [ ] Demo seed remains visible in staging env
- **DoD:** Two users log in with different roles; each sees only their authorised data; audit log has entries for all writes.

## Sprint 7 — Intelligence Layer
**Goal:** Auto-scoring and auto-tagging live; human always in control.
- [ ] Rule-based opportunity scorer runs on stage change; stores ai_score + source + confidence + review_status
- [ ] Auto-tag equipment/pain-point category on visit save
- [ ] Score badge on opportunity card (with "unreviewed" indicator)
- [ ] User can override score; override writes review_status = 'human_reviewed'
- [ ] Overdue next-action flagging agent (low-risk, auto)
- [ ] Follow-up email draft surface (medium-risk, user confirms before any copy action)
- **DoD:** Change opportunity stage → score updates and is visible on card; user can edit and override.

## Gantt (Sprint → Calendar Weeks)
```
Sprint 1  |██ W1-W2
Sprint 2  |████ W2-W4   ← v1 functional milestone
Sprint 3  |██ W4-W5
Sprint 4  |██ W5-W6
Sprint 5  |██ W6-W7
Sprint 6  |██ W7-W8   ← lock-down
Sprint 7  |██ W8-W9
```
