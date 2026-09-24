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

export const TEAM_TEXT_CLASS: Record<string, string> = {
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

// Group-level styling in a team's color: a tinted header and a left accent
// strip for rows belonging to the team. Static strings so Tailwind keeps them.
const TEAM_GROUP_CLASS: Record<string, { header: string; accent: string }> = {
  slate: { header: "bg-slate-50 text-slate-800 dark:bg-slate-900/60 dark:text-slate-200", accent: "border-l-slate-400" },
  red: { header: "bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-200", accent: "border-l-red-500" },
  orange: { header: "bg-orange-50 text-orange-800 dark:bg-orange-950/50 dark:text-orange-200", accent: "border-l-orange-500" },
  amber: { header: "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200", accent: "border-l-amber-500" },
  emerald: { header: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200", accent: "border-l-emerald-500" },
  teal: { header: "bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-200", accent: "border-l-teal-500" },
  cyan: { header: "bg-cyan-50 text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-200", accent: "border-l-cyan-500" },
  blue: { header: "bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200", accent: "border-l-blue-500" },
  indigo: { header: "bg-indigo-50 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200", accent: "border-l-indigo-500" },
  violet: { header: "bg-violet-50 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200", accent: "border-l-violet-500" },
  purple: { header: "bg-purple-50 text-purple-800 dark:bg-purple-950/50 dark:text-purple-200", accent: "border-l-purple-500" },
  pink: { header: "bg-pink-50 text-pink-800 dark:bg-pink-950/50 dark:text-pink-200", accent: "border-l-pink-500" },
};

export function teamGroupClass(color?: string) {
  return TEAM_GROUP_CLASS[color && color in TEAM_GROUP_CLASS ? color : "indigo"];
}

export function teamTextClass(color?: string) {
  const colorKey = color && TEAM_COLORS.some((c) => c.key === color) ? color : "indigo";
  return TEAM_TEXT_CLASS[colorKey];
}

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
