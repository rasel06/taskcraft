import { getCurrentUser } from "@/lib/auth";
import { getVisibleProjects } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default async function ProjectUpdatesPage() {
  const user = await getCurrentUser();
  const projects = await getVisibleProjects(user);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-sm font-semibold text-foreground">Project Updates</h1>
      <p className="max-w-md text-sm text-muted-foreground">Latest known status per published project.</p>
      <ul className="flex max-w-md flex-col gap-1">
        {projects.map((p) => (
          <li key={p.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
            <span className="text-foreground">{p.name}</span>
            <span className="text-xs text-muted-foreground">
              {p.status} · updated {formatDate(p.updatedAt)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
