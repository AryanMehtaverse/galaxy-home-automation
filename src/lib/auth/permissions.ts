import type { AppUser } from "@/types/auth";
import type { Project } from "@/types";

export function canCreateProject(user: AppUser | null | undefined): boolean {
  if (!user || user.active === false) return false;
  return user.role === "admin" || user.role === "owner" || user.role === "clerk";
}

export function canEditProject(user: AppUser | null | undefined, project: Project): boolean {
  if (!user || user.active === false) return false;
  if (user.role === "admin" || user.role === "owner") return true;
  if (user.role === "clerk") {
    return project.createdByUid === user.uid;
  }
  return false;
}

export function canDeleteProject(user: AppUser | null | undefined, project: Project): boolean {
  if (!user || user.active === false) return false;
  if (user.role === "admin" || user.role === "owner") return true;
  if (user.role === "clerk") {
    return project.createdByUid === user.uid;
  }
  return false;
}

export function canEditWorkflowStep(user: AppUser | null | undefined, project: Project): boolean {
  if (!user || user.active === false) return false;
  if (user.role === "admin" || user.role === "owner") return true;
  if (user.role === "clerk") {
    return project.createdByUid === user.uid;
  }
  return false;
}

export function canDeleteWorkflowStep(user: AppUser | null | undefined, project: Project): boolean {
  if (!user || user.active === false) return false;
  if (user.role === "admin" || user.role === "owner") return true;
  if (user.role === "clerk") {
    return project.createdByUid === user.uid;
  }
  return false;
}

export function canUploadPhoto(user: AppUser | null | undefined, project: Project): boolean {
  if (!user || user.active === false) return false;
  if (user.role === "admin" || user.role === "owner") return true;
  if (user.role === "clerk") {
    return project.createdByUid === user.uid;
  }
  return false;
}

export function canDeletePhoto(user: AppUser | null | undefined, project: Project): boolean {
  if (!user || user.active === false) return false;
  if (user.role === "admin" || user.role === "owner") return true;
  if (user.role === "clerk") {
    return project.createdByUid === user.uid;
  }
  return false;
}

export function canAddNote(user: AppUser | null | undefined, project: Project): boolean {
  if (!user || user.active === false) return false;
  if (user.role === "admin" || user.role === "owner") return true;
  if (user.role === "clerk") {
    return project.createdByUid === user.uid;
  }
  return false;
}

export function canManageUsers(user: AppUser | null | undefined): boolean {
  if (!user || user.active === false) return false;
  return user.role === "admin";
}
