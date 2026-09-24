export const PROJECT_STATUS_CATEGORIES = [
  { key: "backlog", label: "Backlog", description: "Not planned yet" },
  { key: "planned", label: "Not started", description: "Planned / to do, not started yet" },
  { key: "started", label: "In progress", description: "Actively being worked on" },
  { key: "completed", label: "Completed", description: "Finished successfully" },
  { key: "canceled", label: "Canceled", description: "Stopped without finishing" },
] as const;

export type ProjectStatusCategory = (typeof PROJECT_STATUS_CATEGORIES)[number]["key"];

export type StatusKind = "project" | "issue";

export interface ProjectStatusDef {
  id: string;
  name: string;
  color: string;
  category: ProjectStatusCategory;
  position: number;
  isDefault: boolean;
}

export const PROJECT_STATUS_COLORS = [
  "#71717a",
  "#a1a1aa",
  "#6366f1",
  "#0ea5e9",
  "#14b8a6",
  "#10b981",
  "#84cc16",
  "#f59e0b",
  "#f97316",
  "#ef4444",
  "#ec4899",
  "#a855f7",
];

// Seeded into the ProjectStatus table the first time it's read while empty,
// matching the lifecycle the app shipped with.
export const DEFAULT_PROJECT_STATUSES: Omit<ProjectStatusDef, "id">[] = [
  { name: "Backlog", color: "#71717a", category: "backlog", position: 0, isDefault: false },
  { name: "Planned", color: "#a1a1aa", category: "planned", position: 1, isDefault: true },
  { name: "Active", color: "#6366f1", category: "started", position: 2, isDefault: false },
  { name: "Completed", color: "#10b981", category: "completed", position: 3, isDefault: false },
  { name: "Cancelled", color: "#ef4444", category: "canceled", position: 4, isDefault: false },
];

// Issue statuses (a project's workflow rows) share the same shape.
export type IssueStatusDef = ProjectStatusDef;

export interface IssueStatusPresetDef {
  id: string;
  name: string;
  color: string;
  category: ProjectStatusCategory;
  position: number;
  preselected: boolean;
}

// Seeded into the IssueStatusPreset library the first time it's read while
// empty. The five original columns are preselected for new projects; the rest
// are available to add.
export const DEFAULT_ISSUE_STATUS_PRESETS: Omit<IssueStatusPresetDef, "id">[] = [
  { name: "Backlog", color: "#71717a", category: "backlog", position: 0, preselected: true },
  { name: "Todo", color: "#3b82f6", category: "planned", position: 1, preselected: true },
  { name: "In Progress", color: "#f59e0b", category: "started", position: 2, preselected: true },
  { name: "In Review", color: "#a855f7", category: "started", position: 3, preselected: false },
  { name: "Testing", color: "#14b8a6", category: "started", position: 4, preselected: false },
  { name: "Blocked", color: "#f97316", category: "started", position: 5, preselected: false },
  { name: "Done", color: "#10b981", category: "completed", position: 6, preselected: true },
  { name: "Cancelled", color: "#ef4444", category: "canceled", position: 7, preselected: true },
];

export function isClosedCategory(category: string): boolean {
  return category === "completed" || category === "canceled";
}

const CATEGORY_KEYS = new Set<string>(PROJECT_STATUS_CATEGORIES.map((c) => c.key));

export function isProjectStatusCategory(value: string): value is ProjectStatusCategory {
  return CATEGORY_KEYS.has(value);
}

export function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}
