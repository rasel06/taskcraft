"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LocalTextList({
  storageKey,
  placeholder,
  defaults = [],
}: {
  storageKey: string;
  placeholder: string;
  defaults?: string[];
}) {
  const [items, setItems] = React.useState<string[]>(defaults);
  const [value, setValue] = React.useState("");
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) setItems(JSON.parse(raw));
      } catch {}
      setLoaded(true);
    }, 0);
    return () => clearTimeout(timeout);
  }, [storageKey]);

  React.useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {}
  }, [items, loaded, storageKey]);

  function add() {
    const v = value.trim();
    if (v && !items.includes(v)) setItems([...items, v]);
    setValue("");
  }

  return (
    <div className="flex max-w-md flex-col gap-3">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder}
        />
        <Button type="button" variant="secondary" onClick={add}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm text-foreground">
            {item}
            <button onClick={() => setItems(items.filter((i) => i !== item))} className="text-faint-foreground hover:text-red-400">
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-faint-foreground">Saved to this browser only.</p>
    </div>
  );
}
