import { notFound } from "next/navigation";
import { getById, listQuery } from "@/lib/crm/data";
import type { Account, Enquiry, Opportunity } from "@/lib/crm/types";
import { OpportunityForm } from "@/components/forms/opportunity-form";
import { Card, DbSetupBanner, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function EditOpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { row: opp, dbMissing } = await getById<Opportunity>("opportunities", id, "*");
  if (dbMissing) return <DbSetupBanner />;
  if (!opp) notFound();

  const [accounts, enquiries] = await Promise.all([
    listQuery<Account>((s) => s.from("accounts").select("id, name").order("name")),
    listQuery<Enquiry>((s) =>
      s.from("enquiries").select("id, enquiry_number, project_name").order("created_at", { ascending: false }),
    ),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={`Edit ${opp.title}`} />
      <Card className="p-6">
        <OpportunityForm accounts={accounts.rows} enquiries={enquiries.rows} opportunity={opp} />
      </Card>
    </div>
  );
}
