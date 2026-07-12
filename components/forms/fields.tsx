"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

export const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export function Field({
  label,
  required,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-slate-600">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

export function CheckboxGroup({
  name,
  options,
  defaultChecked = [],
}: {
  name: string;
  options: string[];
  defaultChecked?: string[];
}) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5">
      {options.map((option) => (
        <label key={option} className="flex items-center gap-1.5 text-sm text-slate-700">
          <input
            type="checkbox"
            name={name}
            value={option}
            defaultChecked={defaultChecked.includes(option)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          {option}
        </label>
      ))}
    </div>
  );
}

export function SubmitButton({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
    >
      {pending ? "Saving…" : children}
    </button>
  );
}

export function FormError({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
      {error}
    </div>
  );
}
