import { SignalHigh, SignalMedium, SignalLow, SignalZero, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function PriorityIcon({ priority, className }: { priority: string; className?: string }) {
  const cls = cn("h-3.5 w-3.5", className);
  switch (priority) {
    case "Urgent":
      return <AlertTriangle className={cn(cls, "text-amber-500")} />;
    case "High":
      return <SignalHigh className={cn(cls, "text-foreground")} />;
    case "Medium":
      return <SignalMedium className={cn(cls, "text-muted-foreground")} />;
    case "Low":
      return <SignalLow className={cn(cls, "text-muted-foreground")} />;
    default:
      return <SignalZero className={cn(cls, "text-faint-foreground")} />;
  }
}
