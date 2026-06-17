"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { Spinner } from "@/components/ui/Spinner";
import type { AppRole } from "@/types/auth";

interface RoleGuardProps {
  allowedRoles: AppRole[];
  children: React.ReactNode;
  redirectTo?: string;
}

export function RoleGuard({ allowedRoles, children, redirectTo = "/dashboard" }: RoleGuardProps) {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  const hasAccess = user && user.role && allowedRoles.includes(user.role);

  useEffect(() => {
    if (!loading && user && !hasAccess) {
      router.replace(redirectTo);
    }
  }, [loading, user, hasAccess, router, redirectTo]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!hasAccess) return null;

  return <>{children}</>;
}
