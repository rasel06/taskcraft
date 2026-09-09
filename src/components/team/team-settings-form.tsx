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
import { TIMEZONES } from "@/lib/constants";
import type { UserLite } from "@/lib/types";

export function TeamSettingsForm({
  team,
  allUsers,
  canManage,
}: {
  team: { id: string; name: string; identifier: string; timezone: string; isPrivate: boolean; leadId: string | null };
  allUsers: UserLite[];
  canManage: boolean;
}) {
  const [name, setName] = React.useState(team.name);
  const [timezone, setTimezone] = React.useState(team.timezone);
  const [isPrivate, setIsPrivate] = React.useState(team.isPrivate);
  const [leadId, setLeadId] = React.useState(team.leadId ?? "");
  const [pending, setPending] = React.useState(false);

  async function save() {
    setPending(true);
    try {
      await updateTeam(team.id, { name, timezone, isPrivate, leadId: leadId || undefined });
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
              {isPrivate ? "Visible only to members and workspace admins" : "Visible to everyone in the workspace"}
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
