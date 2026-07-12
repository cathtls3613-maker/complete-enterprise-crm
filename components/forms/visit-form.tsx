"use client";

import { useActionState } from "react";
import {
  createVisitReport,
  updateVisitReport,
} from "@/lib/crm/actions";
import { initialActionState } from "@/lib/crm/action-state";
import type { Account, VisitReport } from "@/lib/crm/types";
import {
  EQUIPMENT_OPTIONS,
  OPPORTUNITY_POTENTIALS,
  VISIT_PURPOSES,
} from "@/lib/crm/constants";
import { CheckboxGroup, Field, FormError, SubmitButton, inputCls } from "./fields";

export function VisitForm({
  accounts,
  visit,
  defaultAccountId,
}: {
  accounts: Pick<Account, "id" | "name">[];
  visit?: VisitReport;
  defaultAccountId?: string;
}) {
  const action = visit ? updateVisitReport : createVisitReport;
  const [state, formAction] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="space-y-4">
      {visit ? <input type="hidden" name="id" value={visit.id} /> : null}
      <FormError error={state.error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Account" required>
          <select
            name="account_id"
            required
            defaultValue={visit?.account_id ?? defaultAccountId ?? ""}
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
        <Field label="Visit date" required>
          <input
            type="date"
            name="visit_date"
            required
            defaultValue={visit?.visit_date ?? new Date().toISOString().slice(0, 10)}
            className={inputCls}
          />
        </Field>
        <Field label="Purpose" required>
          <select
            name="visit_purpose"
            required
            defaultValue={visit?.visit_purpose ?? ""}
            className={inputCls}
          >
            <option value="" disabled>
              Select purpose…
            </option>
            {VISIT_PURPOSES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
            {visit?.visit_purpose && !VISIT_PURPOSES.includes(visit.visit_purpose) ? (
              <option value={visit.visit_purpose}>{visit.visit_purpose}</option>
            ) : null}
          </select>
        </Field>
        <Field label="Process unit">
          <input
            name="process_unit"
            defaultValue={visit?.process_unit ?? ""}
            placeholder="e.g. CDU Train 2"
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Equipment discussed" required>
        <CheckboxGroup
          name="equipment_discussed"
          options={EQUIPMENT_OPTIONS}
          defaultChecked={visit?.equipment_discussed ?? []}
        />
      </Field>

      <Field label="Contacts met (comma-separated)">
        <input
          name="contacts_met"
          defaultValue={visit?.contacts_met?.join(", ") ?? ""}
          placeholder="Ir. Rashdan Mokhtar, Puan Suraya Hamid"
          className={inputCls}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Operating problem observed">
          <textarea
            name="operating_problem"
            rows={2}
            defaultValue={visit?.operating_problem ?? ""}
            className={inputCls}
          />
        </Field>
        <Field label="Customer pain point">
          <textarea
            name="customer_pain_point"
            rows={2}
            defaultValue={visit?.customer_pain_point ?? ""}
            className={inputCls}
          />
        </Field>
        <Field label="Competitor at site">
          <input
            name="competitor_at_site"
            defaultValue={visit?.competitor_at_site ?? ""}
            placeholder="e.g. Flowserve"
            className={inputCls}
          />
        </Field>
        <Field label="Opportunity potential">
          <select
            name="opportunity_potential"
            defaultValue={visit?.opportunity_potential ?? ""}
            className={inputCls}
          >
            <option value="">Not assessed</option>
            {OPPORTUNITY_POTENTIALS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Next action" required className="sm:col-span-3">
          <input
            name="next_action"
            required
            defaultValue={visit?.next_action ?? ""}
            placeholder="e.g. Submit seal upgrade proposal"
            className={inputCls}
          />
        </Field>
        <Field label="Next action owner" required>
          <input
            name="next_action_owner"
            required
            defaultValue={visit?.next_action_owner ?? ""}
            className={inputCls}
          />
        </Field>
        <Field label="Next action deadline" required>
          <input
            type="date"
            name="next_action_deadline"
            required
            defaultValue={visit?.next_action_deadline ?? ""}
            className={inputCls}
          />
        </Field>
        <Field label="Visit status" required>
          <select
            name="visit_status"
            defaultValue={visit?.visit_status ?? "planned"}
            className={inputCls}
          >
            <option value="planned">Planned</option>
            <option value="done">Done</option>
          </select>
        </Field>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <SubmitButton>{visit ? "Save changes" : "Save visit report"}</SubmitButton>
      </div>
    </form>
  );
}
