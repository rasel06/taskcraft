"use client";

import * as React from "react";
import { toast } from "sonner";
import { X, ShieldCheck } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { addTeamMember, removeTeamMember } from "@/actions/teams";
import type { UserLite } from "@/lib/types";

interface Member {
  userId: string;
  role: string;
  user: UserLite;
}

export function TeamMembersManager({
  teamId,
  members,
  allUsers,
  canManage,
  currentUserId,
}: {
  teamId: string;
  members: Member[];
  allUsers: UserLite[];
  canManage: boolean;
  currentUserId: string;
}) {
  const memberIds = new Set(members.map((m) => m.userId));
  const addable = allUsers.filter((u) => !memberIds.has(u.id));

  async function add(userId: string) {
    try {
      await addTeamMember(teamId, userId);
      toast.success("Member added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add member");
    }
  }

  async function remove(userId: string) {
    try {
      await removeTeamMember(teamId, userId);
      toast.success("Member removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove member");
    }
  }

  return (
    <div className="flex max-w-md flex-col gap-3">
      {canManage && addable.length > 0 && (
        <Select value="" onValueChange={add}>
          <SelectTrigger>
            <SelectValue placeholder="Add a member" />
          </SelectTrigger>
          <SelectContent>
            {addable.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                <span className="flex items-center gap-2">
                  <UserAvatar user={u} className="h-4 w-4" /> {u.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <ul className="flex flex-col gap-1">
        {members.map((m) => (
          <li
            key={m.userId}
            className="flex items-center gap-2 rounded-md border border-border px-3 py-2"
          >
            <UserAvatar user={m.user} className="h-6 w-6" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm text-foreground">{m.user.name}</div>
              <div className="truncate text-xs text-muted-foreground">{m.user.email}</div>
            </div>
            {m.role === "ADMIN" && <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
            {canManage && m.userId !== currentUserId && (
              <button onClick={() => remove(m.userId)} className="text-faint-foreground hover:text-red-400">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
