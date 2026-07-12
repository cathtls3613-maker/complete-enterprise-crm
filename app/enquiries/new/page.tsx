import { listQuery } from "@/lib/crm/data";
import type { Account } from "@/lib/crm/types";
import { EnquiryForm } from "@/components/forms/enquiry-form";
import { Card, DbSetupBanner, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function NewEnquiryPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  const { account } = await searchParams;
  const accounts = await listQuery<Account>((s) =>
    s.from("accounts").select("id, name").order("name"),
  );

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New enquiry"
        subtitle="The enquiry number is generated automatically (ENQ-YYYY-NNNN)."
      />
      {accounts.dbMissing ? <DbSetupBanner /> : null}
      <Card className="p-6">
        <EnquiryForm accounts={accounts.rows} defaultAccountId={account} />
      </Card>
    </div>
  );
}
