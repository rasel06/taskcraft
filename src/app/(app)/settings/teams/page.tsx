import Link from "next/link";
import { Lock, Globe2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getVisibleTeams } from "@/lib/data";
import { CreateTeamDialog } from "@/components/team/create-team-dialog";
import { TeamIconBadge } from "@/components/shared/team-icon";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function TeamsSettingsPage() {
  const user = await getCurrentUser();
  const teams = await getVisibleTeams(user);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold text-foreground">Teams</h1>
        <CreateTeamDialog
          teams={teams}
          trigger={
            <Button variant="primary" size="sm">
              <Plus className="h-3.5 w-3.5" /> Create team
            </Button>
          }
        />
      </div>
      <ul className="flex max-w-2xl flex-col gap-1">
        {teams.map((t) => (
          <li key={t.id}>
            <Link
              href={`/teams/${t.id}/settings`}
              className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5 hover:bg-muted/40"
            >
              <TeamIconBadge icon={t.icon} color={t.color} className="h-6 w-6" iconClassName="h-3.5 w-3.5" />
              <span className="flex-1 text-sm text-foreground">{t.name}</span>
              <span className="text-xs text-muted-foreground">{t.projects.length} projects</span>
              {t.isPrivate ? (
                <Lock className="h-3.5 w-3.5 text-faint-foreground" />
              ) : (
                <Globe2 className="h-3.5 w-3.5 text-faint-foreground" />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
