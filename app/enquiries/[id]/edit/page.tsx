import { notFound } from "next/navigation";
import { getById, listQuery } from "@/lib/crm/data";
import type { Account, Enquiry } from "@/lib/crm/types";
import { EnquiryForm } from "@/components/forms/enquiry-form";
import { Card, DbSetupBanner, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function EditEnquiryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { row: enquiry, dbMissing } = await getById<Enquiry>("enquiries", id, "*");
  if (dbMissing) return <DbSetupBanner />;
  if (!enquiry) notFound();

  const accounts = await listQuery<Account>((s) =>
    s.from("accounts").select("id, name").order("name"),
  );

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={`Edit ${enquiry.enquiry_number}`} />
      <Card className="p-6">
        <EnquiryForm accounts={accounts.rows} enquiry={enquiry} />
      </Card>
    </div>
  );
}
