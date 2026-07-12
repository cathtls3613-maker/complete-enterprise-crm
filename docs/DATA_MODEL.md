# Data Model

## accounts
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid nullable | owner, set at lock-down |
| name | text | |
| industry | text | Power / Chemical / O&G / Pharma / Water |
| segment | text | |
| country, city | text | |
| account_type | text | End User / EPC / Consultant |
| key_plants | text[] | |
| epc_consultants | text[] | |
| installed_base_notes | text | |
| target_pumps/seals/hex/service/spares | numeric | annual targets USD |
| owner_name | text | sales engineer name |
| last_visit_date | date | |

## contacts
Linked to `accounts`. Fields: full_name, title, department, email, phone, role_in_purchase, influence_level.

## visit_reports
Linked to `accounts`. Key fields: visit_date, visit_purpose, process_unit, equipment_discussed (text[]), contacts_met (text[]), operating_problem, competitor_at_site, customer_pain_point, opportunity_potential, next_action, next_action_owner, next_action_deadline, visit_status (planned/done), attachments (text[]), converted_to_enquiry (bool).

## enquiries
Linked to `accounts`, `visit_reports`. Fields: enquiry_number (unique), project_name, equipment_type, process_data, required_delivery_weeks, bid_due_date, competitor, probability (int), status.

## rfqs
Linked to `enquiries`, `accounts`. Fields: rfq_number (unique), technical_requirement, scope, bid_due_date, clarification_log, commercial_terms, bid_bond_required, compliance_matrix_notes, status.

## quotations
Linked to `rfqs`, `accounts`. Fields: quotation_number (unique), equipment_selection, bom_summary, cost_usd, selling_price_usd, margin_pct, delivery_weeks, warranty_months, payment_terms, commercial_deviation, status (draft/submitted/won/lost), submitted_date, result.

## opportunities
Linked to `enquiries`, `accounts`. Fields: title, stage (14 values), product_line, industry, value_usd, probability, expected_close_date, competitor, notes.
**AI fields:** ai_score `numeric` + ai_score_source `text` + ai_score_confidence `numeric` + ai_score_review_status `text default 'unreviewed'`.

## audit_logs
Fields: user_id, action (create/update/delete), table_name, row_id, old_values (jsonb), new_values (jsonb), ip_address.

## RLS
Sprint 1–5: permissive open policies (demo-first). Sprint 6 lock-down: owner-scoped `auth.uid() = user_id`; managers see team rows via role check.
