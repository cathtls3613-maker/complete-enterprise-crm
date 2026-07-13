import Link from "next/link";
import { notFound } from "next/navigation";
import { getById, listQuery } from "@/lib/crm/data";
import type { Enquiry, VisitReport } from "@/lib/crm/types";
import { formatDate } from "@/lib/crm/format";
import { deleteVisitReport } from "@/lib/crm/actions";
import { ConvertToEnquiry } from "@/components/forms/convert-to-enquiry";
import { ConfirmDelete } from "@/components/confirm-delete";
import { AttachmentsPanel } from "@/components/attachments-panel";
import {
  Badge,
  Card,
  DbSetupBanner,
  PageHeader,
  SecondaryLink,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function VisitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { row: visit, dbMissing } = await getById<VisitReport>(
    "visit_reports",
    id,
    "*, accounts(id, name, industry)",
  );
  if (dbMissing) return <DbSetupBanner />;
  if (!visit) notFound();

  const linkedEnquiries = visit.converted_to_enquiry
    ? await listQuery<Enquiry>((s) =>
        s.from("enquiries").select("id, enquiry_number, project_name").eq("visit_report_id", id),
      )
    : { rows: [] as Enquiry[] };

  const facts: Array<[string, React.ReactNode]> = [
    ["Account", visit.accounts ? (
      <Link key="a" href={`/accounts/${visit.accounts.id}`} className="text-indigo-700 hover:underline">
        {visit.accounts.name}
      </Link>
    ) : "—"],
    ["Visit date", formatDate(visit.visit_date)],
    ["Purpose", visit.visit_purpose],
    ["Process unit", visit.process_unit ?? "—"],
    ["Equipment discussed", visit.equipment_discussed?.join(", ") || "—"],
    ["Contacts met", visit.contacts_met?.join(", ") || "—"],
    ["Operating problem", visit.operating_problem ?? "—"],
    ["Competitor at site", visit.competitor_at_site ?? "—"],
    ["Customer pain point", visit.customer_pain_point ?? "—"],
    ["Opportunity potential", visit.opportunity_potential ?? "—"],
    ["Next action", visit.next_action ?? "—"],
    ["Next action owner", visit.next_action_owner ?? "—"],
    ["Next action deadline", formatDate(visit.next_action_deadline)],
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={`Visit — ${visit.accounts?.name ?? "unknown account"}`}
        subtitle={`${formatDate(visit.visit_date)} · ${visit.visit_purpose}`}
        action={
          <div className="flex flex-wrap gap-2">
            <SecondaryLink href={`/visits/${id}/edit`}>Edit</SecondaryLink>
            <ConvertToEnquiry visit={visit} accountName={visit.accounts?.name ?? "account"} />
            <ConfirmDelete action={deleteVisitReport} id={id} what="this visit report" />
          </div>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <Badge value={visit.visit_status} />
        {visit.converted_to_enquiry ? <Badge value="Converted" label="Converted to enquiry" /> : null}
      </div>

      {linkedEnquiries.rows.length > 0 ? (
        <Card className="mb-4 border-emerald-200 bg-emerald-50/50 p-4">
          <p className="text-sm text-emerald-800">
            Linked enquir{linkedEnquiries.rows.length > 1 ? "ies" : "y"}:{" "}
            {linkedEnquiries.rows.map((e, i) => (
              <span key={e.id}>
                {i > 0 ? ", " : ""}
                <Link href={`/enquiries/${e.id}`} className="font-medium underline">
                  {e.enquiry_number} — {e.project_name ?? "untitled"}
                </Link>
              </span>
            ))}
          </p>
        </Card>
      ) : null}

      <Card className="divide-y divide-slate-100">
        {facts.map(([label, value]) => (
          <div key={label} className="grid grid-cols-3 gap-4 px-5 py-3 text-sm">
            <span className="text-slate-500">{label}</span>
            <span className="col-span-2 text-slate-800">{value}</span>
          </div>
        ))}
      </Card>

      <div className="mt-6">
        <AttachmentsPanel visitId={id} attachments={visit.attachments ?? []} />
      </div>
    </div>
  );
}
