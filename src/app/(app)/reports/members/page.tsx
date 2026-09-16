import { getMembersReport, getWorkspaceRoles } from "@/lib/data";
import { ReportsMembersTable } from "@/components/reports/reports-members-table";

export default async function MembersReportPage() {
  const [members, roles] = await Promise.all([getMembersReport(), getWorkspaceRoles()]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-sm font-semibold text-foreground">Members</h1>
      <ReportsMembersTable members={members} roles={roles} />
    </div>
  );
}
