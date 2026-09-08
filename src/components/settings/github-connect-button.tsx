"use client";

import { toast } from "sonner";
import { GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GithubConnectButton() {
  return (
    <Button
      variant="secondary"
      onClick={() => toast("Connecting GitHub requires an OAuth app configured for this workspace.")}
    >
      <GitBranch className="h-4 w-4" /> Connect GitHub
    </Button>
  );
}
