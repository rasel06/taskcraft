"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Check, GripVertical, Pencil, Plus, Star, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ProjectStatusIcon } from "@/components/shared/project-status-icon";
import { createStatus, updateStatus, deleteStatus, reorderStatuses, setDefaultStatus } from "@/actions/statuses";
import {
  PROJECT_STATUS_CATEGORIES,
  PROJECT_STATUS_COLORS,
  isHexColor,
  type ProjectStatusCategory,
  type ProjectStatusDef,
  type StatusKind,
} from "@/lib/project-status";
import { cn } from "@/lib/utils";

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(PROJECT_STATUS_CATEGORIES.map((c) => [c.key, c.label]));
const NOUN = { project: ["project", "projects"], issue: ["issue", "issues"] } as const;

function plural(kind: StatusKind, n: number) {
  return `${n} ${NOUN[kind][n === 1 ? 0 : 1]}`;
}

// Move `fromId` to the position currently held by `toId`.
export function moveStatusId(ids: string[], fromId: string, toId: string): string[] {
  const from = ids.indexOf(fromId);
  const to = ids.indexOf(toId);
  if (from === -1 || to === -1 || from === to) return ids;
  const next = [...ids];
  next.splice(from, 1);
  next.splice(to, 0, fromId);
  return next;
}

// Statuses in display order, with a local override applied immediately while a
// reorder is saved, so a drag-and-drop doesn't snap back before the refresh.
export function useOptimisticStatusOrder<T extends { id: string }>(statuses: T[]) {
  const [order, setOrder] = React.useState<string[] | null>(null);
  const serverKey = statuses.map((s) => s.id).join(",");
  const [lastServerKey, setLastServerKey] = React.useState(serverKey);
  if (serverKey !== lastServerKey) {
    // Fresh data from the server wins over any local override.
    setLastServerKey(serverKey);
    setOrder(null);
  }
  const ordered = React.useMemo(() => {
    if (!order) return statuses;
    const byId = new Map(statuses.map((s) => [s.id, s]));
    const list = order.map((id) => byId.get(id)).filter((s): s is T => !!s);
    return list.length === statuses.length ? list : statuses;
  }, [order, statuses]);
  return { ordered, setOrder };
}

// Shared by the settings list and the board column menus. `projectId` scopes
// issue statuses to one project's workflow (unused for project statuses).
export function useStatusMutations(kind: StatusKind, projectId?: string | null) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  const run = React.useCallback(
    async (action: () => Promise<unknown>, success: string) => {
      setBusy(true);
      try {
        await action();
        toast.success(success);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setBusy(false);
      }
    },
    [router],
  );

  const move = React.useCallback(
    (statuses: ProjectStatusDef[], index: number, delta: number) => {
      const target = index + delta;
      if (target < 0 || target >= statuses.length) return;
      const next = [...statuses];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return run(() => reorderStatuses(kind, next.map((s) => s.id), projectId), "Order updated");
    },
    [kind, projectId, run],
  );

  const reorder = React.useCallback(
    (orderedIds: string[]) => run(() => reorderStatuses(kind, orderedIds, projectId), "Order updated"),
    [kind, projectId, run],
  );

  const makeDefault = React.useCallback(
    (status: ProjectStatusDef) =>
      run(() => setDefaultStatus(kind, status.id, projectId), `${status.name} is now the default`),
    [kind, projectId, run],
  );

  return { busy, move, reorder, makeDefault };
}

