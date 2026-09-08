"use client";

import * as React from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { updateProfile } from "@/actions/users";
import type { UserLite } from "@/lib/types";

export function ProfileForm({ user }: { user: UserLite }) {
  const [name, setName] = React.useState(user.name);
  const [pending, setPending] = React.useState(false);

  async function save() {
    setPending(true);
    try {
      await updateProfile(user.id, { name, avatarUrl: user.avatarUrl });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex max-w-md flex-col gap-4">
      <div className="flex items-center gap-3">
        <UserAvatar user={{ ...user, name }} className="h-12 w-12 text-base" />
        <div className="text-xs text-muted-foreground">Avatar is generated from your initials</div>
      </div>
      <div className="space-y-1.5">
        <Label>Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input value={user.email} disabled className="opacity-60" />
      </div>
      <Button variant="primary" className="w-fit" onClick={save} disabled={pending}>
        {pending ? "Saving..." : "Save changes"}
      </Button>
    </div>
  );
}
