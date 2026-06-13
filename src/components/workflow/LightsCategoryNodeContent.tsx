"use client";

import type { MultiSelectCategoryWorkflowNode } from "@/types/workflow";
import { WorkflowAccordion } from "./WorkflowAccordion";
import { SequentialTaskList } from "./SequentialTaskList";
import { CheckboxRow } from "./CheckboxRow";
interface LightsCategoryNodeContentProps {
  node: MultiSelectCategoryWorkflowNode;
  disabled?: boolean;
  onToggleCategory: (categoryId: string) => void;
  onTaskToggle: (taskId: string) => void;
}

export function LightsCategoryNodeContent({
  node,
  disabled,
  onToggleCategory,
  onTaskToggle,
}: LightsCategoryNodeContentProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          Select light types
        </p>
        <div className="flex flex-wrap gap-2">
          {node.availableCategories.map((cat) => {
            const selected = node.selectedCategoryIds.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                disabled={disabled}
                onClick={() => onToggleCategory(cat.id)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  selected
                    ? "bg-amber-600 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {node.selectedCategoryIds.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Select light types to reveal sequential install chains.
        </p>
      ) : (
        <div className="space-y-3">
          {node.availableCategories
            .filter((cat) => node.selectedCategoryIds.includes(cat.id))
            .map((cat) => {
              const progress =
                cat.tasks.length > 0
                  ? Math.round(
                      (cat.tasks.filter((t) => t.completed).length /
                        cat.tasks.length) *
                        100
                    )
                  : 0;
              const allSubtasksDone =
                cat.tasks.length > 0 &&
                cat.tasks.every((t) => t.completed);

              return (
                <WorkflowAccordion
                  key={cat.id}
                  title={cat.label}
                  completed={cat.completed}
                  progress={progress}
                  defaultOpen
                  description="Sequential steps — parent completes when all are checked"
                >
                  <div className="space-y-3">
                    <CheckboxRow
                      label={`${cat.label} — all steps complete`}
                      checked={cat.completed}
                      disabled
                      locked={!allSubtasksDone}
                      lockReason={
                        !allSubtasksDone
                          ? "Check all subtasks below first"
                          : null
                      }
                      onToggle={() => {}}
                    />
                    <SequentialTaskList
                      tasks={cat.tasks}
                      disabled={disabled}
                      onToggle={onTaskToggle}
                    />
                  </div>
                </WorkflowAccordion>
              );
            })}
        </div>
      )}
    </div>
  );
}
