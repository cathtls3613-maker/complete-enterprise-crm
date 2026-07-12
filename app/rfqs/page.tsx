import Link from "next/link";
import { listQuery } from "@/lib/crm/data";
import type { Rfq } from "@/lib/crm/types";
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

export default async function RfqsPage() {
  const { rows, dbMissing, errorMessage } = await listQuery<Rfq>((s) =>
    s
      .from("rfqs")
      .select("*, accounts(id, name), enquiries(id, enquiry_number, project_name)")
      .order("created_at", { ascending: false }),
  );

  return (
    <div>
      <PageHeader
        title="RFQs"
        subtitle="Formal requests for quotation with technical scope and clarification log."
        action={<PrimaryLink href="/rfqs/new">+ New RFQ</PrimaryLink>}
      />
      {dbMissing ? <DbSetupBanner /> : null}
      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

      {rows.length === 0 ? (
        <EmptyState
          title="No RFQs yet"
          hint="Create one from an enquiry to carry its technical context forward."
          action={<PrimaryLink href="/rfqs/new">+ New RFQ</PrimaryLink>}
        />
      ) : (
        <TableShell>
          <thead className="bg-slate-50">
            <tr>
              <th className={thCls}>Number</th>
              <th className={thCls}>Account</th>
              <th className={thCls}>Enquiry</th>
              <th className={thCls}>Scope</th>
              <th className={thCls}>Bid due</th>
              <th className={thCls}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((r) => (
              <tr key={r.id} className="transition hover:bg-indigo-50/40">
                <td className={tdCls}>
                  <Link href={`/rfqs/${r.id}`} className="font-medium text-indigo-700 hover:underline">
                    {r.rfq_number}
                  </Link>
                </td>
                <td className={tdCls}>
                  {r.accounts ? (
                    <Link href={`/accounts/${r.accounts.id}`} className="text-indigo-700 hover:underline">
                      {r.accounts.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className={tdCls}>
                  {r.enquiries ? (
                    <Link href={`/enquiries/${r.enquiries.id}`} className="text-indigo-700 hover:underline">
                      {r.enquiries.enquiry_number}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className={`${tdCls} max-w-xs truncate`}>{r.scope ?? "—"}</td>
                <td className={tdCls}>{formatDate(r.bid_due_date)}</td>
                <td className={tdCls}>
                  <Badge value={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
      <RealtimeRefresher tables={["rfqs"]} />
    </div>
  );
}
