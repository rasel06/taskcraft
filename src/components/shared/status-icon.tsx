"use client";

import { ProjectStatusIcon } from "@/components/shared/project-status-icon";
import { useIssueStatuses } from "@/components/shared/issue-statuses-context";

// Icon for an issue status name, styled from the database-driven workflow
// (shape by category, color by the configured hex).
export function StatusIcon({ status, className }: { status: string; className?: string }) {
  const { statuses } = useIssueStatuses();
  return <ProjectStatusIcon status={status} statuses={statuses} className={className} />;
}
