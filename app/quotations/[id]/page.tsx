import Link from "next/link";
import { notFound } from "next/navigation";
import { getById } from "@/lib/crm/data";
import type { Quotation } from "@/lib/crm/types";
import { formatDate, formatUsd } from "@/lib/crm/format";
import { deleteQuotation } from "@/lib/crm/actions";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Badge, Card, DbSetupBanner, PageHeader, SecondaryLink } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { row: quotation, dbMissing } = await getById<Quotation>(
    "quotations",
    id,
    "*, accounts(id, name), rfqs(id, rfq_number)",
  );
  if (dbMissing) return <DbSetupBanner />;
  if (!quotation) notFound();

  const facts: Array<[string, React.ReactNode]> = [
    ["Account", quotation.accounts ? (
      <Link key="a" href={`/accounts/${quotation.accounts.id}`} className="text-indigo-700 hover:underline">
        {quotation.accounts.name}
      </Link>
    ) : "—"],
    ["Linked RFQ", quotation.rfqs ? (
      <Link key="r" href={`/rfqs/${quotation.rfqs.id}`} className="text-indigo-700 hover:underline">
        {quotation.rfqs.rfq_number}
      </Link>
    ) : "—"],
    ["Equipment selection", quotation.equipment_selection ?? "—"],
    ["BOM summary", quotation.bom_summary ?? "—"],
    ["Cost", formatUsd(quotation.cost_usd)],
    ["Selling price", formatUsd(quotation.selling_price_usd)],
    ["Margin", quotation.margin_pct != null ? `${quotation.margin_pct}%` : "—"],
    ["Delivery", quotation.delivery_weeks ? `${quotation.delivery_weeks} weeks` : "—"],
    ["Warranty", quotation.warranty_months ? `${quotation.warranty_months} months` : "—"],
    ["Payment terms", quotation.payment_terms ?? "—"],
    ["Commercial deviation", quotation.commercial_deviation ?? "—"],
    ["Submitted date", formatDate(quotation.submitted_date)],
    ["Result", quotation.result ?? "—"],
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={quotation.quotation_number}
        action={
          <div className="flex gap-2">
            <SecondaryLink href={`/quotations/${id}/edit`}>Edit</SecondaryLink>
            <ConfirmDelete action={deleteQuotation} id={id} what={quotation.quotation_number} />
          </div>
        }
      />
      <div className="mb-4">
        <Badge value={quotation.status} />
      </div>
      <Card className="divide-y divide-slate-100">
        {facts.map(([label, value]) => (
          <div key={label} className="grid grid-cols-3 gap-4 px-5 py-3 text-sm">
            <span className="text-slate-500">{label}</span>
            <span className="col-span-2 whitespace-pre-wrap text-slate-800">{value}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
