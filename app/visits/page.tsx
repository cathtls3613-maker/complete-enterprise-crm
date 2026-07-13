import Link from "next/link";
import { listQuery } from "@/lib/crm/data";
import type { VisitReport } from "@/lib/crm/types";
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

function isOverdue(v: VisitReport): boolean {
  return Boolean(
    v.next_action_deadline &&
      v.next_action_deadline < new Date().toISOString().slice(0, 10) &&
      !v.converted_to_enquiry,
  );
}

export default async function VisitsPage() {
  const { rows, dbMissing, errorMessage } = await listQuery<VisitReport>((s) =>
    s
      .from("visit_reports")
      .select("*, accounts(id, name, industry)")
      .order("visit_date", { ascending: false }),
  );

  return (
    <div>
      <PageHeader
        title="Visit reports"
        subtitle="Structured field intelligence — every visit feeds the enquiry pipeline."
        action={<PrimaryLink href="/visits/new">+ New Visit Report</PrimaryLink>}
      />
      {dbMissing ? <DbSetupBanner /> : null}
      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

      {rows.length === 0 ? (
        <EmptyState
          title="No visit reports yet"
          hint="Log your first customer visit — it takes two minutes and becomes pipeline."
          action={<PrimaryLink href="/visits/new">+ New Visit Report</PrimaryLink>}
        />
      ) : (
        <TableShell>
          <thead className="bg-slate-50">
            <tr>
              <th className={thCls}>Date</th>
              <th className={thCls}>Account</th>
              <th className={thCls}>Purpose</th>
              <th className={thCls}>Equipment</th>
              <th className={thCls}>Next action due</th>
              <th className={thCls}>Status</th>
              <th className={thCls}>Converted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((v) => (
              <tr key={v.id} className="transition hover:bg-indigo-50/40">
                <td className={tdCls}>
                  <Link href={`/visits/${v.id}`} className="font-medium text-indigo-700 hover:underline">
                    {formatDate(v.visit_date)}
                  </Link>
                </td>
                <td className={tdCls}>
                  {v.accounts ? (
                    <Link href={`/accounts/${v.accounts.id}`} className="text-indigo-700 hover:underline">
                      {v.accounts.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className={tdCls}>{v.visit_purpose}</td>
                <td className={tdCls}>
                  <span className="text-xs text-slate-500">
                    {v.equipment_discussed?.join(", ") || "—"}
                  </span>
                </td>
                <td className={tdCls}>
                  <span className="flex items-center gap-2">
                    {formatDate(v.next_action_deadline)}
                    {isOverdue(v) ? (
                      <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20">
                        Overdue
                      </span>
                    ) : null}
                  </span>
                </td>
                <td className={tdCls}>
                  <Badge value={v.visit_status} />
                </td>
                <td className={tdCls}>
                  {v.converted_to_enquiry ? <Badge value="Converted" /> : <span className="text-slate-400">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
      <RealtimeRefresher tables={["visit_reports"]} />
    </div>
  );
}
