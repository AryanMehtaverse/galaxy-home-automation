import type { SiteStatus, SitePriority } from "@/types/site";

export const STATUSES: SiteStatus[] = ["Assigned", "In Progress", "Partially Completed", "Completed", "Need Support", "Need Materials", "Cancelled"];
export const PRIORITIES: SitePriority[] = ["Low", "Medium", "High", "Urgent"];

export const STATUS_COLORS: Record<SiteStatus, string> = {
  "Assigned": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "In Progress": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "Partially Completed": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  "Completed": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "Need Support": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  "Need Materials": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "Cancelled": "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

export const PRIORITY_COLORS: Record<SitePriority, string> = {
  Low: "text-zinc-500",
  Medium: "text-amber-500",
  High: "text-orange-500",
  Urgent: "text-red-500 font-bold",
};

export const EMPTY_FORM = {
  projectName: "",
  clientName: "",
  address: "",
  siteDate: "",
  priority: "Medium" as SitePriority,
  siteManagerId: "",
  siteManagerName: "",
  workDescription: "",
  notes: "",
};
