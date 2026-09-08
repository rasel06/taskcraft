"use client";

import * as React from "react";
import { toast } from "sonner";
import { Paperclip, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PriorityIcon } from "@/components/shared/priority-icon";
import { StatusIcon } from "@/components/shared/status-icon";
import { UserAvatar } from "@/components/shared/user-avatar";
import { createIssue } from "@/actions/issues";
import { ISSUE_STATUSES, PRIORITIES } from "@/lib/constants";
import type { ProjectLite, UserLite } from "@/lib/types";

export function CreateIssueDialog({
  projects,
  users,
  defaultProjectId,
  trigger,
}: {
  projects: (ProjectLite & { teamIdentifier: string })[];
  users: UserLite[];
  defaultProjectId?: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [createMore, setCreateMore] = React.useState(false);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [status, setStatus] = React.useState<string>(ISSUE_STATUSES[0]);
  const [priority, setPriority] = React.useState<string>(PRIORITIES[0]);
  const [assigneeId, setAssigneeId] = React.useState<string>("unassigned");
  const [projectId, setProjectId] = React.useState<string>(defaultProjectId ?? "");
  const [labelInput, setLabelInput] = React.useState("");
  const [labels, setLabels] = React.useState<string[]>([]);
  const [attachments, setAttachments] = React.useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const titleRef = React.useRef<HTMLInputElement>(null);

  function resetFields() {
    setTitle("");
    setDescription("");
    setLabelInput("");
  }

  function resetAll() {
    resetFields();
    setStatus(ISSUE_STATUSES[0]);
    setPriority(PRIORITIES[0]);
    setAssigneeId("unassigned");
    setLabels([]);
    setAttachments([]);
    setProjectId(defaultProjectId ?? "");
  }

  function addLabel() {
    const value = labelInput.trim();
    if (value && !labels.includes(value)) setLabels([...labels, value]);
    setLabelInput("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    if (!projectId) {
      toast.error("Pick a project first");
      return;
    }
    setPending(true);
    try {
      const issue = await createIssue({
        title,
        description,
        status,
        priority,
        assigneeId: assigneeId === "unassigned" ? null : assigneeId,
        projectId,
        labels,
        attachments,
      });
      toast.success(`Issue ${issue.id} created`);
      if (createMore) {
        resetFields();
        titleRef.current?.focus();
      } else {
        setOpen(false);
        resetAll();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create issue");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetAll();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent size="lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New issue</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 px-5 py-4">
            <Select
              value={projectId}
              onValueChange={(v) => {
                setProjectId(v);
                titleRef.current?.focus();
              }}
            >
              <SelectTrigger autoFocus={!defaultProjectId} className="w-auto min-w-40">
                <SelectValue placeholder="Choose a project..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.teamIdentifier} · {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              ref={titleRef}
              autoFocus={!!defaultProjectId}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Issue title"
              className="h-9 border-none bg-transparent px-0 text-base font-medium focus-visible:ring-0"
              required
            />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description..."
              className="min-h-24 border-none bg-transparent px-0 focus-visible:ring-0"
            />

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-auto gap-1.5">
                  <StatusIcon status={status} />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ISSUE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} icon={<StatusIcon status={s} />}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-auto gap-1.5">
                  <PriorityIcon priority={priority} />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p} icon={<PriorityIcon priority={p} />}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger className="w-auto gap-1.5">
                  {assigneeId !== "unassigned" && (
                    <UserAvatar user={users.find((u) => u.id === assigneeId)} className="h-4 w-4" />
                  )}
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id} icon={<UserAvatar user={u} className="h-4 w-4" />}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {labels.map((l) => (
                <Badge key={l} variant="indigo">
                  {l}
                  <button
                    type="button"
                    onClick={() => setLabels(labels.filter((x) => x !== l))}
                    className="ml-0.5 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Input
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addLabel();
                  }
                }}
                placeholder="Add label + Enter"
                className="h-6 w-32 border-none bg-transparent px-1 text-xs focus-visible:ring-0"
              />
            </div>

            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {attachments.map((a) => (
                  <Badge key={a} variant="outline">
                    {a}
                    <button
                      type="button"
                      onClick={() => setAttachments(attachments.filter((x) => x !== a))}
                      className="ml-0.5 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Attach files"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  setAttachments([...attachments, ...files.map((f) => f.name)]);
                  e.target.value = "";
                }}
              />
              <div className="flex items-center gap-2">
                <Switch checked={createMore} onCheckedChange={setCreateMore} id="create-more" />
                <Label htmlFor="create-more" className="cursor-pointer">
                  Create more
                </Label>
              </div>
            </div>
            <Button type="submit" variant="primary" disabled={pending}>
              <Plus className="h-4 w-4" />
              {pending ? "Creating..." : "Create issue"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
