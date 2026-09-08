export const ISSUE_STATUSES = ["Backlog", "Todo", "In Progress", "Done", "Cancelled"] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export const PROJECT_STATUSES = ["Backlog", "Planned", "Active", "Completed", "Cancelled"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PRIORITIES = ["No priority", "Low", "Medium", "High", "Urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const TIMEZONES = [
  "GMT-8:00 - Pacific Standard Time",
  "GMT-5:00 - Eastern Standard Time",
  "GMT+0:00 - Greenwich Mean Time",
  "GMT+1:00 - Central European Time",
  "GMT+5:30 - India Standard Time",
  "GMT+6:00 - Bangladesh Standard Time",
  "GMT+8:00 - China Standard Time",
  "GMT+9:00 - Japan Standard Time",
];

export const TEAM_ICONS = [
  "Layers",
  "Code",
  "Terminal",
  "Cpu",
  "Database",
  "Server",
  "GitBranch",
  "GitMerge",
  "GitPullRequest",
  "Bug",
  "Binary",
  "FileCode",
  "Braces",
  "Container",
  "Cloud",
  "HardDrive",
  "Network",
  "Wifi",
  "Lock",
  "KeyRound",
  "Shield",
  "Boxes",
  "Package",
  "Workflow",
  "Webhook",
  "Wrench",
  "Bot",
  "Rocket",
  "Zap",
  "Globe",
  "Command",
  "Router",
] as const;

export const TEAM_COLORS = [
  { key: "slate", label: "Slate", swatch: "bg-slate-500", selected: "border-slate-500 bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300" },
  { key: "red", label: "Red", swatch: "bg-red-500", selected: "border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300" },
  { key: "orange", label: "Orange", swatch: "bg-orange-500", selected: "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
  { key: "amber", label: "Amber", swatch: "bg-amber-500", selected: "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  { key: "emerald", label: "Emerald", swatch: "bg-emerald-500", selected: "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  { key: "teal", label: "Teal", swatch: "bg-teal-500", selected: "border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300" },
  { key: "cyan", label: "Cyan", swatch: "bg-cyan-500", selected: "border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300" },
  { key: "blue", label: "Blue", swatch: "bg-blue-500", selected: "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  { key: "indigo", label: "Indigo", swatch: "bg-indigo-500", selected: "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" },
  { key: "violet", label: "Violet", swatch: "bg-violet-500", selected: "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300" },
  { key: "purple", label: "Purple", swatch: "bg-purple-500", selected: "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
  { key: "pink", label: "Pink", swatch: "bg-pink-500", selected: "border-pink-500 bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300" },
] as const;

export type TeamColorKey = (typeof TEAM_COLORS)[number]["key"];

export const DATE_GRANULARITIES = ["Day", "Month", "Quarter", "Half-year", "Year"] as const;
export type DateGranularity = (typeof DATE_GRANULARITIES)[number];
