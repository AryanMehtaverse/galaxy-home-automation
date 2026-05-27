import type { WorkflowNode } from "./workflow";

export type {
  WorkflowNode,
  WorkflowTask,
  WorkflowCategory,
  WorkflowNodeType,
} from "./workflow";

export type ProjectStatus =
  | "planning"
  | "in_progress"
  | "review"
  | "completed"
  | "on_hold";

export interface Project {
  id: string;
  name: string;
  clientName: string;
  siteManagerName?: string;
  deadline?: string;
  progress: number;
  status: ProjectStatus;
  workflow: WorkflowNode[];
  createdAt: string;
  updatedAt: string;
  createdByUid: string;
  createdByName: string;
  createdByEmail: string;
  /** @deprecated Use createdByUid — kept for legacy Firestore docs */
  createdBy?: string;
  address?: string;
  city?: string;
  landmark?: string;
  googleMapsLink?: string;
  clientPhone?: string;
  startDate: string;
  siteContacts?: {
    designation: string;
    name: string;
    phone: string;
  }[];
}

export interface ProjectCreateInput {
  name?: string;
  clientName?: string;
  siteManagerName?: string;
  deadline?: string;
  progress?: number;
  status?: ProjectStatus;
  workflow?: WorkflowNode[];
  createdByUid?: string;
  createdByName?: string;
  createdByEmail?: string;
  address?: string;
  city?: string;
  landmark?: string;
  googleMapsLink?: string;
  clientPhone?: string;
  startDate: string;
  siteContacts?: {
    designation: string;
    name: string;
    phone: string;
  }[];
}

export type ProjectInput = Omit<Project, "id" | "createdAt" | "updatedAt">;

export type { AppUser, ProjectCreator } from "./auth";
