"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { StatusIcon } from "@/components/shared/status-icon";
import { PriorityIcon } from "@/components/shared/priority-icon";
import { updateIssue } from "@/actions/issues";
import type { IssueView } from "@/lib/issue-view";

export function CycleIssuesManager({
  cycleId,
  cycleIssues,
  availableIssues,
}: {
  cycleId: string;
  cycleIssues: IssueView[];
  availableIssues: IssueView[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  async function add(issueId: string) {
    setPendingId(issueId);
    try {
      await updateIssue(issueId, { cycleId });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add issue");
    } finally {
      setPendingId(null);
    }
  }

  async function remove(issueId: string) {
    setPendingId(issueId);
    try {
      await updateIssue(issueId, { cycleId: null });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove issue");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-2 border-b border-border px-5 py-3">
      <Select value="" onValueChange={add}>
        <SelectTrigger className="h-8 w-72">
          <SelectValue placeholder={availableIssues.length ? "Add issue to cycle..." : "No more issues to add"} />
        </SelectTrigger>
        <SelectContent>
          {availableIssues.map((i) => (
            <SelectItem key={i.id} value={i.id} icon={<StatusIcon status={i.status} />}>
              {i.id} · {i.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {cycleIssues.length > 0 && (
        <ul className="flex flex-col gap-1">
          {cycleIssues.map((i) => (
            <li
              key={i.id}
              className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-sm"
            >
              <StatusIcon status={i.status} />
              <span className="text-faint-foreground">{i.id}</span>
              <span className="min-w-0 flex-1 truncate text-foreground">{i.title}</span>
              <PriorityIcon priority={i.priority} />
              <button
                onClick={() => remove(i.id)}
                disabled={pendingId === i.id}
                className="text-faint-foreground hover:text-red-400"
                title="Remove from cycle"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
