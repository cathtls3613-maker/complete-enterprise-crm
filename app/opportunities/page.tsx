import Link from "next/link";
import { listQuery } from "@/lib/crm/data";
import type { Opportunity } from "@/lib/crm/types";
import { formatUsd } from "@/lib/crm/format";
import { INDUSTRIES, OPPORTUNITY_STAGES, PRODUCT_LINES } from "@/lib/crm/constants";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import {
  DbSetupBanner,
  EmptyState,
  ErrorBanner,
  PageHeader,
  PrimaryLink,
} from "@/components/ui";

export const dynamic = "force-dynamic";

const selectCls =
  "rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 shadow-sm";

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; industry?: string; product_line?: string }>;
}) {
  const { stage, industry, product_line } = await searchParams;

  const { rows, dbMissing, errorMessage } = await listQuery<Opportunity>((s) => {
    let q = s
      .from("opportunities")
      .select("*, accounts(id, name)")
      .order("created_at", { ascending: false });
    if (stage) q = q.eq("stage", stage);
    if (industry) q = q.eq("industry", industry);
    if (product_line) q = q.eq("product_line", product_line);
    return q;
  });

  const visibleStages = stage
    ? OPPORTUNITY_STAGES.filter((s) => s === stage)
    : OPPORTUNITY_STAGES;
  const byStage = new Map<string, Opportunity[]>(visibleStages.map((s) => [s, []]));
  for (const o of rows) {
    (byStage.get(o.stage) ?? byStage.set(o.stage, []).get(o.stage)!).push(o);
  }
  const totalValue = rows.reduce((sum, o) => sum + (o.value_usd ?? 0), 0);
  const filtered = Boolean(stage || industry || product_line);

  return (
    <div>
      <PageHeader
        title="Opportunity funnel"
        subtitle={`${rows.length} opportunit${rows.length === 1 ? "y" : "ies"} · ${formatUsd(totalValue)} total value across 14 stages`}
        action={<PrimaryLink href="/opportunities/new">+ New Opportunity</PrimaryLink>}
      />
      {dbMissing ? <DbSetupBanner /> : null}
      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

      <form method="get" className="mb-5 flex flex-wrap items-center gap-2">
        <select name="stage" defaultValue={stage ?? ""} className={selectCls}>
          <option value="">All stages</option>
          {OPPORTUNITY_STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select name="industry" defaultValue={industry ?? ""} className={selectCls}>
          <option value="">All industries</option>
          {INDUSTRIES.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
        <select name="product_line" defaultValue={product_line ?? ""} className={selectCls}>
          <option value="">All product lines</option>
          {PRODUCT_LINES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          Filter
        </button>
        {filtered ? (
          <Link href="/opportunities" className="text-sm font-medium text-indigo-600 hover:underline">
            Clear
          </Link>
        ) : null}
      </form>

      {rows.length === 0 && !dbMissing ? (
        <EmptyState
          title={filtered ? "Nothing matches these filters" : "No opportunities yet"}
          hint={
            filtered
              ? "Try clearing a filter."
              : "Opportunities appear here when you convert an enquiry or create one directly."
          }
          action={<PrimaryLink href="/opportunities/new">+ New Opportunity</PrimaryLink>}
        />
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {visibleStages.map((stageName) => {
            const cards = byStage.get(stageName) ?? [];
            const stageValue = cards.reduce((sum, o) => sum + (o.value_usd ?? 0), 0);
            return (
              <div
                key={stageName}
                className="flex w-64 shrink-0 flex-col rounded-xl border border-slate-200 bg-slate-100/70"
              >
                <div className="border-b border-slate-200 px-3 py-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    {stageName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {cards.length} · {formatUsd(stageValue)}
                  </p>
                </div>
                <div className="flex flex-col gap-2 p-2">
                  {cards.length === 0 ? (
                    <p className="px-1 py-3 text-center text-xs text-slate-400">—</p>
                  ) : (
                    cards.map((o) => (
                      <Link
                        key={o.id}
                        href={`/opportunities/${o.id}`}
                        className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-indigo-300 hover:shadow"
                      >
                        <p className="text-sm font-medium leading-snug text-slate-900">{o.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{o.accounts?.name ?? "—"}</p>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="font-semibold tabular-nums text-slate-700">
                            {formatUsd(o.value_usd)}
                          </span>
                          <span className="text-slate-400">{o.probability}%</span>
                        </div>
                        {o.ai_score != null ? (
                          <div className="mt-2 flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                o.ai_score >= 60
                                  ? "bg-emerald-100 text-emerald-700"
                                  : o.ai_score >= 30
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              Score {o.ai_score}
                            </span>
                            {o.ai_score_review_status === "unreviewed" ? (
                              <span className="text-[10px] text-slate-400">unreviewed</span>
                            ) : null}
                          </div>
                        ) : null}
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <RealtimeRefresher tables={["opportunities"]} />
    </div>
  );
}
