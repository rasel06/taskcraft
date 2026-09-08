import { PROJECT_STATUSES } from "@/lib/constants";

export default function ProjectStatusesPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-sm font-semibold text-foreground">Project Statuses</h1>
      <p className="max-w-md text-sm text-muted-foreground">The status lifecycle every project moves through.</p>
      <ol className="flex max-w-md flex-col gap-1">
        {PROJECT_STATUSES.map((s, i) => (
          <li key={s} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground">
            <span className="text-xs text-faint-foreground">{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
}
