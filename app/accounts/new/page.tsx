import { AccountForm } from "@/components/forms/account-form";
import { Card, PageHeader } from "@/components/ui";

export default function NewAccountPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="New account" subtitle="Register a customer account." />
      <Card className="p-6">
        <AccountForm />
      </Card>
    </div>
  );
}
