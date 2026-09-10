export interface IssueView {
  id: string;
  title: string;
  status: string;
  priority: string;
  labels: string;
  createdAt: string;
  projectId: string;
  projectName: string;
  teamIdentifier: string;
  milestoneName: string | null;
  cycleId: string | null;
  assignees: { id: string; name: string; avatarUrl: string | null }[];
  commentCount: number;
  hasNewDiscussion: boolean;
}
