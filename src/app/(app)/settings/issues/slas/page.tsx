import { LocalToggleList } from "@/components/settings/local-toggle-list";

export default function IssueSlasPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-sm font-semibold text-foreground">SLAs</h1>
      <p className="max-w-md text-sm text-muted-foreground">Response-time policies applied to urgent issues.</p>
      <LocalToggleList
        storageKey="taskcraft.slas"
        items={[
          { key: "urgent24h", label: "Urgent issues within 24h", description: "Flag urgent issues untouched after 24 hours" },
          { key: "high72h", label: "High priority within 72h", description: "Flag high priority issues untouched after 72 hours" },
        ]}
      />
    </div>
  );
}
