import { getCurrentUser } from "@/lib/auth";
import { getAssignedIssues } from "@/lib/data";
import { IssueRow } from "@/components/issue/issue-row";
import { Inbox as InboxIcon } from "lucide-react";

export default async function InboxPage() {
  const user = await getCurrentUser();
  const issues = user ? await getAssignedIssues(user.id) : [];

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-2 border-b border-border px-5 py-3">
        <InboxIcon className="h-4 w-4 text-muted-foreground" />
        <h1 className="text-sm font-semibold text-foreground">Inbox</h1>
      </header>
      <div className="flex-1 overflow-y-auto">
        {issues.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-1 py-24 text-faint-foreground">
            <InboxIcon className="h-8 w-8" />
            <p className="text-sm">You&apos;re all caught up</p>
            <p className="text-xs">Issues assigned to you will show up here</p>
          </div>
        ) : (
          <>
            <p className="px-4 py-2 text-xs text-faint-foreground">Issues assigned to you, most recently updated</p>
            {issues.map((issue) => (
              <IssueRow key={issue.id} issue={issue} showProject />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
