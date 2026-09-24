"use client";

import { useRouter } from "next/navigation";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export function IssueStatusProjectPicker({
  projects,
  value,
}: {
  projects: { id: string; name: string; teamIdentifier: string; statusCount: number }[];
  value: string;
}) {
  const router = useRouter();
  return (
    <Select
      value={value}
      onValueChange={(id) => router.replace(`/settings/projects/statuses?tab=workflows&project=${id}`, { scroll: false })}
    >
      <SelectTrigger className="h-8 w-80 text-sm">
        <SelectValue placeholder="Choose a project" />
      </SelectTrigger>
      <SelectContent>
        {projects.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.teamIdentifier} · {p.name}
            <span className="ml-1 text-faint-foreground">({p.statusCount} statuses)</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
