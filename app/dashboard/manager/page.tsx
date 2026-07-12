import Link from "next/link";
import { listQuery } from "@/lib/crm/data";
import type { Account, Opportunity, VisitReport } from "@/lib/crm/types";
import { daysSince, formatDate, formatUsd } from "@/lib/crm/format";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import {
  Badge,
  Card,
  DbSetupBanner,
  ErrorBanner,
  KpiCard,
  PageHeader,
  TableShell,
  tdCls,
  thCls,
} from "@/components/ui";

export const dynamic = "force-dynamic";

const WHITE_SPACE_DAYS = 60;

function accountTarget(a: Account): number {
  return (
    (a.target_pumps ?? 0) +
    (a.target_seals ?? 0) +
    (a.target_hex ?? 0) +
    (a.target_service ?? 0) +
    (a.target_spares ?? 0)
  );
}

export default async function ManagerDashboardPage() {
  const [accounts, visits, opportunities] = await Promise.all([
    listQuery<Account>((s) => s.from("accounts").select("*").order("name")),
    listQuery<VisitReport>((s) => s.from("visit_reports").select("*, accounts(id, name, industry)")),
    listQuery<Opportunity>((s) => s.from("opportunities").select("*")),
  ]);

  const dbMissing = accounts.dbMissing || visits.dbMissing || opportunities.dbMissing;
  const errorMessage = accounts.errorMessage ?? visits.errorMessage ?? opportunities.errorMessage;

  // Coverage by segment: share of accounts in each segment visited in the last 60 days.
  const segments = new Map<string, { total: number; covered: number }>();
  for (const a of accounts.rows) {
    const key = a.segment ?? "Unsegmented";
    const entry = segments.get(key) ?? { total: 0, covered: 0 };
    entry.total += 1;
    const days = daysSince(a.last_visit_date);
    if (days != null && days <= WHITE_SPACE_DAYS) entry.covered += 1;
    segments.set(key, entry);
  }

  // White space: accounts not visited in 60+ days (or never).
  const whiteSpace = accounts.rows
    .map((a) => ({ account: a, days: daysSince(a.last_visit_date) }))
    .filter(({ days }) => days == null || days > WHITE_SPACE_DAYS)
    .sort((x, y) => (y.days ?? Infinity) - (x.days ?? Infinity));

  // Overdue next actions across all visit reports.
  const today = new Date().toISOString().slice(0, 10);
  const overdue = visits.rows
    .filter((v) => v.next_action_deadline && v.next_action_deadline < today && !v.converted_to_enquiry)
    .sort((a, b) => (a.next_action_deadline! < b.next_action_deadline! ? -1 : 1));

  // Territory plan per owner: target vs open pipeline vs won.
  const owners = new Map<string, { target: number; pipeline: number; won: number }>();
  const accountOwner = new Map(accounts.rows.map((a) => [a.id, a.owner_name ?? "Unassigned"]));
  for (const a of accounts.rows) {
    const key = a.owner_name ?? "Unassigned";
    const entry = owners.get(key) ?? { target: 0, pipeline: 0, won: 0 };
    entry.target += accountTarget(a);
    owners.set(key, entry);
  }
  for (const o of opportunities.rows) {
    const key = (o.account_id && accountOwner.get(o.account_id)) || "Unassigned";
    const entry = owners.get(key) ?? { target: 0, pipeline: 0, won: 0 };
    if (o.stage === "Awarded") entry.won += o.value_usd ?? 0;
    else if (o.stage !== "Lost") entry.pipeline += o.value_usd ?? 0;
    owners.set(key, entry);
  }

  // EPC / consultant influence per account.
  const influence = accounts.rows
    .map((a) => ({ account: a, count: a.epc_consultants?.length ?? 0 }))
    .filter(({ count }) => count > 0)
    .sort((x, y) => y.count - x.count);

  return (
    <div>
      <PageHeader
        title="Sales manager dashboard"
        subtitle="Team coverage, white space and governance — live from the database."
      />
      {dbMissing ? <DbSetupBanner /> : null}
      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Accounts in white space"
          value={whiteSpace.length}
          hint={`No visit in ${WHITE_SPACE_DAYS}+ days`}
        />
        <KpiCard
          label="Overdue next actions"
          value={overdue.length}
          hint={overdue.length === 0 ? "Team is on top of follow-ups" : "Past deadline, not converted"}
        />
        <KpiCard
          label="Open pipeline"
          value={formatUsd(
            opportunities.rows
              .filter((o) => !["Awarded", "Lost"].includes(o.stage))
              .reduce((s, o) => s + (o.value_usd ?? 0), 0),
          )}
          hint="All owners"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            Visit coverage by segment <span className="font-normal text-slate-400">(last {WHITE_SPACE_DAYS} days)</span>
          </h2>
          {segments.size === 0 ? (
            <p className="text-sm text-slate-500">No accounts yet.</p>
          ) : (
            <div className="space-y-3">
              {[...segments.entries()].map(([segment, { total, covered }]) => (
                <div key={segment} className="flex items-center gap-3">
                  <span className="w-36 shrink-0 truncate text-sm text-slate-600">{segment}</span>
                  <div className="h-5 flex-1 overflow-hidden rounded bg-slate-100">
                    <div
                      className="h-full rounded bg-emerald-500"
                      style={{ width: `${(covered / total) * 100}%` }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right text-sm tabular-nums text-slate-700">
                    {covered}/{total}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            EPC / consultant influence
          </h2>
          {influence.length === 0 ? (
            <p className="text-sm text-slate-500">No consultant relationships recorded.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {influence.map(({ account, count }) => (
                <li key={account.id} className="flex items-center justify-between gap-2">
                  <Link href={`/accounts/${account.id}`} className="text-indigo-700 hover:underline">
                    {account.name}
                  </Link>
                  <span className="text-slate-600">
                    {count} consultant{count > 1 ? "s" : ""} ·{" "}
                    <span className="text-xs text-slate-400">
                      {account.epc_consultants?.join(", ")}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <h2 className="mb-2 mt-8 text-sm font-semibold text-slate-900">
        White space — no visit in {WHITE_SPACE_DAYS}+ days
      </h2>
      {whiteSpace.length === 0 ? (
        <Card className="p-5 text-sm text-slate-500">
          Full coverage — every account was visited within {WHITE_SPACE_DAYS} days.
        </Card>
      ) : (
        <TableShell>
          <thead className="bg-slate-50">
            <tr>
              <th className={thCls}>Account</th>
              <th className={thCls}>Industry</th>
              <th className={thCls}>Owner</th>
              <th className={thCls}>Last visit</th>
              <th className={thCls}>Days silent</th>
              <th className={`${thCls} text-right`}>Annual target</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {whiteSpace.map(({ account, days }) => (
              <tr key={account.id}>
                <td className={tdCls}>
                  <Link href={`/accounts/${account.id}`} className="font-medium text-indigo-700 hover:underline">
                    {account.name}
                  </Link>
                </td>
                <td className={tdCls}>
                  <Badge value={account.industry} />
                </td>
                <td className={tdCls}>{account.owner_name ?? "—"}</td>
                <td className={tdCls}>{formatDate(account.last_visit_date)}</td>
                <td className={tdCls}>{days == null ? "never visited" : `${days} days`}</td>
                <td className={`${tdCls} text-right tabular-nums`}>{formatUsd(accountTarget(account))}</td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      <h2 className="mb-2 mt-8 text-sm font-semibold text-slate-900">Overdue next actions</h2>
      {overdue.length === 0 ? (
        <Card className="p-5 text-sm text-slate-500">Nothing overdue — clean follow-up book.</Card>
      ) : (
        <TableShell>
          <thead className="bg-slate-50">
            <tr>
              <th className={thCls}>Account</th>
              <th className={thCls}>Next action</th>
              <th className={thCls}>Owner</th>
              <th className={thCls}>Deadline</th>
              <th className={thCls}>Visit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {overdue.map((v) => (
              <tr key={v.id}>
                <td className={tdCls}>{v.accounts?.name ?? "—"}</td>
                <td className={tdCls}>{v.next_action ?? "—"}</td>
                <td className={tdCls}>{v.next_action_owner ?? "—"}</td>
                <td className={`${tdCls} font-medium text-rose-600`}>
                  {formatDate(v.next_action_deadline)}
                </td>
                <td className={tdCls}>
                  <Link href={`/visits/${v.id}`} className="text-indigo-700 hover:underline">
                    view
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      <h2 className="mb-2 mt-8 text-sm font-semibold text-slate-900">
        Territory plan — target vs pipeline vs won, per sales engineer
      </h2>
      <TableShell>
        <thead className="bg-slate-50">
          <tr>
            <th className={thCls}>Sales engineer</th>
            <th className={`${thCls} text-right`}>Annual target</th>
            <th className={`${thCls} text-right`}>Open pipeline</th>
            <th className={`${thCls} text-right`}>Won</th>
            <th className={`${thCls} text-right`}>Coverage</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {[...owners.entries()].map(([owner, { target, pipeline, won }]) => (
            <tr key={owner}>
              <td className={`${tdCls} font-medium`}>{owner}</td>
              <td className={`${tdCls} text-right tabular-nums`}>{formatUsd(target)}</td>
              <td className={`${tdCls} text-right tabular-nums`}>{formatUsd(pipeline)}</td>
              <td className={`${tdCls} text-right tabular-nums`}>{formatUsd(won)}</td>
              <td className={`${tdCls} text-right tabular-nums`}>
                {target > 0 ? `${Math.round(((pipeline + won) / target) * 100)}%` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </TableShell>
      <RealtimeRefresher tables={["accounts", "visit_reports", "opportunities"]} />
    </div>
  );
}
