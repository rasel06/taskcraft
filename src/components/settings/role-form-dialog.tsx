"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createRole, updateRole } from "@/actions/roles";
import { PERMISSIONS, type PermissionKey } from "@/lib/permissions";

interface RoleLite {
  id: string;
  name: string;
  permissions: string;
}

export function RoleFormDialog({ role }: { role?: RoleLite }) {
  const router = useRouter();
  const isEdit = !!role;
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(role?.name ?? "");
  const [permissions, setPermissions] = React.useState<PermissionKey[]>(
    role ? (role.permissions.split(",").filter(Boolean) as PermissionKey[]) : [],
  );
  const [pending, setPending] = React.useState(false);

  function reset() {
    setName(role?.name ?? "");
    setPermissions(role ? (role.permissions.split(",").filter(Boolean) as PermissionKey[]) : []);
  }

  function toggle(key: PermissionKey) {
    setPermissions((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      if (isEdit) {
        await updateRole(role.id, { name, permissions });
        toast.success("Role updated");
      } else {
        await createRole({ name, permissions });
        toast.success("Role created");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save role");
    } finally {
      setPending(false);
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
      <DialogTrigger asChild>
        {isEdit ? (
          <button className="text-muted-foreground hover:text-foreground" title="Edit role">
            <Pencil className="h-3.5 w-3.5" />
          </button>
        ) : (
          <Button variant="primary" size="sm">
            <Plus className="h-3.5 w-3.5" /> New role
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit role" : "New role"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 px-5 py-4">
            <div className="space-y-1.5">
              <Label>Role name</Label>
              <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Manager" required />
            </div>
            <div className="space-y-1.5">
              <Label>Permissions</Label>
              <div className="flex flex-col gap-2">
                {PERMISSIONS.map((p) => (
                  <div
                    key={p.key}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2.5"
                  >
                    <div>
                      <div className="text-sm text-foreground">{p.label}</div>
                      <div className="text-xs text-muted-foreground">{p.description}</div>
                    </div>
                    <Switch checked={permissions.includes(p.key)} onCheckedChange={() => toggle(p.key)} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="justify-end">
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Saving..." : isEdit ? "Save changes" : "Create role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
