"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
] as const;

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const timeout = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className={cn("flex items-center gap-0.5 rounded-md border border-border p-0.5", className)}>
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = mounted && theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            title={opt.label}
            onClick={() => setTheme(opt.value)}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded",
              active ? "bg-primary-soft-bg text-primary-soft-text" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
