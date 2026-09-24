"use client";

import { useRouter } from "next/navigation";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export function IssueStatusProjectPicker({
  projects,
  value,
}: {
  projects: { id: string; name: string; teamIdentifier: string; canManage: boolean }[];
  value: string;
}) {
  const router = useRouter();
  return (
    <Select value={value} onValueChange={(id) => router.replace(`/settings/issues/statuses?project=${id}`)}>
      <SelectTrigger className="h-8 w-72 text-sm">
        <SelectValue placeholder="Choose a project" />
      </SelectTrigger>
      <SelectContent>
        {projects.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.teamIdentifier} · {p.name}
            {!p.canManage && <span className="ml-1 text-faint-foreground">(view only)</span>}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
