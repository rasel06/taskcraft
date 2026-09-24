import { redirect } from "next/navigation";

// Issue statuses are now managed per project at Settings > Projects > Statuses.
export default async function IssueStatusesPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const { project } = await searchParams;
  redirect(`/settings/projects/statuses?tab=workflows${project ? `&project=${project}` : ""}`);
}
