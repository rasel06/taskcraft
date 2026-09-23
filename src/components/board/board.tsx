"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ListFilter,
  ArrowUpDown,
  LayoutGrid,
  Rows3,
  Plus,
  X,
  MoreHorizontal,
  Pencil,
  ArrowLeft,
  ArrowRight,
  Star,
  Trash2,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IssueCard } from "@/components/issue/issue-card";
import { IssueRow } from "@/components/issue/issue-row";
import { StatusIcon } from "@/components/shared/status-icon";
import { PriorityIcon } from "@/components/shared/priority-icon";
import { updateIssue } from "@/actions/issues";
import { PRIORITIES } from "@/lib/constants";
import { useIssueStatuses } from "@/components/shared/issue-statuses-context";
import {
  StatusFormDialog,
  DeleteStatusDialog,
  useStatusMutations,
  useOptimisticStatusOrder,
  moveStatusId,
} from "@/components/settings/workflow-statuses";
import type { IssueStatusDef } from "@/lib/project-status";
import { cn } from "@/lib/utils";
import type { IssueView } from "@/lib/issue-view";

type GroupBy = "status" | "priority" | "assignee";
type OrderBy = "created" | "priority" | "title";
type Layout = "board" | "list";

const PRIORITY_RANK: Record<string, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3, "No priority": 4 };

function groupKeys(issue: IssueView, groupBy: GroupBy): string[] {
  if (groupBy === "status") return [issue.status];
  if (groupBy === "priority") return [issue.priority];
  return issue.assignees.length > 0 ? issue.assignees.map((a) => a.name) : ["Unassigned"];
}

