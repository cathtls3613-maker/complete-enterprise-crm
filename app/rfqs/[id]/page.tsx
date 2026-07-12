import Link from "next/link";
import { notFound } from "next/navigation";
import { getById, listQuery } from "@/lib/crm/data";
import type { Quotation, Rfq } from "@/lib/crm/types";
import { formatDate, formatUsd } from "@/lib/crm/format";
import { deleteRfq } from "@/lib/crm/actions";
import { ClarificationForm } from "@/components/forms/rfq-form";
import { ConfirmDelete } from "@/components/confirm-delete";
import {
  Badge,
  Card,
  DbSetupBanner,
  PageHeader,
  PrimaryLink,
  SecondaryLink,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function RfqDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { row: rfq, dbMissing } = await getById<Rfq>(
    "rfqs",
    id,
    "*, accounts(id, name), enquiries(id, enquiry_number, project_name)",
  );
  if (dbMissing) return <DbSetupBanner />;
  if (!rfq) notFound();

  const quotations = await listQuery<Quotation>((s) =>
    s.from("quotations").select("id, quotation_number, status, selling_price_usd").eq("rfq_id", id),
  );

  const facts: Array<[string, React.ReactNode]> = [
    ["Account", rfq.accounts ? (
      <Link key="a" href={`/accounts/${rfq.accounts.id}`} className="text-indigo-700 hover:underline">
        {rfq.accounts.name}
      </Link>
    ) : "—"],
    ["Linked enquiry", rfq.enquiries ? (
      <Link key="e" href={`/enquiries/${rfq.enquiries.id}`} className="text-indigo-700 hover:underline">
        {rfq.enquiries.enquiry_number} — {rfq.enquiries.project_name ?? "untitled"}
      </Link>
    ) : "—"],
    ["Technical requirement", rfq.technical_requirement ?? "—"],
    ["Scope of supply", rfq.scope ?? "—"],
    ["Bid due date", formatDate(rfq.bid_due_date)],
    ["Commercial terms", rfq.commercial_terms ?? "—"],
    ["Bid bond required", rfq.bid_bond_required ? "Yes" : "No"],
    ["Compliance matrix", rfq.compliance_matrix_notes ?? "—"],
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={rfq.rfq_number}
        subtitle={rfq.enquiries?.project_name ?? undefined}
        action={
          <div className="flex flex-wrap gap-2">
            <SecondaryLink href={`/rfqs/${id}/edit`}>Edit</SecondaryLink>
            <PrimaryLink href={`/quotations/new?rfq=${id}`}>Create Quotation →</PrimaryLink>
            <ConfirmDelete action={deleteRfq} id={id} what={rfq.rfq_number} />
          </div>
        }
      />

      <div className="mb-4">
        <Badge value={rfq.status} />
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
        <h2 className="mb-2 text-sm font-semibold text-slate-900">
          Clarification log <span className="font-normal text-slate-400">(append-only)</span>
        </h2>
        {rfq.clarification_log ? (
          <pre className="mb-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 font-sans text-sm text-slate-700">
            {rfq.clarification_log}
          </pre>
        ) : (
          <p className="mb-3 text-sm text-slate-500">No clarifications logged yet.</p>
        )}
        <ClarificationForm rfqId={id} />
      </Card>

      <Card className="mt-6 p-5">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Quotations</h2>
        {quotations.rows.length === 0 ? (
          <p className="text-sm text-slate-500">No quotation yet — create one from this RFQ.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {quotations.rows.map((q) => (
              <li key={q.id} className="flex items-center justify-between gap-2">
                <Link href={`/quotations/${q.id}`} className="font-medium text-indigo-700 hover:underline">
                  {q.quotation_number}
                </Link>
                <span className="flex items-center gap-2">
                  <Badge value={q.status} />
                  <span className="tabular-nums text-slate-600">{formatUsd(q.selling_price_usd)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
