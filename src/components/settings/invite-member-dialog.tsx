"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
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
import { createMember } from "@/actions/members";

export function InviteMemberDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [bankId, setBankId] = React.useState("");
  const [fileNumber, setFileNumber] = React.useState("");
  const [mobile, setMobile] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [createMore, setCreateMore] = React.useState(false);
  const nameRef = React.useRef<HTMLInputElement>(null);

  function resetFields() {
    setName("");
    setEmail("");
    setBankId("");
    setFileNumber("");
    setMobile("");
    setPassword("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await createMember({ name, email, bankId, fileNumber, mobile, password, isWorkspaceAdmin: isAdmin });
      toast.success(`${name} added to the workspace`);
      router.refresh();
      if (createMore) {
        resetFields();
        nameRef.current?.focus();
      } else {
        setOpen(false);
        resetFields();
        setIsAdmin(false);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to invite member");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary" size="sm">
          <UserPlus className="h-3.5 w-3.5" /> Invite people
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Invite a member</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 px-5 py-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input ref={nameRef} value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
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
            <div className="space-y-1.5">
              <Label>Initial password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
              <p className="text-xs text-faint-foreground">At least 8 characters. They can change it after signing in.</p>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
              <div>
                <div className="text-sm text-foreground">Workspace admin</div>
                <div className="text-xs text-muted-foreground">Can access every team and project</div>
              </div>
              <Switch checked={isAdmin} onCheckedChange={setIsAdmin} />
            </div>
          </div>
          <DialogFooter>
            <div className="flex items-center gap-2">
              <Switch checked={createMore} onCheckedChange={setCreateMore} id="create-more" />
              <Label htmlFor="create-more" className="cursor-pointer">
                Create more
              </Label>
            </div>
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Adding..." : "Add member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
