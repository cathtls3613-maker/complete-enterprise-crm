import Link from "next/link";
import { listQuery } from "@/lib/crm/data";
import type { Quotation } from "@/lib/crm/types";
import { formatDate, formatUsd } from "@/lib/crm/format";
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

export default async function QuotationsPage() {
  const { rows, dbMissing, errorMessage } = await listQuery<Quotation>((s) =>
    s
      .from("quotations")
      .select("*, accounts(id, name), rfqs(id, rfq_number)")
      .order("created_at", { ascending: false }),
  );

  return (
    <div>
      <PageHeader
        title="Quotations"
        subtitle="Commercial offers — draft → submitted → won / lost."
        action={<PrimaryLink href="/quotations/new">+ New Quotation</PrimaryLink>}
      />
      {dbMissing ? <DbSetupBanner /> : null}
      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

      {rows.length === 0 ? (
        <EmptyState
          title="No quotations yet"
          hint="Create one from an RFQ so the technical scope carries over."
          action={<PrimaryLink href="/quotations/new">+ New Quotation</PrimaryLink>}
        />
      ) : (
        <TableShell>
          <thead className="bg-slate-50">
            <tr>
              <th className={thCls}>Number</th>
              <th className={thCls}>Account</th>
              <th className={thCls}>RFQ</th>
              <th className={`${thCls} text-right`}>Price</th>
              <th className={`${thCls} text-right`}>Margin</th>
              <th className={thCls}>Submitted</th>
              <th className={thCls}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((q) => (
              <tr key={q.id} className="transition hover:bg-indigo-50/40">
                <td className={tdCls}>
                  <Link href={`/quotations/${q.id}`} className="font-medium text-indigo-700 hover:underline">
                    {q.quotation_number}
                  </Link>
                </td>
                <td className={tdCls}>
                  {q.accounts ? (
                    <Link href={`/accounts/${q.accounts.id}`} className="text-indigo-700 hover:underline">
                      {q.accounts.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className={tdCls}>
                  {q.rfqs ? (
                    <Link href={`/rfqs/${q.rfqs.id}`} className="text-indigo-700 hover:underline">
                      {q.rfqs.rfq_number}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className={`${tdCls} text-right tabular-nums`}>{formatUsd(q.selling_price_usd)}</td>
                <td className={`${tdCls} text-right tabular-nums`}>
                  {q.margin_pct != null ? `${q.margin_pct}%` : "—"}
                </td>
                <td className={tdCls}>{formatDate(q.submitted_date)}</td>
                <td className={tdCls}>
                  <Badge value={q.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
      <RealtimeRefresher tables={["quotations"]} />
    </div>
  );
}
