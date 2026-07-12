import Link from "next/link";
import { listQuery } from "@/lib/crm/data";
import type { Contact } from "@/lib/crm/types";
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

export default async function ContactsPage() {
  const { rows, dbMissing, errorMessage } = await listQuery<Contact>((s) =>
    s.from("contacts").select("*, accounts(id, name)").order("full_name"),
  );

  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle="People at customer accounts and their role in the purchase."
        action={<PrimaryLink href="/contacts/new">+ New Contact</PrimaryLink>}
      />
      {dbMissing ? <DbSetupBanner /> : null}
      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

      {rows.length === 0 ? (
        <EmptyState
          title="No contacts yet"
          action={<PrimaryLink href="/contacts/new">+ New Contact</PrimaryLink>}
        />
      ) : (
        <TableShell>
          <thead className="bg-slate-50">
            <tr>
              <th className={thCls}>Name</th>
              <th className={thCls}>Account</th>
              <th className={thCls}>Title</th>
              <th className={thCls}>Department</th>
              <th className={thCls}>Role in purchase</th>
              <th className={thCls}>Influence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((c) => (
              <tr key={c.id} className="transition hover:bg-indigo-50/40">
                <td className={tdCls}>
                  <Link href={`/contacts/${c.id}/edit`} className="font-medium text-indigo-700 hover:underline">
                    {c.full_name}
                  </Link>
                  <p className="text-xs text-slate-400">{c.email ?? ""}</p>
                </td>
                <td className={tdCls}>
                  {c.accounts ? (
                    <Link href={`/accounts/${c.accounts.id}`} className="text-indigo-700 hover:underline">
                      {c.accounts.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className={tdCls}>{c.title ?? "—"}</td>
                <td className={tdCls}>{c.department ?? "—"}</td>
                <td className={tdCls}>{c.role_in_purchase ?? "—"}</td>
                <td className={tdCls}>{c.influence_level ? <Badge value={c.influence_level} /> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
      <RealtimeRefresher tables={["contacts"]} />
    </div>
  );
}
