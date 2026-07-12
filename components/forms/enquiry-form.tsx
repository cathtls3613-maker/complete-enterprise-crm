"use client";

import { useActionState } from "react";
import { createEnquiry, updateEnquiry } from "@/lib/crm/actions";
import { initialActionState } from "@/lib/crm/action-state";
import type { Account, Enquiry } from "@/lib/crm/types";
import { ENQUIRY_STATUSES, EQUIPMENT_OPTIONS } from "@/lib/crm/constants";
import { Field, FormError, SubmitButton, inputCls } from "./fields";

export function EnquiryForm({
  accounts,
  enquiry,
  defaultAccountId,
}: {
  accounts: Pick<Account, "id" | "name">[];
  enquiry?: Enquiry;
  defaultAccountId?: string;
}) {
  const action = enquiry ? updateEnquiry : createEnquiry;
  const [state, formAction] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="space-y-4">
      {enquiry ? <input type="hidden" name="id" value={enquiry.id} /> : null}
      <FormError error={state.error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Account" required>
          <select
            name="account_id"
            required
            defaultValue={enquiry?.account_id ?? defaultAccountId ?? ""}
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
        <Field label="Project name">
          <input name="project_name" defaultValue={enquiry?.project_name ?? ""} className={inputCls} />
        </Field>
        <Field label="Equipment type" required>
          <select
            name="equipment_type"
            required
            defaultValue={enquiry?.equipment_type ?? ""}
            className={inputCls}
          >
            <option value="" disabled>
              Select…
            </option>
            {EQUIPMENT_OPTIONS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
            <option value="Service">Service</option>
            {enquiry?.equipment_type &&
            ![...EQUIPMENT_OPTIONS, "Service"].includes(enquiry.equipment_type) ? (
              <option value={enquiry.equipment_type}>{enquiry.equipment_type}</option>
            ) : null}
          </select>
        </Field>
        <Field label="Competitor">
          <input name="competitor" defaultValue={enquiry?.competitor ?? ""} className={inputCls} />
        </Field>
      </div>

      <Field label="Process data">
        <textarea
          name="process_data"
          rows={2}
          defaultValue={enquiry?.process_data ?? ""}
          placeholder="Service conditions, temperature, pressure, standards…"
          className={inputCls}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Delivery (weeks)">
          <input
            type="number"
            min={0}
            name="required_delivery_weeks"
            defaultValue={enquiry?.required_delivery_weeks ?? ""}
            className={inputCls}
          />
        </Field>
        <Field label="Bid due date">
          <input
            type="date"
            name="bid_due_date"
            defaultValue={enquiry?.bid_due_date ?? ""}
            className={inputCls}
          />
        </Field>
        <Field label="Probability (%)">
          <input
            type="number"
            min={0}
            max={100}
            name="probability"
            defaultValue={enquiry?.probability ?? 20}
            className={inputCls}
          />
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={enquiry?.status ?? "open"} className={inputCls}>
            {ENQUIRY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex justify-end pt-2">
        <SubmitButton>{enquiry ? "Save changes" : "Create enquiry"}</SubmitButton>
      </div>
    </form>
  );
}
