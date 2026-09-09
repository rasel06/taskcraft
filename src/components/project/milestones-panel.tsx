"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addMilestone, updateMilestone, deleteMilestone } from "@/actions/milestones";
import { cn } from "@/lib/utils";

interface Milestone {
  id: string;
  name: string;
  description: string | null;
}

export function MilestonesPanel({ projectId, milestones }: { projectId: string; milestones: Milestone[] }) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const nameRef = React.useRef<HTMLInputElement>(null);

  function openForm() {
    setShowForm(true);
    requestAnimationFrame(() => nameRef.current?.focus());
  }

  function startEdit(m: Milestone) {
    setEditingId(m.id);
    setName(m.name);
    setDescription(m.description ?? "");
    openForm();
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setDescription("");
    setShowForm(false);
  }

  async function submit() {
    if (!name.trim() || pending) return;
    setPending(true);
    try {
      if (editingId) {
        await updateMilestone(editingId, { name, description });
      } else {
        await addMilestone(projectId, { name, description });
      }
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save milestone");
    } finally {
      setPending(false);
    }
  }

  async function remove(id: string) {
    try {
      await deleteMilestone(id);
      if (editingId === id) resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete milestone");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      resetForm();
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {milestones.length > 0 ? (
        <ul className="space-y-1.5">
          {milestones.map((m, i) => (
            <li
              key={m.id}
              className={cn(
                "flex items-center gap-2.5 rounded-md border px-2.5 py-1.5",
                editingId === m.id ? "border-primary-soft-border bg-primary-soft-bg" : "border-border bg-muted/40",
              )}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[9px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-foreground">{m.name}</div>
                {m.description && <div className="truncate text-xs text-muted-foreground">{m.description}</div>}
              </div>
              <button onClick={() => startEdit(m)} className="shrink-0 text-muted-foreground hover:text-foreground">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => remove(m.id)} className="shrink-0 text-muted-foreground hover:text-red-400">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        !showForm && <p className="text-xs text-faint-foreground">No milestones yet.</p>
      )}

      {showForm ? (
        <div className="flex flex-col gap-1.5 rounded-md border border-border bg-muted/20 p-2">
          <Input
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Milestone name"
            className="h-7 text-xs"
          />
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Description (optional)"
            className="h-7 text-xs"
          />
          <div className="flex items-center justify-end gap-1.5 pt-0.5">
            <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
              Cancel
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={submit} disabled={!name.trim() || pending}>
              {editingId ? "Save" : "Add"}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openForm}
          className="flex items-center gap-1.5 rounded-md border border-dashed border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:border-input hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" /> Add milestone
        </button>
      )}
    </div>
  );
}
