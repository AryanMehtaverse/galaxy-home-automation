import type { AppUser, AppRole } from "@/types/auth";
import type { Project } from "@/types";

export function hasRole(user: AppUser | null | undefined, roles: AppRole[]): boolean {
  if (!user || user.active === false || !user.role) return false;
  return roles.includes(user.role);
}

// admin sees everything
// bd_team: Leads + SOP Bot
// project_manager: New Project + Quotations + SOP Bot
// site_worker: My Sites + SOP Bot

export function canAccessDashboard(user: AppUser | null | undefined): boolean {
  return hasRole(user, ["admin", "project_manager", "owner", "clerk"]);
}

export function canAccessAlerts(user: AppUser | null | undefined): boolean {
  return hasRole(user, ["admin", "project_manager", "owner", "clerk"]);
}

export function canAccessInventory(user: AppUser | null | undefined): boolean {
  return hasRole(user, ["admin", "owner", "clerk"]);
}

export function canAccessNewProject(user: AppUser | null | undefined): boolean {
  return hasRole(user, ["admin", "project_manager", "owner", "clerk"]);
}

export function canAccessQuotations(user: AppUser | null | undefined): boolean {
  return hasRole(user, ["admin", "project_manager", "owner", "clerk"]);
}

export function canAccessLeads(user: AppUser | null | undefined): boolean {
  return hasRole(user, ["admin", "bd_team", "owner"]);
}

export function canAccessSiteOperations(user: AppUser | null | undefined): boolean {
  return hasRole(user, ["admin", "owner"]);
}

export function canAccessMySites(user: AppUser | null | undefined): boolean {
  return hasRole(user, ["site_worker"]);
}

export function canManageSiteAssignments(user: AppUser | null | undefined): boolean {
  return hasRole(user, ["admin", "owner"]);
}

export function canUpdateSiteStatus(user: AppUser | null | undefined): boolean {
  return hasRole(user, ["admin", "site_worker", "owner"]);
}

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

export function canViewActivityLogs(user: AppUser | null | undefined): boolean {
  if (!user || user.active === false) return false;
  return user.role === "admin" || user.role === "owner";
}

export function canAccessRecycleBin(user: AppUser | null | undefined): boolean {
  if (!user || user.active === false) return false;
  return user.role === "admin" || user.role === "owner";
}

export function canPermanentlyDeleteProject(user: AppUser | null | undefined): boolean {
  if (!user || user.active === false) return false;
  return user.role === "admin" || user.role === "owner";
}

export function canViewProjectAlert(user: AppUser | null | undefined, project: Project): boolean {
  if (!user || user.active === false) return false;
  if (user.role === "admin" || user.role === "owner") return true;
  if (user.role === "clerk") {
    return project.createdByUid === user.uid;
  }
  return false;
}

export function canAddInventorySheet(user: AppUser | null | undefined): boolean {
  if (!user || user.active === false) return false;
  return user.role === "admin" || user.role === "owner";
}

export function canEditInventorySheet(user: AppUser | null | undefined): boolean {
  if (!user || user.active === false) return false;
  return user.role === "admin" || user.role === "owner";
}

export function canDeleteInventorySheet(user: AppUser | null | undefined): boolean {
  if (!user || user.active === false) return false;
  return user.role === "admin" || user.role === "owner";
}

export function canOpenInventorySheet(user: AppUser | null | undefined): boolean {
  if (!user || user.active === false) return false;
  return user.role === "admin" || user.role === "owner" || user.role === "clerk";
}

