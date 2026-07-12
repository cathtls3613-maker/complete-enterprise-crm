import { notFound } from "next/navigation";
import { getById, listQuery } from "@/lib/crm/data";
import type { Account, VisitReport } from "@/lib/crm/types";
import { VisitForm } from "@/components/forms/visit-form";
import { Card, DbSetupBanner, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function EditVisitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { row: visit, dbMissing } = await getById<VisitReport>("visit_reports", id, "*");
  if (dbMissing) return <DbSetupBanner />;
  if (!visit) notFound();

  const accounts = await listQuery<Account>((s) =>
    s.from("accounts").select("id, name").order("name"),
  );

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Edit visit report" />
      <Card className="p-6">
        <VisitForm accounts={accounts.rows} visit={visit} />
      </Card>
    </div>
  );
}
