import { SignalHigh, SignalMedium, SignalLow, SignalZero, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

// One color per priority level, from most to least severe:
// Urgent red, High orange, Medium amber, Low blue, No priority gray.
export const PRIORITY_STYLES: Record<string, { icon: string; badge: string; accent: string; tint: string }> = {
  Urgent: {
    icon: "text-red-600 dark:text-red-400",
    badge: "border-red-700 bg-red-600 text-white",
    accent: "border-l-red-600 hover:border-l-red-600",
    tint: "bg-red-50 dark:bg-red-950/30",
  },
  High: {
    icon: "text-orange-500 dark:text-orange-400",
    badge: "border-orange-600 bg-orange-500 text-white",
    accent: "border-l-orange-500 hover:border-l-orange-500",
    tint: "bg-orange-50 dark:bg-orange-950/25",
  },
  Medium: {
    icon: "text-amber-500 dark:text-amber-400",
    badge: "border-amber-500 bg-amber-400 text-amber-950",
    accent: "border-l-amber-400 hover:border-l-amber-400",
    tint: "bg-amber-50/60 dark:bg-amber-950/20",
  },
  Low: {
    icon: "text-sky-500 dark:text-sky-400",
    badge: "border-sky-600 bg-sky-500 text-white",
    accent: "border-l-sky-500 hover:border-l-sky-500",
    tint: "bg-background",
  },
  "No priority": {
    icon: "text-faint-foreground",
    badge: "border-border bg-muted text-muted-foreground",
    accent: "border-l-border hover:border-l-border",
    tint: "bg-background",
  },
};

export function priorityStyle(priority: string) {
  return PRIORITY_STYLES[priority] ?? PRIORITY_STYLES["No priority"];
}

export function PriorityIcon({ priority, className }: { priority: string; className?: string }) {
  const cls = cn("h-4 w-4 shrink-0", priorityStyle(priority).icon, className);
  switch (priority) {
    case "Urgent":
      return <AlertTriangle className={cls} strokeWidth={2.5} />;
    case "High":
      return <SignalHigh className={cls} strokeWidth={2.75} />;
    case "Medium":
      return <SignalMedium className={cls} strokeWidth={2.75} />;
    case "Low":
      return <SignalLow className={cls} strokeWidth={2.75} />;
    default:
      return <SignalZero className={cls} strokeWidth={2.5} />;
  }
}

export function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  return (
    <span
      title={`Priority: ${priority}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-1 text-[11px] font-semibold leading-none shadow-sm",
        priorityStyle(priority).badge,
        className,
      )}
    >
      {/* Solid badge background already carries the color; draw the icon in the text color. */}
      <PriorityIcon priority={priority} className="h-3.5 w-3.5 text-current dark:text-current" />
      {priority}
    </span>
  );
}
