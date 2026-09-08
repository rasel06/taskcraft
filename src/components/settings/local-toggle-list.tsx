"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";

interface ToggleItem {
  key: string;
  label: string;
  description: string;
  defaultOn?: boolean;
}

export function LocalToggleList({ storageKey, items }: { storageKey: string; items: ToggleItem[] }) {
  const [state, setState] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map((i) => [i.key, i.defaultOn ?? false])),
  );
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) setState((prev) => ({ ...prev, ...JSON.parse(raw) }));
      } catch {}
      setLoaded(true);
    }, 0);
    return () => clearTimeout(timeout);
  }, [storageKey]);

  React.useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {}
  }, [state, loaded, storageKey]);

  return (
    <div className="flex max-w-md flex-col gap-3">
      {items.map((item) => (
        <div key={item.key} className="flex items-start justify-between rounded-md border border-border px-3 py-2.5">
          <div>
            <div className="text-sm text-foreground">{item.label}</div>
            <div className="text-xs text-muted-foreground">{item.description}</div>
          </div>
          <Switch
            checked={state[item.key] ?? false}
            onCheckedChange={(v) => setState((prev) => ({ ...prev, [item.key]: v }))}
          />
        </div>
      ))}
      <p className="text-xs text-faint-foreground">Saved to this browser only.</p>
    </div>
  );
}
