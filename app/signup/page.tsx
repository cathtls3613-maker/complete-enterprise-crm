"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Field, inputCls } from "@/components/forms/fields";

const ROLES = [
  ["sales_engineer", "Sales Engineer / BDM"],
  ["application_engineer", "Application Engineer"],
  ["sales_manager", "Sales Manager"],
  ["finance", "Finance"],
  ["director", "Director"],
] as const;

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      options: {
        data: {
          full_name: String(fd.get("full_name")),
          role: String(fd.get("role")),
        },
      },
    });
    setBusy(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    if (!data.session) {
      setNotice(
        "Account created — check your email for the confirmation link, then sign in.",
      );
      return;
    }
    router.push("/?toast=Account%20created");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900">
        Create account
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        Role controls what you can change after lock-down (demo lets you pick freely).
      </p>
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {error ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {notice}
          </p>
        ) : null}
        <Field label="Full name" required>
          <input name="full_name" required className={inputCls} />
        </Field>
        <Field label="Email" required>
          <input type="email" name="email" required autoComplete="email" className={inputCls} />
        </Field>
        <Field label="Password (min 6 chars)" required>
          <input
            type="password"
            name="password"
            required
            minLength={6}
            autoComplete="new-password"
            className={inputCls}
          />
        </Field>
        <Field label="Role" required>
          <select name="role" defaultValue="sales_engineer" className={inputCls}>
            {ROLES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
        >
          {busy ? "Creating…" : "Create account"}
        </button>
        <p className="text-center text-sm text-slate-500">
          Already registered?{" "}
          <Link href="/login" className="font-medium text-indigo-600 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