export function Board({ issues, showProject = false }: { issues: IssueView[]; showProject?: boolean }) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [groupBy, setGroupBy] = React.useState<GroupBy>("status");
  const [orderBy, setOrderBy] = React.useState<OrderBy>("created");
  const [layout, setLayout] = React.useState<Layout>("board");
  const [dragIssueId, setDragIssueId] = React.useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = React.useState<string[]>([]);
  const { statuses: serverStatuses, canManage } = useIssueStatuses();
  const { ordered: statuses, setOrder } = useOptimisticStatusOrder(serverStatuses);
  const { reorder } = useStatusMutations("issue");
  // Column drag (reordering statuses) is separate from card drag (moving an issue).
  const [dragStatusId, setDragStatusId] = React.useState<string | null>(null);
  const [overStatusKey, setOverStatusKey] = React.useState<string | null>(null);
  const canReorder = canManage && groupBy === "status";

  function dropStatusOn(targetName: string) {
    const target = statuses.find((s) => s.name === targetName);
    const dragged = dragStatusId;
    setDragStatusId(null);
    setOverStatusKey(null);
    if (!dragged || !target) return;
    const current = statuses.map((s) => s.id);
    const next = moveStatusId(current, dragged, target.id);
    if (next.join() === current.join()) return;
    setOrder(next);
    reorder(next);
  }

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = issues;
    if (q) {
      list = list.filter((i) => i.title.toLowerCase().includes(q) || i.id.toLowerCase().includes(q));
    }
    if (priorityFilter.length > 0) {
      list = list.filter((i) => priorityFilter.includes(i.priority));
    }
    list = [...list].sort((a, b) => {
      if (orderBy === "priority") return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (orderBy === "title") return a.title.localeCompare(b.title);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [issues, search, orderBy, priorityFilter]);

  const groups = React.useMemo(() => {
    if (groupBy === "status") {
      const map = new Map<string, IssueView[]>();
      statuses.forEach((s) => map.set(s.name, []));
      filtered.forEach((issue) => {
        const key = issue.status;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(issue);
      });
      return Array.from(map.entries());
    }
    const map = new Map<string, IssueView[]>();
    filtered.forEach((issue) => {
      for (const key of groupKeys(issue, groupBy)) {
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(issue);
      }
    });
    return Array.from(map.entries());
  }, [filtered, groupBy, statuses]);

  async function handleDrop(status: string) {
    if (!dragIssueId) return;
    const issue = issues.find((i) => i.id === dragIssueId);
    setDragIssueId(null);
    if (!issue || issue.status === status) return;
    try {
      await updateIssue(issue.id, { status });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to move issue");
    }
  }

  function togglePriority(p: string) {
    setPriorityFilter((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-border px-4 py-2.5">
      <div className="flex items-center gap-2">
        <div className="relative w-56">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search issues..."
            className="h-7 pl-7 text-xs"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
              <Plus className="h-3 w-3" /> Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Priority</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {PRIORITIES.map((p) => (
              <DropdownMenuCheckboxItem
                key={p}
                checked={priorityFilter.includes(p)}
                onCheckedChange={() => togglePriority(p)}
                onSelect={(e) => e.preventDefault()}
              >
                <span className="flex items-center gap-2">
                  <PriorityIcon priority={p} /> {p}
                </span>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
          <SelectTrigger className="h-7 w-auto gap-1.5 text-xs">
            <ListFilter className="h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="status">Group: Status</SelectItem>
            <SelectItem value="priority">Group: Priority</SelectItem>
            <SelectItem value="assignee">Group: Assignee</SelectItem>
          </SelectContent>
        </Select>
        <Select value={orderBy} onValueChange={(v) => setOrderBy(v as OrderBy)}>
          <SelectTrigger className="h-7 w-auto gap-1.5 text-xs">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created">Order: Created</SelectItem>
            <SelectItem value="priority">Order: Priority</SelectItem>
            <SelectItem value="title">Order: Title</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-1 rounded-md border border-input p-0.5">
          <button
            onClick={() => setLayout("board")}
            className={cn("rounded p-1", layout === "board" ? "bg-primary-soft-bg text-primary-soft-text" : "text-faint-foreground")}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setLayout("list")}
            className={cn("rounded p-1", layout === "list" ? "bg-primary-soft-bg text-primary-soft-text" : "text-faint-foreground")}
          >
            <Rows3 className="h-3.5 w-3.5" />
          </button>
        </div>
        <span className="text-xs text-faint-foreground">{filtered.length} issues</span>
      </div>

      {priorityFilter.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {priorityFilter.map((p) => (
            <Badge key={p} variant="indigo" className="gap-1">
              <PriorityIcon priority={p} /> {p}
              <button onClick={() => togglePriority(p)} className="ml-0.5 hover:text-white">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <button onClick={() => setPriorityFilter([])} className="text-xs text-faint-foreground hover:text-foreground">
            Clear
          </button>
        </div>
      )}
      </div>

      {layout === "list" ? (
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <EmptyState />
          ) : (
            filtered.map((issue) => <IssueRow key={issue.id} issue={issue} showProject={showProject} />)
          )}
        </div>
      ) : (
        <div className="flex flex-1 gap-3 overflow-x-auto p-3">
          {groups.map(([key, list]) => {
            const statusDef = groupBy === "status" ? statuses.find((s) => s.name === key) : undefined;
            const draggableColumn = canReorder && !!statusDef;
            return (
            <div
              key={key}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragStatusId) setOverStatusKey(key);
              }}
              onDragLeave={() => setOverStatusKey((cur) => (cur === key ? null : cur))}
              onDrop={(e) => {
                e.preventDefault();
                if (dragStatusId) dropStatusOn(key);
                else if (groupBy === "status") handleDrop(key);
              }}
              className={cn(
                "flex w-72 shrink-0 flex-col rounded-md bg-muted/30 transition-shadow",
                statusDef && dragStatusId === statusDef.id && "opacity-50",
                dragStatusId && overStatusKey === key && statusDef?.id !== dragStatusId && "ring-2 ring-primary",
              )}
            >
              <div
                draggable={draggableColumn}
                onDragStart={(e) => {
                  if (!statusDef) return;
                  e.stopPropagation();
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", statusDef.id);
                  setDragStatusId(statusDef.id);
                }}
                onDragEnd={() => {
                  setDragStatusId(null);
                  setOverStatusKey(null);
                }}
                title={draggableColumn ? "Drag to reorder columns" : undefined}
                className={cn(
                  "group/col flex items-center gap-1.5 px-2 py-2 text-xs font-medium text-muted-foreground",
                  draggableColumn && "cursor-grab active:cursor-grabbing",
                )}
              >
                {draggableColumn && (
                  <GripVertical className="-ml-1 h-3.5 w-3.5 shrink-0 text-faint-foreground opacity-0 transition-opacity group-hover/col:opacity-100" />
                )}
                {groupBy === "status" && <StatusIcon status={key} />}
                {key}
                <span className="ml-auto text-faint-foreground">{list.length}</span>
                {groupBy === "status" && canManage && (
                  <StatusColumnMenu status={statuses.find((s) => s.name === key)} statuses={statuses} />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
                {list.map((issue) => (
                  <div
                    key={issue.id}
                    draggable
                    onDragStart={() => setDragIssueId(issue.id)}
                  >
                    <IssueCard issue={issue} showProject={showProject} />
                  </div>
                ))}
              </div>
            </div>
            );
          })}
          {groupBy === "status" && canManage && (
            <StatusFormDialog
              kind="issue"
              trigger={
                <button
                  type="button"
                  className="flex h-9 w-48 shrink-0 items-center justify-center gap-1.5 rounded-md border border-dashed border-border text-xs text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                >
                  <Plus className="h-3.5 w-3.5" /> Add status
                </button>
              }
            />
          )}
        </div>
      )}
    </div>
  );
}

// Column header menu for managing an issue status straight from the board.
// Only rendered for users with the manage_issue_statuses permission; the
// server actions check the permission again.
function StatusColumnMenu({ status, statuses }: { status?: IssueStatusDef; statuses: IssueStatusDef[] }) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const { busy, move, makeDefault } = useStatusMutations("issue");
  // Issues can carry a status name that was removed from the workflow; nothing to manage then.
  if (!status) return null;
  const index = statuses.findIndex((s) => s.id === status.id);

  return (
    <>
      {/* Non-modal so opening a dialog from a menu item doesn't leave the page pointer-locked. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title="Manage status"
            disabled={busy}
            className="flex h-5 w-5 items-center justify-center rounded text-faint-foreground hover:bg-muted hover:text-foreground"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5" /> Edit status
          </DropdownMenuItem>
          <DropdownMenuItem disabled={index <= 0} onSelect={() => move(statuses, index, -1)}>
            <ArrowLeft className="h-3.5 w-3.5" /> Move left
          </DropdownMenuItem>
          <DropdownMenuItem disabled={index >= statuses.length - 1} onSelect={() => move(statuses, index, 1)}>
            <ArrowRight className="h-3.5 w-3.5" /> Move right
          </DropdownMenuItem>
          <DropdownMenuItem disabled={status.isDefault} onSelect={() => makeDefault(status)}>
            <Star className="h-3.5 w-3.5" /> {status.isDefault ? "Default for new issues" : "Make default"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setDeleteOpen(true)} className="text-red-600 focus:text-red-600">
            <Trash2 className="h-3.5 w-3.5" /> Delete status
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <StatusFormDialog kind="issue" status={status} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteStatusDialog kind="issue" status={status} statuses={statuses} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1 py-24 text-faint-foreground">
      <p className="text-sm">No issues found</p>
    </div>
  );
}
