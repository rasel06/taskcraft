"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, GripVertical, Pencil, Plus, Star, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProjectStatusIcon } from "@/components/shared/project-status-icon";
import {
  DeleteStatusDialog,
  StatusFormDialog,
  moveStatusId,
  useOptimisticStatusOrder,
  useStatusMutations,
} from "@/components/settings/workflow-statuses";
import {
  addIssueStatusPresetToProject,
  createIssueStatusPreset,
  deleteIssueStatusPreset,
  reorderIssueStatusPresets,
  setIssueStatusPresetPreselected,
  updateIssueStatusPreset,
} from "@/actions/issue-status-presets";
import {
  PROJECT_STATUS_CATEGORIES,
  type IssueStatusDef,
  type IssueStatusPresetDef,
} from "@/lib/project-status";
import { cn } from "@/lib/utils";

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(PROJECT_STATUS_CATEGORIES.map((c) => [c.key, c.label]));

// HTML5 drag-to-reorder over a list of rows keyed by id.
function useRowDrag(ids: string[], onReorder: (next: string[]) => void, enabled: boolean) {
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);
  const rowProps = (id: string) =>
    enabled
      ? {
          draggable: true,
          onDragStart: (e: React.DragEvent) => {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", id);
            setDragId(id);
          },
          onDragOver: (e: React.DragEvent) => {
            if (!dragId) return;
            e.preventDefault();
            setOverId(id);
          },
          onDragLeave: () => setOverId((cur) => (cur === id ? null : cur)),
          onDrop: (e: React.DragEvent) => {
            e.preventDefault();
            if (dragId) {
              const next = moveStatusId(ids, dragId, id);
              if (next.join() !== ids.join()) onReorder(next);
            }
            setDragId(null);
            setOverId(null);
          },
          onDragEnd: () => {
            setDragId(null);
            setOverId(null);
          },
        }
      : {};
  const rowState = (id: string) => ({ dragging: dragId === id, over: overId === id && dragId !== id });
  return { rowProps, rowState };
}

function IconButton({
  className,
  danger,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
        danger && "hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40",
        className,
      )}
      {...props}
    />
  );
}

// ---- Preset library (admin) -------------------------------------------------

