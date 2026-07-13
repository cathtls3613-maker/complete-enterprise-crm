"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  LATE_FUNNEL_STAGES,
  OPPORTUNITY_STAGES,
  QUOTATION_STATUSES,
} from "@/lib/crm/constants";
import { isSchemaMissing } from "@/lib/crm/data";
import { guessProductLine } from "@/lib/crm/product-line";
import type { ActionState } from "@/lib/crm/action-state";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// ── field helpers ────────────────────────────────────────────────────────────

function str(fd: FormData, name: string): string | null {
  const v = fd.get(name);
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed === "" ? null : trimmed;
}

function num(fd: FormData, name: string): number | null {
  const v = str(fd, name);
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function all(fd: FormData, name: string): string[] {
  return fd
    .getAll(name)
    .filter((v): v is string => typeof v === "string" && v.trim() !== "")
    .map((v) => v.trim());
}

function requireFields(
  fd: FormData,
  fields: Array<[name: string, label: string]>,
): string | null {
  const missing = fields.filter(([name]) => str(fd, name) == null).map(([, l]) => l);
  if (missing.length === 0) return null;
  return `Required: ${missing.join(", ")}`;
}

function friendlyDbError(error: { code?: string; message?: string }): string {
  if (isSchemaMissing(error)) {
    return "Database not initialized — apply supabase/migrations/0001_init.sql first.";
  }
  if (error.code === "42501" || (error.message ?? "").includes("row-level security")) {
    return "Not allowed — sign in to create or edit records.";
  }
  return `Could not save — ${error.message ?? "check your connection"}`;
}

// ── audit log ────────────────────────────────────────────────────────────────

async function audit(
  supabase: Supabase,
  action: "create" | "update" | "delete",
  table: string,
  rowId: string | null,
  oldValues: unknown,
  newValues: unknown,
) {
  // Best-effort: an audit failure must never block the business write.
  await supabase.from("audit_logs").insert({
    action,
    table_name: table,
    row_id: rowId,
    old_values: oldValues ?? null,
    new_values: newValues ?? null,
  });
}

// ── document numbering ───────────────────────────────────────────────────────

async function nextNumber(
  supabase: Supabase,
  table: string,
  column: string,
  prefix: string,
): Promise<string> {
  const year = new Date().getFullYear();
  const like = `${prefix}-${year}-%`;
  const { data } = await supabase
    .from(table)
    .select(column)
    .like(column, like)
    .order(column, { ascending: false })
    .limit(1);
  const latest = (data?.[0] as Record<string, string> | undefined)?.[column];
  const lastSeq = latest ? Number.parseInt(latest.slice(-4), 10) : 0;
  const seq = Number.isFinite(lastSeq) ? lastSeq + 1 : 1;
  return `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
}

function withToast(path: string, message: string): never {
  revalidatePath("/", "layout");
  redirect(`${path}?toast=${encodeURIComponent(message)}`);
}

// ── accounts ─────────────────────────────────────────────────────────────────

function accountPayload(fd: FormData) {
  return {
    name: str(fd, "name"),
    industry: str(fd, "industry"),
    segment: str(fd, "segment"),
    country: str(fd, "country"),
    city: str(fd, "city"),
    account_type: str(fd, "account_type"),
    key_plants: str(fd, "key_plants")?.split(",").map((s) => s.trim()).filter(Boolean) ?? null,
    epc_consultants:
      str(fd, "epc_consultants")?.split(",").map((s) => s.trim()).filter(Boolean) ?? null,
    installed_base_notes: str(fd, "installed_base_notes"),
    target_pumps: num(fd, "target_pumps") ?? 0,
    target_seals: num(fd, "target_seals") ?? 0,
    target_hex: num(fd, "target_hex") ?? 0,
    target_service: num(fd, "target_service") ?? 0,
    target_spares: num(fd, "target_spares") ?? 0,
    owner_name: str(fd, "owner_name"),
  };
}

export async function createAccount(_: ActionState, fd: FormData): Promise<ActionState> {
  const invalid = requireFields(fd, [
    ["name", "Account name"],
    ["industry", "Industry"],
  ]);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const payload = accountPayload(fd);
  const { data, error } = await supabase.from("accounts").insert(payload).select("id").single();
  if (error) return { error: friendlyDbError(error) };
  await audit(supabase, "create", "accounts", data.id, null, payload);
  withToast(`/accounts/${data.id}`, "Account created");
}

export async function updateAccount(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  if (!id) return { error: "Missing account id" };
  const invalid = requireFields(fd, [
    ["name", "Account name"],
    ["industry", "Industry"],
  ]);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const { data: old } = await supabase.from("accounts").select("*").eq("id", id).maybeSingle();
  const payload = accountPayload(fd);
  const { error } = await supabase.from("accounts").update(payload).eq("id", id);
  if (error) return { error: friendlyDbError(error) };
  await audit(supabase, "update", "accounts", id, old, payload);
  withToast(`/accounts/${id}`, "Account updated");
}

export async function deleteAccount(fd: FormData): Promise<void> {
  const id = str(fd, "id");
  if (!id) return;
  const supabase = await createClient();
  const { data: old } = await supabase.from("accounts").select("*").eq("id", id).maybeSingle();
  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) withToast("/accounts", friendlyDbError(error));
  await audit(supabase, "delete", "accounts", id, old, null);
  withToast("/accounts", "Account deleted");
}

// ── contacts ─────────────────────────────────────────────────────────────────

function contactPayload(fd: FormData) {
  return {
    account_id: str(fd, "account_id"),
    full_name: str(fd, "full_name"),
    title: str(fd, "title"),
    department: str(fd, "department"),
    email: str(fd, "email"),
    phone: str(fd, "phone"),
    role_in_purchase: str(fd, "role_in_purchase"),
    influence_level: str(fd, "influence_level"),
  };
}

export async function createContact(_: ActionState, fd: FormData): Promise<ActionState> {
  const invalid = requireFields(fd, [
    ["full_name", "Full name"],
    ["account_id", "Account"],
  ]);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const payload = contactPayload(fd);
  const { data, error } = await supabase.from("contacts").insert(payload).select("id").single();
  if (error) return { error: friendlyDbError(error) };
  await audit(supabase, "create", "contacts", data.id, null, payload);
  withToast("/contacts", "Contact created");
}

export async function updateContact(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  if (!id) return { error: "Missing contact id" };
  const invalid = requireFields(fd, [
    ["full_name", "Full name"],
    ["account_id", "Account"],
  ]);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const { data: old } = await supabase.from("contacts").select("*").eq("id", id).maybeSingle();
  const payload = contactPayload(fd);
  const { error } = await supabase.from("contacts").update(payload).eq("id", id);
  if (error) return { error: friendlyDbError(error) };
  await audit(supabase, "update", "contacts", id, old, payload);
  withToast("/contacts", "Contact updated");
}

export async function deleteContact(fd: FormData): Promise<void> {
  const id = str(fd, "id");
  if (!id) return;
  const supabase = await createClient();
  const { data: old } = await supabase.from("contacts").select("*").eq("id", id).maybeSingle();
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) withToast("/contacts", friendlyDbError(error));
  await audit(supabase, "delete", "contacts", id, old, null);
  withToast("/contacts", "Contact deleted");
}

// ── visit reports (core engine) ──────────────────────────────────────────────

const VISIT_REQUIRED: Array<[string, string]> = [
  ["account_id", "Account"],
  ["visit_date", "Visit date"],
  ["visit_purpose", "Purpose"],
  ["next_action", "Next action"],
  ["next_action_owner", "Next action owner"],
  ["next_action_deadline", "Next action deadline"],
];

function visitPayload(fd: FormData) {
  return {
    account_id: str(fd, "account_id"),
    visit_date: str(fd, "visit_date"),
    visit_purpose: str(fd, "visit_purpose"),
    process_unit: str(fd, "process_unit"),
    equipment_discussed: all(fd, "equipment_discussed"),
    contacts_met:
      str(fd, "contacts_met")?.split(",").map((s) => s.trim()).filter(Boolean) ?? [],
    operating_problem: str(fd, "operating_problem"),
    competitor_at_site: str(fd, "competitor_at_site"),
    customer_pain_point: str(fd, "customer_pain_point"),
    opportunity_potential: str(fd, "opportunity_potential"),
    next_action: str(fd, "next_action"),
    next_action_owner: str(fd, "next_action_owner"),
    next_action_deadline: str(fd, "next_action_deadline"),
    visit_status: str(fd, "visit_status") ?? "planned",
  };
}

async function touchAccountLastVisit(supabase: Supabase, accountId: string | null) {
  if (!accountId) return;
  const { data } = await supabase
    .from("visit_reports")
    .select("visit_date")
    .eq("account_id", accountId)
    .eq("visit_status", "done")
    .order("visit_date", { ascending: false })
    .limit(1);
  const latest = data?.[0]?.visit_date ?? null;
  await supabase.from("accounts").update({ last_visit_date: latest }).eq("id", accountId);
}

export async function createVisitReport(_: ActionState, fd: FormData): Promise<ActionState> {
  const invalid = requireFields(fd, VISIT_REQUIRED);
  if (invalid) return { error: invalid };
  if (all(fd, "equipment_discussed").length === 0) {
    return { error: "Required: at least one equipment discussed" };
  }

  const supabase = await createClient();
  const payload = visitPayload(fd);
  const { data, error } = await supabase
    .from("visit_reports")
    .insert(payload)
    .select("id")
    .single();
  if (error) return { error: friendlyDbError(error) };
  await audit(supabase, "create", "visit_reports", data.id, null, payload);
  await touchAccountLastVisit(supabase, payload.account_id);
  withToast(`/visits/${data.id}`, "Visit report saved");
}

export async function updateVisitReport(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  if (!id) return { error: "Missing visit id" };
  const invalid = requireFields(fd, VISIT_REQUIRED);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const { data: old } = await supabase.from("visit_reports").select("*").eq("id", id).maybeSingle();
  const payload = visitPayload(fd);
  const { error } = await supabase.from("visit_reports").update(payload).eq("id", id);
  if (error) return { error: friendlyDbError(error) };
  await audit(supabase, "update", "visit_reports", id, old, payload);
  await touchAccountLastVisit(supabase, payload.account_id);
  withToast(`/visits/${id}`, "Visit report updated");
}

export async function deleteVisitReport(fd: FormData): Promise<void> {
  const id = str(fd, "id");
  if (!id) return;
  const supabase = await createClient();
  const { data: old } = await supabase.from("visit_reports").select("*").eq("id", id).maybeSingle();
  const { error } = await supabase.from("visit_reports").delete().eq("id", id);
  if (error) withToast(`/visits/${id}`, friendlyDbError(error));
  await audit(supabase, "delete", "visit_reports", id, old, null);
  await touchAccountLastVisit(supabase, old?.account_id ?? null);
  withToast("/visits", "Visit report deleted");
}

// Attachment paths live in visit_reports.attachments; the file bytes live in
// the public `visit-attachments` storage bucket (see 0002_attachments.sql).

export async function appendVisitAttachment(
  visitId: string,
  path: string,
): Promise<{ error: string | null }> {
  if (!visitId || !path) return { error: "Missing visit or file path" };
  const supabase = await createClient();
  const { data: visit, error: readError } = await supabase
    .from("visit_reports")
    .select("attachments")
    .eq("id", visitId)
    .maybeSingle();
  if (readError) return { error: friendlyDbError(readError) };
  if (!visit) return { error: "Visit report not found" };

  const next = [...(visit.attachments ?? []), path];
  const { error } = await supabase
    .from("visit_reports")
    .update({ attachments: next })
    .eq("id", visitId);
  if (error) return { error: friendlyDbError(error) };
  await audit(supabase, "update", "visit_reports", visitId, { attachments: visit.attachments }, { attachments: next });
  revalidatePath(`/visits/${visitId}`);
  return { error: null };
}

export async function removeVisitAttachment(
  visitId: string,
  path: string,
): Promise<{ error: string | null }> {
  if (!visitId || !path) return { error: "Missing visit or file path" };
  const supabase = await createClient();
  const { data: visit, error: readError } = await supabase
    .from("visit_reports")
    .select("attachments")
    .eq("id", visitId)
    .maybeSingle();
  if (readError) return { error: friendlyDbError(readError) };
  if (!visit) return { error: "Visit report not found" };

  const next = (visit.attachments ?? []).filter((p: string) => p !== path);
  const { error } = await supabase
    .from("visit_reports")
    .update({ attachments: next })
    .eq("id", visitId);
  if (error) return { error: friendlyDbError(error) };
  await audit(supabase, "update", "visit_reports", visitId, { attachments: visit.attachments }, { attachments: next });
  revalidatePath(`/visits/${visitId}`);
  return { error: null };
}

// ── convert to enquiry: the one core verb ────────────────────────────────────
// Inserts the enquiry, flips the visit's converted flag, and creates the
// linked opportunity so the conversion shows up in the funnel immediately
// (PRD success scenario).

export async function convertVisitToEnquiry(_: ActionState, fd: FormData): Promise<ActionState> {
  const visitId = str(fd, "visit_report_id");
  if (!visitId) return { error: "Missing visit id" };
  const invalid = requireFields(fd, [
    ["equipment_type", "Equipment type"],
    ["project_name", "Project name"],
  ]);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const { data: visit, error: visitError } = await supabase
    .from("visit_reports")
    .select("*, accounts(id, name, industry)")
    .eq("id", visitId)
    .maybeSingle();
  if (visitError) return { error: friendlyDbError(visitError) };
  if (!visit) return { error: "Visit report not found" };
  if (visit.converted_to_enquiry) return { error: "This visit is already converted" };

  const enquiryNumber = await nextNumber(supabase, "enquiries", "enquiry_number", "ENQ");
  const enquiryPayload = {
    enquiry_number: enquiryNumber,
    account_id: visit.account_id,
    visit_report_id: visit.id,
    project_name: str(fd, "project_name"),
    equipment_type: str(fd, "equipment_type"),
    process_data: str(fd, "process_data"),
    required_delivery_weeks: num(fd, "required_delivery_weeks"),
    bid_due_date: str(fd, "bid_due_date"),
    competitor: str(fd, "competitor"),
    probability: num(fd, "probability") ?? 20,
    status: "open",
  };

  const { data: enquiry, error: enquiryError } = await supabase
    .from("enquiries")
    .insert(enquiryPayload)
    .select("id")
    .single();
  if (enquiryError) return { error: friendlyDbError(enquiryError) };
  await audit(supabase, "create", "enquiries", enquiry.id, null, enquiryPayload);

  const { error: flipError } = await supabase
    .from("visit_reports")
    .update({ converted_to_enquiry: true })
    .eq("id", visit.id);
  if (flipError) return { error: friendlyDbError(flipError) };
  await audit(supabase, "update", "visit_reports", visit.id, { converted_to_enquiry: false }, { converted_to_enquiry: true });

  const account = visit.accounts as { name?: string; industry?: string } | null;
  const oppPayload = {
    enquiry_id: enquiry.id,
    account_id: visit.account_id,
    title: enquiryPayload.project_name ?? `${account?.name ?? "New"} — ${enquiryPayload.equipment_type}`,
    stage: "Enquiry Received",
    product_line: guessProductLine(enquiryPayload.equipment_type),
    industry: account?.industry ?? null,
    probability: enquiryPayload.probability,
    expected_close_date: enquiryPayload.bid_due_date,
    competitor: enquiryPayload.competitor,
    ...scoreFields({
      stage: "Enquiry Received",
      probability: enquiryPayload.probability,
      competitor: enquiryPayload.competitor,
      expected_close_date: enquiryPayload.bid_due_date,
      notes: null,
      lastVisitDate: visit.visit_date,
    }),
  };
  const { data: opp, error: oppError } = await supabase
    .from("opportunities")
    .insert(oppPayload)
    .select("id")
    .single();
  if (!oppError && opp) {
    await audit(supabase, "create", "opportunities", opp.id, null, oppPayload);
  }

  withToast("/enquiries", `Enquiry ${enquiryNumber} created from visit`);
}

// ── enquiries ────────────────────────────────────────────────────────────────

function enquiryPayload(fd: FormData) {
  return {
    account_id: str(fd, "account_id"),
    project_name: str(fd, "project_name"),
    equipment_type: str(fd, "equipment_type"),
    process_data: str(fd, "process_data"),
    required_delivery_weeks: num(fd, "required_delivery_weeks"),
    bid_due_date: str(fd, "bid_due_date"),
    competitor: str(fd, "competitor"),
    probability: num(fd, "probability") ?? 20,
    status: str(fd, "status") ?? "open",
  };
}

export async function createEnquiry(_: ActionState, fd: FormData): Promise<ActionState> {
  const invalid = requireFields(fd, [
    ["account_id", "Account"],
    ["equipment_type", "Equipment type"],
  ]);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const payload = {
    ...enquiryPayload(fd),
    enquiry_number: await nextNumber(supabase, "enquiries", "enquiry_number", "ENQ"),
    visit_report_id: str(fd, "visit_report_id"),
  };
  const { data, error } = await supabase.from("enquiries").insert(payload).select("id").single();
  if (error) return { error: friendlyDbError(error) };
  await audit(supabase, "create", "enquiries", data.id, null, payload);
  withToast(`/enquiries/${data.id}`, `Enquiry ${payload.enquiry_number} created`);
}

export async function updateEnquiry(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  if (!id) return { error: "Missing enquiry id" };
  const invalid = requireFields(fd, [
    ["account_id", "Account"],
    ["equipment_type", "Equipment type"],
  ]);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const { data: old } = await supabase.from("enquiries").select("*").eq("id", id).maybeSingle();
  const payload = enquiryPayload(fd);
  const { error } = await supabase.from("enquiries").update(payload).eq("id", id);
  if (error) return { error: friendlyDbError(error) };
  await audit(supabase, "update", "enquiries", id, old, payload);
  withToast(`/enquiries/${id}`, "Enquiry updated");
}

export async function deleteEnquiry(fd: FormData): Promise<void> {
  const id = str(fd, "id");
  if (!id) return;
  const supabase = await createClient();
  const { data: old } = await supabase.from("enquiries").select("*").eq("id", id).maybeSingle();
  const { error } = await supabase.from("enquiries").delete().eq("id", id);
  if (error) withToast(`/enquiries/${id}`, friendlyDbError(error));
  await audit(supabase, "delete", "enquiries", id, old, null);
  withToast("/enquiries", "Enquiry deleted");
}

// ── rfqs ─────────────────────────────────────────────────────────────────────

function rfqPayload(fd: FormData) {
  return {
    enquiry_id: str(fd, "enquiry_id"),
    account_id: str(fd, "account_id"),
    technical_requirement: str(fd, "technical_requirement"),
    scope: str(fd, "scope"),
    bid_due_date: str(fd, "bid_due_date"),
    commercial_terms: str(fd, "commercial_terms"),
    bid_bond_required: fd.get("bid_bond_required") === "on",
    compliance_matrix_notes: str(fd, "compliance_matrix_notes"),
    status: str(fd, "status") ?? "received",
  };
}

export async function createRfq(_: ActionState, fd: FormData): Promise<ActionState> {
  const invalid = requireFields(fd, [
    ["account_id", "Account"],
    ["technical_requirement", "Technical requirement"],
  ]);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const payload = {
    ...rfqPayload(fd),
    rfq_number: await nextNumber(supabase, "rfqs", "rfq_number", "RFQ"),
  };
  const { data, error } = await supabase.from("rfqs").insert(payload).select("id").single();
  if (error) return { error: friendlyDbError(error) };
  await audit(supabase, "create", "rfqs", data.id, null, payload);
  withToast(`/rfqs/${data.id}`, `RFQ ${payload.rfq_number} created`);
}

export async function updateRfq(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  if (!id) return { error: "Missing RFQ id" };
  const invalid = requireFields(fd, [
    ["account_id", "Account"],
    ["technical_requirement", "Technical requirement"],
  ]);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const { data: old } = await supabase.from("rfqs").select("*").eq("id", id).maybeSingle();
  const payload = rfqPayload(fd);
  const { error } = await supabase.from("rfqs").update(payload).eq("id", id);
  if (error) return { error: friendlyDbError(error) };
  await audit(supabase, "update", "rfqs", id, old, payload);
  withToast(`/rfqs/${id}`, "RFQ updated");
}

export async function appendRfqClarification(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const entry = str(fd, "entry");
  if (!id) return { error: "Missing RFQ id" };
  if (!entry) return { error: "Required: clarification entry" };

  const supabase = await createClient();
  const { data: rfq, error: readError } = await supabase
    .from("rfqs")
    .select("clarification_log")
    .eq("id", id)
    .maybeSingle();
  if (readError) return { error: friendlyDbError(readError) };

  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  const line = `[${stamp}] ${entry}`;
  const nextLog = rfq?.clarification_log ? `${rfq.clarification_log}\n${line}` : line;
  const { error } = await supabase.from("rfqs").update({ clarification_log: nextLog }).eq("id", id);
  if (error) return { error: friendlyDbError(error) };
  await audit(supabase, "update", "rfqs", id, { clarification_log: rfq?.clarification_log ?? null }, { clarification_log: nextLog });
  withToast(`/rfqs/${id}`, "Clarification logged");
}

export async function deleteRfq(fd: FormData): Promise<void> {
  const id = str(fd, "id");
  if (!id) return;
  const supabase = await createClient();
  const { data: old } = await supabase.from("rfqs").select("*").eq("id", id).maybeSingle();
  const { error } = await supabase.from("rfqs").delete().eq("id", id);
  if (error) withToast(`/rfqs/${id}`, friendlyDbError(error));
  await audit(supabase, "delete", "rfqs", id, old, null);
  withToast("/rfqs", "RFQ deleted");
}

// ── opportunities ────────────────────────────────────────────────────────────

// Rule-based scorer from docs/INTELLIGENCE_LAYER.md (rule_engine_v1).
function scoreFields(input: {
  stage: string;
  probability: number | null;
  competitor: string | null;
  expected_close_date: string | null;
  notes: string | null;
  lastVisitDate: string | null;
}) {
  let score = 0;
  if (LATE_FUNNEL_STAGES.includes(input.stage as (typeof LATE_FUNNEL_STAGES)[number])) score += 30;
  if (input.lastVisitDate) {
    const days = (Date.now() - new Date(input.lastVisitDate).getTime()) / 86_400_000;
    if (days >= 0 && days <= 30) score += 20;
  }
  if (input.competitor) score += 10;
  const text = (input.notes ?? "").toLowerCase();
  if (text.includes("shutdown") || text.includes("compliance")) score += 15;
  if ((input.probability ?? 0) > 50) score += 15;
  if (input.expected_close_date) {
    const days = (new Date(input.expected_close_date).getTime() - Date.now()) / 86_400_000;
    if (days >= 0 && days <= 45) score += 10;
  }
  return {
    ai_score: Math.min(score, 100),
    ai_score_source: "rule_engine_v1",
    ai_score_confidence: 0.75,
    ai_score_review_status: "unreviewed",
  };
}

// Stage-advance validation: later stages need the fields a manager would
// expect to be filled by then.
function stageValidationError(fd: FormData): string | null {
  const stage = str(fd, "stage");
  if (!stage) return "Required: Stage";
  const idx = OPPORTUNITY_STAGES.indexOf(stage as (typeof OPPORTUNITY_STAGES)[number]);
  if (idx === -1) return "Unknown stage";
  const rfqIdx = OPPORTUNITY_STAGES.indexOf("RFQ Issued");
  const quoteIdx = OPPORTUNITY_STAGES.indexOf("Quotation Submitted");
  if (idx >= rfqIdx && stage !== "On Hold") {
    if (num(fd, "value_usd") == null) return `Stage "${stage}" requires a value (USD)`;
    if (str(fd, "expected_close_date") == null)
      return `Stage "${stage}" requires an expected close date`;
  }
  if (idx >= quoteIdx && stage !== "On Hold") {
    if (str(fd, "competitor") == null) return `Stage "${stage}" requires the competitor`;
  }
  if ((stage === "Awarded" || stage === "Lost") && str(fd, "notes") == null) {
    return `Stage "${stage}" requires a closing note (why we ${stage === "Awarded" ? "won" : "lost"})`;
  }
  return null;
}

async function lastVisitDateForAccount(supabase: Supabase, accountId: string | null) {
  if (!accountId) return null;
  const { data } = await supabase
    .from("accounts")
    .select("last_visit_date")
    .eq("id", accountId)
    .maybeSingle();
  return data?.last_visit_date ?? null;
}

function opportunityPayload(fd: FormData) {
  return {
    account_id: str(fd, "account_id"),
    enquiry_id: str(fd, "enquiry_id"),
    title: str(fd, "title"),
    stage: str(fd, "stage") ?? "Target Account",
    product_line: str(fd, "product_line"),
    industry: str(fd, "industry"),
    value_usd: num(fd, "value_usd"),
    probability: num(fd, "probability") ?? 10,
    expected_close_date: str(fd, "expected_close_date"),
    competitor: str(fd, "competitor"),
    notes: str(fd, "notes"),
  };
}

export async function createOpportunity(_: ActionState, fd: FormData): Promise<ActionState> {
  const invalid =
    requireFields(fd, [
      ["title", "Title"],
      ["account_id", "Account"],
    ]) ?? stageValidationError(fd);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const base = opportunityPayload(fd);
  const payload = {
    ...base,
    ...scoreFields({
      ...base,
      lastVisitDate: await lastVisitDateForAccount(supabase, base.account_id),
    }),
  };
  const { data, error } = await supabase
    .from("opportunities")
    .insert(payload)
    .select("id")
    .single();
  if (error) return { error: friendlyDbError(error) };
  await audit(supabase, "create", "opportunities", data.id, null, payload);
  withToast("/opportunities", "Opportunity created");
}

export async function updateOpportunity(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  if (!id) return { error: "Missing opportunity id" };
  const invalid =
    requireFields(fd, [
      ["title", "Title"],
      ["account_id", "Account"],
    ]) ?? stageValidationError(fd);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const { data: old } = await supabase.from("opportunities").select("*").eq("id", id).maybeSingle();
  const base = opportunityPayload(fd);
  // Re-score on every save; stage changes are the main trigger.
  const payload = {
    ...base,
    ...scoreFields({
      ...base,
      lastVisitDate: await lastVisitDateForAccount(supabase, base.account_id),
    }),
  };
  const { error } = await supabase.from("opportunities").update(payload).eq("id", id);
  if (error) return { error: friendlyDbError(error) };
  await audit(supabase, "update", "opportunities", id, old, payload);
  withToast(`/opportunities/${id}`, "Opportunity updated");
}

export async function overrideOpportunityScore(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const score = num(fd, "ai_score");
  if (!id) return { error: "Missing opportunity id" };
  if (score == null || score < 0 || score > 100) return { error: "Score must be 0–100" };

  const supabase = await createClient();
  const { data: old } = await supabase
    .from("opportunities")
    .select("ai_score, ai_score_review_status")
    .eq("id", id)
    .maybeSingle();
  const payload = {
    ai_score: score,
    ai_score_source: "human_override",
    ai_score_confidence: 1,
    ai_score_review_status: "human_reviewed",
  };
  const { error } = await supabase.from("opportunities").update(payload).eq("id", id);
  if (error) return { error: friendlyDbError(error) };
  await audit(supabase, "update", "opportunities", id, old, payload);
  withToast(`/opportunities/${id}`, "Score overridden");
}

export async function deleteOpportunity(fd: FormData): Promise<void> {
  const id = str(fd, "id");
  if (!id) return;
  const supabase = await createClient();
  const { data: old } = await supabase.from("opportunities").select("*").eq("id", id).maybeSingle();
  const { error } = await supabase.from("opportunities").delete().eq("id", id);
  if (error) withToast(`/opportunities/${id}`, friendlyDbError(error));
  await audit(supabase, "delete", "opportunities", id, old, null);
  withToast("/opportunities", "Opportunity deleted");
}

// ── quotations ───────────────────────────────────────────────────────────────

function quotationPayload(fd: FormData) {
  const status = str(fd, "status") ?? "draft";
  const cost = num(fd, "cost_usd");
  const price = num(fd, "selling_price_usd");
  const margin =
    cost != null && price != null && price !== 0
      ? Math.round(((price - cost) / price) * 1000) / 10
      : num(fd, "margin_pct");
  return {
    rfq_id: str(fd, "rfq_id"),
    account_id: str(fd, "account_id"),
    equipment_selection: str(fd, "equipment_selection"),
    bom_summary: str(fd, "bom_summary"),
    cost_usd: cost,
    selling_price_usd: price,
    margin_pct: margin,
    delivery_weeks: num(fd, "delivery_weeks"),
    warranty_months: num(fd, "warranty_months") ?? 12,
    payment_terms: str(fd, "payment_terms"),
    commercial_deviation: str(fd, "commercial_deviation"),
    status,
    submitted_date:
      status === "draft" ? null : str(fd, "submitted_date") ?? new Date().toISOString().slice(0, 10),
    result: status === "won" ? "won" : status === "lost" ? "lost" : null,
  };
}

export async function createQuotation(_: ActionState, fd: FormData): Promise<ActionState> {
  const invalid = requireFields(fd, [
    ["account_id", "Account"],
    ["selling_price_usd", "Selling price (USD)"],
  ]);
  if (invalid) return { error: invalid };
  const status = str(fd, "status") ?? "draft";
  if (!QUOTATION_STATUSES.includes(status as (typeof QUOTATION_STATUSES)[number])) {
    return { error: "Invalid status" };
  }

  const supabase = await createClient();
  const payload = {
    ...quotationPayload(fd),
    quotation_number: await nextNumber(supabase, "quotations", "quotation_number", "QTN"),
  };
  const { data, error } = await supabase.from("quotations").insert(payload).select("id").single();
  if (error) return { error: friendlyDbError(error) };
  await audit(supabase, "create", "quotations", data.id, null, payload);
  withToast(`/quotations/${data.id}`, `Quotation ${payload.quotation_number} created`);
}

export async function updateQuotation(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  if (!id) return { error: "Missing quotation id" };
  const invalid = requireFields(fd, [
    ["account_id", "Account"],
    ["selling_price_usd", "Selling price (USD)"],
  ]);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const { data: old } = await supabase.from("quotations").select("*").eq("id", id).maybeSingle();
  const payload = quotationPayload(fd);
  const { error } = await supabase.from("quotations").update(payload).eq("id", id);
  if (error) return { error: friendlyDbError(error) };
  await audit(supabase, "update", "quotations", id, old, payload);
  withToast(`/quotations/${id}`, "Quotation updated");
}

export async function deleteQuotation(fd: FormData): Promise<void> {
  const id = str(fd, "id");
  if (!id) return;
  const supabase = await createClient();
  const { data: old } = await supabase.from("quotations").select("*").eq("id", id).maybeSingle();
  const { error } = await supabase.from("quotations").delete().eq("id", id);
  if (error) withToast(`/quotations/${id}`, friendlyDbError(error));
  await audit(supabase, "delete", "quotations", id, old, null);
  withToast("/quotations", "Quotation deleted");
}
