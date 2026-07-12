import { getById, listQuery } from "@/lib/crm/data";
import type { Account, Rfq } from "@/lib/crm/types";
import { QuotationForm } from "@/components/forms/quotation-form";
import { Card, DbSetupBanner, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function NewQuotationPage({
  searchParams,
}: {
  searchParams: Promise<{ rfq?: string }>;
}) {
  const { rfq: rfqId } = await searchParams;
  const [accounts, rfqs] = await Promise.all([
    listQuery<Account>((s) => s.from("accounts").select("id, name").order("name")),
    listQuery<Rfq>((s) =>
      s
        .from("rfqs")
        .select("id, rfq_number, account_id, technical_requirement, scope")
        .order("created_at", { ascending: false }),
    ),
  ]);

  const prefillRfq = rfqId
    ? (await getById<Rfq>("rfqs", rfqId, "id, rfq_number, account_id, technical_requirement, scope")).row
    : null;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New quotation"
        subtitle={
          prefillRfq
            ? `Pre-filled from ${prefillRfq.rfq_number}.`
            : "The quotation number is generated automatically (QTN-YYYY-NNNN)."
        }
      />
      {accounts.dbMissing ? <DbSetupBanner /> : null}
      <Card className="p-6">
        <QuotationForm accounts={accounts.rows} rfqs={rfqs.rows} prefillRfq={prefillRfq} />
      </Card>
    </div>
  );
}
