# Agentic Layer

## Risk Levels & Actions

### Low — Auto (no approval needed)
- Auto-tag visit report equipment/pain-point category on save
- Compute opportunity score on stage change
- Mark visit as overdue if `next_action_deadline` passed with no follow-up
- Suggest next funnel stage when required fields are complete

### Medium — Draft shown in UI, user must click Confirm
- Create follow-up task from overdue next-action (writes to `visit_reports.next_action`)
- Update opportunity probability when stage advances
- Generate RFQ skeleton from enquiry fields

### High — Explicit approval required
- Draft outbound follow-up email (shown as editable text; user clicks Send separately via their own mail client — **app never sends autonomously**)
- Advance opportunity to Awarded/Lost (requires manager confirmation)

### Critical — Human only, no agent path
- Delete account or opportunity
- Mark quotation as Won (triggers order creation)
- Any financial record change

## Named Tools (v1)
- `score_opportunity(opportunity_id)` — reads fields, returns score 0–100
- `tag_visit_report(visit_report_id)` — extracts equipment/pain-point tags
- `draft_rfq_from_enquiry(enquiry_id)` — returns pre-filled RFQ object for user review
- `flag_overdue_actions()` — returns list of past-deadline next-actions

## Audit Log Fields
`user_id, action, table_name, row_id, old_values (jsonb), new_values (jsonb), triggered_by (human/agent), created_at`

## v1 vs Later
- **v1:** Low-risk auto-tags and scoring only
- **Later:** Draft email, next-best-action card, spec-in likelihood agent
