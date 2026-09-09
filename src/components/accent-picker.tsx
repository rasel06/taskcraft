"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { ACCENTS, useAccent } from "@/components/accent-provider";
import { cn } from "@/lib/utils";

export function AccentPicker() {
  const { accent, setAccent } = useAccent();

  return (
    <div className="flex items-center gap-2">
      {ACCENTS.map((a) => {
        const active = accent === a.key;
        return (
          <button
            key={a.key}
            type="button"
            title={a.label}
            onClick={() => setAccent(a.key)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition-shadow",
              active && "ring-2 ring-foreground",
            )}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full"
              style={{ backgroundColor: a.swatch }}
            >
              {active && <Check className="h-3.5 w-3.5 text-white" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
