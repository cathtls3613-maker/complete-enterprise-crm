# Intelligence Layer

## Messy Inputs This Cleans Up
- Unstructured visit notes → structured pain point / equipment / competitor tags
- Gut-feel probability → scored probability based on stage, competitor, visit recency, pain-point severity
- Disconnected spreadsheet rows → linked visit → enquiry → opportunity chain

## Auto-Structure at Visit Save
```json
{
  "equipment_tags": ["Mechanical Seal", "Pump"],
  "pain_point_category": "Reliability / MTBF",
  "competitor_detected": "Flowserve",
  "urgency_signal": "shutdown risk",
  "source": "structured_fields_parser",
  "confidence": 0.91,
  "review_status": "unreviewed"
}
```

## Opportunity Scoring (Rule-Based v1, LLM-Assisted Later)
| Signal | Points |
|---|---|
| Stage ≥ RFQ Issued | +30 |
| Visit in last 30 days | +20 |
| Competitor known | +10 |
| Pain point = shutdown / compliance | +15 |
| Probability > 50 | +15 |
| Bid due date < 45 days | +10 |

Score 0–100 stored as `ai_score`. Source = `rule_engine_v1`. Confidence = 0.75 default.

## Events to Track
- Visit created / completed
- Enquiry converted from visit
- Stage advanced on opportunity
- Quotation submitted
- Next-action overdue

## v1 vs Later
- **v1:** Rule-based score on opportunity save; pain-point auto-tag from structured fields
- **Later:** LLM re-scores from visit narrative; next-best-action suggestion; spec-in probability model
