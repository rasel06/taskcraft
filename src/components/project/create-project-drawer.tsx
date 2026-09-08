"use client";

import * as React from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Sparkles, Diamond, Pencil, Trash2, Plus, CalendarIcon, X } from "lucide-react";
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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
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
  const [generating, setGenerating] = React.useState(false);
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

  function generateWithAgent() {
    if (!name.trim()) {
      toast.error("Add a project name first");
      return;
    }
    setGenerating(true);
    setTimeout(() => {
      setDescription(
        (prev) =>
          prev ||
          `${name.trim()} delivers a focused set of improvements for the team. Outline:\n- Define scope and success criteria\n- Break work into milestones\n- Ship incrementally and gather feedback`,
      );
      setMilestones((prev) =>
        prev.length
          ? prev
          : [
              { key: crypto.randomUUID(), name: "Kickoff", description: "Align on scope and success criteria" },
              { key: crypto.randomUUID(), name: "Beta", description: "Ship a usable version to early users" },
              { key: crypto.randomUUID(), name: "Launch", description: "Full rollout" },
            ],
      );
      setGenerating(false);
      toast.success("Outline drafted - review and edit before publishing");
    }, 900);
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
      <DialogContent size="xl" className="max-h-[85vh] grid-rows-[auto_1fr_auto]">
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 overflow-y-auto px-5 py-4">
          <div className="space-y-3">
            <Input
              ref={nameRef}
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              className="h-9 border-none bg-transparent px-0 text-lg font-semibold focus-visible:ring-0"
            />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write a short brief..."
              className="min-h-20 border-none bg-transparent px-0 focus-visible:ring-0"
            />
          </div>

          <button
            type="button"
            onClick={generateWithAgent}
            disabled={generating}
            className="flex items-center gap-2 rounded-md border border-dashed border-indigo-300 bg-indigo-50 px-3 py-2.5 text-left text-sm text-indigo-700 transition-colors hover:bg-indigo-100 disabled:opacity-60 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950/70"
          >
            <Sparkles className="h-4 w-4" />
            {generating ? "Drafting outline..." : "Create with Agent — generate a brief and milestone outline"}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Team</Label>
              <Select value={teamId} onValueChange={setTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.identifier})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Project lead</Label>
              <Select value={leadId} onValueChange={setLeadId}>
                <SelectTrigger>
                  {leadId && <UserAvatar user={users.find((u) => u.id === leadId)} className="h-4 w-4" />}
                  <SelectValue placeholder="Select lead" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id} icon={<UserAvatar user={u} className="h-4 w-4" />}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Members</Label>
              <Select
                value=""
                onValueChange={(id) => setMemberIds((prev) => (prev.includes(id) ? prev : [...prev, id]))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={memberIds.length ? `${memberIds.length} added` : "Add members"} />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      <span className="flex items-center gap-2">
                        <UserAvatar user={u} className="h-4 w-4" /> {u.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {memberIds.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {memberIds.map((id) => {
                    const u = users.find((x) => x.id === id);
                    if (!u) return null;
                    return (
                      <span
                        key={id}
                        className="flex items-center gap-1 rounded-md bg-muted py-0.5 pl-1.5 pr-1 text-xs text-foreground"
                      >
                        {u.name}
                        <button type="button" onClick={() => setMemberIds(memberIds.filter((x) => x !== id))}>
                          <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Timeline</Label>
              <div className="flex rounded-md border border-input p-0.5">
                {DATE_GRANULARITIES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGranularity(g)}
                    className={cn(
                      "rounded px-2 py-0.5 text-xs transition-colors",
                      granularity === g ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
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
          </div>

          <div className="space-y-2">
            <Label>Milestones</Label>
            {milestones.length > 0 && (
              <ul className="space-y-1">
                {milestones.map((m) => (
                  <li
                    key={m.key}
                    className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5"
                  >
                    <Diamond className="h-3 w-3 shrink-0 rotate-45 border-2 border-emerald-500 bg-transparent text-transparent" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-foreground">{m.name}</div>
                      {m.description && <div className="truncate text-xs text-muted-foreground">{m.description}</div>}
                    </div>
                    <button type="button" onClick={() => editMilestone(m)} className="text-muted-foreground hover:text-foreground">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setMilestones(milestones.filter((x) => x.key !== m.key))}
                      className="text-muted-foreground hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center gap-2">
              <Input
                value={msName}
                onChange={(e) => setMsName(e.target.value)}
                placeholder="Milestone name"
                className="h-8"
              />
              <Input
                value={msDesc}
                onChange={(e) => setMsDesc(e.target.value)}
                placeholder="Description"
                className="h-8"
              />
              <Button type="button" variant="secondary" size="sm" onClick={upsertMilestone}>
                <Plus className="h-3.5 w-3.5" />
                {editingKey ? "Save" : "Add"}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
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
