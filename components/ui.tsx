import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500"
    >
      {children}
    </Link>
  );
}

export function SecondaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
    >
      {children}
    </Link>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

const BADGE_COLORS: Record<string, string> = {
  // visit status
  planned: "bg-amber-50 text-amber-700 ring-amber-600/20",
  done: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  // generic statuses
  open: "bg-sky-50 text-sky-700 ring-sky-600/20",
  quoted: "bg-violet-50 text-violet-700 ring-violet-600/20",
  received: "bg-sky-50 text-sky-700 ring-sky-600/20",
  clarification: "bg-amber-50 text-amber-700 ring-amber-600/20",
  closed: "bg-slate-100 text-slate-600 ring-slate-500/20",
  cancelled: "bg-slate-100 text-slate-600 ring-slate-500/20",
  draft: "bg-slate-100 text-slate-600 ring-slate-500/20",
  submitted: "bg-sky-50 text-sky-700 ring-sky-600/20",
  won: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  lost: "bg-rose-50 text-rose-700 ring-rose-600/20",
  // funnel highlights
  Awarded: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Lost: "bg-rose-50 text-rose-700 ring-rose-600/20",
  "On Hold": "bg-amber-50 text-amber-700 ring-amber-600/20",
  Converted: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  High: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Medium: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Low: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export function Badge({ value, label }: { value: string; label?: string }) {
  const color = BADGE_COLORS[value] ?? "bg-indigo-50 text-indigo-700 ring-indigo-600/20";
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${color}`}
    >
      {label ?? value}
    </span>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-14 text-center">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {hint ? <p className="max-w-sm text-sm text-slate-500">{hint}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function DbSetupBanner() {
  return (
    <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <p className="font-semibold">Database not initialized</p>
      <p className="mt-1">
        The schema in <code className="rounded bg-amber-100 px-1">supabase/migrations/0001_init.sql</code>{" "}
        has not been applied to this Supabase project yet. Paste it into the Supabase SQL editor
        (Dashboard → SQL Editor → Run) and reload — the app will light up with seed data.
      </p>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-6 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800">
      <p className="font-semibold">Could not load data</p>
      <p className="mt-1">{message}</p>
    </div>
  );
}

export function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <Card className="px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </Card>
  );
}

export const thCls =
  "px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500";
export const tdCls = "px-4 py-3 text-sm text-slate-700";

export function TableShell({ children }: { children: ReactNode }) {
  return (
    <Card className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">{children}</table>
    </Card>
  );
}
