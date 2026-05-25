"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuthContext();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Authentication failed. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        required
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        required
        minLength={6}
      />
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </p>
      )}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
      </Button>
      <button
        type="button"
        onClick={() => setIsSignUp(!isSignUp)}
        className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
      >
        {isSignUp
          ? "Already have an account? Sign in"
          : "Need an account? Sign up"}
      </button>
    </form>
  );
}
