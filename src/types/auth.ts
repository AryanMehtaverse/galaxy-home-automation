export type AppRole =
  | "admin"
  | "owner"
  | "clerk"
  | "site_worker"       // legacy
  | "bd_team"
  | "project_manager"
  | "site_manager"      // new
  | "field_team"        // new
  | "accounts"
  | "unassigned";

/** Normalized authenticated user for the app */
export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role?: AppRole;
  active?: boolean;
}

export interface ProjectCreator {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
}
