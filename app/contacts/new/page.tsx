import { listQuery } from "@/lib/crm/data";
import type { Account } from "@/lib/crm/types";
import { ContactForm } from "@/components/forms/contact-form";
import { Card, DbSetupBanner, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function NewContactPage({
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
      <PageHeader title="New contact" />
      {accounts.dbMissing ? <DbSetupBanner /> : null}
      <Card className="p-6">
        <ContactForm accounts={accounts.rows} defaultAccountId={account} />
      </Card>
    </div>
  );
}
