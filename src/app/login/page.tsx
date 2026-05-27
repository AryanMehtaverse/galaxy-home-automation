"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Spinner } from "@/components/ui/Spinner";

export default function LoginPage() {
  const { user, loading, authError } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-transparent">
          <Image
            src="/Galaxy Logo no bg.jpeg"
            alt="Galaxy Home Automation"
            width={64}
            height={64}
            className="object-contain"
            priority
          />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Project Manager
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Galaxy Home Automation LLP
        </p>
      </div>
      {authError && (
        <div className="mb-4 w-full max-w-sm rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400 text-center font-medium">
          {authError}
        </div>
      )}
      <GoogleSignInButton />
    </div>
  );
}