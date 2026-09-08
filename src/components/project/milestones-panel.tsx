"use client";

import * as React from "react";
import { toast } from "sonner";
import { Diamond, Plus, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addMilestone, updateMilestone, deleteMilestone } from "@/actions/milestones";

interface Milestone {
  id: string;
  name: string;
  description: string | null;
}

export function MilestonesPanel({ projectId, milestones }: { projectId: string; milestones: Milestone[] }) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  function startEdit(m: Milestone) {
    setEditingId(m.id);
    setName(m.name);
    setDescription(m.description ?? "");
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setDescription("");
  }

  async function submit() {
    if (!name.trim()) return;
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete milestone");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {milestones.length > 0 && (
        <ul className="space-y-1">
          {milestones.map((m) => (
            <li key={m.id} className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5">
              <Diamond className="h-3 w-3 shrink-0 rotate-45 border-2 border-emerald-500 bg-transparent text-transparent" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-foreground">{m.name}</div>
                {m.description && <div className="truncate text-xs text-muted-foreground">{m.description}</div>}
              </div>
              <button onClick={() => startEdit(m)} className="text-muted-foreground hover:text-foreground">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => remove(m.id)} className="text-muted-foreground hover:text-red-400">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-1.5">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Milestone name" className="h-7 text-xs" />
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="h-7 text-xs"
        />
        <Button type="button" size="sm" variant="secondary" onClick={submit} disabled={pending}>
          <Plus className="h-3.5 w-3.5" />
          {editingId ? "Save" : "Add"}
        </Button>
      </div>
    </div>
  );
}
