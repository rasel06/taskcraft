"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
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
import { updateMember } from "@/actions/members";
import type { MemberDetail } from "@/lib/types";

export function EditMemberDialog({ member }: { member: MemberDetail }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(member.name);
  const [email, setEmail] = React.useState(member.email);
  const [bankId, setBankId] = React.useState(member.bankId ?? "");
  const [fileNumber, setFileNumber] = React.useState(member.fileNumber ?? "");
  const [mobile, setMobile] = React.useState(member.mobile ?? "");
  const [isAdmin, setIsAdmin] = React.useState(member.isWorkspaceAdmin);
  const [pending, setPending] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await updateMember(member.id, { name, email, bankId, fileNumber, mobile, isWorkspaceAdmin: isAdmin });
      toast.success("Member updated");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update member");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-muted-foreground hover:text-foreground" title="Edit member">
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Edit member</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 px-5 py-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Bank ID</Label>
              <Input value={bankId} onChange={(e) => setBankId(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>File number</Label>
              <Input value={fileNumber} onChange={(e) => setFileNumber(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Mobile</Label>
              <Input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
              <div>
                <div className="text-sm text-foreground">Workspace admin</div>
                <div className="text-xs text-muted-foreground">Can access every team and project</div>
              </div>
              <Switch checked={isAdmin} onCheckedChange={setIsAdmin} />
            </div>
          </div>
          <DialogFooter className="justify-end">
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
