import { LocalToggleList } from "@/components/settings/local-toggle-list";

export default function FeaturesPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-sm font-semibold text-foreground">Features</h1>
      <p className="max-w-md text-sm text-muted-foreground">Toggle workspace features on or off.</p>
      <LocalToggleList
        storageKey="taskcraft.features"
        items={[
          { key: "aiAgents", label: "AI & Agents", description: "Enable the Create with Agent outline generator", defaultOn: true },
          { key: "initiatives", label: "Initiatives", description: "Group multiple projects under a shared goal" },
          { key: "documents", label: "Documents", description: "Long-form docs linked to projects" },
          { key: "customerRequests", label: "Customer requests", description: "Intake board for external feedback" },
          { key: "releases", label: "Releases", description: "Track shipped versions per team" },
        ]}
      />
    </div>
  );
}
