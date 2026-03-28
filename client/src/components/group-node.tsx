import { memo, useState } from "react";
import { Handle, Position, type NodeProps, NodeResizer } from "@xyflow/react";
import { Trash2, GripVertical } from "lucide-react";

export interface GroupNodeData {
  label: string;
  groupType: "region" | "vpc" | "subnet" | "availability-zone" | "security-group";
  onDelete?: (id: string) => void;
  [key: string]: unknown;
}

const GROUP_STYLES: Record<string, { border: string; bg: string; label: string; icon: string }> = {
  region: {
    border: "border-blue-400/50",
    bg: "bg-blue-500/[0.03]",
    label: "text-blue-500",
    icon: "🌍",
  },
  vpc: {
    border: "border-emerald-400/50",
    bg: "bg-emerald-500/[0.03]",
    label: "text-emerald-500",
    icon: "🔒",
  },
  subnet: {
    border: "border-amber-400/50",
    bg: "bg-amber-500/[0.03]",
    label: "text-amber-600 dark:text-amber-400",
    icon: "🔗",
  },
  "availability-zone": {
    border: "border-purple-400/50",
    bg: "bg-purple-500/[0.03]",
    label: "text-purple-500",
    icon: "🏢",
  },
  "security-group": {
    border: "border-red-400/50",
    bg: "bg-red-500/[0.03]",
    label: "text-red-500",
    icon: "🛡️",
  },
};

const GROUP_BORDER_COLORS: Record<string, string> = {
  region: "#60a5fa",
  vpc: "#34d399",
  subnet: "#fbbf24",
  "availability-zone": "#a78bfa",
  "security-group": "#f87171",
};

function GroupNodeComponent({ id, data, selected }: NodeProps & { data: GroupNodeData }) {
  const { label, groupType, onDelete } = data;
  const [isHovered, setIsHovered] = useState(false);
  const style = GROUP_STYLES[groupType] || GROUP_STYLES.vpc;

  return (
    <>
      <NodeResizer
        color={GROUP_BORDER_COLORS[groupType] || "#34d399"}
        isVisible={selected}
        minWidth={200}
        minHeight={150}
        handleStyle={{ width: 8, height: 8 }}
      />

      <div
        className={`w-full h-full rounded-xl border-2 border-dashed ${style.border} ${style.bg} transition-all duration-200 ${
          selected ? "ring-1 ring-primary/30" : ""
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-testid={`group-${groupType}-${id}`}
      >
        {/* Connection handles for groups */}
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-background !border-primary !opacity-0 hover:!opacity-100"
          data-testid={`handle-top-${id}`}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-background !border-primary !opacity-0 hover:!opacity-100"
          data-testid={`handle-bottom-${id}`}
        />
        <Handle
          type="target"
          position={Position.Left}
          className="!bg-background !border-primary !opacity-0 hover:!opacity-100"
          data-testid={`handle-left-${id}`}
        />
        <Handle
          type="source"
          position={Position.Right}
          className="!bg-background !border-primary !opacity-0 hover:!opacity-100"
          data-testid={`handle-right-${id}`}
        />

        {/* Label header */}
        <div className="absolute top-0 left-0 right-0 px-3 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{style.icon}</span>
            <span className={`text-[11px] font-semibold ${style.label} tracking-wide uppercase`}>
              {label}
            </span>
          </div>

          {/* Delete on hover */}
          {isHovered && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(id);
              }}
              className="w-5 h-5 rounded-full bg-destructive/80 text-destructive-foreground flex items-center justify-center hover:bg-destructive transition-colors shadow-sm"
              data-testid={`btn-delete-group-${id}`}
              title="Delete group"
            >
              <Trash2 className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export const GroupNode = memo(GroupNodeComponent);
