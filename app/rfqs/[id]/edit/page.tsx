import { notFound } from "next/navigation";
import { getById, listQuery } from "@/lib/crm/data";
import type { Account, Enquiry, Rfq } from "@/lib/crm/types";
import { RfqForm } from "@/components/forms/rfq-form";
import { Card, DbSetupBanner, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function EditRfqPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { row: rfq, dbMissing } = await getById<Rfq>("rfqs", id, "*");
  if (dbMissing) return <DbSetupBanner />;
  if (!rfq) notFound();

  const [accounts, enquiries] = await Promise.all([
    listQuery<Account>((s) => s.from("accounts").select("id, name").order("name")),
    listQuery<Enquiry>((s) =>
      s
        .from("enquiries")
        .select("id, enquiry_number, project_name, account_id, process_data, equipment_type, bid_due_date")
        .order("created_at", { ascending: false }),
    ),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={`Edit ${rfq.rfq_number}`} />
      <Card className="p-6">
        <RfqForm accounts={accounts.rows} enquiries={enquiries.rows} rfq={rfq} />
      </Card>
    </div>
  );
}
