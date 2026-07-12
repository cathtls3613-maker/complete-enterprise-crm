import Link from "next/link";
import { notFound } from "next/navigation";
import { getById } from "@/lib/crm/data";
import type { Opportunity } from "@/lib/crm/types";
import { formatDate, formatUsd } from "@/lib/crm/format";
import { deleteOpportunity } from "@/lib/crm/actions";
import { ScoreOverrideForm } from "@/components/forms/opportunity-form";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Badge, Card, DbSetupBanner, PageHeader, SecondaryLink } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { row: opp, dbMissing } = await getById<Opportunity>(
    "opportunities",
    id,
    "*, accounts(id, name), enquiries(id, enquiry_number, project_name)",
  );
  if (dbMissing) return <DbSetupBanner />;
  if (!opp) notFound();

  const facts: Array<[string, React.ReactNode]> = [
    ["Account", opp.accounts ? (
      <Link key="a" href={`/accounts/${opp.accounts.id}`} className="text-indigo-700 hover:underline">
        {opp.accounts.name}
      </Link>
    ) : "—"],
    ["Linked enquiry", opp.enquiries ? (
      <Link key="e" href={`/enquiries/${opp.enquiries.id}`} className="text-indigo-700 hover:underline">
        {opp.enquiries.enquiry_number} — {opp.enquiries.project_name ?? "untitled"}
      </Link>
    ) : "—"],
    ["Product line", opp.product_line ?? "—"],
    ["Industry", opp.industry ?? "—"],
    ["Value", formatUsd(opp.value_usd)],
    ["Probability", `${opp.probability}%`],
    ["Expected close", formatDate(opp.expected_close_date)],
    ["Competitor", opp.competitor ?? "—"],
    ["Notes", opp.notes ?? "—"],
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={opp.title}
        action={
          <div className="flex gap-2">
            <SecondaryLink href={`/opportunities/${id}/edit`}>Edit / advance stage</SecondaryLink>
            <ConfirmDelete action={deleteOpportunity} id={id} what={opp.title} />
          </div>
        }
      />
      <div className="mb-4 flex items-center gap-2">
        <Badge value={opp.stage} />
      </div>

      <Card className="divide-y divide-slate-100">
        {facts.map(([label, value]) => (
          <div key={label} className="grid grid-cols-3 gap-4 px-5 py-3 text-sm">
            <span className="text-slate-500">{label}</span>
            <span className="col-span-2 whitespace-pre-wrap text-slate-800">{value}</span>
          </div>
        ))}
      </Card>

      <Card className="mt-6 p-5">
        <h2 className="text-sm font-semibold text-slate-900">AI score</h2>
        <p className="mt-1 text-sm text-slate-600">
          {opp.ai_score != null ? (
            <>
              <span className="text-2xl font-semibold text-slate-900">{opp.ai_score}</span>
              <span className="text-slate-400"> / 100</span>
              <span className="ml-3 text-xs text-slate-500">
                source: {opp.ai_score_source ?? "—"} · confidence:{" "}
                {opp.ai_score_confidence ?? "—"} ·{" "}
                {opp.ai_score_review_status === "human_reviewed" ? (
                  <span className="font-medium text-emerald-600">human reviewed</span>
                ) : (
                  <span className="font-medium text-amber-600">unreviewed</span>
                )}
              </span>
            </>
          ) : (
            "Not scored yet — save the opportunity once to trigger the rule engine."
          )}
        </p>
        <p className="mb-3 mt-2 text-xs text-slate-500">
          The rule engine re-scores on every save. Override below to set your own judgement — the
          record is then marked human-reviewed.
        </p>
        <ScoreOverrideForm opportunity={opp} />
      </Card>
    </div>
  );
}
