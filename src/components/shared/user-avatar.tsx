import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";

export function UserAvatar({
  user,
  className,
}: {
  user: { name: string; avatarUrl?: string | null } | null | undefined;
  className?: string;
}) {
  if (!user) {
    return (
      <Avatar className={className}>
        <AvatarFallback className="border border-dashed border-input bg-transparent text-faint-foreground">
          ?
        </AvatarFallback>
      </Avatar>
    );
  }
  return (
    <Avatar className={className}>
      {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
      <AvatarFallback>{initials(user.name)}</AvatarFallback>
    </Avatar>
  );
}
