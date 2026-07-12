"use client";

import { useActionState } from "react";
import { createAccount, updateAccount } from "@/lib/crm/actions";
import { initialActionState } from "@/lib/crm/action-state";
import type { Account } from "@/lib/crm/types";
import { ACCOUNT_TYPES, INDUSTRIES } from "@/lib/crm/constants";
import { Field, FormError, SubmitButton, inputCls } from "./fields";

export function AccountForm({ account }: { account?: Account }) {
  const action = account ? updateAccount : createAccount;
  const [state, formAction] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="space-y-4">
      {account ? <input type="hidden" name="id" value={account.id} /> : null}
      <FormError error={state.error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Account name" required>
          <input name="name" required defaultValue={account?.name ?? ""} className={inputCls} />
        </Field>
        <Field label="Industry" required>
          <select name="industry" required defaultValue={account?.industry ?? ""} className={inputCls}>
            <option value="" disabled>
              Select…
            </option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
            {account?.industry && !INDUSTRIES.includes(account.industry) ? (
              <option value={account.industry}>{account.industry}</option>
            ) : null}
          </select>
        </Field>
        <Field label="Segment">
          <input
            name="segment"
            defaultValue={account?.segment ?? ""}
            placeholder="e.g. Downstream"
            className={inputCls}
          />
        </Field>
        <Field label="Account type">
          <select name="account_type" defaultValue={account?.account_type ?? ""} className={inputCls}>
            <option value="">Select…</option>
            {ACCOUNT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Country">
          <input name="country" defaultValue={account?.country ?? ""} className={inputCls} />
        </Field>
        <Field label="City">
          <input name="city" defaultValue={account?.city ?? ""} className={inputCls} />
        </Field>
        <Field label="Owner (sales engineer)">
          <input name="owner_name" defaultValue={account?.owner_name ?? ""} className={inputCls} />
        </Field>
        <Field label="Key plants (comma-separated)">
          <input
            name="key_plants"
            defaultValue={account?.key_plants?.join(", ") ?? ""}
            className={inputCls}
          />
        </Field>
        <Field label="EPC / consultants (comma-separated)" className="sm:col-span-2">
          <input
            name="epc_consultants"
            defaultValue={account?.epc_consultants?.join(", ") ?? ""}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Installed base notes">
        <textarea
          name="installed_base_notes"
          rows={2}
          defaultValue={account?.installed_base_notes ?? ""}
          className={inputCls}
        />
      </Field>

      <fieldset>
        <legend className="mb-2 text-xs font-medium text-slate-600">
          Annual targets (USD)
        </legend>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {(
            [
              ["target_pumps", "Pumps"],
              ["target_seals", "Seals"],
              ["target_hex", "Heat Exch."],
              ["target_service", "Service"],
              ["target_spares", "Spares"],
            ] as const
          ).map(([name, label]) => (
            <Field key={name} label={label}>
              <input
                type="number"
                min={0}
                name={name}
                defaultValue={account?.[name] ?? 0}
                className={inputCls}
              />
            </Field>
          ))}
        </div>
      </fieldset>

      <div className="flex justify-end pt-2">
        <SubmitButton>{account ? "Save changes" : "Create account"}</SubmitButton>
      </div>
    </form>
  );
}
