import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canAccessTeam } from "@/lib/auth";
import { getTeamIssues, getCycleIssues, getClosedIssueStatusLookup } from "@/lib/data";
import { AccessDenied } from "@/components/shared/access-denied";
import { Board } from "@/components/board/board";
import { CycleFormDialog } from "@/components/team/cycle-form-dialog";
import { DeleteCycleDialog } from "@/components/team/delete-cycle-dialog";
import { CycleIssuesManager } from "@/components/team/cycle-issues-manager";
import { formatDate } from "@/lib/utils";
import { ChevronLeft, Pencil } from "lucide-react";
import type { CycleStatus } from "@/lib/types";

function cycleStatus(startDate: Date, targetDate: Date): CycleStatus {
  const now = Date.now();
  if (now < startDate.getTime()) return "Upcoming";
  if (now > targetDate.getTime()) return "Completed";
  return "Active";
}

const STATUS_DOT: Record<CycleStatus, string> = {
  Active: "bg-indigo-500",
  Upcoming: "bg-zinc-500",
  Completed: "bg-emerald-500",
};

export default async function CycleDetailPage({
  params,
}: {
  params: Promise<{ teamId: string; cycleId: string }>;
}) {
  const { teamId, cycleId } = await params;
  const cycle = await prisma.cycle.findUnique({ where: { id: cycleId } });
  if (!cycle || cycle.teamId !== teamId) notFound();

  const user = await getCurrentUser();
  const allowed = await canAccessTeam(teamId, user);
  if (!allowed) {
    return (
      <div className="flex flex-1 flex-col">
        <header className="border-b border-border px-5 py-3">
          <h1 className="text-sm font-semibold text-foreground">Cycle</h1>
        </header>
        <AccessDenied />
      </div>
    );
  }

  const [cycleIssues, teamIssues] = await Promise.all([
    getCycleIssues(cycleId, user?.id),
    getTeamIssues(teamId, user?.id),
  ]);
  const isClosed = await getClosedIssueStatusLookup(cycleIssues.map((i) => i.projectId));
  const closedCount = cycleIssues.filter((i) => isClosed(i.projectId, i.status)).length;
  const availableIssues = teamIssues.filter((i) => i.cycleId !== cycleId);
  const status = cycleStatus(cycle.startDate, cycle.targetDate);
  const label = cycle.name?.trim() || `Cycle ${cycle.number}`;
  const pct = cycleIssues.length
    ? Math.round((closedCount / cycleIssues.length) * 100)
    : 0;

  const overview = {
    id: cycle.id,
    teamId: cycle.teamId,
    number: cycle.number,
    name: cycle.name,
    startDate: cycle.startDate.toISOString(),
    targetDate: cycle.targetDate.toISOString(),
    status,
    issueCount: cycleIssues.length,
    completedCount: closedCount,
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="flex flex-col gap-2 border-b border-border px-5 py-3">
        <Link
          href={`/teams/${teamId}/cycles`}
          className="flex w-fit items-center gap-1 text-xs text-faint-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Cycles
        </Link>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[status]}`} />
          <h1 className="text-sm font-semibold text-foreground">{label}</h1>
          <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] text-muted-foreground">{status}</span>
          <div className="ml-auto flex items-center gap-2.5">
            <CycleFormDialog
              teamId={teamId}
              cycle={overview}
              trigger={
                <button className="text-muted-foreground hover:text-foreground" title="Edit cycle">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              }
            />
            <DeleteCycleDialog cycleId={cycle.id} label={label} redirectTo={`/teams/${teamId}/cycles`} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {formatDate(cycle.startDate)} - {formatDate(cycle.targetDate)}
          </span>
          <div className="flex w-40 items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-8 text-right text-xs text-faint-foreground">{pct}%</span>
          </div>
        </div>
      </header>

      <CycleIssuesManager cycleId={cycle.id} cycleIssues={cycleIssues} availableIssues={availableIssues} />

      <Board issues={cycleIssues} showProject />
    </div>
  );
}
