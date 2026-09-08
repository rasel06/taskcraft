"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileText, Hash, X } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { StatusIcon } from "@/components/shared/status-icon";
import { PriorityIcon } from "@/components/shared/priority-icon";

interface SearchIssue {
  id: string;
  title: string;
  status: string;
  priority: string;
  projectId: string;
  projectName: string;
  teamIdentifier: string;
}

interface SearchProject {
  id: string;
  name: string;
  teamIdentifier: string;
}

export function SearchModal({ teamIdentifiers }: { teamIdentifiers: string[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [teamChip, setTeamChip] = React.useState<string | null>(null);
  const [issues, setIssues] = React.useState<SearchIssue[]>([]);
  const [projects, setProjects] = React.useState<SearchProject[]>([]);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuery("");
      setTeamChip(null);
    }
  }

  React.useEffect(() => {
    let cancelled = false;
    let keyword = query;
    let detectedTeam = teamChip;

    if (!detectedTeam) {
      const match = query.match(/^([A-Za-z]{2,4}):\s*(.*)$/);
      if (match && teamIdentifiers.includes(match[1].toUpperCase())) {
        detectedTeam = match[1].toUpperCase();
        keyword = match[2];
      }
    }

    if (!keyword && !detectedTeam) {
      const clear = setTimeout(() => {
        setIssues([]);
        setProjects([]);
      }, 0);
      return () => clearTimeout(clear);
    }

    const params = new URLSearchParams();
    if (keyword) params.set("q", keyword);
    if (detectedTeam) params.set("team", detectedTeam);

    const timeout = setTimeout(() => {
      fetch(`/api/search?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          if (!cancelled) {
            setIssues(data.issues ?? []);
            setProjects(data.projects ?? []);
          }
        })
        .catch(() => {});
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query, teamChip, teamIdentifiers]);

  const rawMatch = query.match(/^([A-Za-z]{2,4}):\s*(.*)$/);
  const activeChip =
    teamChip ?? (rawMatch && teamIdentifiers.includes(rawMatch[1].toUpperCase()) ? rawMatch[1].toUpperCase() : null);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-8 w-full items-center gap-2 rounded-md border border-input bg-background px-2.5 text-sm text-muted-foreground hover:border-input hover:text-muted-foreground"
      >
        <Hash className="h-3.5 w-3.5" />
        Search
        <kbd className="ml-auto rounded border border-input bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={handleOpenChange}>
        {activeChip && (
          <div className="flex items-center gap-1.5 border-b border-border px-3 pt-2">
            <span className="flex items-center gap-1 rounded bg-indigo-50 px-1.5 py-0.5 text-xs text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {activeChip}
              <button
                onClick={() => {
                  setTeamChip(null);
                  setQuery("");
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          </div>
        )}
        <CommandInput
          placeholder={activeChip ? "Search within team..." : 'Search issues, projects, or type "FRO:" ...'}
          value={activeChip ? query.replace(/^([A-Za-z]{2,4}):\s*/, "") : query}
          onValueChange={(v) => {
            if (activeChip) {
              setTeamChip(activeChip);
              setQuery(v);
            } else {
              setQuery(v);
            }
          }}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {projects.length > 0 && (
            <CommandGroup heading="Projects">
              {projects.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`project-${p.id}`}
                  onSelect={() => {
                    handleOpenChange(false);
                    router.push(`/projects/${p.id}`);
                  }}
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{p.name}</span>
                  <span className="ml-auto text-xs text-faint-foreground">{p.teamIdentifier}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {issues.length > 0 && (
            <CommandGroup heading="Issues">
              {issues.map((issue) => (
                <CommandItem
                  key={issue.id}
                  value={`issue-${issue.id}`}
                  onSelect={() => {
                    handleOpenChange(false);
                    router.push(`/projects/${issue.projectId}?issue=${issue.id}`);
                  }}
                >
                  <StatusIcon status={issue.status} />
                  <span className="text-muted-foreground">{issue.id}</span>
                  <span className="truncate">{issue.title}</span>
                  <PriorityIcon priority={issue.priority} className="ml-auto" />
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
