"use client";

import * as React from "react";
import { toast } from "sonner";
import { Lock, Globe2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { updateTeam } from "@/actions/teams";
import { TIMEZONES, TEAM_ICONS, TEAM_COLORS } from "@/lib/constants";
import { TEAM_ICON_MAP } from "@/components/shared/team-icon";
import { cn } from "@/lib/utils";
import type { UserLite } from "@/lib/types";

export function TeamSettingsForm({
  team,
  allUsers,
  canManage,
}: {
  team: {
    id: string;
    name: string;
    identifier: string;
    timezone: string;
    isPrivate: boolean;
    leadId: string | null;
    icon: string;
    color: string;
  };
  allUsers: UserLite[];
  canManage: boolean;
}) {
  const [name, setName] = React.useState(team.name);
  const [timezone, setTimezone] = React.useState(team.timezone);
  const [isPrivate, setIsPrivate] = React.useState(team.isPrivate);
  const [leadId, setLeadId] = React.useState(team.leadId ?? "");
  const [icon, setIcon] = React.useState(team.icon);
  const [color, setColor] = React.useState(team.color);
  const [pending, setPending] = React.useState(false);

  async function save() {
    setPending(true);
    try {
      await updateTeam(team.id, { name, timezone, isPrivate, leadId: leadId || undefined, icon, color });
      toast.success("Team settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex max-w-md flex-col gap-4">
      {!canManage && (
        <p className="text-xs text-faint-foreground">You don&apos;t have permission to edit team settings.</p>
      )}
      <div className="space-y-1.5">
        <Label>Team name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!canManage} />
      </div>
      <div className="space-y-1.5">
        <Label>Identifier</Label>
        <Input value={team.identifier} disabled className="opacity-60" />
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
                disabled={!canManage}
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
              disabled={!canManage}
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
        <Select value={leadId} onValueChange={setLeadId} disabled={!canManage}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {allUsers.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Timezone</Label>
        <Select value={timezone} onValueChange={setTimezone} disabled={!canManage}>
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
      <div className="flex items-start justify-between rounded-md border border-input px-3 py-2.5">
        <div className="flex items-start gap-2">
          {isPrivate ? <Lock className="mt-0.5 h-4 w-4 text-muted-foreground" /> : <Globe2 className="mt-0.5 h-4 w-4 text-muted-foreground" />}
          <div>
            <div className="text-sm text-foreground">{isPrivate ? "Private team" : "Public team"}</div>
            <div className="text-xs text-muted-foreground">
              Only members and roles with &quot;View all teams&quot; permission can access this team
            </div>
          </div>
        </div>
        <Switch checked={isPrivate} onCheckedChange={setIsPrivate} disabled={!canManage} />
      </div>
      <Button variant="primary" className="w-fit" onClick={save} disabled={pending || !canManage}>
        {pending ? "Saving..." : "Save changes"}
      </Button>
    </div>
  );
}
