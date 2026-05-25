"use client";

import type { TextInputWorkflowNode } from "@/types/workflow";
import { Input } from "@/components/ui/Input";
import { CheckboxRow } from "./CheckboxRow";

interface TextInputNodeContentProps {
  node: TextInputWorkflowNode;
  disabled?: boolean;
  onValueChange: (value: string) => void;
  onStepToggle: () => void;
}

export function TextInputNodeContent({
  node,
  disabled,
  onValueChange,
  onStepToggle,
}: TextInputNodeContentProps) {
  const hasValue = node.value.trim().length > 0;

  return (
    <div className="space-y-4">
      <Input
        label={node.description || "Value"}
        value={node.value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder="Enter value…"
        disabled={disabled}
      />
      <CheckboxRow
        label={`${node.title} complete`}
        checked={node.completed}
        disabled={disabled || !hasValue}
        locked={!hasValue}
        lockReason={!hasValue ? "Enter a value first" : null}
        onToggle={onStepToggle}
      />
    </div>
  );
}
