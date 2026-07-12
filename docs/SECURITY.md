# Security

## Secret Handling
- Supabase service-role key is **server-side only** (Next.js server actions / API routes)
- Only the anon key is exposed to the browser via `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- All LLM API keys stored as Vercel environment variables — never in client code or committed to repo

## Permission Model
| Role | Sees | Can Write |
|---|---|---|
| Anonymous (demo) | All seed data | Nothing (post lock-down) |
| sales_engineer | Own accounts + shared accounts | Own visit reports, enquiries, opportunities |
| application_engineer | All RFQs + quotations | RFQ fields, clarification log |
| sales_manager | All team records | All — except delete |
| finance | Quotations, opportunities (read) | None |
| director | All (read) | None |

## Agent Permissions
- Agent tools run under the calling user's role — no privilege escalation
- Agent can never call `delete`, `send_email`, or `mark_as_won` without explicit human approval in UI
- Only named tools in `AGENTIC_LAYER.md` are callable — no `run_any` / `exec_sql` tools exposed

## Audit Principle
Every create, update, and delete writes a row to `audit_logs` with `triggered_by` = human or agent. Audit rows are append-only (no delete policy on `audit_logs`). Before adding real user data, confirm RLS lock-down sprint is complete.

## Lock-Down Checklist (Sprint 6)
- [ ] Replace open v1 RLS policies with `auth.uid() = user_id` owner policies
- [ ] Add manager-scope policy (role check via `users` table)
- [ ] Verify no server secret reachable from browser DevTools
- [ ] Penetration check: unauthenticated POST to any table returns 403
