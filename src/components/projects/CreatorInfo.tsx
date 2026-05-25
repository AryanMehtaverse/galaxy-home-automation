import { formatDate } from "@/lib/utils/dates";

interface CreatorInfoProps {
  createdByName: string;
  createdByEmail?: string;
  createdAt?: string;
  compact?: boolean;
}

export function CreatorInfo({
  createdByName,
  createdByEmail,
  createdAt,
  compact,
}: CreatorInfoProps) {
  const label = createdByName.trim() || createdByEmail || "Unknown";

  if (compact) {
    return (
      <span className="text-xs text-zinc-500">
        Created by {label}
      </span>
    );
  }

  return (
    <div className="text-sm text-zinc-600 dark:text-zinc-400">
      <p>
        Created by{" "}
        <span className="font-medium text-zinc-800 dark:text-zinc-200">
          {label}
        </span>
      </p>
      {createdAt && (
        <p className="mt-0.5 text-xs text-zinc-500">
          {formatDate(createdAt)}
        </p>
      )}
    </div>
  );
}
