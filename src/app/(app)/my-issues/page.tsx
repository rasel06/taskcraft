import { getCurrentUser } from "@/lib/auth";
import { getAssignedIssues } from "@/lib/data";
import { Board } from "@/components/board/board";
import { ListChecks } from "lucide-react";

export default async function MyIssuesPage() {
  const user = await getCurrentUser();
  const issues = user ? await getAssignedIssues(user.id) : [];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="flex items-center gap-2 border-b border-border px-5 py-3">
        <ListChecks className="h-4 w-4 text-muted-foreground" />
        <h1 className="text-sm font-semibold text-foreground">My Issues</h1>
      </header>
      <Board issues={issues} showProject />
    </div>
  );
}
