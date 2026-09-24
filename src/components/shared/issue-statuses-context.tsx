"use client";

import * as React from "react";
import { PROJECT_STATUS_CATEGORIES, type IssueStatusDef } from "@/lib/project-status";

interface IssueStatusesValue {
  // Each visible project's own issue workflow, in column order.
  byProject: Record<string, IssueStatusDef[]>;
  // Projects whose workflow the current user may manage.
  manageableProjectIds: string[];
}

const IssueStatusesContext = React.createContext<IssueStatusesValue>({ byProject: {}, manageableProjectIds: [] });

// Provided once by the (app) layout so every board, dialog and icon reads the
// database-driven, per-project issue workflows without prop drilling.
export function IssueStatusesProvider({
  byProject,
  manageableProjectIds,
  children,
}: IssueStatusesValue & { children: React.ReactNode }) {
  const value = React.useMemo(() => ({ byProject, manageableProjectIds }), [byProject, manageableProjectIds]);
  return <IssueStatusesContext.Provider value={value}>{children}</IssueStatusesContext.Provider>;
}

// Adds one project's workflow (and whether the user can manage it) on top of
// the layout's map. Project pages use this because a user can belong to a
// project whose team isn't in their visible-teams list, which is what the
// layout loads.
export function ProjectIssueStatusesProvider({
  projectId,
  statuses,
  canManage,
  children,
}: {
  projectId: string;
  statuses: IssueStatusDef[];
  canManage: boolean;
  children: React.ReactNode;
}) {
  const parent = React.useContext(IssueStatusesContext);
  const value = React.useMemo(
    () => ({
      byProject: { ...parent.byProject, [projectId]: statuses },
      manageableProjectIds: canManage
        ? Array.from(new Set([...parent.manageableProjectIds, projectId]))
        : parent.manageableProjectIds.filter((id) => id !== projectId),
    }),
    [parent, projectId, statuses, canManage],
  );
  return <IssueStatusesContext.Provider value={value}>{children}</IssueStatusesContext.Provider>;
}

const EMPTY: IssueStatusDef[] = [];

// One project's workflow and whether the current user can manage it.
export function useProjectIssueStatuses(projectId: string | null | undefined) {
  const { byProject, manageableProjectIds } = React.useContext(IssueStatusesContext);
  return {
    statuses: (projectId && byProject[projectId]) || EMPTY,
    canManage: !!projectId && manageableProjectIds.includes(projectId),
  };
}

// Find a status definition by name, preferring the given project's workflow.
// Without a project (or when it isn't loaded), the first project that has a
// status with that name supplies the icon/color.
export function useIssueStatusLookup() {
  const { byProject } = React.useContext(IssueStatusesContext);
  return React.useCallback(
    (name: string, projectId?: string | null) => {
      const own = projectId ? byProject[projectId]?.find((s) => s.name === name) : undefined;
      if (own) return own;
      for (const list of Object.values(byProject)) {
        const match = list.find((s) => s.name === name);
        if (match) return match;
      }
      return undefined;
    },
    [byProject],
  );
}

const CATEGORY_RANK: Record<string, number> = Object.fromEntries(PROJECT_STATUS_CATEGORIES.map((c, i) => [c.key, i]));

// Columns for a board or report that spans several projects: one column per
// distinct status name, ordered by category (backlog → canceled), then by the
// position it has in the projects' workflows.
export function mergeIssueStatusColumns(lists: IssueStatusDef[][]): IssueStatusDef[] {
  const byName = new Map<string, IssueStatusDef>();
  for (const list of lists) {
    for (const s of list) {
      const seen = byName.get(s.name);
      if (!seen || s.position < seen.position) byName.set(s.name, s);
    }
  }
  return Array.from(byName.values()).sort(
    (a, b) =>
      (CATEGORY_RANK[a.category] ?? 99) - (CATEGORY_RANK[b.category] ?? 99) ||
      a.position - b.position ||
      a.name.localeCompare(b.name),
  );
}

// Merged columns for every workflow the user can see (reports).
export function useAllIssueStatusColumns() {
  const { byProject } = React.useContext(IssueStatusesContext);
  return React.useMemo(() => mergeIssueStatusColumns(Object.values(byProject)), [byProject]);
}

// Merged columns for a specific set of projects (cross-project boards).
export function useIssueStatusColumns(projectIds: string[]) {
  const { byProject } = React.useContext(IssueStatusesContext);
  const key = Array.from(new Set(projectIds)).sort().join(",");
  return React.useMemo(
    () => mergeIssueStatusColumns(key ? key.split(",").map((id) => byProject[id] ?? []) : []),
    [key, byProject],
  );
}

export function defaultIssueStatusName(statuses: IssueStatusDef[]) {
  return (statuses.find((s) => s.isDefault) ?? statuses[0])?.name ?? "";
}
