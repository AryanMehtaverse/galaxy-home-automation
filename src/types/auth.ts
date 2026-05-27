/** Normalized authenticated user for the app */
export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role?: "admin" | "owner" | "clerk";
  active?: boolean;
}

export interface ProjectCreator {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
}
