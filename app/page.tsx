import Link from "next/link";
import { listQuery } from "@/lib/crm/data";
import type { Account, Opportunity, VisitReport } from "@/lib/crm/types";
import { formatUsd } from "@/lib/crm/format";
import { AccountsTable } from "@/components/accounts-table";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import {
  DbSetupBanner,
  ErrorBanner,
  KpiCard,
  PageHeader,
  PrimaryLink,
  SecondaryLink,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [accounts, opportunities, visits] = await Promise.all([
    listQuery<Account>((s) => s.from("accounts").select("*").order("name")),
    listQuery<Opportunity>((s) => s.from("opportunities").select("*")),
    listQuery<VisitReport>((s) => s.from("visit_reports").select("*")),
  ]);

  const dbMissing = accounts.dbMissing || opportunities.dbMissing || visits.dbMissing;
  const errorMessage = accounts.errorMessage ?? opportunities.errorMessage ?? visits.errorMessage;

  const openOpps = opportunities.rows.filter((o) => !["Awarded", "Lost"].includes(o.stage));
  const pipelineValue = openOpps.reduce((sum, o) => sum + (o.value_usd ?? 0), 0);
  const visitsDone = visits.rows.filter((v) => v.visit_status === "done").length;
  const visitsPlanned = visits.rows.filter((v) => v.visit_status === "planned").length;

  return (
    <div>
      <PageHeader
        title="Pipeline overview"
        subtitle="Live view of accounts, funnel value and visit activity — no login needed in demo mode."
        action={
          <div className="flex gap-2">
            <SecondaryLink href="/opportunities">View funnel</SecondaryLink>
            <PrimaryLink href="/visits/new">+ New Visit Report</PrimaryLink>
          </div>
        }
      />

      {dbMissing ? <DbSetupBanner /> : null}
      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Accounts" value={accounts.rows.length} hint="Active customer accounts" />
        <KpiCard
          label="Open pipeline"
          value={formatUsd(pipelineValue)}
          hint={`${openOpps.length} open opportunities`}
        />
        <KpiCard
          label="Visits done"
          value={visitsDone}
          hint={visitsDone === 0 ? "No visits logged yet" : "All time"}
        />
        <KpiCard
          label="Visits planned"
          value={visitsPlanned}
          hint={visitsPlanned === 0 ? "Nothing scheduled" : "Awaiting completion"}
        />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Accounts</h2>
        <Link href="/accounts" className="text-sm font-medium text-indigo-600 hover:underline">
          Manage accounts →
        </Link>
      </div>
      <AccountsTable accounts={accounts.rows} />
      <RealtimeRefresher tables={["accounts", "opportunities", "visit_reports"]} />
    </div>
  );
}
