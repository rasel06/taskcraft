"use client";

import * as React from "react";
import { DEFAULT_ISSUE_STATUSES, type IssueStatusDef } from "@/lib/project-status";

interface IssueStatusesValue {
  statuses: IssueStatusDef[];
  canManage: boolean;
}

// Fallback for components rendered outside the app layout (none today); keeps
// them working with the original five columns, read-only.
const FALLBACK: IssueStatusesValue = {
  statuses: DEFAULT_ISSUE_STATUSES.map((s) => ({ ...s, id: s.name })),
  canManage: false,
};

const IssueStatusesContext = React.createContext<IssueStatusesValue>(FALLBACK);

// Provided once by the (app) layout so every board, dialog and icon reads the
// same database-driven issue workflow without prop drilling.
export function IssueStatusesProvider({
  statuses,
  canManage,
  children,
}: IssueStatusesValue & { children: React.ReactNode }) {
  const value = React.useMemo(() => ({ statuses, canManage }), [statuses, canManage]);
  return <IssueStatusesContext.Provider value={value}>{children}</IssueStatusesContext.Provider>;
}

export function useIssueStatuses() {
  return React.useContext(IssueStatusesContext);
}

export function defaultIssueStatusName(statuses: IssueStatusDef[]) {
  return (statuses.find((s) => s.isDefault) ?? statuses[0])?.name ?? "";
}
