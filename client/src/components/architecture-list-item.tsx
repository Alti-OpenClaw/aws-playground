import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Clock, FileText, Layers } from "lucide-react";

interface Architecture {
  id: number;
  name: string;
  description?: string | null;
  nodesJson: string;
  edgesJson: string;
  notesJson?: string | null;
  connectionConfigsJson?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

function parseNodeCount(json: string): number {
  try { return JSON.parse(json).length; } catch { return 0; }
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    });
  } catch { return ""; }
}

interface ArchitectureListItemProps {
  arch: Architecture;
  selected: boolean;
  onSelect: (arch: Architecture) => void;
  onDelete: (id: number, e: React.MouseEvent) => void;
}

export const ArchitectureListItem = memo(function ArchitectureListItem({
  arch, selected, onSelect, onDelete,
}: ArchitectureListItemProps) {
  return (
    <div
      className={`flex items-center gap-3 p-2.5 rounded-md border cursor-pointer transition-colors ${
        selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/50"
      }`}
      onClick={() => onSelect(arch)}
      data-testid={`arch-item-${arch.id}`}
    >
      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Layers className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{arch.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <FileText className="w-2.5 h-2.5" />
            {parseNodeCount(arch.nodesJson)} services
          </span>
          {arch.updatedAt && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {formatDate(arch.updatedAt)}
            </span>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
        onClick={(e) => onDelete(arch.id, e)}
        data-testid={`btn-delete-arch-${arch.id}`}
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
});

export type { Architecture };
