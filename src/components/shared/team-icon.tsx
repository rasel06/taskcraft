import {
  Layers,
  Code,
  Terminal,
  Cpu,
  Database,
  Server,
  GitBranch,
  GitMerge,
  GitPullRequest,
  Bug,
  Binary,
  FileCode,
  Braces,
  Container,
  Cloud,
  HardDrive,
  Network,
  Wifi,
  Lock,
  KeyRound,
  Shield,
  Boxes,
  Package,
  Workflow,
  Webhook,
  Wrench,
  Bot,
  Rocket,
  Zap,
  Globe,
  Command,
  Router,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TEAM_COLORS } from "@/lib/constants";

export const TEAM_ICON_MAP: Record<string, LucideIcon> = {
  Layers,
  Code,
  Terminal,
  Cpu,
  Database,
  Server,
  GitBranch,
  GitMerge,
  GitPullRequest,
  Bug,
  Binary,
  FileCode,
  Braces,
  Container,
  Cloud,
  HardDrive,
  Network,
  Wifi,
  Lock,
  KeyRound,
  Shield,
  Boxes,
  Package,
  Workflow,
  Webhook,
  Wrench,
  Bot,
  Rocket,
  Zap,
  Globe,
  Command,
  Router,
};

const TEAM_TEXT_CLASS: Record<string, string> = {
  slate: "text-slate-600 dark:text-slate-400",
  red: "text-red-600 dark:text-red-400",
  orange: "text-orange-600 dark:text-orange-400",
  amber: "text-amber-600 dark:text-amber-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
  teal: "text-teal-600 dark:text-teal-400",
  cyan: "text-cyan-600 dark:text-cyan-400",
  blue: "text-blue-600 dark:text-blue-400",
  indigo: "text-indigo-600 dark:text-indigo-400",
  violet: "text-violet-600 dark:text-violet-400",
  purple: "text-purple-600 dark:text-purple-400",
  pink: "text-pink-600 dark:text-pink-400",
};

const TEAM_BG_CLASS: Record<string, string> = {
  slate: "bg-slate-100 dark:bg-slate-900",
  red: "bg-red-100 dark:bg-red-950",
  orange: "bg-orange-100 dark:bg-orange-950",
  amber: "bg-amber-100 dark:bg-amber-950",
  emerald: "bg-emerald-100 dark:bg-emerald-950",
  teal: "bg-teal-100 dark:bg-teal-950",
  cyan: "bg-cyan-100 dark:bg-cyan-950",
  blue: "bg-blue-100 dark:bg-blue-950",
  indigo: "bg-indigo-100 dark:bg-indigo-950",
  violet: "bg-violet-100 dark:bg-violet-950",
  purple: "bg-purple-100 dark:bg-purple-950",
  pink: "bg-pink-100 dark:bg-pink-950",
};

export function TeamIcon({ icon, color, className }: { icon: string; color?: string; className?: string }) {
  const Icon = TEAM_ICON_MAP[icon] ?? Layers;
  return <Icon className={cn(color && TEAM_TEXT_CLASS[color], className)} />;
}

export function TeamIconBadge({
  icon,
  color,
  className,
  iconClassName,
}: {
  icon: string;
  color?: string;
  className?: string;
  iconClassName?: string;
}) {
  const colorKey = color && TEAM_COLORS.some((c) => c.key === color) ? color : "indigo";
  return (
    <span className={cn("flex items-center justify-center rounded", TEAM_BG_CLASS[colorKey], className)}>
      <TeamIcon icon={icon} color={colorKey} className={iconClassName} />
    </span>
  );
}
