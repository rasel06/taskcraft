import { Circle, CircleDot, CircleCheck, CircleSlash, CircleDashed } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatusIcon({ status, className }: { status: string; className?: string }) {
  const cls = cn("h-3.5 w-3.5", className);
  switch (status) {
    case "Todo":
      return <Circle className={cn(cls, "text-muted-foreground")} />;
    case "In Progress":
      return <CircleDot className={cn(cls, "text-amber-500")} />;
    case "Active":
      return <CircleDot className={cn(cls, "text-indigo-500")} />;
    case "Done":
    case "Completed":
      return <CircleCheck className={cn(cls, "text-emerald-500")} />;
    case "Cancelled":
      return <CircleSlash className={cn(cls, "text-faint-foreground")} />;
    default:
      return <CircleDashed className={cn(cls, "text-muted-foreground")} />;
  }
}
