import { ThemeToggle } from "@/components/theme-toggle";
import { LocalToggleList } from "@/components/settings/local-toggle-list";

export default function PreferencesPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-sm font-semibold text-foreground">Preferences</h1>
      <div className="max-w-md space-y-1.5">
        <p className="text-sm text-foreground">Theme</p>
        <ThemeToggle />
      </div>
      <LocalToggleList
        storageKey="taskcraft.preferences"
        items={[
          { key: "compactRows", label: "Compact issue rows", description: "Tighter spacing in list views" },
          { key: "fullNames", label: "Show full names", description: "Use full names instead of initials where space allows" },
        ]}
      />
    </div>
  );
}
