import { listQuery } from "@/lib/crm/data";
import type { Account, Enquiry } from "@/lib/crm/types";
import { OpportunityForm } from "@/components/forms/opportunity-form";
import { Card, DbSetupBanner, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function NewOpportunityPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string; enquiry?: string }>;
}) {
  const { account, enquiry } = await searchParams;
  const [accounts, enquiries] = await Promise.all([
    listQuery<Account>((s) => s.from("accounts").select("id, name").order("name")),
    listQuery<Enquiry>((s) =>
      s.from("enquiries").select("id, enquiry_number, project_name").order("created_at", { ascending: false }),
    ),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="New opportunity" />
      {accounts.dbMissing ? <DbSetupBanner /> : null}
      <Card className="p-6">
        <OpportunityForm
          accounts={accounts.rows}
          enquiries={enquiries.rows}
          defaultAccountId={account}
          defaultEnquiryId={enquiry}
        />
      </Card>
    </div>
  );
}
