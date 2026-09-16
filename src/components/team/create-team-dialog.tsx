"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, Globe2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { createTeam } from "@/actions/teams";
import { TIMEZONES, TEAM_ICONS, TEAM_COLORS } from "@/lib/constants";
import { TEAM_ICON_MAP } from "@/components/shared/team-icon";
import { cn } from "@/lib/utils";
import type { TeamWithProjects, UserLite } from "@/lib/types";

export function CreateTeamDialog({
  teams,
  users,
  currentUserId,
  trigger,
}: {
  teams: TeamWithProjects[];
  users: UserLite[];
  currentUserId: string;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [name, setName] = React.useState("");
  const [identifier, setIdentifier] = React.useState("");
  const [timezone, setTimezone] = React.useState(TIMEZONES[5]);
  const [isPrivate, setIsPrivate] = React.useState(false);
  const [icon, setIcon] = React.useState<string>(TEAM_ICONS[0]);
  const [color, setColor] = React.useState<string>(TEAM_COLORS[8].key);
  const [leadId, setLeadId] = React.useState<string>(currentUserId);
  const [cloneFrom, setCloneFrom] = React.useState<string>("none");
  const [createMore, setCreateMore] = React.useState(false);
  const nameRef = React.useRef<HTMLInputElement>(null);

  function resetFields() {
    setName("");
    setIdentifier("");
  }

  function reset() {
    resetFields();
    setTimezone(TIMEZONES[5]);
    setIsPrivate(false);
    setIcon(TEAM_ICONS[0]);
    setColor(TEAM_COLORS[8].key);
    setLeadId(currentUserId);
    setCloneFrom("none");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    try {
      const team = await createTeam({
        name,
        identifier,
        timezone,
        isPrivate,
        icon,
        color,
        leadId,
        cloneFromTeamId: cloneFrom === "none" ? null : cloneFrom,
      });
      toast.success(`Team "${team.name}" created`);
      if (createMore) {
        resetFields();
        nameRef.current?.focus();
        router.refresh();
      } else {
        setOpen(false);
        reset();
        router.push(`/teams/${team.id}/issues`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create team");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create team</DialogTitle>
            <DialogDescription>Teams group projects and control who can see them.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 px-5 py-4">
            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="team-name">Team name</Label>
                <Input
                  id="team-name"
                  ref={nameRef}
                  autoFocus
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!identifier || identifier === deriveIdentifier(name)) {
                      setIdentifier(deriveIdentifier(e.target.value));
                    }
                  }}
                  placeholder="Frontend"
                  required
                />
              </div>
              <div className="w-24 space-y-1.5">
                <Label htmlFor="team-identifier">Identifier</Label>
                <Input
                  id="team-identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value.toUpperCase().slice(0, 4))}
                  maxLength={4}
                  placeholder="FRO"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Icon</Label>
              <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
                {TEAM_ICONS.map((iconName) => {
                  const Icon = TEAM_ICON_MAP[iconName];
                  const selectedClass = TEAM_COLORS.find((c) => c.key === color)?.selected;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setIcon(iconName)}
                      title={iconName}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-md border",
                        icon === iconName
                          ? selectedClass
                          : "border-input text-muted-foreground hover:border-input hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-1.5">
                {TEAM_COLORS.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setColor(c.key)}
                    title={c.label}
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition-shadow",
                      c.swatch,
                      color === c.key && "ring-2 ring-foreground",
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Team lead</Label>
              <Select value={leadId} onValueChange={setLeadId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                      {u.id === currentUserId ? " (you)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {teams.length > 0 && (
              <div className="space-y-1.5">
                <Label>Clone settings from</Label>
                <Select value={cloneFrom} onValueChange={setCloneFrom}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Don&apos;t clone</SelectItem>
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} ({t.identifier})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-start justify-between rounded-md border border-input px-3 py-2.5">
              <div className="flex items-start gap-2">
                {isPrivate ? (
                  <Lock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                ) : (
                  <Globe2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <div className="text-sm text-foreground">{isPrivate ? "Private team" : "Public team"}</div>
                  <div className="text-xs text-muted-foreground">
                    Only members and roles with &quot;View all teams&quot; permission can access this team
                  </div>
                </div>
              </div>
              <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
            </div>
          </div>

          <DialogFooter>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch checked={createMore} onCheckedChange={setCreateMore} id="create-more" />
                <Label htmlFor="create-more" className="cursor-pointer">
                  Create more
                </Label>
              </div>
            </div>
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Creating..." : "Create team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function deriveIdentifier(name: string) {
  return name
    .replace(/[^a-zA-Z ]/g, "")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 4) || name.toUpperCase().slice(0, 3);
}
