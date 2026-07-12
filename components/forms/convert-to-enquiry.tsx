"use client";

import { useActionState, useState } from "react";
import { convertVisitToEnquiry } from "@/lib/crm/actions";
import { initialActionState } from "@/lib/crm/action-state";
import type { VisitReport } from "@/lib/crm/types";
import { EQUIPMENT_OPTIONS } from "@/lib/crm/constants";
import { Field, FormError, SubmitButton, inputCls } from "./fields";

/**
 * The core verb of the app: opens a modal pre-filled from the visit report;
 * confirming inserts the enquiry, flips the visit's converted flag, and
 * creates the linked opportunity.
 */
export function ConvertToEnquiry({
  visit,
  accountName,
}: {
  visit: VisitReport;
  accountName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(convertVisitToEnquiry, initialActionState);

  if (visit.converted_to_enquiry) {
    return (
      <button
        type="button"
        disabled
        title="This visit has already been converted to an enquiry"
        className="cursor-not-allowed rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-500"
      >
        ✓ Converted to enquiry
      </button>
    );
  }

  const prefillProcessData = [visit.operating_problem, visit.customer_pain_point]
    .filter(Boolean)
    .join(" — ");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-500"
      >
        Convert to Enquiry →
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:items-center">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Convert visit to enquiry</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Pre-filled from the visit at {accountName}. Review, adjust, confirm.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form action={formAction} className="space-y-4">
              <input type="hidden" name="visit_report_id" value={visit.id} />
              <FormError error={state.error} />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Account">
                  <input value={accountName} disabled className={`${inputCls} bg-slate-50`} />
                </Field>
                <Field label="Project name" required>
                  <input
                    name="project_name"
                    required
                    defaultValue={
                      visit.opportunity_potential
                        ? `${accountName.split(" ")[0]} — ${visit.process_unit ?? visit.visit_purpose}`
                        : visit.visit_purpose
                    }
                    className={inputCls}
                  />
                </Field>
                <Field label="Equipment type" required>
                  <select
                    name="equipment_type"
                    required
                    defaultValue={visit.equipment_discussed?.[0] ?? ""}
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
                  </select>
                </Field>
                <Field label="Competitor">
                  <input
                    name="competitor"
                    defaultValue={visit.competitor_at_site ?? ""}
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="Process data">
                <textarea
                  name="process_data"
                  rows={2}
                  defaultValue={prefillProcessData}
                  className={inputCls}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Required delivery (weeks)">
                  <input type="number" min={0} name="required_delivery_weeks" className={inputCls} />
                </Field>
                <Field label="Bid due date">
                  <input type="date" name="bid_due_date" className={inputCls} />
                </Field>
                <Field label="Probability (%)">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    name="probability"
                    defaultValue={visit.opportunity_potential === "Firm" ? 50 : 20}
                    className={inputCls}
                  />
                </Field>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <SubmitButton>Confirm — create enquiry</SubmitButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
