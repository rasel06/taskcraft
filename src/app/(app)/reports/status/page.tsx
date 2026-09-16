import { getCurrentUser } from "@/lib/auth";
import { getProjectsStatusReport } from "@/lib/data";
import { ReportsStatusTable } from "@/components/reports/reports-status-table";

export default async function TaskStatusReportPage() {
  const user = await getCurrentUser();
  const projects = await getProjectsStatusReport(user);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-sm font-semibold text-foreground">Task status by project</h1>
      <ReportsStatusTable projects={projects} />
    </div>
  );
}
