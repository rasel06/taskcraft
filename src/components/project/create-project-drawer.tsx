"use client";

import * as React from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Pencil, Trash2, Plus, CalendarIcon, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PriorityIcon } from "@/components/shared/priority-icon";
import { UserAvatar } from "@/components/shared/user-avatar";
import { createProject } from "@/actions/projects";
import { PRIORITIES, DATE_GRANULARITIES, type DateGranularity } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { TeamWithProjects, UserLite } from "@/lib/types";

interface DraftMilestone {
  key: string;
  name: string;
  description: string;
}

function formatByGranularity(date: Date, granularity: DateGranularity) {
  switch (granularity) {
    case "Month":
      return format(date, "MMM yyyy");
    case "Quarter":
      return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
    case "Half-year":
      return `H${date.getMonth() < 6 ? 1 : 2} ${date.getFullYear()}`;
    case "Year":
      return `${date.getFullYear()}`;
    default:
      return format(date, "MMM d, yyyy");
  }
}

function DatePickerField({
  label,
  date,
  onChange,
  granularity,
}: {
  label: string;
  date: Date | undefined;
  onChange: (d: Date | undefined) => void;
  granularity: DateGranularity;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start font-normal">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            {date ? formatByGranularity(date, granularity) : <span className="text-muted-foreground">Set date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar mode="single" selected={date} onSelect={onChange} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function CreateProjectDrawer({
  teams,
  users,
  defaultTeamId,
  trigger,
}: {
  teams: TeamWithProjects[];
  users: UserLite[];
  defaultTeamId?: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState<"draft" | "publish" | null>(null);

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [teamId, setTeamId] = React.useState(defaultTeamId ?? teams[0]?.id ?? "");
  const [leadId, setLeadId] = React.useState("");
  const [memberIds, setMemberIds] = React.useState<string[]>([]);
  const [priority, setPriority] = React.useState<string>(PRIORITIES[0]);
  const [granularity, setGranularity] = React.useState<DateGranularity>("Month");
  const [startDate, setStartDate] = React.useState<Date | undefined>();
  const [targetDate, setTargetDate] = React.useState<Date | undefined>();
  const [milestones, setMilestones] = React.useState<DraftMilestone[]>([]);
  const [msName, setMsName] = React.useState("");
  const [msDesc, setMsDesc] = React.useState("");
  const [editingKey, setEditingKey] = React.useState<string | null>(null);
  const [createMore, setCreateMore] = React.useState(false);
  const nameRef = React.useRef<HTMLInputElement>(null);

  function resetFields() {
    setName("");
    setDescription("");
    setMilestones([]);
    setMsName("");
    setMsDesc("");
    setEditingKey(null);
  }

  function reset() {
    resetFields();
    setLeadId("");
    setMemberIds([]);
    setPriority(PRIORITIES[0]);
    setStartDate(undefined);
    setTargetDate(undefined);
  }

  function upsertMilestone() {
    const trimmed = msName.trim();
    if (!trimmed) return;
    if (editingKey) {
      setMilestones(milestones.map((m) => (m.key === editingKey ? { ...m, name: trimmed, description: msDesc.trim() } : m)));
      setEditingKey(null);
    } else {
      setMilestones([...milestones, { key: crypto.randomUUID(), name: trimmed, description: msDesc.trim() }]);
    }
    setMsName("");
    setMsDesc("");
  }

  function editMilestone(m: DraftMilestone) {
    setEditingKey(m.key);
    setMsName(m.name);
    setMsDesc(m.description);
  }

  function cancelMilestoneEdit() {
    setEditingKey(null);
    setMsName("");
    setMsDesc("");
  }

  function handleMilestoneKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    upsertMilestone();
  }

  async function submit(mode: "draft" | "publish") {
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }
    if (!teamId) {
      toast.error("Pick a team");
      return;
    }
    if (!leadId) {
      toast.error("Pick a project lead");
      return;
    }
    setPending(mode);
    try {
      await createProject({
        name,
        description,
        teamId,
        leadId,
        memberIds,
        startDate: startDate?.toISOString() ?? null,
        targetDate: targetDate?.toISOString() ?? null,
        priority,
        isDraft: mode === "draft",
        milestones: milestones.map((m) => ({ name: m.name, description: m.description })),
      });
      toast.success(mode === "draft" ? "Saved as draft" : "Project published");
      if (createMore) {
        resetFields();
        nameRef.current?.focus();
      } else {
        setOpen(false);
        reset();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setPending(null);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent size="xl" className="flex max-h-[85vh] flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>New project</DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
          <section className="flex flex-col gap-3">
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger className="h-8 w-auto min-w-40 gap-1.5 rounded-md border border-border bg-muted/30 text-xs">
                <SelectValue placeholder="Choose a team..." />
              </SelectTrigger>
              <SelectContent>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({t.identifier})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              ref={nameRef}
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              className="h-10 rounded-none border-0 border-b border-border bg-transparent px-0 text-base font-medium focus-visible:border-primary focus-visible:ring-0"
            />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write a short brief..."
              className="min-h-20 rounded-md border border-border bg-muted/10 px-3 py-2 text-sm focus-visible:ring-1 focus-visible:ring-ring"
            />
          </section>

          <section className="flex flex-col gap-2 border-t border-border pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Properties</h3>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-8 w-auto gap-1.5 rounded-md border border-border bg-muted/30 text-xs">
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

              <Select
                value={leadId}
                onValueChange={(id) => {
                  setLeadId(id);
                  setMemberIds((prev) => prev.filter((x) => x !== id));
                }}
              >
                <SelectTrigger className="h-8 w-auto gap-1.5 rounded-md border border-border bg-muted/30 text-xs">
                  {leadId && <UserAvatar user={users.find((u) => u.id === leadId)} className="h-4 w-4" />}
                  <SelectValue placeholder="Project lead" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter((u) => !memberIds.includes(u.id))
                    .map((u) => (
                      <SelectItem key={u.id} value={u.id} icon={<UserAvatar user={u} className="h-4 w-4" />}>
                        {u.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Select
                value=""
                onValueChange={(id) => setMemberIds((prev) => (prev.includes(id) ? prev : [...prev, id]))}
              >
                <SelectTrigger className="h-8 w-auto gap-1.5 rounded-md border border-border bg-muted/30 text-xs">
                  <SelectValue placeholder={memberIds.length ? `${memberIds.length} member${memberIds.length === 1 ? "" : "s"}` : "Add members"} />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter((u) => u.id !== leadId)
                    .map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        <span className="flex items-center gap-2">
                          <UserAvatar user={u} className="h-4 w-4" /> {u.name}
                        </span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {memberIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {memberIds.map((id) => {
                  const u = users.find((x) => x.id === id);
                  if (!u) return null;
                  return (
                    <Badge key={id} variant="outline">
                      {u.name}
                      <button type="button" onClick={() => setMemberIds(memberIds.filter((x) => x !== id))} className="ml-0.5 hover:text-white">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-2 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timeline</h3>
              <div className="flex rounded-md border border-input p-0.5">
                {DATE_GRANULARITIES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGranularity(g)}
                    className={cn(
                      "rounded px-2 py-0.5 text-xs transition-colors",
                      granularity === g ? "bg-primary-soft-bg text-primary-soft-text" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <DatePickerField label="Start date" date={startDate} onChange={setStartDate} granularity={granularity} />
              <DatePickerField label="Target date" date={targetDate} onChange={setTargetDate} granularity={granularity} />
            </div>
          </section>

          <section className="flex flex-col gap-2 border-t border-border pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Milestones</h3>
            {milestones.length > 0 ? (
              <ul className="space-y-1.5">
                {milestones.map((m, i) => (
                  <li
                    key={m.key}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md border px-3 py-2",
                      editingKey === m.key ? "border-primary-soft-border bg-primary-soft-bg" : "border-border bg-muted/40",
                    )}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">{m.name}</div>
                      {m.description && <div className="truncate text-xs text-muted-foreground">{m.description}</div>}
                    </div>
                    <button type="button" onClick={() => editMilestone(m)} className="shrink-0 text-muted-foreground hover:text-foreground">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMilestones(milestones.filter((x) => x.key !== m.key));
                        if (editingKey === m.key) cancelMilestoneEdit();
                      }}
                      className="shrink-0 text-muted-foreground hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-md border border-dashed border-border px-3 py-2.5 text-xs text-faint-foreground">
                No milestones yet — add the key checkpoints for this project.
              </p>
            )}
            <div className="flex flex-col gap-1.5 rounded-md border border-border bg-muted/20 p-2.5">
              <Input
                value={msName}
                onChange={(e) => setMsName(e.target.value)}
                onKeyDown={handleMilestoneKeyDown}
                placeholder="Milestone name"
                className="h-8"
              />
              <Input
                value={msDesc}
                onChange={(e) => setMsDesc(e.target.value)}
                onKeyDown={handleMilestoneKeyDown}
                placeholder="Description (optional)"
                className="h-8"
              />
              <div className="flex items-center justify-end gap-1.5 pt-0.5">
                {editingKey && (
                  <Button type="button" variant="ghost" size="sm" onClick={cancelMilestoneEdit}>
                    Cancel
                  </Button>
                )}
                <Button type="button" variant="secondary" size="sm" onClick={upsertMilestone} disabled={!msName.trim()}>
                  <Plus className="h-3.5 w-3.5" />
                  {editingKey ? "Save milestone" : "Add milestone"}
                </Button>
              </div>
            </div>
          </section>
        </div>

        <DialogFooter className="shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs text-faint-foreground">Drafts are only visible to you and members you add</span>
            <div className="flex items-center gap-2">
              <Switch checked={createMore} onCheckedChange={setCreateMore} id="create-more" />
              <Label htmlFor="create-more" className="cursor-pointer">
                Create more
              </Label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={!!pending} onClick={() => submit("draft")}>
              {pending === "draft" ? "Saving..." : "Save as draft"}
            </Button>
            <Button type="button" variant="primary" disabled={!!pending} onClick={() => submit("publish")}>
              {pending === "publish" ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
