import { LocalTextList } from "@/components/settings/local-text-list";

export default function ProjectLabelsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-sm font-semibold text-foreground">Project Labels</h1>
      <LocalTextList storageKey="taskcraft.projectLabels" placeholder="e.g. platform" defaults={["platform", "growth"]} />
    </div>
  );
}
