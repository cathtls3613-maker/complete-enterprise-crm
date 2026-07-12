import { notFound } from "next/navigation";
import { getById, listQuery } from "@/lib/crm/data";
import type { Account, Contact } from "@/lib/crm/types";
import { deleteContact } from "@/lib/crm/actions";
import { ContactForm } from "@/components/forms/contact-form";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Card, DbSetupBanner, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { row: contact, dbMissing } = await getById<Contact>("contacts", id, "*");
  if (dbMissing) return <DbSetupBanner />;
  if (!contact) notFound();

  const accounts = await listQuery<Account>((s) =>
    s.from("accounts").select("id, name").order("name"),
  );

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={`Edit ${contact.full_name}`}
        action={<ConfirmDelete action={deleteContact} id={id} what={contact.full_name} />}
      />
      <Card className="p-6">
        <ContactForm accounts={accounts.rows} contact={contact} />
      </Card>
    </div>
  );
}
