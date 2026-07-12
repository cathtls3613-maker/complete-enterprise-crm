import { notFound } from "next/navigation";
import { getById } from "@/lib/crm/data";
import type { Account } from "@/lib/crm/types";
import { AccountForm } from "@/components/forms/account-form";
import { Card, DbSetupBanner, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function EditAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { row: account, dbMissing } = await getById<Account>("accounts", id, "*");
  if (dbMissing) return <DbSetupBanner />;
  if (!account) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={`Edit ${account.name}`} />
      <Card className="p-6">
        <AccountForm account={account} />
      </Card>
    </div>
  );
}
