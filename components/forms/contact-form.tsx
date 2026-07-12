"use client";

import { useActionState } from "react";
import { createContact, updateContact } from "@/lib/crm/actions";
import { initialActionState } from "@/lib/crm/action-state";
import type { Account, Contact } from "@/lib/crm/types";
import { INFLUENCE_LEVELS, ROLES_IN_PURCHASE } from "@/lib/crm/constants";
import { Field, FormError, SubmitButton, inputCls } from "./fields";

export function ContactForm({
  accounts,
  contact,
  defaultAccountId,
}: {
  accounts: Pick<Account, "id" | "name">[];
  contact?: Contact;
  defaultAccountId?: string;
}) {
  const action = contact ? updateContact : createContact;
  const [state, formAction] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="space-y-4">
      {contact ? <input type="hidden" name="id" value={contact.id} /> : null}
      <FormError error={state.error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required>
          <input name="full_name" required defaultValue={contact?.full_name ?? ""} className={inputCls} />
        </Field>
        <Field label="Account" required>
          <select
            name="account_id"
            required
            defaultValue={contact?.account_id ?? defaultAccountId ?? ""}
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
        <Field label="Title">
          <input name="title" defaultValue={contact?.title ?? ""} className={inputCls} />
        </Field>
        <Field label="Department">
          <input name="department" defaultValue={contact?.department ?? ""} className={inputCls} />
        </Field>
        <Field label="Email">
          <input type="email" name="email" defaultValue={contact?.email ?? ""} className={inputCls} />
        </Field>
        <Field label="Phone">
          <input name="phone" defaultValue={contact?.phone ?? ""} className={inputCls} />
        </Field>
        <Field label="Role in purchase">
          <select
            name="role_in_purchase"
            defaultValue={contact?.role_in_purchase ?? ""}
            className={inputCls}
          >
            <option value="">Select…</option>
            {ROLES_IN_PURCHASE.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Influence level">
          <select
            name="influence_level"
            defaultValue={contact?.influence_level ?? ""}
            className={inputCls}
          >
            <option value="">Select…</option>
            {INFLUENCE_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex justify-end pt-2">
        <SubmitButton>{contact ? "Save changes" : "Create contact"}</SubmitButton>
      </div>
    </form>
  );
}
