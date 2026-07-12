"use client";

import { useActionState } from "react";
import {
  createOpportunity,
  updateOpportunity,
  overrideOpportunityScore,
} from "@/lib/crm/actions";
import { initialActionState } from "@/lib/crm/action-state";
import type { Account, Enquiry, Opportunity } from "@/lib/crm/types";
import { INDUSTRIES, OPPORTUNITY_STAGES, PRODUCT_LINES } from "@/lib/crm/constants";
import { Field, FormError, SubmitButton, inputCls } from "./fields";

export function OpportunityForm({
  accounts,
  enquiries,
  opportunity,
  defaultAccountId,
  defaultEnquiryId,
}: {
  accounts: Pick<Account, "id" | "name">[];
  enquiries: Pick<Enquiry, "id" | "enquiry_number" | "project_name">[];
  opportunity?: Opportunity;
  defaultAccountId?: string;
  defaultEnquiryId?: string;
}) {
  const action = opportunity ? updateOpportunity : createOpportunity;
  const [state, formAction] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="space-y-4">
      {opportunity ? <input type="hidden" name="id" value={opportunity.id} /> : null}
      <FormError error={state.error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" required className="sm:col-span-2">
          <input name="title" required defaultValue={opportunity?.title ?? ""} className={inputCls} />
        </Field>
        <Field label="Account" required>
          <select
            name="account_id"
            required
            defaultValue={opportunity?.account_id ?? defaultAccountId ?? ""}
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
            defaultValue={opportunity?.enquiry_id ?? defaultEnquiryId ?? ""}
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
        <Field label="Stage" required>
          <select
            name="stage"
            required
            defaultValue={opportunity?.stage ?? "Target Account"}
            className={inputCls}
          >
            {OPPORTUNITY_STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Product line">
          <select
            name="product_line"
            defaultValue={opportunity?.product_line ?? ""}
            className={inputCls}
          >
            <option value="">Select…</option>
            {PRODUCT_LINES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Industry">
          <select name="industry" defaultValue={opportunity?.industry ?? ""} className={inputCls}>
            <option value="">Select…</option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Value (USD)">
          <input
            type="number"
            min={0}
            name="value_usd"
            defaultValue={opportunity?.value_usd ?? ""}
            className={inputCls}
          />
        </Field>
        <Field label="Probability (%)">
          <input
            type="number"
            min={0}
            max={100}
            name="probability"
            defaultValue={opportunity?.probability ?? 10}
            className={inputCls}
          />
        </Field>
        <Field label="Expected close date">
          <input
            type="date"
            name="expected_close_date"
            defaultValue={opportunity?.expected_close_date ?? ""}
            className={inputCls}
          />
        </Field>
        <Field label="Competitor">
          <input
            name="competitor"
            defaultValue={opportunity?.competitor ?? ""}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Notes">
        <textarea
          name="notes"
          rows={2}
          defaultValue={opportunity?.notes ?? ""}
          placeholder="Required when closing as Awarded or Lost"
          className={inputCls}
        />
      </Field>

      <p className="text-xs text-slate-500">
        Stage rules: from “RFQ Issued” onward a value and expected close date are required; from
        “Quotation Submitted” onward the competitor too; “Awarded”/“Lost” need a closing note.
      </p>

      <div className="flex justify-end pt-2">
        <SubmitButton>{opportunity ? "Save changes" : "Create opportunity"}</SubmitButton>
      </div>
    </form>
  );
}

/** Human override for the rule-engine score (writes review_status = human_reviewed). */
export function ScoreOverrideForm({ opportunity }: { opportunity: Opportunity }) {
  const [state, formAction] = useActionState(overrideOpportunityScore, initialActionState);
  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="id" value={opportunity.id} />
      <FormError error={state.error} />
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          max={100}
          name="ai_score"
          defaultValue={opportunity.ai_score ?? 50}
          className={`${inputCls} w-24`}
        />
        <SubmitButton>Override score</SubmitButton>
      </div>
    </form>
  );
}
