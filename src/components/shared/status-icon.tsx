"use client";

import { ProjectStatusIcon } from "@/components/shared/project-status-icon";
import { useIssueStatusLookup } from "@/components/shared/issue-statuses-context";

// Icon for an issue status name, styled from its project's workflow (shape by
// category, color by the configured hex). Pass `projectId` when known.
export function StatusIcon({ status, projectId, className }: { status: string; projectId?: string | null; className?: string }) {
  const lookup = useIssueStatusLookup();
  const def = lookup(status, projectId);
  return <ProjectStatusIcon status={def ?? status} className={className} />;
}
