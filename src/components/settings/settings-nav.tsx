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
      { href: "/settings/roles", label: "Roles" },
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
    <nav className="flex shrink-0 gap-4 overflow-x-auto border-b border-border p-3 md:w-56 md:flex-col md:overflow-y-auto md:overflow-x-hidden md:border-b-0 md:border-r md:p-4">
      {SECTIONS.map((section) => (
        <div key={section.title || section.links[0].href} className="flex shrink-0 flex-col gap-0.5">
          {section.title && (
            <span className="px-2 pb-1 text-xs font-medium text-faint-foreground">{section.title}</span>
          )}
          <div className="flex gap-0.5 md:flex-col">
            {section.links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "whitespace-nowrap rounded-md px-2 py-1.5 text-sm hover:bg-muted",
                    active ? "bg-primary-soft-bg text-primary-soft-text" : "text-muted-foreground",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
