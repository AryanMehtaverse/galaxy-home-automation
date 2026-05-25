import type {
  MultiSelectCategoryWorkflowNode,
  WorkflowNode,
  WorkflowNodePatch,
} from "@/types/workflow";
import { reconcileWorkflow } from "./pipeline";
import { toggleSubtask } from "./sequential";

function updateNodeInWorkflow(
  workflow: WorkflowNode[],
  nodeId: string,
  updater: (node: WorkflowNode) => WorkflowNode
): WorkflowNode[] {
  return workflow.map((node) => (node.id === nodeId ? updater(node) : node));
}

function finalizeWorkflow(workflow: WorkflowNode[]): WorkflowNode[] {
  return reconcileWorkflow(workflow);
}

export function patchWorkflowNode(
  workflow: WorkflowNode[],
  nodeId: string,
  patch: WorkflowNodePatch
): WorkflowNode[] {
  const updated = updateNodeInWorkflow(workflow, nodeId, (node) => {
    const { value: _v, selectedCategoryIds: _s, tasks: _t, completed: _c, ...basePatch } =
      patch;

    if (node.type === "text_input") {
      const value =
        patch.value !== undefined ? String(patch.value) : node.value;
      let completed =
        patch.completed !== undefined ? patch.completed : node.completed;
      if (!value.trim()) completed = false;
      return { ...node, ...basePatch, value, completed };
    }
    if (node.type === "numeric_input") {
      let value = node.value;
      if (patch.value !== undefined) {
        const num =
          patch.value === null || patch.value === ""
            ? null
            : Number(patch.value);
        value = num !== null && Number.isFinite(num) ? num : null;
      }
      let completed =
        patch.completed !== undefined ? patch.completed : node.completed;
      if (value === null || value <= 0) completed = false;
      return { ...node, ...basePatch, value, completed };
    }
    if (node.type === "multi_select_category") {
      return {
        ...node,
        ...basePatch,
        ...(patch.selectedCategoryIds !== undefined
          ? { selectedCategoryIds: patch.selectedCategoryIds }
          : {}),
      };
    }
    if (node.type === "checklist") {
      return {
        ...node,
        ...basePatch,
        ...(patch.tasks !== undefined ? { tasks: patch.tasks } : {}),
      };
    }
    return node;
  });
  return finalizeWorkflow(updated);
}

export function toggleWorkflowTask(
  workflow: WorkflowNode[],
  nodeId: string,
  taskId: string
): WorkflowNode[] {
  const updated = updateNodeInWorkflow(workflow, nodeId, (node) => {
    if (node.type === "checklist") {
      return {
        ...node,
        tasks: toggleSubtask(node.tasks, taskId),
      };
    }
    if (node.type === "multi_select_category") {
      return {
        ...node,
        availableCategories: node.availableCategories.map((cat) => ({
          ...cat,
          tasks: toggleSubtask(cat.tasks, taskId),
        })),
      } satisfies MultiSelectCategoryWorkflowNode;
    }
    return node;
  });
  return finalizeWorkflow(updated);
}

export function toggleWorkflowStep(
  workflow: WorkflowNode[],
  nodeId: string
): WorkflowNode[] {
  const updated = updateNodeInWorkflow(workflow, nodeId, (node) => {
    if (node.type === "numeric_input") {
      const next = !node.completed;
      if (next && (node.value === null || node.value <= 0)) return node;
      return { ...node, completed: next };
    }
    if (node.type === "text_input") {
      const next = !node.completed;
      if (next && !node.value.trim()) return node;
      return { ...node, completed: next };
    }
    return node;
  });
  return finalizeWorkflow(updated);
}

export function toggleLightCategory(
  workflow: WorkflowNode[],
  nodeId: string,
  categoryId: string
): WorkflowNode[] {
  const updated = updateNodeInWorkflow(workflow, nodeId, (node) => {
    if (node.type !== "multi_select_category") return node;
    const selected = new Set(node.selectedCategoryIds);
    if (selected.has(categoryId)) {
      selected.delete(categoryId);
    } else {
      selected.add(categoryId);
    }
    return {
      ...node,
      selectedCategoryIds: Array.from(selected),
    };
  });
  return finalizeWorkflow(updated);
}
