import { listQuery } from "@/lib/crm/data";
import type { Enquiry, Opportunity, Quotation, Rfq } from "@/lib/crm/types";
import { formatUsd } from "@/lib/crm/format";
import { INDUSTRIES, PRODUCT_LINES } from "@/lib/crm/constants";
import { guessProductLine } from "@/lib/crm/product-line";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import {
  Card,
  DbSetupBanner,
  ErrorBanner,
  KpiCard,
  PageHeader,
} from "@/components/ui";

export const dynamic = "force-dynamic";

const SERVICE_LINES = ["Service", "Spares"];

function Bars({
  rows,
  color,
}: {
  rows: Array<{ label: string; value: number; display?: string }>;
  color: string;
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="space-y-3">
      {rows.map(({ label, value, display }) => (
        <div key={label} className="flex items-center gap-3">
          <span className="w-36 shrink-0 truncate text-sm text-slate-600">{label}</span>
          <div className="h-5 flex-1 overflow-hidden rounded bg-slate-100">
            <div
              className={`h-full rounded ${color}`}
              style={{ width: `${Math.max((value / max) * 100, value > 0 ? 2 : 0)}%` }}
            />
          </div>
          <span className="w-24 shrink-0 text-right text-sm tabular-nums text-slate-700">
            {display ?? formatUsd(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default async function DirectorDashboardPage() {
  const [opportunities, quotations, rfqs, enquiries] = await Promise.all([
    listQuery<Opportunity>((s) => s.from("opportunities").select("*")),
    listQuery<Quotation>((s) => s.from("quotations").select("*")),
    listQuery<Rfq>((s) => s.from("rfqs").select("id, enquiry_id")),
    listQuery<Enquiry>((s) => s.from("enquiries").select("id, equipment_type")),
  ]);

  const dbMissing =
    opportunities.dbMissing || quotations.dbMissing || rfqs.dbMissing || enquiries.dbMissing;
  const errorMessage =
    opportunities.errorMessage ?? quotations.errorMessage ?? rfqs.errorMessage ?? enquiries.errorMessage;

  const openOpps = opportunities.rows.filter((o) => !["Awarded", "Lost"].includes(o.stage));
  const wonValue = opportunities.rows
    .filter((o) => o.stage === "Awarded")
    .reduce((s, o) => s + (o.value_usd ?? 0), 0);

  // Funnel value by industry (open opportunities).
  const byIndustry = INDUSTRIES.map((industry) => ({
    label: industry,
    value: openOpps
      .filter((o) => o.industry === industry)
      .reduce((s, o) => s + (o.value_usd ?? 0), 0),
  }));
  const unclassified = openOpps
    .filter((o) => !o.industry || !INDUSTRIES.includes(o.industry))
    .reduce((s, o) => s + (o.value_usd ?? 0), 0);
  if (unclassified > 0) byIndustry.push({ label: "Unclassified", value: unclassified });

  // Margin by product line: quotation → rfq → enquiry equipment type → product line.
  const enquiryLine = new Map(
    enquiries.rows.map((e) => [e.id, guessProductLine(e.equipment_type)]),
  );
  const rfqLine = new Map(
    rfqs.rows.map((r) => [r.id, r.enquiry_id ? enquiryLine.get(r.enquiry_id) ?? null : null]),
  );
  const marginBuckets = new Map<string, number[]>();
  for (const q of quotations.rows) {
    if (q.margin_pct == null) continue;
    const line = (q.rfq_id ? rfqLine.get(q.rfq_id) : null) ?? "Unlinked";
    const bucket = marginBuckets.get(line) ?? [];
    bucket.push(q.margin_pct);
    marginBuckets.set(line, bucket);
  }
  const marginRows = [...marginBuckets.entries()].map(([label, margins]) => {
    const avg = margins.reduce((s, m) => s + m, 0) / margins.length;
    return {
      label,
      value: Math.max(avg, 0),
      display: `${Math.round(avg * 10) / 10}% (${margins.length})`,
    };
  });

  // Service vs capital split of open pipeline.
  const serviceValue = openOpps
    .filter((o) => o.product_line && SERVICE_LINES.includes(o.product_line))
    .reduce((s, o) => s + (o.value_usd ?? 0), 0);
  const capitalValue = openOpps
    .filter((o) => o.product_line && !SERVICE_LINES.includes(o.product_line))
    .reduce((s, o) => s + (o.value_usd ?? 0), 0);
  const splitTotal = serviceValue + capitalValue;

  // Pipeline by product line.
  const byLine = PRODUCT_LINES.map((line) => ({
    label: line,
    value: openOpps
      .filter((o) => o.product_line === line)
      .reduce((s, o) => s + (o.value_usd ?? 0), 0),
  }));

  const decided = quotations.rows.filter((q) => ["won", "lost"].includes(q.status));
  const won = decided.filter((q) => q.status === "won").length;

  return (
    <div>
      <PageHeader
        title="Director dashboard"
        subtitle="Read-only portfolio view — funnel value, margin quality, service vs capital mix."
      />
      {dbMissing ? <DbSetupBanner /> : null}
      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Open pipeline"
          value={formatUsd(openOpps.reduce((s, o) => s + (o.value_usd ?? 0), 0))}
          hint={`${openOpps.length} opportunities`}
        />
        <KpiCard label="Won (awarded)" value={formatUsd(wonValue)} hint="All time" />
        <KpiCard
          label="Quotation win rate"
          value={decided.length > 0 ? `${Math.round((won / decided.length) * 100)}%` : "—"}
          hint={decided.length > 0 ? `${won} of ${decided.length} decided` : "No decided quotations yet"}
        />
        <KpiCard
          label="Service share of pipeline"
          value={splitTotal > 0 ? `${Math.round((serviceValue / splitTotal) * 100)}%` : "—"}
          hint={
            splitTotal > 0
              ? `${formatUsd(serviceValue)} service vs ${formatUsd(capitalValue)} capital`
              : "No classified pipeline value"
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Open funnel value by industry
          </h2>
          {openOpps.length === 0 ? (
            <p className="text-sm text-slate-500">No open opportunities.</p>
          ) : (
            <Bars rows={byIndustry} color="bg-indigo-500" />
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Open funnel value by product line
          </h2>
          {openOpps.length === 0 ? (
            <p className="text-sm text-slate-500">No open opportunities.</p>
          ) : (
            <Bars rows={byLine} color="bg-emerald-500" />
          )}
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Average quotation margin by product line{" "}
            <span className="font-normal text-slate-400">(via linked RFQ → enquiry)</span>
          </h2>
          {marginRows.length === 0 ? (
            <p className="text-sm text-slate-500">
              No quotations with margin data yet — margins appear once quotations are priced.
            </p>
          ) : (
            <Bars rows={marginRows} color="bg-violet-500" />
          )}
        </Card>
      </div>
      <RealtimeRefresher tables={["opportunities", "quotations"]} />
    </div>
  );
}
