import { listQuery } from "@/lib/crm/data";
import type { Account } from "@/lib/crm/types";
import { AccountsTable } from "@/components/accounts-table";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import { DbSetupBanner, ErrorBanner, PageHeader, PrimaryLink } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const { rows, dbMissing, errorMessage } = await listQuery<Account>((s) =>
    s.from("accounts").select("*").order("name"),
  );

  return (
    <div>
      <PageHeader
        title="Accounts"
        subtitle="Customer accounts with industry, targets and visit coverage."
        action={<PrimaryLink href="/accounts/new">+ New Account</PrimaryLink>}
      />
      {dbMissing ? <DbSetupBanner /> : null}
      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}
      <AccountsTable accounts={rows} />
      <RealtimeRefresher tables={["accounts"]} />
    </div>
  );
}
