import type { Timestamp } from "firebase/firestore";

export type SiteStatus =
  | "Assigned"
  | "In Progress"
  | "Partially Completed"
  | "Completed"
  | "Need Support"
  | "Need Materials"
  | "Cancelled";

export type SitePriority = "Low" | "Medium" | "High" | "Urgent";

export interface SiteAssignment {
  id: string;
  projectName: string;
  clientName: string;
  address: string;
  siteDate: string;
  priority: SitePriority;
  // who created (owner/admin)
  assignedBy: string;
  assignedByName: string;
  // site manager responsible for this site
  siteManagerId: string;
  siteManagerName: string;
  // field team member assigned by site manager
  assignedTo: string;
  assignedToName: string;
  workDescription: string;
  notes: string;
  status: SiteStatus;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface SitePhoto {
  id: string;
  siteId: string;
  uploadedBy: string;
  uploadedByName: string;
  category: "Before Work" | "During Work" | "After Work";
  imageUrl: string;
  timestamp: Timestamp | null;
}

export interface SiteTimelineEntry {
  id: string;
  siteId: string;
  action: string;
  description: string;
  userId: string;
  userName: string;
  timestamp: Timestamp | null;
}

export interface SiteReport {
  id: string;
  siteId: string;
  workerId: string;
  workerName: string;
  workCompleted: string;
  pendingWork: string;
  issues: string;
  clientRequests: string;
  notes: string;
  createdAt: Timestamp | null;
}

export interface VoiceReport {
  id: string;
  siteId: string;
  workerId: string;
  workerName: string;
  audioUrl: string;
  transcript: string;
  generatedReport: GeneratedReport | null;
  createdAt: Timestamp | null;
}

export interface GeneratedReport {
  workCompleted: string[];
  materialsUsed: string[];
  pendingWork: string[];
  issues: string[];
  clientRequests: string[];
  recommendedStatus: string;
}
