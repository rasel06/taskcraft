import { LocalToggleList } from "@/components/settings/local-toggle-list";

export default function AgentPersonalizationPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-sm font-semibold text-foreground">Agent Personalization</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Controls for the &quot;Create with Agent&quot; project outline generator.
      </p>
      <LocalToggleList
        storageKey="taskcraft.agent"
        items={[
          { key: "suggestMilestones", label: "Suggest milestones", description: "Prefill common milestones when drafting", defaultOn: true },
          { key: "suggestBrief", label: "Suggest project brief", description: "Draft an outline paragraph", defaultOn: true },
        ]}
      />
    </div>
  );
}
