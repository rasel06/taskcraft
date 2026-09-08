import { LocalTextList } from "@/components/settings/local-text-list";

export default function IssueTemplatesPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-sm font-semibold text-foreground">Issue Templates</h1>
      <p className="max-w-md text-sm text-muted-foreground">Named templates your team can start new issues from.</p>
      <LocalTextList storageKey="taskcraft.issueTemplates" placeholder="e.g. Bug report" defaults={["Bug report", "Feature request"]} />
    </div>
  );
}
