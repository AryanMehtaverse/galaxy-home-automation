"use client";

import type { Project } from "@/types";
import { WorkflowNodePanel } from "./WorkflowNodePanel";
import {
  updateWorkflowNode,
  toggleWorkflowTask,
  toggleWorkflowStep,
  toggleWorkflowLightCategory,
} from "@/lib/firestore/projects";
import { getSortedPipeline } from "@/lib/workflow/pipeline";

interface WorkflowTreeProps {
  project: Project;
}

export function WorkflowTree({ project }: WorkflowTreeProps) {
  const sorted = getSortedPipeline(project.workflow);

  return (
    <div className="relative space-y-0">
      {sorted.map((node, index) => (
        <div key={node.id} className="relative">
          {index > 0 && (
            <div
              className="absolute -top-3 left-[1.65rem] z-0 h-3 w-0.5 bg-zinc-300 dark:bg-zinc-600"
              aria-hidden
            />
          )}
          <WorkflowNodePanel
            workflow={project.workflow}
            node={node}
            onNodeUpdate={(nodeId, patch) =>
              updateWorkflowNode(
                project.id,
                project.workflow,
                nodeId,
                patch,
                project.status
              )
            }
            onTaskToggle={(nodeId, taskId) =>
              toggleWorkflowTask(
                project.id,
                project.workflow,
                nodeId,
                taskId,
                project.status
              )
            }
            onStepToggle={(nodeId) =>
              toggleWorkflowStep(
                project.id,
                project.workflow,
                nodeId,
                project.status
              )
            }
            onToggleCategory={(nodeId, categoryId) =>
              toggleWorkflowLightCategory(
                project.id,
                project.workflow,
                nodeId,
                categoryId,
                project.status
              )
            }
          />
        </div>
      ))}
    </div>
  );
}
