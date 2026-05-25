"use client";

import Image from "next/image";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/Button";

export function UserMenu() {
  const { user, logout } = useAuthContext();

  if (!user) return null;

  return (
    <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
      <div className="mb-3 flex items-center justify-between">
        <ThemeToggle />
      </div>
      <div className="mb-3 flex items-center gap-3">
        {user.photoURL ? (
          <Image
            src={user.photoURL}
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {user.displayName}
          </p>
          <p className="truncate text-xs text-zinc-500" title={user.email}>
            {user.email}
          </p>
        </div>
      </div>
      <Button variant="ghost" size="sm" className="w-full" onClick={() => logout()}>
        Sign out
      </Button>
    </div>
  );
}
