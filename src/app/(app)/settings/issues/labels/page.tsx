import { LocalTextList } from "@/components/settings/local-text-list";

export default function IssueLabelsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-sm font-semibold text-foreground">Issue Labels</h1>
      <p className="max-w-md text-sm text-muted-foreground">Suggested labels shown when tagging an issue.</p>
      <LocalTextList storageKey="taskcraft.issueLabels" placeholder="e.g. bug" defaults={["bug", "feature", "chore"]} />
    </div>
  );
}