export function WorkflowStatusesManager({
  kind,
  projectId,
  statuses,
  usage,
  canManage,
}: {
  kind: StatusKind;
  projectId?: string | null;
  statuses: ProjectStatusDef[];
  usage: Record<string, number>;
  canManage: boolean;
}) {
  const { busy, move, reorder, makeDefault } = useStatusMutations(kind, projectId);
  const { ordered, setOrder } = useOptimisticStatusOrder(statuses);
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);

  function dropOn(targetId: string) {
    if (!dragId) return;
    const ids = moveStatusId(
      ordered.map((s) => s.id),
      dragId,
      targetId,
    );
    setDragId(null);
    setOverId(null);
    if (ids.join() === ordered.map((s) => s.id).join()) return;
    setOrder(ids);
    reorder(ids);
  }

  return (
    <div className="flex max-w-2xl flex-col gap-3">
      {canManage && (
        <div className="flex justify-end">
          <StatusFormDialog
            kind={kind}
            projectId={projectId}
            trigger={
              <Button variant="primary" size="sm">
                <Plus className="h-3.5 w-3.5" /> New status
              </Button>
            }
          />
        </div>
      )}
      <ol className={cn("flex flex-col gap-1.5", busy && "opacity-60")}>
        {ordered.map((s, i) => {
          const count = usage[s.name] ?? 0;
          return (
            <li
              key={s.id}
              draggable={canManage && !busy}
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", s.id);
                setDragId(s.id);
              }}
              onDragOver={(e) => {
                if (!dragId) return;
                e.preventDefault();
                setOverId(s.id);
              }}
              onDragLeave={() => setOverId((cur) => (cur === s.id ? null : cur))}
              onDrop={(e) => {
                e.preventDefault();
                dropOn(s.id);
              }}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
              className={cn(
                "flex items-center gap-3 rounded-md border border-l-4 border-border bg-background px-3 py-2.5 text-sm transition-shadow",
                dragId === s.id && "opacity-50",
                overId === s.id && dragId !== s.id && "ring-2 ring-primary",
              )}
              style={{ borderLeftColor: s.color }}
            >
              {canManage && (
                <GripVertical className="-ml-1 h-4 w-4 shrink-0 cursor-grab text-faint-foreground active:cursor-grabbing" aria-label="Drag to reorder" />
              )}
              <span className="w-4 text-xs tabular-nums text-faint-foreground">{i + 1}</span>
              <ProjectStatusIcon status={s} className="h-4 w-4" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-center gap-2">
                  <span className="truncate font-medium text-foreground">{s.name}</span>
                  {s.isDefault && (
                    <span className="rounded bg-primary-soft-bg px-1.5 py-0.5 text-[10px] font-medium text-primary-soft-text">
                      Default
                    </span>
                  )}
                </span>
                <span className="text-xs text-faint-foreground">
                  {CATEGORY_LABEL[s.category]} · {plural(kind, count)}
                </span>
              </div>

              {canManage && (
                <div className="flex items-center gap-1">
                  <IconButton title="Move up" disabled={i === 0 || busy} onClick={() => move(ordered, i, -1)}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </IconButton>
                  <IconButton title="Move down" disabled={i === ordered.length - 1 || busy} onClick={() => move(ordered, i, 1)}>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </IconButton>
                  <IconButton
                    title={s.isDefault ? `Default status for new ${NOUN[kind][1]}` : `Make default for new ${NOUN[kind][1]}`}
                    disabled={s.isDefault || busy}
                    onClick={() => makeDefault(s)}
                  >
                    <Star className={cn("h-3.5 w-3.5", s.isDefault && "fill-amber-400 text-amber-400")} />
                  </IconButton>
                  <StatusFormDialog
                    kind={kind}
                    projectId={projectId}
                    status={s}
                    trigger={
                      <IconButton title="Edit status">
                        <Pencil className="h-3.5 w-3.5" />
                      </IconButton>
                    }
                  />
                  <DeleteStatusDialog
                    kind={kind}
                    projectId={projectId}
                    status={s}
                    statuses={ordered}
                    usage={count}
                    trigger={
                      <IconButton title="Delete status" danger>
                        <Trash2 className="h-3.5 w-3.5" />
                      </IconButton>
                    }
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {canManage && (
        <p className="text-xs text-faint-foreground">Drag rows by the handle (or use the arrows) to change the order.</p>
      )}
      {!canManage && (
        <p className="text-xs text-faint-foreground">
          You can view the workflow.{" "}
          {kind === "issue"
            ? "Editing is limited to admins and this project's lead or admin members."
            : "Editing needs the \u201cManage project statuses\u201d permission."}
        </p>
      )}
    </div>
  );
}

const IconButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }
>(({ className, danger, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
      danger && "hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40",
      className,
    )}
    {...props}
  />
));
IconButton.displayName = "IconButton";

// Create (no `status`) or edit a status. Either pass a `trigger`, or control it
// with `open` / `onOpenChange` (used from the board's column menu).
export function StatusFormDialog({
  kind,
  projectId,
  status,
  trigger,
  open: openProp,
  onOpenChange,
  save,
  title,
  description,
}: {
  kind: StatusKind;
  projectId?: string | null;
  status?: Pick<ProjectStatusDef, "id" | "name" | "color" | "category">;
  // Overrides the default create/update action (used by the preset library).
  save?: (input: { name: string; category: ProjectStatusCategory; color: string }) => Promise<unknown>;
  title?: string;
  description?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const isEdit = !!status;
  const [openState, setOpenState] = React.useState(false);
  const open = openProp ?? openState;
  const [name, setName] = React.useState(status?.name ?? "");
  const [category, setCategory] = React.useState<ProjectStatusCategory>(status?.category ?? "planned");
  const [color, setColor] = React.useState(status?.color ?? PROJECT_STATUS_COLORS[2]);
  const [pending, setPending] = React.useState(false);

  function setOpen(next: boolean) {
    if (openProp === undefined) setOpenState(next);
    onOpenChange?.(next);
    if (next) {
      setName(status?.name ?? "");
      setCategory(status?.category ?? "planned");
      setColor(status?.color ?? PROJECT_STATUS_COLORS[2]);
    }
  }

  // A controlled dialog opens without going through setOpen, so sync the
  // fields from the status whenever it opens.
  const wasOpen = React.useRef(open);
  React.useEffect(() => {
    if (open && !wasOpen.current) {
      setName(status?.name ?? "");
      setCategory(status?.category ?? "planned");
      setColor(status?.color ?? PROJECT_STATUS_COLORS[2]);
    }
    wasOpen.current = open;
  }, [open, status]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      if (save) {
        await save({ name, category, color });
        toast.success(isEdit ? "Status updated" : "Status created");
      } else if (isEdit) {
        await updateStatus(kind, status.id, { name, category, color }, projectId);
        toast.success("Status updated");
      } else {
        await createStatus(kind, { name, category, color }, projectId);
        toast.success("Status created");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save status");
    } finally {
      setPending(false);
    }
  }

  const preview: ProjectStatusDef = {
    id: status?.id ?? "preview",
    name: name || "Status name",
    color: isHexColor(color) ? color : "#71717a",
    category,
    position: 0,
    isDefault: false,
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{title ?? (isEdit ? "Edit status" : `New ${kind} status`)}</DialogTitle>
            {(description || isEdit) && (
              <DialogDescription>
                {description ??
                  `Renaming updates every ${kind} currently on this status${kind === "issue" ? " in this project" : ""}.`}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="flex flex-col gap-4 px-5 py-4">
            <div className="space-y-1.5">
              <Label htmlFor={`status-name-${status?.id ?? "new"}`}>Name</Label>
              <Input
                id={`status-name-${status?.id ?? "new"}`}
                autoFocus
                value={name}
                maxLength={40}
                onChange={(e) => setName(e.target.value)}
                placeholder={kind === "issue" ? "e.g. In Review" : "e.g. On hold"}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ProjectStatusCategory)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUS_CATEGORIES.map((c) => (
                    <SelectItem key={c.key} value={c.key} icon={<ProjectStatusIcon status={{ ...preview, category: c.key }} />}>
                      {c.label} <span className="text-faint-foreground">— {c.description}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {kind === "issue" && (
                <p className="text-[11px] text-faint-foreground">
                  Completed and canceled statuses count as closed in cycle and report progress.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex flex-wrap items-center gap-1.5">
                {PROJECT_STATUS_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full ring-offset-2 ring-offset-background",
                      color.toLowerCase() === c && "ring-2 ring-foreground",
                    )}
                    style={{ backgroundColor: c }}
                  >
                    {color.toLowerCase() === c && <Check className="h-3.5 w-3.5 text-white" />}
                  </button>
                ))}
                <label
                  title="Custom color"
                  className="relative ml-1 flex h-6 cursor-pointer items-center gap-1 rounded-md border border-border px-1.5 text-[11px] text-muted-foreground hover:bg-muted"
                >
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: preview.color }} />
                  Custom
                  <input
                    type="color"
                    value={preview.color}
                    onChange={(e) => setColor(e.target.value)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm">
              <span className="text-xs text-faint-foreground">Preview</span>
              <ProjectStatusIcon status={preview} className="h-4 w-4" />
              <span className="text-foreground">{preview.name}</span>
            </div>
          </div>
          <DialogFooter className="justify-end">
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Saving..." : isEdit ? "Save changes" : "Create status"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// `usage` undefined means the caller doesn't know the count (e.g. a filtered
// board); the replacement picker is then always shown and the server decides.
export function DeleteStatusDialog({
  kind,
  projectId,
  status,
  statuses,
  usage,
  trigger,
  open: openProp,
  onOpenChange,
  remove = false,
}: {
  kind: StatusKind;
  projectId?: string | null;
  // "Remove from this project" wording (the status stays in the preset library).
  remove?: boolean;
  status: ProjectStatusDef;
  statuses: ProjectStatusDef[];
  usage?: number;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [openState, setOpenState] = React.useState(false);
  const open = openProp ?? openState;
  const [pending, setPending] = React.useState(false);
  const others = statuses.filter((s) => s.id !== status.id);
  const [replacementId, setReplacementId] = React.useState<string>(
    (others.find((s) => s.isDefault) ?? others[0])?.id ?? "",
  );
  const needsReplacement = usage === undefined || usage > 0;
  const blocked = status.isDefault
    ? "This is the default status. Make another status the default first."
    : others.length === 0
      ? "At least one status is required."
      : null;

  function setOpen(next: boolean) {
    if (openProp === undefined) setOpenState(next);
    onOpenChange?.(next);
  }

  async function handleDelete() {
    setPending(true);
    try {
      const result = await deleteStatus(kind, status.id, needsReplacement ? replacementId : null, projectId);
      toast.success(
        result.moved > 0
          ? `${status.name} ${remove ? "removed" : "deleted"} · ${plural(kind, result.moved)} moved to ${result.to}`
          : `${status.name} ${remove ? "removed" : "deleted"}`,
      );
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete status");
    } finally {
      setPending(false);
    }
  }

  const description =
    blocked ??
    (usage === undefined
      ? `Any ${NOUN[kind][1]} on this status will be moved to the status you choose.`
      : usage > 0
        ? `${plural(kind, usage)} ${usage === 1 ? "is" : "are"} on this status. Choose where to move ${usage === 1 ? "it" : "them"}.`
        : remove
          ? `No ${NOUN[kind][1]} use this status. It stays available in the status presets.`
          : `No ${NOUN[kind][1]} use this status. This can't be undone.`);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {remove ? "Remove" : "Delete"} &ldquo;{status.name}&rdquo;{remove ? " from this project" : ""}?
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {!blocked && needsReplacement && (
          <div className="flex flex-col gap-1.5 px-5 py-4">
            <Label>Move {NOUN[kind][1]} to</Label>
            <Select value={replacementId} onValueChange={setReplacementId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Choose a status" />
              </SelectTrigger>
              <SelectContent>
                {others.map((s) => (
                  <SelectItem key={s.id} value={s.id} icon={<ProjectStatusIcon status={s} />}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <DialogFooter className="justify-end">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          {!blocked && (
            <Button variant="destructive" onClick={handleDelete} disabled={pending || (needsReplacement && !replacementId)}>
              {pending
                ? remove
                  ? "Removing..."
                  : "Deleting..."
                : needsReplacement
                  ? `Move & ${remove ? "remove" : "delete"}`
                  : remove
                    ? "Remove status"
                    : "Delete status"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
