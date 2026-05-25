import type { User } from "firebase/auth";
import type { AppUser, ProjectCreator } from "@/types/auth";

export function mapFirebaseUser(user: User): AppUser {
  return {
    uid: user.uid,
    email: user.email ?? "",
    displayName:
      user.displayName?.trim() ||
      user.email?.split("@")[0] ||
      "User",
    photoURL: user.photoURL,
  };
}

export function toProjectCreator(user: AppUser): ProjectCreator {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}
