export interface UserLite {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  isWorkspaceAdmin: boolean;
}

export interface MemberDetail extends UserLite {
  bankId: string | null;
  fileNumber: string | null;
  mobile: string | null;
}

export type CycleStatus = "Upcoming" | "Active" | "Completed";

export interface CycleOverview {
  id: string;
  teamId: string;
  number: number;
  name: string | null;
  startDate: string;
  targetDate: string;
  status: CycleStatus;
  issueCount: number;
  completedCount: number;
}

export interface ProjectLite {
  id: string;
  name: string;
  teamId: string;
  status: string;
  isDraft: boolean;
}

export interface ProjectOverview {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  isDraft: boolean;
  createdAt: string;
  startDate: string | null;
  targetDate: string | null;
  issueCount: number;
  team: { id: string; name: string; identifier: string };
  lead: { id: string; name: string; avatarUrl: string | null };
}

export interface TeamWithProjects {
  id: string;
  name: string;
  identifier: string;
  icon: string;
  color: string;
  isPrivate: boolean;
  timezone: string;
  projects: ProjectLite[];
  memberIds: string[];
}