export function IssueStatusPresetLibrary({
  presets,
  usage,
  canManage,
}: {
  presets: IssueStatusPresetDef[];
  usage: Record<string, number>;
  canManage: boolean;
}) {
  const router = useRouter();
  const { ordered, setOrder } = useOptimisticStatusOrder(presets);
  const [busy, setBusy] = React.useState(false);
  const [deleting, setDeleting] = React.useState<IssueStatusPresetDef | null>(null);

  async function run(action: () => Promise<unknown>, success?: string) {
    setBusy(true);
    try {
      await action();
      if (success) toast.success(success);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const { rowProps, rowState } = useRowDrag(
    ordered.map((p) => p.id),
    (next) => {
      setOrder(next);
      run(() => reorderIssueStatusPresets(next), "Order updated");
    },
    canManage && !busy,
  );

  return (
    <div className="flex max-w-3xl flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          The statuses projects can use. Edits here apply to every project that uses the status. &ldquo;New projects&rdquo;
          marks the ones ticked by default when a project is created.
        </p>
        {canManage && (
          <StatusFormDialog
            kind="issue"
            title="New status preset"
            description="Projects can add it to their workflow once it exists."
            save={(input) => createIssueStatusPreset(input)}
            trigger={
              <Button variant="primary" size="sm" className="shrink-0">
                <Plus className="h-3.5 w-3.5" /> New status
              </Button>
            }
          />
        )}
      </div>

      <ol className={cn("flex flex-col gap-1.5", busy && "opacity-60")}>
        {ordered.map((p, i) => {
          const used = usage[p.id] ?? 0;
          const { dragging, over } = rowState(p.id);
          return (
            <li
              key={p.id}
              {...rowProps(p.id)}
              className={cn(
                "flex items-center gap-3 rounded-md border border-l-4 border-border bg-background px-3 py-2.5 text-sm",
                dragging && "opacity-50",
                over && "ring-2 ring-primary",
              )}
              style={{ borderLeftColor: p.color }}
            >
              {canManage && <GripVertical className="-ml-1 h-4 w-4 shrink-0 cursor-grab text-faint-foreground" />}
              <span className="w-4 text-xs tabular-nums text-faint-foreground">{i + 1}</span>
              <ProjectStatusIcon status={{ ...p, isDefault: false }} className="h-4 w-4" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium text-foreground">{p.name}</span>
                <span className="text-xs text-faint-foreground">
                  {CATEGORY_LABEL[p.category]} · {used === 0 ? "not used" : `used by ${used} project${used === 1 ? "" : "s"}`}
                </span>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground" title="Ticked by default for new projects">
                New projects
                <Switch
                  checked={p.preselected}
                  disabled={!canManage || busy}
                  onCheckedChange={(v) => run(() => setIssueStatusPresetPreselected(p.id, v))}
                />
              </label>
              {canManage && (
                <div className="flex items-center gap-1">
                  <StatusFormDialog
                    kind="issue"
                    status={p}
                    title="Edit status preset"
                    description={
                      used > 0
                        ? `Changes apply to the ${used} project${used === 1 ? "" : "s"} using it; a rename also renames the status on their issues.`
                        : "Not used by any project yet."
                    }
                    save={(input) => updateIssueStatusPreset(p.id, input)}
                    trigger={
                      <IconButton title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </IconButton>
                    }
                  />
                  <IconButton
                    danger
                    title={used > 0 ? "In use by projects — remove it from their workflows first" : "Delete"}
                    disabled={used > 0 || busy}
                    onClick={() => setDeleting(p)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </IconButton>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {canManage ? (
        <p className="text-xs text-faint-foreground">Drag rows to change the order used when picking statuses.</p>
      ) : (
        <p className="text-xs text-faint-foreground">Only admins can change status presets.</p>
      )}

      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{deleting?.name}&rdquo;?</DialogTitle>
            <DialogDescription>It will no longer be available to add to projects. This can&apos;t be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="justify-end">
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => {
                const target = deleting;
                setDeleting(null);
                if (target) run(() => deleteIssueStatusPreset(target.id), `${target.name} deleted`);
              }}
            >
              Delete status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---- One project's workflow (admin) ------------------------------------------

export function ProjectWorkflowEditor({
  projectId,
  statuses,
  presets,
  usage,
  canManage,
}: {
  projectId: string;
  statuses: IssueStatusDef[];
  presets: IssueStatusPresetDef[];
  usage: Record<string, number>;
  canManage: boolean;
}) {
  const router = useRouter();
  const { busy, reorder, makeDefault } = useStatusMutations("issue", projectId);
  const { ordered, setOrder } = useOptimisticStatusOrder(statuses);
  const [adding, setAdding] = React.useState(false);
  const available = presets.filter((p) => !statuses.some((s) => s.name.toLowerCase() === p.name.toLowerCase()));

  const { rowProps, rowState } = useRowDrag(
    ordered.map((s) => s.id),
    (next) => {
      setOrder(next);
      reorder(next);
    },
    canManage && !busy,
  );

  async function add(presetId: string) {
    setAdding(true);
    try {
      await addIssueStatusPresetToProject(projectId, presetId);
      toast.success("Status added");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add status");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="flex max-w-3xl flex-col gap-3">
      <ol className={cn("flex flex-col gap-1.5", busy && "opacity-60")}>
        {ordered.map((s, i) => {
          const count = usage[s.name] ?? 0;
          const { dragging, over } = rowState(s.id);
          return (
            <li
              key={s.id}
              {...rowProps(s.id)}
              className={cn(
                "flex items-center gap-3 rounded-md border border-l-4 border-border bg-background px-3 py-2.5 text-sm",
                dragging && "opacity-50",
                over && "ring-2 ring-primary",
              )}
              style={{ borderLeftColor: s.color }}
            >
              {canManage && <GripVertical className="-ml-1 h-4 w-4 shrink-0 cursor-grab text-faint-foreground" />}
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
                  {CATEGORY_LABEL[s.category]} · {count} issue{count === 1 ? "" : "s"}
                </span>
              </div>
              {canManage && (
                <div className="flex items-center gap-1">
                  <IconButton
                    title={s.isDefault ? "Default status for new issues" : "Make default for new issues"}
                    disabled={s.isDefault || busy}
                    onClick={() => makeDefault(s)}
                  >
                    <Star className={cn("h-3.5 w-3.5", s.isDefault && "fill-amber-400 text-amber-400")} />
                  </IconButton>
                  <DeleteStatusDialog
                    kind="issue"
                    projectId={projectId}
                    status={s}
                    statuses={ordered}
                    usage={count}
                    remove
                    trigger={
                      <IconButton danger title="Remove from project">
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

      {canManage ? (
        <div className="flex flex-wrap items-center gap-3">
          <Select value="" onValueChange={add} disabled={adding || available.length === 0}>
            <SelectTrigger className="h-8 w-64 text-xs">
              <Plus className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder={available.length ? "Add a status from presets" : "All presets are in use"} />
            </SelectTrigger>
            <SelectContent>
              {available.map((p) => (
                <SelectItem key={p.id} value={p.id} icon={<ProjectStatusIcon status={{ ...p, isDefault: false }} />}>
                  {p.name} <span className="text-faint-foreground">— {CATEGORY_LABEL[p.category]}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-faint-foreground">
            Drag to reorder columns · ★ sets where new issues start · names and colors are edited in Status presets.
          </span>
        </div>
      ) : (
        <p className="text-xs text-faint-foreground">Only admins can change a project&apos;s workflow.</p>
      )}
    </div>
  );
}

// ---- Picker used when creating a project ------------------------------------------

export interface WorkflowSelection {
  presetIds: string[];
  defaultPresetId: string | null;
}

export function initialWorkflowSelection(presets: IssueStatusPresetDef[]): WorkflowSelection {
  const chosen = presets.filter((p) => p.preselected);
  const def = chosen.find((p) => p.category === "backlog") ?? chosen[0];
  return { presetIds: chosen.map((p) => p.id), defaultPresetId: def?.id ?? null };
}

// Columns follow the preset library order; ★ picks where new issues start.
export function IssueWorkflowPicker({
  presets,
  value,
  onChange,
  disabled,
}: {
  presets: IssueStatusPresetDef[];
  value: WorkflowSelection;
  onChange: (next: WorkflowSelection) => void;
  disabled?: boolean;
}) {
  const selected = new Set(value.presetIds);

  function toggle(id: string) {
    const nextIds = presets.filter((p) => (p.id === id ? !selected.has(id) : selected.has(p.id))).map((p) => p.id);
    const def = nextIds.includes(value.defaultPresetId ?? "") ? value.defaultPresetId : (nextIds[0] ?? null);
    onChange({ presetIds: nextIds, defaultPresetId: def });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid gap-1.5 sm:grid-cols-2">
        {presets.map((p) => {
          const on = selected.has(p.id);
          const isDefault = on && value.defaultPresetId === p.id;
          return (
            <div
              key={p.id}
              className={cn(
                "flex items-center gap-2 rounded-md border px-2.5 py-2 text-sm transition-colors",
                on ? "border-input bg-background" : "border-dashed border-border bg-muted/20 text-muted-foreground",
              )}
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                disabled={disabled}
                onClick={() => toggle(p.id)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                    on ? "border-primary bg-primary text-primary-foreground" : "border-input",
                  )}
                >
                  {on && <Check className="h-3 w-3" />}
                </span>
                <ProjectStatusIcon status={{ ...p, isDefault: false }} className="h-3.5 w-3.5" />
                <span className={cn("truncate", on && "text-foreground")}>{p.name}</span>
              </button>
              {on && (
                <button
                  type="button"
                  disabled={disabled}
                  title={isDefault ? "New issues start here" : "Make new issues start here"}
                  onClick={() => onChange({ ...value, defaultPresetId: p.id })}
                  className="shrink-0 rounded p-0.5 text-faint-foreground hover:text-amber-500"
                >
                  <Star className={cn("h-3.5 w-3.5", isDefault && "fill-amber-400 text-amber-400")} />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-faint-foreground">
        {value.presetIds.length} status{value.presetIds.length === 1 ? "" : "es"} selected · ★ marks where new issues start.
        You can change this later in the project&apos;s settings.
      </p>
    </div>
  );
}
