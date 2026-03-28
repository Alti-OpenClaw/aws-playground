import { memo } from "react";
import { Panel } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Download,
  Trash2,
  Sun,
  Moon,
  Undo2,
  Redo2,
  Save,
  FolderOpen,
} from "lucide-react";

interface CanvasToolbarProps {
  nodeCount: number;
  edgeCount: number;
  archName: string;
  isDark: boolean;
  canUndo: boolean;
  canRedo: boolean;
  hasUnsavedChanges: boolean;
  onToggleTheme: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSave: () => void;
  onLoad: () => void;
  onExport: () => void;
}

export const CanvasToolbar = memo(function CanvasToolbar({
  nodeCount,
  edgeCount,
  archName,
  isDark,
  canUndo,
  canRedo,
  hasUnsavedChanges,
  onToggleTheme,
  onUndo,
  onRedo,
  onClear,
  onSave,
  onLoad,
  onExport,
}: CanvasToolbarProps) {
  return (
    <Panel position="top-center">
      <div className="flex items-center gap-1.5 bg-card border border-card-border rounded-lg shadow-md px-2 py-1.5">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-2 pr-2 border-r border-border">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="w-3.5 h-3.5 text-primary-foreground"
              fill="currentColor"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-xs font-semibold text-foreground whitespace-nowrap">
            AWS Playground
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-1.5 mr-2 pr-2 border-r border-border">
          {archName && (
            <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-primary border-primary/30">
              {archName}
              {hasUnsavedChanges && <span className="ml-1 text-amber-500">●</span>}
            </Badge>
          )}
          {!archName && hasUnsavedChanges && (
            <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-amber-500 border-amber-400/30">
              Unsaved
            </Badge>
          )}
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
            {nodeCount} services
          </Badge>
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
            {edgeCount} connections
          </Badge>
        </div>

        {/* Actions */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleTheme}
              className="h-7 w-7 p-0"
              data-testid="btn-toggle-theme"
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle theme</TooltipContent>
        </Tooltip>

        <div className="w-px h-5 bg-border mx-0.5" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onUndo}
              className="h-7 w-7 p-0"
              disabled={!canUndo}
              data-testid="btn-undo"
              aria-label="Undo"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRedo}
              className="h-7 w-7 p-0"
              disabled={!canRedo}
              data-testid="btn-redo"
              aria-label="Redo"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-7 w-7 p-0"
              disabled={nodeCount === 0}
              data-testid="btn-clear-canvas"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Clear canvas</TooltipContent>
        </Tooltip>

        <div className="w-px h-5 bg-border mx-0.5" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSave}
              disabled={nodeCount === 0}
              className="h-7 w-7 p-0"
              data-testid="btn-save"
            >
              <Save className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Save architecture (Ctrl+S)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLoad}
              className="h-7 w-7 p-0"
              data-testid="btn-load"
            >
              <FolderOpen className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Load architecture</TooltipContent>
        </Tooltip>

        <div className="w-px h-5 bg-border mx-0.5" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              onClick={onExport}
              disabled={nodeCount === 0}
              className="h-7 text-[11px] px-3 gap-1.5"
              data-testid="btn-export"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export CloudFormation template (Ctrl+E)</TooltipContent>
        </Tooltip>
      </div>
    </Panel>
  );
});
