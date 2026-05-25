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
  deadline?: string;
  progress: number;
  status: ProjectStatus;
  workflow: WorkflowNode[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ProjectCreateInput {
  name?: string;
  clientName?: string;
  deadline?: string;
  progress?: number;
  status?: ProjectStatus;
  workflow?: WorkflowNode[];
  createdBy?: string;
}

export type ProjectInput = Omit<Project, "id" | "createdAt" | "updatedAt">;
