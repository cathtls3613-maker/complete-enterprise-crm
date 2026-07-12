import { listQuery } from "@/lib/crm/data";
import type { Account } from "@/lib/crm/types";
import { VisitForm } from "@/components/forms/visit-form";
import { Card, DbSetupBanner, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function NewVisitPage({
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
        title="New visit report"
        subtitle="All starred fields are mandatory — structured data beats free-text dumps."
      />
      {accounts.dbMissing ? <DbSetupBanner /> : null}
      <Card className="p-6">
        <VisitForm accounts={accounts.rows} defaultAccountId={account} />
      </Card>
    </div>
  );
}
