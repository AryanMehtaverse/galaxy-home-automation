import type {
  WorkflowCategory,
  WorkflowNode,
  WorkflowTask,
} from "@/types/workflow";
import { WORKFLOW_KEYS } from "./keys";

function task(title: string, order: number): WorkflowTask {
  return {
    id: crypto.randomUUID(),
    title,
    completed: false,
    order,
  };
}

function sequentialTasks(titles: string[]): WorkflowTask[] {
  return titles.map((title, index) => task(title, index));
}

export const LIGHT_TYPE_DEFINITIONS: Omit<WorkflowCategory, "tasks" | "completed">[] = [
  { id: "cob", label: "COB" },
  { id: "led_strips", label: "LED Strips" },
  { id: "panel", label: "Panel" },
  { id: "spotlight", label: "Spotlight" },
  { id: "magnetic_track", label: "Magnetic Track" },
  { id: "fiber", label: "Fiber" },
];

const LIGHT_TASK_TITLES: Record<string, string[]> = {
  cob: ["Cutout", "Light"],
  led_strips: ["Cutout", "Profile", "LED Strip", "Controller", "Driver"],
  panel: ["Cutout"],
  spotlight: ["Cutout"],
  magnetic_track: ["Cutout", "0.5m Track"],
  fiber: ["Cutout", "Supplier"],
};

export function createLightCategories(): WorkflowCategory[] {
  return LIGHT_TYPE_DEFINITIONS.map((def) => ({
    ...def,
    completed: false,
    tasks: sequentialTasks(LIGHT_TASK_TITLES[def.id] ?? []),
  }));
}

export interface WorkflowNodeDefinition {
  key: string;
  title: string;
  type: WorkflowNode["type"];
  order: number;
  description?: string;
  taskTitles?: string[];
}

export const WORKFLOW_NODE_DEFINITIONS: WorkflowNodeDefinition[] = [
  {
    key: WORKFLOW_KEYS.ADVANCE_RECEIVED,
    title: "Advance Received",
    type: "checklist",
    order: 0,
    taskTitles: ["Advance payment received", "Documentation signed"],
  },
  {
    key: WORKFLOW_KEYS.LEAD_TIME,
    title: "Lead Time",
    type: "numeric_input",
    order: 1,
    description: "Number of days",
  },
  {
    key: WORKFLOW_KEYS.LIGHTS,
    title: "Lights",
    type: "multi_select_category",
    order: 2,
    description: "Select light types — each runs a sequential install chain",
  },
  {
    key: WORKFLOW_KEYS.BACKBOX,
    title: "Backbox",
    type: "checklist",
    order: 3,
    taskTitles: ["Backbox installed", "Wiring complete"],
  },
  {
    key: WORKFLOW_KEYS.ICON_COLOUR,
    title: "Icon Colour",
    type: "text_input",
    order: 4,
  },
  {
    key: WORKFLOW_KEYS.SWITCH_SOCKET,
    title: "Switch + Socket",
    type: "text_input",
    order: 5,
  },
  {
    key: WORKFLOW_KEYS.CURTAINS,
    title: "Curtains",
    type: "checklist",
    order: 6,
    taskTitles: ["Motor installed", "Calibration complete"],
  },
  {
    key: WORKFLOW_KEYS.IR_HUB_LCD,
    title: "IR + HUB + LCD",
    type: "checklist",
    order: 7,
    taskTitles: ["IR blaster", "Hub setup", "LCD panel"],
  },
  {
    key: WORKFLOW_KEYS.PROGRAMMING,
    title: "Programming",
    type: "checklist",
    order: 8,
    taskTitles: ["Scene programming", "Client handover"],
  },
];
