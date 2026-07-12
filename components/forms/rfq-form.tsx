"use client";

import { useActionState } from "react";
import {
  appendRfqClarification,
  createRfq,
  updateRfq,
} from "@/lib/crm/actions";
import { initialActionState } from "@/lib/crm/action-state";
import type { Account, Enquiry, Rfq } from "@/lib/crm/types";
import { RFQ_STATUSES } from "@/lib/crm/constants";
import { Field, FormError, SubmitButton, inputCls } from "./fields";

export function RfqForm({
  accounts,
  enquiries,
  rfq,
  prefillEnquiry,
}: {
  accounts: Pick<Account, "id" | "name">[];
  enquiries: Pick<Enquiry, "id" | "enquiry_number" | "project_name" | "account_id" | "process_data" | "equipment_type" | "bid_due_date">[];
  rfq?: Rfq;
  prefillEnquiry?: Pick<
    Enquiry,
    "id" | "account_id" | "process_data" | "equipment_type" | "project_name" | "bid_due_date"
  > | null;
}) {
  const action = rfq ? updateRfq : createRfq;
  const [state, formAction] = useActionState(action, initialActionState);

  const defaultTechnical = rfq?.technical_requirement
    ?? (prefillEnquiry
      ? [prefillEnquiry.equipment_type, prefillEnquiry.process_data].filter(Boolean).join(" — ")
      : "");
  const defaultScope = rfq?.scope ?? (prefillEnquiry?.project_name ?? "");

  return (
    <form action={formAction} className="space-y-4">
      {rfq ? <input type="hidden" name="id" value={rfq.id} /> : null}
      <FormError error={state.error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Account" required>
          <select
            name="account_id"
            required
            defaultValue={rfq?.account_id ?? prefillEnquiry?.account_id ?? ""}
            className={inputCls}
          >
            <option value="" disabled>
              Select account…
            </option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Linked enquiry">
          <select
            name="enquiry_id"
            defaultValue={rfq?.enquiry_id ?? prefillEnquiry?.id ?? ""}
            className={inputCls}
          >
            <option value="">None</option>
            {enquiries.map((e) => (
              <option key={e.id} value={e.id}>
                {e.enquiry_number} — {e.project_name ?? "untitled"}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Technical requirement" required>
        <textarea
          name="technical_requirement"
          required
          rows={3}
          defaultValue={defaultTechnical}
          className={inputCls}
        />
      </Field>

      <Field label="Scope of supply">
        <textarea name="scope" rows={2} defaultValue={defaultScope} className={inputCls} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Bid due date">
          <input
            type="date"
            name="bid_due_date"
            defaultValue={rfq?.bid_due_date ?? prefillEnquiry?.bid_due_date ?? ""}
            className={inputCls}
          />
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={rfq?.status ?? "received"} className={inputCls}>
            {RFQ_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Bid bond required" className="flex items-end pb-2">
          <input
            type="checkbox"
            name="bid_bond_required"
            defaultChecked={rfq?.bid_bond_required ?? false}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Commercial terms">
          <textarea
            name="commercial_terms"
            rows={2}
            defaultValue={rfq?.commercial_terms ?? ""}
            className={inputCls}
          />
        </Field>
        <Field label="Compliance matrix notes">
          <textarea
            name="compliance_matrix_notes"
            rows={2}
            defaultValue={rfq?.compliance_matrix_notes ?? ""}
            className={inputCls}
          />
        </Field>
      </div>

      <div className="flex justify-end pt-2">
        <SubmitButton>{rfq ? "Save changes" : "Create RFQ"}</SubmitButton>
      </div>
    </form>
  );
}

/** Append-only clarification log entry form for the RFQ detail page. */
export function ClarificationForm({ rfqId }: { rfqId: string }) {
  const [state, formAction] = useActionState(appendRfqClarification, initialActionState);
  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="id" value={rfqId} />
      <FormError error={state.error} />
      <div className="flex gap-2">
        <input
          name="entry"
          required
          placeholder="Add clarification entry…"
          className={inputCls}
        />
        <SubmitButton>Log</SubmitButton>
      </div>
    </form>
  );
}
