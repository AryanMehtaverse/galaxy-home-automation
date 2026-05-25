"use client";

import type { ChecklistWorkflowNode } from "@/types/workflow";
import { SequentialTaskList } from "./SequentialTaskList";

interface ChecklistNodeContentProps {
  node: ChecklistWorkflowNode;
  disabled?: boolean;
  onTaskToggle: (taskId: string) => void;
}

export function ChecklistNodeContent({
  node,
  disabled,
  onTaskToggle,
}: ChecklistNodeContentProps) {
  return (
    <SequentialTaskList
      tasks={node.tasks}
      disabled={disabled}
      onToggle={onTaskToggle}
    />
  );
}
