"use client";

import * as React from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { updateProject } from "@/actions/projects";
import type { UserLite } from "@/lib/types";

export function ProjectSettingsForm({
  project,
  members,
  canManage,
}: {
  project: { id: string; name: string; description: string | null; leadId: string };
  members: UserLite[];
  canManage: boolean;
}) {
  const [name, setName] = React.useState(project.name);
  const [description, setDescription] = React.useState(project.description ?? "");
  const [leadId, setLeadId] = React.useState(project.leadId);
  const [pending, setPending] = React.useState(false);

  async function save() {
    setPending(true);
    try {
      await updateProject(project.id, { name, description: description || null, leadId });
      toast.success("Project settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex max-w-md flex-col gap-4">
      {!canManage && (
        <p className="text-xs text-faint-foreground">You don&apos;t have permission to edit project settings.</p>
      )}
      <div className="space-y-1.5">
        <Label>Project name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!canManage} />
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={!canManage} />
      </div>
      <div className="space-y-1.5">
        <Label>Project lead</Label>
        <Select value={leadId} onValueChange={setLeadId} disabled={!canManage}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button variant="primary" className="w-fit" onClick={save} disabled={pending || !canManage}>
        {pending ? "Saving..." : "Save changes"}
      </Button>
    </div>
  );
}
