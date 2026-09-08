import { ChangePasswordForm } from "@/components/settings/change-password-form";

export default function SecurityPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-sm font-semibold text-foreground">Security</h1>
      <ChangePasswordForm />
    </div>
  );
}
