import { notFound } from "next/navigation";
import { getById, listQuery } from "@/lib/crm/data";
import type { Account, Quotation, Rfq } from "@/lib/crm/types";
import { QuotationForm } from "@/components/forms/quotation-form";
import { Card, DbSetupBanner, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function EditQuotationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { row: quotation, dbMissing } = await getById<Quotation>("quotations", id, "*");
  if (dbMissing) return <DbSetupBanner />;
  if (!quotation) notFound();

  const [accounts, rfqs] = await Promise.all([
    listQuery<Account>((s) => s.from("accounts").select("id, name").order("name")),
    listQuery<Rfq>((s) =>
      s
        .from("rfqs")
        .select("id, rfq_number, account_id, technical_requirement, scope")
        .order("created_at", { ascending: false }),
    ),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={`Edit ${quotation.quotation_number}`} />
      <Card className="p-6">
        <QuotationForm accounts={accounts.rows} rfqs={rfqs.rows} quotation={quotation} />
      </Card>
    </div>
  );
}
