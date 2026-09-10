import { UserAvatar } from "@/components/shared/user-avatar";

export function AssigneeAvatars({
  users,
  className = "h-5 w-5",
  max = 3,
}: {
  users: { name: string; avatarUrl?: string | null }[];
  className?: string;
  max?: number;
}) {
  if (users.length === 0) return <UserAvatar user={null} className={className} />;

  const shown = users.slice(0, max);
  const overflow = users.length - shown.length;

  return (
    <div className="flex -space-x-2">
      {shown.map((u, i) => (
        <UserAvatar key={i} user={u} className={`${className} ring-2 ring-background`} />
      ))}
      {overflow > 0 && (
        <div
          className={`${className} flex items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground ring-2 ring-background`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
