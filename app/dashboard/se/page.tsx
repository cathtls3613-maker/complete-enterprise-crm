import { listQuery } from "@/lib/crm/data";
import type { Opportunity, Quotation, Rfq, VisitReport } from "@/lib/crm/types";
import { formatUsd } from "@/lib/crm/format";
import { PRODUCT_LINES } from "@/lib/crm/constants";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import {
  Card,
  DbSetupBanner,
  ErrorBanner,
  KpiCard,
  PageHeader,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SeDashboardPage() {
  const [visits, rfqs, quotations, opportunities] = await Promise.all([
    listQuery<VisitReport>((s) => s.from("visit_reports").select("*")),
    listQuery<Rfq>((s) => s.from("rfqs").select("*")),
    listQuery<Quotation>((s) => s.from("quotations").select("*")),
    listQuery<Opportunity>((s) => s.from("opportunities").select("*")),
  ]);

  const dbMissing =
    visits.dbMissing || rfqs.dbMissing || quotations.dbMissing || opportunities.dbMissing;
  const errorMessage =
    visits.errorMessage ?? rfqs.errorMessage ?? quotations.errorMessage ?? opportunities.errorMessage;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const inThisMonth = (d: string | null) => {
    if (!d) return false;
    const date = new Date(d);
    return date >= monthStart && date <= now;
  };

  const monthVisits = visits.rows.filter(
    (v) => inThisMonth(v.visit_date) || (v.visit_status === "planned" && v.visit_date >= monthStart.toISOString().slice(0, 10)),
  );
  const visitsDone = monthVisits.filter((v) => v.visit_status === "done").length;
  const visitsPlanned = monthVisits.filter((v) => v.visit_status === "planned").length;

  const openRfqs = rfqs.rows.filter((r) => !["closed", "quoted"].includes(r.status)).length;

  const openQuotes = quotations.rows.filter((q) => q.status === "submitted");
  const openQuoteValue = openQuotes.reduce((sum, q) => sum + (q.selling_price_usd ?? 0), 0);

  const won = quotations.rows.filter((q) => q.status === "won").length;
  const lost = quotations.rows.filter((q) => q.status === "lost").length;
  const hitRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : null;

  // Product-line mix over open opportunity value.
  const openOpps = opportunities.rows.filter((o) => !["Awarded", "Lost"].includes(o.stage));
  const mix = PRODUCT_LINES.map((line) => ({
    line,
    value: openOpps
      .filter((o) => o.product_line === line)
      .reduce((sum, o) => sum + (o.value_usd ?? 0), 0),
  }));
  const other = openOpps
    .filter((o) => !o.product_line || !PRODUCT_LINES.includes(o.product_line))
    .reduce((sum, o) => sum + (o.value_usd ?? 0), 0);
  if (other > 0) mix.push({ line: "Other", value: other });
  const maxMix = Math.max(...mix.map((m) => m.value), 1);

  return (
    <div>
      <PageHeader
        title="Sales engineer dashboard"
        subtitle="Personal activity and funnel KPIs, live from the database."
      />
      {dbMissing ? <DbSetupBanner /> : null}
      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Visits — this month"
          value={
            monthVisits.length === 0 ? "—" : `${visitsDone} done / ${visitsPlanned} planned`
          }
          hint={monthVisits.length === 0 ? "No visits logged this month" : "Planned vs done"}
        />
        <KpiCard
          label="Open RFQs"
          value={openRfqs}
          hint={openRfqs === 0 ? "Nothing awaiting quotation" : "Awaiting quotation"}
        />
        <KpiCard
          label="Open quotation value"
          value={openQuotes.length === 0 ? "—" : formatUsd(openQuoteValue)}
          hint={
            openQuotes.length === 0
              ? "No submitted quotations outstanding"
              : `${openQuotes.length} submitted, awaiting result`
          }
        />
        <KpiCard
          label="Hit rate"
          value={hitRate == null ? "—" : `${hitRate}%`}
          hint={
            hitRate == null ? "No decided quotations yet" : `${won} won / ${lost} lost`
          }
        />
      </div>

      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Product-line mix — open pipeline value
        </h2>
        {openOpps.length === 0 ? (
          <p className="text-sm text-slate-500">
            No open opportunities — the mix appears once the funnel has value in it.
          </p>
        ) : (
          <div className="space-y-3">
            {mix.map(({ line, value }) => (
              <div key={line} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-sm text-slate-600">{line}</span>
                <div className="h-5 flex-1 overflow-hidden rounded bg-slate-100">
                  <div
                    className="h-full rounded bg-indigo-500"
                    style={{ width: `${Math.max((value / maxMix) * 100, value > 0 ? 2 : 0)}%` }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right text-sm tabular-nums text-slate-700">
                  {formatUsd(value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
      <RealtimeRefresher tables={["visit_reports", "rfqs", "quotations", "opportunities"]} />
    </div>
  );
}
