import Link from "next/link";
import { notFound } from "next/navigation";
import { getById, listQuery } from "@/lib/crm/data";
import type { Account, Contact, Opportunity, VisitReport } from "@/lib/crm/types";
import { formatDate, formatUsd } from "@/lib/crm/format";
import { deleteAccount } from "@/lib/crm/actions";
import { ConfirmDelete } from "@/components/confirm-delete";
import {
  Badge,
  Card,
  DbSetupBanner,
  EmptyState,
  PageHeader,
  PrimaryLink,
  SecondaryLink,
  TableShell,
  tdCls,
  thCls,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { row: account, dbMissing } = await getById<Account>("accounts", id, "*");
  if (dbMissing) {
    return (
      <div>
        <PageHeader title="Account" />
        <DbSetupBanner />
      </div>
    );
  }
  if (!account) notFound();

  const [contacts, visits, opportunities] = await Promise.all([
    listQuery<Contact>((s) =>
      s.from("contacts").select("*").eq("account_id", id).order("full_name"),
    ),
    listQuery<VisitReport>((s) =>
      s.from("visit_reports").select("*").eq("account_id", id).order("visit_date", { ascending: false }),
    ),
    listQuery<Opportunity>((s) =>
      s.from("opportunities").select("*").eq("account_id", id).order("created_at", { ascending: false }),
    ),
  ]);

  const targets: Array<[string, number]> = [
    ["Pumps", account.target_pumps],
    ["Seals", account.target_seals],
    ["Heat Exchangers", account.target_hex],
    ["Service", account.target_service],
    ["Spares", account.target_spares],
  ];

  return (
    <div>
      <PageHeader
        title={account.name}
        subtitle={`${account.industry}${account.segment ? ` · ${account.segment}` : ""} · ${
          [account.city, account.country].filter(Boolean).join(", ") || "location n/a"
        }`}
        action={
          <div className="flex gap-2">
            <SecondaryLink href={`/accounts/${id}/edit`}>Edit</SecondaryLink>
            <PrimaryLink href={`/visits/new?account=${id}`}>+ Log visit</PrimaryLink>
            <ConfirmDelete action={deleteAccount} id={id} what={account.name} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Profile</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Type</dt>
              <dd>{account.account_type ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Owner</dt>
              <dd>{account.owner_name ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Last visit</dt>
              <dd>{formatDate(account.last_visit_date)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Key plants</dt>
              <dd className="text-right">{account.key_plants?.join(", ") || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">EPC / consultants</dt>
              <dd className="text-right">{account.epc_consultants?.join(", ") || "—"}</dd>
            </div>
          </dl>
          {account.installed_base_notes ? (
            <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              {account.installed_base_notes}
            </p>
          ) : null}
          <h3 className="mb-2 mt-5 text-sm font-semibold text-slate-900">Annual targets</h3>
          <ul className="space-y-1.5 text-sm">
            {targets.map(([label, value]) => (
              <li key={label} className="flex justify-between">
                <span className="text-slate-500">{label}</span>
                <span className="font-medium tabular-nums">{formatUsd(value)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Contacts ({contacts.rows.length})
              </h2>
              <Link
                href={`/contacts/new?account=${id}`}
                className="text-sm font-medium text-indigo-600 hover:underline"
              >
                + Add contact
              </Link>
            </div>
            {contacts.rows.length === 0 ? (
              <EmptyState title="No contacts recorded" />
            ) : (
              <TableShell>
                <thead className="bg-slate-50">
                  <tr>
                    <th className={thCls}>Name</th>
                    <th className={thCls}>Title</th>
                    <th className={thCls}>Role</th>
                    <th className={thCls}>Influence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {contacts.rows.map((c) => (
                    <tr key={c.id}>
                      <td className={tdCls}>
                        <Link href={`/contacts/${c.id}/edit`} className="font-medium text-indigo-700 hover:underline">
                          {c.full_name}
                        </Link>
                      </td>
                      <td className={tdCls}>{c.title ?? "—"}</td>
                      <td className={tdCls}>{c.role_in_purchase ?? "—"}</td>
                      <td className={tdCls}>
                        {c.influence_level ? <Badge value={c.influence_level} /> : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold text-slate-900">
              Visit reports ({visits.rows.length})
            </h2>
            {visits.rows.length === 0 ? (
              <EmptyState title="No visits logged for this account" />
            ) : (
              <TableShell>
                <thead className="bg-slate-50">
                  <tr>
                    <th className={thCls}>Date</th>
                    <th className={thCls}>Purpose</th>
                    <th className={thCls}>Status</th>
                    <th className={thCls}>Converted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {visits.rows.map((v) => (
                    <tr key={v.id}>
                      <td className={tdCls}>
                        <Link href={`/visits/${v.id}`} className="font-medium text-indigo-700 hover:underline">
                          {formatDate(v.visit_date)}
                        </Link>
                      </td>
                      <td className={tdCls}>{v.visit_purpose}</td>
                      <td className={tdCls}>
                        <Badge value={v.visit_status} />
                      </td>
                      <td className={tdCls}>
                        {v.converted_to_enquiry ? <Badge value="Converted" /> : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold text-slate-900">
              Opportunities ({opportunities.rows.length})
            </h2>
            {opportunities.rows.length === 0 ? (
              <EmptyState title="No opportunities for this account" />
            ) : (
              <TableShell>
                <thead className="bg-slate-50">
                  <tr>
                    <th className={thCls}>Title</th>
                    <th className={thCls}>Stage</th>
                    <th className={`${thCls} text-right`}>Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {opportunities.rows.map((o) => (
                    <tr key={o.id}>
                      <td className={tdCls}>
                        <Link href={`/opportunities/${o.id}`} className="font-medium text-indigo-700 hover:underline">
                          {o.title}
                        </Link>
                      </td>
                      <td className={tdCls}>
                        <Badge value={o.stage} />
                      </td>
                      <td className={`${tdCls} text-right tabular-nums`}>{formatUsd(o.value_usd)}</td>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
