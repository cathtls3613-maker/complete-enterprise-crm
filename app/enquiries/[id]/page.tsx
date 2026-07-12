import Link from "next/link";
import { notFound } from "next/navigation";
import { getById, listQuery } from "@/lib/crm/data";
import type { Enquiry, Opportunity, Rfq } from "@/lib/crm/types";
import { formatDate, formatUsd } from "@/lib/crm/format";
import { deleteEnquiry } from "@/lib/crm/actions";
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

export default async function EnquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { row: enquiry, dbMissing } = await getById<Enquiry>(
    "enquiries",
    id,
    "*, accounts(id, name, industry), visit_reports(id, visit_date, visit_purpose)",
  );
  if (dbMissing) return <DbSetupBanner />;
  if (!enquiry) notFound();

  const [rfqs, opportunities] = await Promise.all([
    listQuery<Rfq>((s) => s.from("rfqs").select("id, rfq_number, status").eq("enquiry_id", id)),
    listQuery<Opportunity>((s) =>
      s.from("opportunities").select("id, title, stage, value_usd").eq("enquiry_id", id),
    ),
  ]);

  const facts: Array<[string, React.ReactNode]> = [
    ["Account", enquiry.accounts ? (
      <Link key="a" href={`/accounts/${enquiry.accounts.id}`} className="text-indigo-700 hover:underline">
        {enquiry.accounts.name}
      </Link>
    ) : "—"],
    ["Project", enquiry.project_name ?? "—"],
    ["Equipment type", enquiry.equipment_type],
    ["Process data", enquiry.process_data ?? "—"],
    ["Required delivery", enquiry.required_delivery_weeks ? `${enquiry.required_delivery_weeks} weeks` : "—"],
    ["Bid due date", formatDate(enquiry.bid_due_date)],
    ["Competitor", enquiry.competitor ?? "—"],
    ["Probability", `${enquiry.probability}%`],
    [
      "Origin visit",
      enquiry.visit_reports ? (
        <Link key="v" href={`/visits/${enquiry.visit_reports.id}`} className="text-indigo-700 hover:underline">
          {formatDate(enquiry.visit_reports.visit_date)} — {enquiry.visit_reports.visit_purpose}
        </Link>
      ) : (
        <span className="text-slate-400">created directly (no visit)</span>
      ),
    ],
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={enquiry.enquiry_number}
        subtitle={enquiry.project_name ?? undefined}
        action={
          <div className="flex flex-wrap gap-2">
            <SecondaryLink href={`/enquiries/${id}/edit`}>Edit</SecondaryLink>
            <PrimaryLink href={`/rfqs/new?enquiry=${id}`}>Create RFQ →</PrimaryLink>
            <ConfirmDelete action={deleteEnquiry} id={id} what={enquiry.enquiry_number} />
          </div>
        }
      />

      <div className="mb-4">
        <Badge value={enquiry.status} />
      </div>

      <Card className="divide-y divide-slate-100">
        {facts.map(([label, value]) => (
          <div key={label} className="grid grid-cols-3 gap-4 px-5 py-3 text-sm">
            <span className="text-slate-500">{label}</span>
            <span className="col-span-2 text-slate-800">{value}</span>
          </div>
        ))}
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Linked RFQs</h2>
          {rfqs.rows.length === 0 ? (
            <p className="text-sm text-slate-500">None yet — create one from this enquiry.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {rfqs.rows.map((r) => (
                <li key={r.id} className="flex items-center justify-between">
                  <Link href={`/rfqs/${r.id}`} className="font-medium text-indigo-700 hover:underline">
                    {r.rfq_number}
                  </Link>
                  <Badge value={r.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-5">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Linked opportunities</h2>
          {opportunities.rows.length === 0 ? (
            <p className="text-sm text-slate-500">None yet.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {opportunities.rows.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2">
                  <Link href={`/opportunities/${o.id}`} className="font-medium text-indigo-700 hover:underline">
                    {o.title}
                  </Link>
                  <span className="flex items-center gap-2">
                    <Badge value={o.stage} />
                    <span className="tabular-nums text-slate-600">{formatUsd(o.value_usd)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
