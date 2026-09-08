import { LocalTextList } from "@/components/settings/local-text-list";

export default function ProjectTemplatesPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-sm font-semibold text-foreground">Project Templates</h1>
      <LocalTextList storageKey="taskcraft.projectTemplates" placeholder="e.g. Product launch" defaults={["Product launch"]} />
    </div>
  );
}
