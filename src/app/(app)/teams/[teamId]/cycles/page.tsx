import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canAccessTeam } from "@/lib/auth";
import { getTeamCycles } from "@/lib/data";
import { AccessDenied } from "@/components/shared/access-denied";
import { CycleFormDialog } from "@/components/team/cycle-form-dialog";
import { DeleteCycleDialog } from "@/components/team/delete-cycle-dialog";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { RefreshCw, Lock, Plus, Pencil } from "lucide-react";
import type { CycleOverview, CycleStatus } from "@/lib/types";

const STATUS_ORDER: CycleStatus[] = ["Active", "Upcoming", "Completed"];
const STATUS_DOT: Record<CycleStatus, string> = {
  Active: "bg-indigo-500",
  Upcoming: "bg-zinc-500",
  Completed: "bg-emerald-500",
};

function CycleRow({ cycle, teamId }: { cycle: CycleOverview; teamId: string }) {
  const pct = cycle.issueCount ? Math.round((cycle.completedCount / cycle.issueCount) * 100) : 0;
  const label = cycle.name?.trim() || `Cycle ${cycle.number}`;
  return (
    <div className="flex items-center gap-3 border-b border-border px-5 py-3 hover:bg-muted/40">
      <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[cycle.status]}`} />
      <Link href={`/teams/${teamId}/cycles/${cycle.id}`} className="min-w-0 flex-1">
        <div className="truncate text-sm text-foreground">{label}</div>
        <div className="text-xs text-faint-foreground">
          {formatDate(cycle.startDate)} - {formatDate(cycle.targetDate)} · {cycle.issueCount} issues
        </div>
      </Link>
      <div className="flex w-40 items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="w-8 text-right text-xs text-faint-foreground">{pct}%</span>
      </div>
      <div className="flex items-center gap-2 border-l border-border pl-3">
        <CycleFormDialog
          teamId={teamId}
          cycle={cycle}
          trigger={
            <button className="text-muted-foreground hover:text-foreground" title="Edit cycle">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          }
        />
        <DeleteCycleDialog cycleId={cycle.id} label={label} />
      </div>
    </div>
  );
}

export default async function TeamCyclesPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) notFound();

  const user = await getCurrentUser();
  const allowed = await canAccessTeam(teamId, user);
  const cycles = allowed ? await getTeamCycles(teamId) : [];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="flex items-center gap-2 border-b border-border px-5 py-3">
        <h1 className="text-sm font-semibold text-foreground">{team.name}</h1>
        {team.isPrivate && <Lock className="h-3.5 w-3.5 text-faint-foreground" />}
        <span className="text-sm text-faint-foreground">Cycles</span>
        {allowed && (
          <div className="ml-auto">
            <CycleFormDialog
              teamId={teamId}
              trigger={
                <Button variant="primary" size="sm">
                  <Plus className="h-3.5 w-3.5" /> New cycle
                </Button>
              }
            />
          </div>
        )}
      </header>
      {!allowed ? (
        <AccessDenied />
      ) : cycles.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 py-24 text-faint-foreground">
          <RefreshCw className="h-8 w-8" />
          <p className="text-sm">Cycles aren&apos;t set up for this team yet</p>
          <p className="text-xs">Time-boxed sprints will appear here once enabled</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {STATUS_ORDER.map((status) => {
            const group = cycles.filter((c) => c.status === status);
            if (group.length === 0) return null;
            return (
              <div key={status} className="flex flex-col">
                <div className="border-b border-border bg-muted/30 px-5 py-1.5 text-xs font-medium text-muted-foreground">
                  {status}
                </div>
                {group.map((c) => (
                  <CycleRow key={c.id} cycle={c} teamId={teamId} />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
