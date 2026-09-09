"use client";

import * as React from "react";
import { HelpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function HelpDialog() {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          title="Help"
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent size="xl" className="flex h-[90vh] max-h-[90vh] w-[95vw] max-w-6xl flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>User Manual</DialogTitle>
        </DialogHeader>
        {open && (
          <iframe
            src="/docs/user-manual.html"
            title="TaskCraft User Manual"
            className="min-h-0 w-full flex-1 border-0"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
