"use client";

import { useActionState } from "react";
import { createQuotation, updateQuotation } from "@/lib/crm/actions";
import { initialActionState } from "@/lib/crm/action-state";
import type { Account, Quotation, Rfq } from "@/lib/crm/types";
import { QUOTATION_STATUSES } from "@/lib/crm/constants";
import { Field, FormError, SubmitButton, inputCls } from "./fields";

export function QuotationForm({
  accounts,
  rfqs,
  quotation,
  prefillRfq,
}: {
  accounts: Pick<Account, "id" | "name">[];
  rfqs: Pick<Rfq, "id" | "rfq_number" | "account_id" | "technical_requirement" | "scope">[];
  quotation?: Quotation;
  prefillRfq?: Pick<Rfq, "id" | "rfq_number" | "account_id" | "technical_requirement" | "scope"> | null;
}) {
  const action = quotation ? updateQuotation : createQuotation;
  const [state, formAction] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="space-y-4">
      {quotation ? <input type="hidden" name="id" value={quotation.id} /> : null}
      <FormError error={state.error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Account" required>
          <select
            name="account_id"
            required
            defaultValue={quotation?.account_id ?? prefillRfq?.account_id ?? ""}
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
        <Field label="Linked RFQ">
          <select
            name="rfq_id"
            defaultValue={quotation?.rfq_id ?? prefillRfq?.id ?? ""}
            className={inputCls}
          >
            <option value="">None</option>
            {rfqs.map((r) => (
              <option key={r.id} value={r.id}>
                {r.rfq_number}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Equipment selection">
        <textarea
          name="equipment_selection"
          rows={2}
          defaultValue={quotation?.equipment_selection ?? prefillRfq?.technical_requirement ?? ""}
          className={inputCls}
        />
      </Field>
      <Field label="BOM summary">
        <textarea
          name="bom_summary"
          rows={2}
          defaultValue={quotation?.bom_summary ?? prefillRfq?.scope ?? ""}
          className={inputCls}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Cost (USD)">
          <input
            type="number"
            min={0}
            step="0.01"
            name="cost_usd"
            defaultValue={quotation?.cost_usd ?? ""}
            className={inputCls}
          />
        </Field>
        <Field label="Selling price (USD)" required>
          <input
            type="number"
            min={0}
            step="0.01"
            name="selling_price_usd"
            required
            defaultValue={quotation?.selling_price_usd ?? ""}
            className={inputCls}
          />
        </Field>
        <Field label="Margin % (auto from cost/price)">
          <input
            type="number"
            step="0.1"
            name="margin_pct"
            defaultValue={quotation?.margin_pct ?? ""}
            className={inputCls}
          />
        </Field>
        <Field label="Delivery (weeks)">
          <input
            type="number"
            min={0}
            name="delivery_weeks"
            defaultValue={quotation?.delivery_weeks ?? ""}
            className={inputCls}
          />
        </Field>
        <Field label="Warranty (months)">
          <input
            type="number"
            min={0}
            name="warranty_months"
            defaultValue={quotation?.warranty_months ?? 12}
            className={inputCls}
          />
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={quotation?.status ?? "draft"} className={inputCls}>
            {QUOTATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Payment terms">
          <input
            name="payment_terms"
            defaultValue={quotation?.payment_terms ?? ""}
            placeholder="e.g. 30% advance, 70% on delivery"
            className={inputCls}
          />
        </Field>
        <Field label="Commercial deviation">
          <input
            name="commercial_deviation"
            defaultValue={quotation?.commercial_deviation ?? ""}
            className={inputCls}
          />
        </Field>
      </div>

      <p className="text-xs text-slate-500">
        Setting status to “submitted” stamps today as the submitted date; “won”/“lost” records the
        result.
      </p>

      <div className="flex justify-end pt-2">
        <SubmitButton>{quotation ? "Save changes" : "Create quotation"}</SubmitButton>
      </div>
    </form>
  );
}
