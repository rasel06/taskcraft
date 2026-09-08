"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SECTIONS = [
  {
    title: "Personal",
    links: [
      { href: "/settings/profile", label: "Profile" },
      { href: "/settings/notifications", label: "Notifications" },
      { href: "/settings/preferences", label: "Preferences" },
      { href: "/settings/security", label: "Security" },
      { href: "/settings/agent-personalization", label: "Agent Personalization" },
    ],
  },
  {
    title: "Issues",
    links: [
      { href: "/settings/issues/labels", label: "Labels" },
      { href: "/settings/issues/templates", label: "Templates" },
      { href: "/settings/issues/slas", label: "SLAs" },
    ],
  },
  {
    title: "Projects",
    links: [
      { href: "/settings/projects/labels", label: "Labels" },
      { href: "/settings/projects/templates", label: "Templates" },
      { href: "/settings/projects/statuses", label: "Statuses" },
      { href: "/settings/projects/updates", label: "Updates" },
    ],
  },
  {
    title: "Workspace",
    links: [
      { href: "/settings/members", label: "Members" },
      { href: "/settings/teams", label: "Teams" },
      { href: "/settings/billing", label: "Billing" },
      { href: "/settings/integrations", label: "Integrations" },
    ],
  },
  {
    title: "",
    links: [{ href: "/settings/features", label: "Features" }],
  },
];

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav className="flex w-56 shrink-0 flex-col gap-4 overflow-y-auto border-r border-border p-4">
      {SECTIONS.map((section) => (
        <div key={section.title || section.links[0].href} className="flex flex-col gap-0.5">
          {section.title && (
            <span className="px-2 pb-1 text-xs font-medium text-faint-foreground">{section.title}</span>
          )}
          {section.links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-2 py-1.5 text-sm hover:bg-muted",
                  active ? "bg-muted text-foreground" : "text-muted-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
