"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Printer } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/reports/projects", label: "Project progress" },
  { href: "/reports/status", label: "Task status by project" },
  { href: "/reports/members", label: "Members" },
];

export function ReportsNav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1 overflow-x-auto border-b border-border px-4 pt-3 print:hidden sm:px-6">
      <div className="flex flex-1 gap-1">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "whitespace-nowrap border-b-2 px-2.5 pb-2.5 text-sm",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => window.print()}
        title="Print or save this report as PDF"
        className="mb-2.5 flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-xs text-primary-foreground hover:bg-primary-hover"
      >
        <Printer className="h-3.5 w-3.5" /> Print / PDF
      </button>
    </nav>
  );
}
