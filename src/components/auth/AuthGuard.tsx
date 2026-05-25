"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { Spinner } from "@/components/ui/Spinner";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
