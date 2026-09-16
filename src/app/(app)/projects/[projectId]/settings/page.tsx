import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canAccessProject, canManageProject } from "@/lib/auth";
import { getAllUsers } from "@/lib/data";
import { AccessDenied } from "@/components/shared/access-denied";
import { ProjectSettingsForm } from "@/components/project/project-settings-form";
import { ProjectMembersManager } from "@/components/project/project-members-manager";

export default async function ProjectSettingsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true, role: { select: { id: true, name: true } } } },
        },
      },
    },
  });
  if (!project) notFound();

  const user = await getCurrentUser();
  const allowed = await canAccessProject(projectId, user);
  const canManage = await canManageProject(projectId, user);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <header className="flex items-center gap-2 border-b border-border px-5 py-3">
        <h1 className="text-sm font-semibold text-foreground">{project.name}</h1>
        <span className="text-sm text-faint-foreground">Settings</span>
      </header>
      {!allowed ? (
        <AccessDenied />
      ) : (
        <div className="flex flex-col gap-8 p-6">
          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">General</h2>
            <ProjectSettingsForm
              project={{ id: project.id, name: project.name, description: project.description, leadId: project.leadId }}
              members={project.members.map((m) => m.user)}
              canManage={canManage}
            />
          </section>
          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Members</h2>
            <ProjectMembersManager
              projectId={project.id}
              members={project.members.map((m) => ({ userId: m.userId, role: m.role, user: m.user }))}
              allUsers={await getAllUsers()}
              leadId={project.leadId}
              canManage={canManage}
              currentUserId={user?.id ?? ""}
            />
          </section>
        </div>
      )}
    </div>
  );
}
