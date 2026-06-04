import type { Project } from "@/types";
import type { AppUser } from "@/types/auth";
import { daysUntilDeadline } from "./dates";
import { isNodeCompleted } from "../workflow/progress";
import { getSortedPipeline } from "../workflow/pipeline";
import { canViewProjectAlert } from "../auth/permissions";

export interface AlertInfo {
  project: Project;
  daysRemaining: number;
  priority: "red" | "orange" | "yellow";
  currentStep: string;
  remainingText: string;
}

export function getProjectCurrentStep(project: Project): string {
  if (!project.workflow || project.workflow.length === 0) {
    return "Workflow Completed";
  }
  const sorted = getSortedPipeline(project.workflow);
  const firstIncomplete = sorted.find((node) => !isNodeCompleted(node));
  return firstIncomplete ? firstIncomplete.title : "Workflow Completed";
}

export function calculateAlertInfo(project: Project): AlertInfo | null {
  if (project.deleted) return null;
  if (project.status === "completed") return null;
  if (!project.deadline) return null;

  const days = daysUntilDeadline(project.deadline);

  if (days <= 7) {
    let priority: "red" | "orange" | "yellow";
    let remainingText = "";

    if (days < 0) {
      priority = "red";
      const absDays = Math.abs(days);
      remainingText = `Overdue by ${absDays} ${absDays === 1 ? "day" : "days"}`;
    } else if (days <= 2) {
      priority = "orange";
      remainingText = `Remaining: ${days} ${days === 1 ? "day" : "days"}`;
    } else {
      priority = "yellow";
      remainingText = `Remaining: ${days} ${days === 1 ? "day" : "days"}`;
    }

    const currentStep = getProjectCurrentStep(project);

    return {
      project,
      daysRemaining: days,
      priority,
      currentStep,
      remainingText,
    };
  }

  return null;
}

export function getAlertsForUser(
  projects: Project[],
  user: AppUser | null | undefined
): AlertInfo[] {
  return projects
    .filter((p) => canViewProjectAlert(user, p))
    .map((p) => calculateAlertInfo(p))
    .filter((a): a is AlertInfo => a !== null);
}
