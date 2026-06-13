export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-amber-600 dark:border-zinc-700 dark:border-t-amber-400 ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
