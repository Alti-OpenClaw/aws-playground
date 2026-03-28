import { getServiceIconUrl } from "@/data/aws-services";
import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Trash2, StickyNote, GripVertical } from "lucide-react";
import type { AwsService } from "@/data/aws-services";

export interface AwsNodeData {
  service: AwsService;
  notes?: string;
  config?: Record<string, any>;
  onDelete?: (id: string) => void;
  onAddNote?: (id: string) => void;
}

function AwsNodeComponent({ id, data, selected }: NodeProps & { data: AwsNodeData }) {
  const { service, notes, onDelete, onAddNote } = data;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative group transition-all duration-200 ${
        selected
          ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
          : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`node-${service.id}`}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-background !border-primary"
        data-testid={`handle-top-${id}`}
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-background !border-primary"
        data-testid={`handle-left-${id}`}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-background !border-primary"
        data-testid={`handle-bottom-${id}`}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-background !border-primary"
        data-testid={`handle-right-${id}`}
      />

      {/* Node card */}
      <div
        className="bg-card border border-card-border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 min-w-[140px]"
        style={{ borderTopColor: service.color, borderTopWidth: "3px" }}
      >
        {/* Action buttons on hover */}
        {isHovered && (
          <div className="absolute -top-3 -right-3 flex gap-1 z-10">
            <button
              onClick={(e) => { e.stopPropagation(); onAddNote?.(id); }}
              className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-md"
              data-testid={`btn-note-${id}`}
              title="Add note"
            >
              <StickyNote className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(id); }}
              className="w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors shadow-md"
              data-testid={`btn-delete-${id}`}
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="px-3 py-2.5 flex items-center gap-2.5">
          {/* AWS Service Icon */}
          <div
            className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${service.color}15` }}
          >
            <img
              src={getServiceIconUrl(service.iconSlug)}
              alt={service.name}
              className="w-7 h-7"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `<span style="color: ${service.color}; font-weight: 700; font-size: 11px;">${service.shortName}</span>`;
                }
              }}
            />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-foreground leading-tight truncate">
              {service.shortName}
            </div>
            <div className="text-[10px] text-muted-foreground leading-tight truncate mt-0.5">
              {service.name}
            </div>
          </div>
        </div>

        {/* Notes indicator */}
        {notes && (
          <div className="px-3 pb-2">
            <div className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded truncate flex items-center gap-1">
              <StickyNote className="w-2.5 h-2.5 flex-shrink-0" />
              {notes}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const AwsNode = memo(AwsNodeComponent);
