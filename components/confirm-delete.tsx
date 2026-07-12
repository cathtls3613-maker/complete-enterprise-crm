"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

function DeleteSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-rose-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-rose-500 disabled:opacity-60"
    >
      {pending ? "Deleting…" : "Yes, delete"}
    </button>
  );
}

/**
 * Delete button with an inline confirmation dialog. Wraps a server action so
 * nothing is deleted until the user explicitly confirms.
 */
export function ConfirmDelete({
  action,
  id,
  label,
  what,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  label?: string;
  what: string;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-rose-200 bg-white px-3.5 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
      >
        {label ?? "Delete"}
      </button>
      {confirming ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <p className="text-sm font-semibold text-slate-900">Delete {what}?</p>
            <p className="mt-1 text-sm text-slate-500">
              This permanently removes it from the database.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <form action={action}>
                <input type="hidden" name="id" value={id} />
                <DeleteSubmit />
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
