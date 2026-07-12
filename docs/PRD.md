# Product Requirements Document

## Problem
Industrial sales teams (pumps, seals, heat exchangers, valves) run their pipeline in spreadsheets and chat. Visit knowledge is lost, RFQs are disconnected from technical history, and managers have no live view of funnel health or activity compliance.

## Target Users
- **Sales Engineer / BDM** — logs visits, converts to enquiries, submits quotations
- **Application Engineer** — handles technical clarifications on RFQs
- **Sales Manager** — reviews team coverage, white-space, KPIs
- **Finance / Director** — read-only pipeline value and margin view

## Core Objects
`Account` → `Contact` → `Visit Report` → `Enquiry` → `RFQ` → `Quotation` → `Opportunity`

## MVP Must-Haves (v1)
- [ ] Account list with industry, segment, targets by product line
- [ ] Contact records linked to accounts
- [ ] Structured visit report form (all mandatory fields, no free-text dump)
- [ ] **"Convert to Enquiry"** button on every visit report — auto-creates linked enquiry
- [ ] Enquiry detail page showing origin visit
- [ ] RFQ object created from enquiry
- [ ] Opportunity funnel with all 14 stages; stage-advance validation
- [ ] Sales Engineer dashboard: visits planned vs done, open RFQs, quotation value, hit rate
- [ ] All pages render without login (seed data visible on first load)

## Non-Goals (v1)
- CPQ / full BOM cost engine
- Map / geo routing
- Email send from app
- Mobile native app
- Multi-tenant / resale SaaS

## Definition of Done
**Success scenario:** A sales engineer opens the app, creates a visit report for an existing account, clicks "Convert to Enquiry", confirms the pre-filled enquiry form, and sees the new enquiry appear in the enquiry list AND as a linked opportunity in the funnel — all persisted to the database, visible to a second browser tab without refresh.
