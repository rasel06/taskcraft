import { getCurrentUser } from "@/lib/auth";
import { ProfileForm } from "@/components/settings/profile-form";

export default async function ProfileSettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    isWorkspaceAdmin: user.isWorkspaceAdmin,
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-sm font-semibold text-foreground">Profile</h1>
      <ProfileForm user={safeUser} />
    </div>
  );
}
