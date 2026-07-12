import { getById, listQuery } from "@/lib/crm/data";
import type { Account, Enquiry } from "@/lib/crm/types";
import { RfqForm } from "@/components/forms/rfq-form";
import { Card, DbSetupBanner, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function NewRfqPage({
  searchParams,
}: {
  searchParams: Promise<{ enquiry?: string }>;
}) {
  const { enquiry: enquiryId } = await searchParams;
  const [accounts, enquiries] = await Promise.all([
    listQuery<Account>((s) => s.from("accounts").select("id, name").order("name")),
    listQuery<Enquiry>((s) =>
      s
        .from("enquiries")
        .select("id, enquiry_number, project_name, account_id, process_data, equipment_type, bid_due_date")
        .order("created_at", { ascending: false }),
    ),
  ]);

  const prefillEnquiry = enquiryId
    ? (await getById<Enquiry>(
        "enquiries",
        enquiryId,
        "id, account_id, process_data, equipment_type, project_name, bid_due_date",
      )).row
    : null;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New RFQ"
        subtitle={
          prefillEnquiry
            ? "Pre-filled from the enquiry — review and save."
            : "The RFQ number is generated automatically (RFQ-YYYY-NNNN)."
        }
      />
      {accounts.dbMissing ? <DbSetupBanner /> : null}
      <Card className="p-6">
        <RfqForm
          accounts={accounts.rows}
          enquiries={enquiries.rows}
          prefillEnquiry={prefillEnquiry}
        />
      </Card>
    </div>
  );
}
