"use client";

import type { WorkflowNode } from "@/types/workflow";
import { WorkflowAccordion } from "./WorkflowAccordion";
import { ChecklistNodeContent } from "./ChecklistNodeContent";
import { TextInputNodeContent } from "./TextInputNodeContent";
import { NumericInputNodeContent } from "./NumericInputNodeContent";
import { LightsCategoryNodeContent } from "./LightsCategoryNodeContent";
import { getNodeProgress } from "@/lib/workflow/progress";
import { isNodeEditable } from "@/lib/workflow/dependencies";
import { getSortedPipeline } from "@/lib/workflow/pipeline";

interface WorkflowNodePanelProps {
  workflow: WorkflowNode[];
  node: WorkflowNode;
  onNodeUpdate: (
    nodeId: string,
    patch: import("@/types/workflow").WorkflowNodePatch
  ) => void;
  onTaskToggle: (nodeId: string, taskId: string) => void;
  onStepToggle: (nodeId: string) => void;
  onToggleCategory: (nodeId: string, categoryId: string) => void;
}

export function WorkflowNodePanel({
  workflow,
  node,
  onNodeUpdate,
  onTaskToggle,
  onStepToggle,
  onToggleCategory,
}: WorkflowNodePanelProps) {
  const pipelineLocked = !isNodeEditable(workflow, node.id);
  const disabled = pipelineLocked || node.locked;
  const progress = getNodeProgress(node);
  const stepNumber =
    getSortedPipeline(workflow).findIndex((n) => n.id === node.id) + 1;

  return (
    <WorkflowAccordion
      title={node.title}
      completed={node.completed}
      progress={progress}
      locked={pipelineLocked}
      blockedReason={node.blockedReason}
      description={node.description}
      stepNumber={stepNumber}
    >
      {node.type === "checklist" && (
        <ChecklistNodeContent
          node={node}
          disabled={disabled}
          onTaskToggle={(taskId) => onTaskToggle(node.id, taskId)}
        />
      )}

      {node.type === "numeric_input" && (
        <NumericInputNodeContent
          node={node}
          disabled={disabled}
          onValueChange={(value) => onNodeUpdate(node.id, { value })}
          onStepToggle={() => onStepToggle(node.id)}
        />
      )}

      {node.type === "text_input" && (
        <TextInputNodeContent
          node={node}
          disabled={disabled}
          onValueChange={(value) => onNodeUpdate(node.id, { value })}
          onStepToggle={() => onStepToggle(node.id)}
        />
      )}

      {node.type === "multi_select_category" && (
        <LightsCategoryNodeContent
          node={node}
          disabled={disabled}
          onToggleCategory={(categoryId) =>
            onToggleCategory(node.id, categoryId)
          }
          onTaskToggle={(taskId) => onTaskToggle(node.id, taskId)}
        />
      )}
    </WorkflowAccordion>
  );
}
