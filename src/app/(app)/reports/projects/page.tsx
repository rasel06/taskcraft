import { getCurrentUser } from "@/lib/auth";
import { getProjectsStatusReport } from "@/lib/data";
import { ReportsProjectsTable } from "@/components/reports/reports-projects-table";

export default async function ProjectProgressReportPage() {
  const user = await getCurrentUser();
  const projects = await getProjectsStatusReport(user);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-sm font-semibold text-foreground">Project progress</h1>
      <ReportsProjectsTable projects={projects} />
    </div>
  );
}
