"use client";

interface CheckboxRowProps {
  label: string;
  checked: boolean;
  disabled?: boolean;
  locked?: boolean;
  lockReason?: string | null;
  onToggle: () => void;
}

export function CheckboxRow({
  label,
  checked,
  disabled,
  locked,
  lockReason,
  onToggle,
}: CheckboxRowProps) {
  const isDisabled = disabled || locked;

  return (
    <label
      className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
        locked
          ? "cursor-not-allowed border-zinc-100 bg-zinc-50 opacity-60 dark:border-zinc-800 dark:bg-zinc-900/50"
          : checked
            ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20"
            : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800/50"
      } ${isDisabled && !locked ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={isDisabled}
        onChange={onToggle}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed"
      />
      <span className="min-w-0 flex-1">
        <span
          className={`block text-sm ${
            checked
              ? "text-zinc-500 line-through"
              : locked
                ? "text-zinc-400"
                : "text-zinc-800 dark:text-zinc-200"
          }`}
        >
          {label}
        </span>
        {locked && lockReason && (
          <span className="mt-0.5 block text-xs text-zinc-400">{lockReason}</span>
        )}
      </span>
    </label>
  );
}
