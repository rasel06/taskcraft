"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { createCycle, updateCycle } from "@/actions/cycles";
import type { CycleOverview } from "@/lib/types";

function DateField({
  label,
  date,
  onChange,
}: {
  label: string;
  date: Date | undefined;
  onChange: (d: Date | undefined) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start font-normal">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            {date ? format(date, "MMM d, yyyy") : <span className="text-muted-foreground">Set date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar mode="single" selected={date} onSelect={onChange} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function CycleFormDialog({
  teamId,
  cycle,
  trigger,
}: {
  teamId: string;
  cycle?: CycleOverview;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const isEdit = !!cycle;
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(cycle?.name ?? "");
  const [startDate, setStartDate] = React.useState<Date | undefined>(
    cycle ? new Date(cycle.startDate) : undefined,
  );
  const [targetDate, setTargetDate] = React.useState<Date | undefined>(
    cycle ? new Date(cycle.targetDate) : undefined,
  );
  const [pending, setPending] = React.useState(false);

  function reset() {
    setName(cycle?.name ?? "");
    setStartDate(cycle ? new Date(cycle.startDate) : undefined);
    setTargetDate(cycle ? new Date(cycle.targetDate) : undefined);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate || !targetDate) {
      toast.error("Start and target dates are required");
      return;
    }
    setPending(true);
    try {
      if (isEdit) {
        await updateCycle(cycle.id, {
          name,
          startDate: startDate.toISOString(),
          targetDate: targetDate.toISOString(),
        });
        toast.success("Cycle updated");
      } else {
        await createCycle({
          teamId,
          name,
          startDate: startDate.toISOString(),
          targetDate: targetDate.toISOString(),
        });
        toast.success("Cycle created");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save cycle");
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
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit cycle" : "New cycle"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 px-5 py-4">
            <div className="space-y-1.5">
              <Label>Name (optional)</Label>
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Cycle name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <DateField label="Start date" date={startDate} onChange={setStartDate} />
              <DateField label="Target date" date={targetDate} onChange={setTargetDate} />
            </div>
          </div>
          <DialogFooter className="justify-end">
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Saving..." : isEdit ? "Save changes" : "Create cycle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
