import type { WorkflowNode } from "@/types/workflow";
import {
  applyPipelineLocks,
  getPipelineBlockReason,
  isStepEditable,
  reconcileWorkflow,
} from "./pipeline";

export { reconcileWorkflow, applyPipelineLocks };

export function isNodeEditable(
  workflow: WorkflowNode[],
  nodeId: string
): boolean {
  return isStepEditable(workflow, nodeId);
}

export function getDependencyBlockReason(
  workflow: WorkflowNode[],
  nodeId: string
): string | null {
  return getPipelineBlockReason(workflow, nodeId);
}

export function applyWorkflowDependencies(
  workflow: WorkflowNode[]
): WorkflowNode[] {
  return applyPipelineLocks(workflow);
}
