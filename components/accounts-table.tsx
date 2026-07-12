import Link from "next/link";
import type { Account } from "@/lib/crm/types";
import { formatDate, formatUsd } from "@/lib/crm/format";
import { Badge, EmptyState, PrimaryLink, TableShell, tdCls, thCls } from "@/components/ui";

function annualTarget(a: Account): number {
  return (
    (a.target_pumps ?? 0) +
    (a.target_seals ?? 0) +
    (a.target_hex ?? 0) +
    (a.target_service ?? 0) +
    (a.target_spares ?? 0)
  );
}

export function AccountsTable({ accounts }: { accounts: Account[] }) {
  if (accounts.length === 0) {
    return (
      <EmptyState
        title="No accounts yet"
        hint="Accounts are the root of the CRM — every visit, enquiry and opportunity hangs off one."
        action={<PrimaryLink href="/accounts/new">+ New Account</PrimaryLink>}
      />
    );
  }
  return (
    <TableShell>
      <thead className="bg-slate-50">
        <tr>
          <th className={thCls}>Account</th>
          <th className={thCls}>Industry</th>
          <th className={thCls}>Type</th>
          <th className={thCls}>Owner</th>
          <th className={thCls}>Last visit</th>
          <th className={`${thCls} text-right`}>Annual target</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 bg-white">
        {accounts.map((a) => (
          <tr key={a.id} className="transition hover:bg-indigo-50/40">
            <td className={tdCls}>
              <Link href={`/accounts/${a.id}`} className="font-medium text-indigo-700 hover:underline">
                {a.name}
              </Link>
              <p className="text-xs text-slate-400">
                {[a.city, a.country].filter(Boolean).join(", ") || "—"}
              </p>
            </td>
            <td className={tdCls}>
              <Badge value={a.industry} />
            </td>
            <td className={tdCls}>{a.account_type ?? "—"}</td>
            <td className={tdCls}>{a.owner_name ?? "—"}</td>
            <td className={tdCls}>{formatDate(a.last_visit_date)}</td>
            <td className={`${tdCls} text-right font-medium tabular-nums`}>
              {formatUsd(annualTarget(a))}
            </td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}
