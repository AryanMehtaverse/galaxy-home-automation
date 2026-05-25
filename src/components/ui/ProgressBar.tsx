interface ProgressBarProps {
  value: number;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export function ProgressBar({
  value,
  size = "md",
  showLabel = true,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const height = size === "sm" ? "h-1.5" : "h-2.5";

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700 ${height}`}
      >
        <div
          className={`${height} rounded-full bg-indigo-500 transition-all duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="min-w-[2.5rem] text-right text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {clamped}%
        </span>
      )}
    </div>
  );
}
