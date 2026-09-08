export default function BillingPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-sm font-semibold text-foreground">Billing</h1>
      <div className="max-w-md rounded-md border border-border p-4">
        <div className="text-sm text-foreground">Free plan</div>
        <p className="mt-1 text-xs text-muted-foreground">
          This is a self-hosted demo instance. Connect a payment provider to enable paid plans.
        </p>
      </div>
    </div>
  );
}
