export const WORKFLOW_KEYS = {
  ADVANCE_RECEIVED: "advance_received",
  LEAD_TIME: "lead_time",
  LIGHTS: "lights",
  BACKBOX: "backbox",
  ICON_COLOUR: "icon_colour",
  SWITCH_SOCKET: "switch_socket",
  CURTAINS: "curtains",
  IR_HUB_LCD: "ir_hub_lcd",
  PROGRAMMING: "programming",
} as const;

export type WorkflowKey = (typeof WORKFLOW_KEYS)[keyof typeof WORKFLOW_KEYS];
