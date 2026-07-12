import Link from "next/link";
import { listQuery } from "@/lib/crm/data";
import type { Enquiry } from "@/lib/crm/types";
import { formatDate } from "@/lib/crm/format";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import {
  Badge,
  DbSetupBanner,
  EmptyState,
  ErrorBanner,
  PageHeader,
  PrimaryLink,
  TableShell,
  tdCls,
  thCls,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function EnquiriesPage() {
  const { rows, dbMissing, errorMessage } = await listQuery<Enquiry>((s) =>
    s
      .from("enquiries")
      .select("*, accounts(id, name, industry), visit_reports(id, visit_date, visit_purpose)")
      .order("created_at", { ascending: false }),
  );

  return (
    <div>
      <PageHeader
        title="Enquiries"
        subtitle="Commercial demand captured from visits — the start of the conversion chain."
        action={<PrimaryLink href="/enquiries/new">+ New Enquiry</PrimaryLink>}
      />
      {dbMissing ? <DbSetupBanner /> : null}
      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

      {rows.length === 0 ? (
        <EmptyState
          title="No enquiries yet"
          hint="Convert a visit report, or create an enquiry directly."
          action={<PrimaryLink href="/enquiries/new">+ New Enquiry</PrimaryLink>}
        />
      ) : (
        <TableShell>
          <thead className="bg-slate-50">
            <tr>
              <th className={thCls}>Number</th>
              <th className={thCls}>Project</th>
              <th className={thCls}>Account</th>
              <th className={thCls}>Equipment</th>
              <th className={thCls}>Bid due</th>
              <th className={thCls}>Prob.</th>
              <th className={thCls}>Origin visit</th>
              <th className={thCls}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((e) => (
              <tr key={e.id} className="transition hover:bg-indigo-50/40">
                <td className={tdCls}>
                  <Link href={`/enquiries/${e.id}`} className="font-medium text-indigo-700 hover:underline">
                    {e.enquiry_number}
                  </Link>
                </td>
                <td className={tdCls}>{e.project_name ?? "—"}</td>
                <td className={tdCls}>
                  {e.accounts ? (
                    <Link href={`/accounts/${e.accounts.id}`} className="text-indigo-700 hover:underline">
                      {e.accounts.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className={tdCls}>{e.equipment_type}</td>
                <td className={tdCls}>{formatDate(e.bid_due_date)}</td>
                <td className={`${tdCls} tabular-nums`}>{e.probability}%</td>
                <td className={tdCls}>
                  {e.visit_reports ? (
                    <Link href={`/visits/${e.visit_reports.id}`} className="text-indigo-700 hover:underline">
                      {formatDate(e.visit_reports.visit_date)}
                    </Link>
                  ) : (
                    <span className="text-slate-400">direct</span>
                  )}
                </td>
                <td className={tdCls}>
                  <Badge value={e.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
      <RealtimeRefresher tables={["enquiries"]} />
    </div>
  );
}
