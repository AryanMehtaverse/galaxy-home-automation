"use client";

import type { WorkflowTask } from "@/types/workflow";
import {
  getSubtaskLockReason,
  isSubtaskLocked,
  sortTasks,
} from "@/lib/workflow/sequential";
import { CheckboxRow } from "./CheckboxRow";

interface SequentialTaskListProps {
  tasks: WorkflowTask[];
  disabled?: boolean;
  onToggle: (taskId: string) => void;
}

export function SequentialTaskList({
  tasks,
  disabled,
  onToggle,
}: SequentialTaskListProps) {
  const sorted = sortTasks(tasks);

  return (
    <div className="relative pl-1">
      {sorted.map((task, index) => {
        const locked = isSubtaskLocked(sorted, index);
        const lockReason = getSubtaskLockReason(sorted, index);
        const isLast = index === sorted.length - 1;

        return (
          <div key={task.id} className="relative flex gap-3 pb-1">
            <div className="flex w-6 shrink-0 flex-col items-center">
              {!isLast && (
                <span
                  className={`absolute left-[11px] top-8 bottom-0 w-0.5 ${
                    task.completed
                      ? "bg-emerald-400 dark:bg-emerald-600"
                      : "bg-zinc-200 dark:bg-zinc-700"
                  }`}
                  aria-hidden
                />
              )}
              <span
                className={`relative z-10 mt-3 flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                  task.completed
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : locked
                      ? "border-zinc-300 bg-zinc-100 text-zinc-400 dark:border-zinc-600 dark:bg-zinc-800"
                      : "border-amber-500 bg-white text-amber-600 dark:bg-zinc-900 dark:text-amber-400"
                }`}
              >
                {task.completed ? "✓" : index + 1}
              </span>
            </div>
            <div className="min-w-0 flex-1 pb-3">
              <CheckboxRow
                label={task.title}
                checked={task.completed}
                disabled={disabled}
                locked={locked}
                lockReason={lockReason}
                onToggle={() => onToggle(task.id)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
