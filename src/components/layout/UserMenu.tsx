"use client";

import Image from "next/image";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/Button";

interface UserMenuProps {
  collapsed?: boolean;
}

export function UserMenu({ collapsed = false }: UserMenuProps) {
  const { user, logout } = useAuthContext();

  if (!user) return null;

  return (
    <div className={`border-t border-zinc-200 p-4 dark:border-zinc-800 transition-all duration-300 ${collapsed ? "flex flex-col items-center gap-4 px-2" : ""}`}>
      {collapsed ? (
        <>
          <div className="flex items-center justify-center">
            <ThemeToggle />
          </div>
          <div className="relative group/avatar">
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
            {/* Tooltip for user info */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-zinc-900 text-zinc-100 text-xs whitespace-nowrap opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none z-50 shadow-md border border-zinc-700">
              <p className="font-semibold">{user.displayName}</p>
              <p className="text-[10px] text-zinc-400">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 relative group/logout"
            aria-label="Sign out"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-zinc-900 text-zinc-100 text-xs whitespace-nowrap opacity-0 group-hover/logout:opacity-100 transition-opacity pointer-events-none z-50 shadow-md border border-zinc-700">
              Sign out
            </div>
          </button>
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
