import { FolderKanban, Plus } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getProjectsOverview, getVisibleTeams, getAllUsers, getProjectStatuses } from "@/lib/data";
import { ProjectList } from "@/components/project/project-list";
import { CreateProjectDrawer } from "@/components/project/create-project-drawer";
import { Button } from "@/components/ui/button";

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  const [projects, teams, users, statuses] = await Promise.all([
    getProjectsOverview(user),
    getVisibleTeams(user),
    getAllUsers(),
    getProjectStatuses(),
  ]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="flex items-center gap-2 border-b border-border px-5 py-3">
        <FolderKanban className="h-4 w-4 text-muted-foreground" />
        <h1 className="text-sm font-semibold text-foreground">Projects</h1>
        {can(user, "create_projects") && (
          <div className="ml-auto">
            <CreateProjectDrawer
              teams={teams}
              users={users}
              trigger={
                <Button variant="primary" size="sm">
                  <Plus className="h-3.5 w-3.5" /> New project
                </Button>
              }
            />
          </div>
        )}
      </header>
      {projects.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 py-24 text-faint-foreground">
          <FolderKanban className="h-8 w-8" />
          <p className="text-sm">No published projects yet</p>
        </div>
      ) : (
        <ProjectList projects={projects} statuses={statuses} />
      )}
    </div>
  );
}
