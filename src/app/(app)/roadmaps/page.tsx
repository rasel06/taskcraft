import { getCurrentUser } from "@/lib/auth";
import { getProjectsOverview } from "@/lib/data";
import { RoadmapTimeline } from "@/components/project/roadmap-timeline";
import { Map } from "lucide-react";

export default async function RoadmapsPage() {
  const user = await getCurrentUser();
  const projects = await getProjectsOverview(user);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="flex items-center gap-2 border-b border-border px-5 py-3">
        <Map className="h-4 w-4 text-muted-foreground" />
        <h1 className="text-sm font-semibold text-foreground">Roadmaps</h1>
      </header>
      {projects.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 py-24 text-faint-foreground">
          <Map className="h-8 w-8" />
          <p className="text-sm">No published projects yet</p>
        </div>
      ) : (
        <RoadmapTimeline projects={projects} />
      )}
    </div>
  );
}
