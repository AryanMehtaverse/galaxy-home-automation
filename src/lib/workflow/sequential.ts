import type { WorkflowTask } from "@/types/workflow";

export function sortTasks(tasks: WorkflowTask[]): WorkflowTask[] {
  return [...tasks].sort((a, b) => a.order - b.order);
}

export function isSubtaskLocked(
  tasks: WorkflowTask[],
  taskIndex: number
): boolean {
  if (taskIndex <= 0) return false;
  const sorted = sortTasks(tasks);
  return !sorted[taskIndex - 1]?.completed;
}

export function getSubtaskLockReason(
  tasks: WorkflowTask[],
  taskIndex: number
): string | null {
  if (!isSubtaskLocked(tasks, taskIndex)) return null;
  const sorted = sortTasks(tasks);
  const previous = sorted[taskIndex - 1];
  return previous
    ? `Check "${previous.title}" first`
    : "Complete the previous step first";
}

/** Reset all tasks after index to unchecked */
export function cascadeResetSubtasks(
  tasks: WorkflowTask[],
  fromIndex: number
): WorkflowTask[] {
  const sorted = sortTasks(tasks);
  return sorted.map((t, i) =>
    i > fromIndex ? { ...t, completed: false } : t
  );
}

/**
 * Toggle a subtask checkbox with strict sequential rules.
 */
export function toggleSubtask(
  tasks: WorkflowTask[],
  taskId: string
): WorkflowTask[] {
  const sorted = sortTasks(tasks);
  const index = sorted.findIndex((t) => t.id === taskId);
  if (index === -1) return tasks;

  const current = sorted[index];

  if (!current.completed && isSubtaskLocked(sorted, index)) {
    return tasks;
  }

  const nextCompleted = !current.completed;

  let updated = sorted.map((t, i) =>
    i === index ? { ...t, completed: nextCompleted } : t
  );

  if (current.completed && !nextCompleted) {
    updated = cascadeResetSubtasks(updated, index);
  }

  return updated;
}
