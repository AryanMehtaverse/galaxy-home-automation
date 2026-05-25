"use client";

import type { NumericInputWorkflowNode } from "@/types/workflow";
import { Input } from "@/components/ui/Input";
import { CheckboxRow } from "./CheckboxRow";

interface NumericInputNodeContentProps {
  node: NumericInputWorkflowNode;
  disabled?: boolean;
  onValueChange: (value: number | null) => void;
  onStepToggle: () => void;
}

export function NumericInputNodeContent({
  node,
  disabled,
  onValueChange,
  onStepToggle,
}: NumericInputNodeContentProps) {
  const hasValue = node.value !== null && node.value > 0;

  return (
    <div className="space-y-4">
      <Input
        label={node.description || "Number of days"}
        type="number"
        min={0}
        step={1}
        value={node.value ?? ""}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") {
            onValueChange(null);
            return;
          }
          const num = parseInt(raw, 10);
          onValueChange(Number.isFinite(num) ? num : null);
        }}
        placeholder="e.g. 14"
        disabled={disabled}
      />
      <CheckboxRow
        label="Lead time confirmed"
        checked={node.completed}
        disabled={disabled || !hasValue}
        locked={!hasValue}
        lockReason={!hasValue ? "Enter number of days first" : null}
        onToggle={onStepToggle}
      />
    </div>
  );
}
