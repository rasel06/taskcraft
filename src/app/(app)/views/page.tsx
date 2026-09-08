import { getCurrentUser } from "@/lib/auth";
import { getAllVisibleIssues } from "@/lib/data";
import { Board } from "@/components/board/board";
import { LayoutGrid } from "lucide-react";

export default async function ViewsPage() {
  const user = await getCurrentUser();
  const issues = await getAllVisibleIssues(user);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="flex items-center gap-2 border-b border-border px-5 py-3">
        <LayoutGrid className="h-4 w-4 text-muted-foreground" />
        <h1 className="text-sm font-semibold text-foreground">All Issues</h1>
      </header>
      <Board issues={issues} showProject />
    </div>
  );
}
