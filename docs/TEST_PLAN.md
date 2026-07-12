# Test Plan

## v1 Success Scenario (Manual)

### Setup
- App running locally or on Vercel preview
- Supabase migration + seed applied
- No login required

### Steps
1. Open `/` — assert: accounts list loads with ≥4 rows; no blank screen; no login redirect
2. Click account "Petronas Refinery Kerteh" — assert: detail page shows contacts and last visit date
3. Navigate to `/visits` — assert: 4 seeded visit reports visible with correct status badges
4. Click **New Visit Report** — assert: form opens with all required fields present
5. Fill in: account = Petronas, date = today, purpose = Follow-up, equipment = Pump + Seal, process unit = CDU, competitor = Flowserve, pain point = vibration, next action = Submit proposal, deadline = 2 weeks out
6. Click **Save** — assert: success toast appears; new row appears at top of visits list
7. Open the new visit report — assert: all fields saved correctly
8. Click **Convert to Enquiry** — assert: modal opens pre-filled with account, equipment type, competitor
9. Edit `bid_due_date`, click **Confirm** — assert: success toast; enquiry appears in `/enquiries` list with correct enquiry number; visit row shows "Converted" badge
10. Open the enquiry — assert: linked visit report name is shown as a clickable link
11. Open `/opportunities` — assert: funnel displays all 4 seeded opportunities in correct stages
12. Open opportunity "CDU Seal Upgrade" — assert: stage = RFQ Issued; value and competitor fields populated
13. Reload the browser — assert: all created records still present (not lost on refresh)

## Empty State Tests
- Delete all opportunities → `/opportunities` shows "No opportunities yet" empty state with a **New Opportunity** CTA
- Load `/dashboard/se` with no visits this month → KPI cards show 0 / "—" with helper copy, not broken layout

## Error State Tests
- Submit visit report with `next_action_deadline` blank → inline validation error, form not submitted
- Simulate network failure (DevTools offline) during save → error toast "Could not save — check your connection"; data not partially written
- Navigate to `/visits/nonexistent-id` → 404 page, not crash

## Permission Smoke Test (post Sprint 6)
- Unauthenticated `POST /api/visits` → 403 response
- sales_engineer user cannot see another engineer's private accounts
- sales_manager user sees all team records
