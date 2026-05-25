import type {
  ChecklistWorkflowNode,
  MultiSelectCategoryWorkflowNode,
  NumericInputWorkflowNode,
  TextInputWorkflowNode,
  WorkflowNode,
} from "@/types/workflow";
import {
  createLightCategories,
  WORKFLOW_NODE_DEFINITIONS,
} from "./definitions";
import { WORKFLOW_KEYS } from "./keys";

function createChecklistNode(
  def: (typeof WORKFLOW_NODE_DEFINITIONS)[number]
): ChecklistWorkflowNode {
  return {
    id: crypto.randomUUID(),
    key: def.key,
    title: def.title,
    type: "checklist",
    order: def.order,
    completed: false,
    description: def.description ?? "",
    locked: false,
    blockedReason: "",
    tasks: (def.taskTitles ?? []).map((title, index) => ({
      id: crypto.randomUUID(),
      title,
      completed: false,
      order: index,
    })),
  };
}

function createNumericInputNode(
  def: (typeof WORKFLOW_NODE_DEFINITIONS)[number]
): NumericInputWorkflowNode {
  return {
    id: crypto.randomUUID(),
    key: def.key,
    title: def.title,
    type: "numeric_input",
    order: def.order,
    completed: false,
    value: null,
    description: def.description ?? "",
    locked: false,
    blockedReason: "",
  };
}

function createTextInputNode(
  def: (typeof WORKFLOW_NODE_DEFINITIONS)[number]
): TextInputWorkflowNode {
  return {
    id: crypto.randomUUID(),
    key: def.key,
    title: def.title,
    type: "text_input",
    order: def.order,
    completed: false,
    value: "",
    description: def.description ?? "",
    locked: false,
    blockedReason: "",
  };
}

function createLightsNode(
  def: (typeof WORKFLOW_NODE_DEFINITIONS)[number]
): MultiSelectCategoryWorkflowNode {
  return {
    id: crypto.randomUUID(),
    key: WORKFLOW_KEYS.LIGHTS,
    title: def.title,
    type: "multi_select_category",
    order: def.order,
    completed: false,
    description: def.description ?? "",
    locked: false,
    blockedReason: "",
    availableCategories: createLightCategories(),
    selectedCategoryIds: [],
  };
}

export function createDefaultWorkflow(): WorkflowNode[] {
  return WORKFLOW_NODE_DEFINITIONS.map((def) => {
    switch (def.type) {
      case "checklist":
        return createChecklistNode(def);
      case "numeric_input":
        return createNumericInputNode(def);
      case "text_input":
        return createTextInputNode(def);
      case "multi_select_category":
        return createLightsNode(def);
      default:
        return createChecklistNode(def);
    }
  }).sort((a, b) => a.order - b.order);
}
