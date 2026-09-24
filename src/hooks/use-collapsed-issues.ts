"use client";

import * as React from "react";

// Cards start collapsed; this remembers which ones the viewer has expanded.
// A per-viewer convenience kept in localStorage, shared by every board in the
// tab and synced across tabs.
const KEY = "taskcraft.expandedIssues";
const EVENT = "taskcraft:collapsed-issues";

function read(): string {
  try {
    return window.localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function write(ids: Set<string>) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // Storage unavailable (private mode, blocked): collapse still works until reload.
    memoryFallback = JSON.stringify(Array.from(ids));
  }
  window.dispatchEvent(new Event(EVENT));
}

let memoryFallback: string | null = null;

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => e.key === KEY && onChange();
  window.addEventListener("storage", onStorage);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVENT, onChange);
  };
}

function parse(raw: string): Set<string> {
  try {
    const list = JSON.parse(raw);
    return new Set(Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

export function useCollapsedIssues() {
  // Server render (and first client render) sees every card collapsed, the default, so there's no hydration mismatch.
  const raw = React.useSyncExternalStore(subscribe, () => memoryFallback ?? read(), () => "[]");
  const expanded = React.useMemo(() => parse(raw), [raw]);
  const isCollapsed = React.useCallback((id: string) => !expanded.has(id), [expanded]);

  const toggle = React.useCallback((id: string) => {
    const next = parse(memoryFallback ?? read());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    write(next);
  }, []);

  // Collapse (value = true) or expand (false) several cards at once.
  const setMany = React.useCallback((ids: string[], collapse: boolean) => {
    const next = parse(memoryFallback ?? read());
    for (const id of ids) {
      if (collapse) next.delete(id);
      else next.add(id);
    }
    write(next);
  }, []);

  return { isCollapsed, toggle, setMany };
}
