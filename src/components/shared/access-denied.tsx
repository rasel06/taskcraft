import { Lock } from "lucide-react";

export function AccessDenied({ message = "This team is private. Ask an admin for access." }: { message?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 text-faint-foreground">
      <Lock className="h-8 w-8" />
      <p className="text-sm font-medium text-muted-foreground">Access denied</p>
      <p className="text-xs">{message}</p>
    </div>
  );
}
