import { useMemo, lazy, Suspense, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  SelectionMode,
  type Node,
  BackgroundVariant,
  MarkerType,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Badge } from "@/components/ui/badge";
import { Layout } from "lucide-react";
import { CanvasToolbar } from "@/components/canvas-toolbar";
import { AwsNode, type AwsNodeData } from "@/components/aws-node";
import { GroupNode } from "@/components/group-node";
import { ServicePalette } from "@/components/service-palette";
import { usePlaygroundState } from "@/hooks/use-playground-state";

const ConnectionDialog = lazy(() => import("@/components/connection-dialog").then(m => ({ default: m.ConnectionDialog })));
const ExportDialog = lazy(() => import("@/components/export-dialog").then(m => ({ default: m.ExportDialog })));
const NoteDialog = lazy(() => import("@/components/note-dialog").then(m => ({ default: m.NoteDialog })));
const SaveLoadDialog = lazy(() => import("@/components/save-load-dialog").then(m => ({ default: m.SaveLoadDialog })));

const nodeTypes = { awsService: AwsNode, group: GroupNode };

export default function Playground() {
  const state = usePlaygroundState();

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;

      if (isCtrl && e.key === "z" && !e.shiftKey) { e.preventDefault(); state.handleUndo(); return; }
      if (isCtrl && e.key === "z" && e.shiftKey) { e.preventDefault(); state.handleRedo(); return; }
      if (isCtrl && e.key === "c") {
        const sel = state.nodes.filter((n) => n.selected);
        if (sel.length > 0 && !window.getSelection()?.toString()) { e.preventDefault(); state.handleCopy(); return; }
      }
      if (isCtrl && e.key === "v") {
        if (state.clipboard.current.nodes.length > 0 && !document.querySelector("input:focus, textarea:focus")) {
          e.preventDefault(); state.handlePaste(); return;
        }
      }
      if (isCtrl && e.key === "s") { e.preventDefault(); if (state.nodes.length > 0) state.setShowSaveDialog(true); return; }
      if (isCtrl && e.key === "e") { e.preventDefault(); if (state.nodes.length > 0) state.setShowExportDialog(true); return; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state]);

  // Get source/target services for connection dialog
  const sourceService = useMemo(() => {
    if (!state.pendingConnection?.source) return null;
    const node = state.nodes.find((n) => n.id === state.pendingConnection?.source);
    return node ? (node.data as unknown as AwsNodeData).service : null;
  }, [state.pendingConnection, state.nodes]);

  const targetService = useMemo(() => {
    if (!state.pendingConnection?.target) return null;
    const node = state.nodes.find((n) => n.id === state.pendingConnection?.target);
    return node ? (node.data as unknown as AwsNodeData).service : null;
  }, [state.pendingConnection, state.nodes]);

  const noteNode = useMemo(() => {
    if (!state.noteNodeId) return null;
    return state.nodes.find((n) => n.id === state.noteNodeId);
  }, [state.noteNodeId, state.nodes]);

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      <div className="w-64 flex-shrink-0 overflow-hidden">
        <ServicePalette onDragStart={state.handleDragStart} />
      </div>

      <div className="flex-1 relative" role="application" aria-label="AWS architecture canvas" onDragOver={state.handleDragOver} onDrop={state.handleDrop}>
        <ReactFlow
          nodes={state.nodes.map((n) => ({
            ...n,
            data: {
              ...n.data,
              onDelete: state.handleDeleteNode,
              ...(n.type !== "group" ? { onAddNote: state.handleOpenNoteDialog } : {}),
            },
          }))}
          edges={state.edges}
          onNodesChange={state.onNodesChange}
          onEdgesChange={state.onEdgesChange}
          onConnect={state.onConnect}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[16, 16]}
          minZoom={0.2}
          maxZoom={2}
          selectionOnDrag
          selectionMode={SelectionMode.Partial}
          multiSelectionKeyCode="Shift"
          selectionKeyCode={null}
          deleteKeyCode={["Backspace", "Delete"]}
          defaultEdgeOptions={{
            animated: true,
            style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(var(--primary))" },
          }}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color={state.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} />
          <Controls className="!shadow-md" showInteractive={false} />
          <MiniMap
            nodeColor={(node: Node) => {
              const service = (node.data as unknown as AwsNodeData)?.service;
              return service?.color || "#888";
            }}
            maskColor={state.isDark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.7)"}
            className="!bg-card !border-card-border"
          />

          <CanvasToolbar
            nodeCount={state.nodes.length}
            edgeCount={state.edges.length}
            archName={state.currentArchName}
            isDark={state.isDark}
            canUndo={state.canUndo()}
            canRedo={state.canRedo()}
            hasUnsavedChanges={state.hasUnsavedChanges}
            onToggleTheme={state.toggleTheme}
            onUndo={state.handleUndo}
            onRedo={state.handleRedo}
            onClear={state.handleClear}
            onSave={() => state.setShowSaveDialog(true)}
            onLoad={() => state.setShowLoadDialog(true)}
            onExport={() => state.setShowExportDialog(true)}
          />

          {state.nodes.length === 0 && (
            <Panel position="top-center" className="!top-1/2 !-translate-y-1/2">
              <div className="text-center max-w-sm">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Layout className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Start Building</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  Drag AWS services from the sidebar onto the canvas. Connect them by dragging from one handle to another.
                  You'll be guided through configuration at each step.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="outline" className="text-[10px]">Drag to add</Badge>
                  <Badge variant="outline" className="text-[10px]">Connect handles</Badge>
                  <Badge variant="outline" className="text-[10px]">Export IaC</Badge>
                </div>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>

      <Suspense fallback={null}>
        {state.showConnectionDialog && (
          <ConnectionDialog
            open={state.showConnectionDialog}
            onOpenChange={state.setShowConnectionDialog}
            source={sourceService}
            target={targetService}
            onConfirm={state.handleConfirmConnection}
            onCancel={state.handleCancelConnection}
          />
        )}
        {state.showExportDialog && (
          <ExportDialog
            open={state.showExportDialog}
            onOpenChange={state.setShowExportDialog}
            nodes={state.nodes}
            edges={state.edges}
            connectionConfigs={state.connectionConfigs}
            architectureName={state.currentArchName}
          />
        )}
        {state.showNoteDialog && (
          <NoteDialog
            open={state.showNoteDialog}
            onOpenChange={state.setShowNoteDialog}
            nodeId={state.noteNodeId}
            serviceName={noteNode ? (noteNode.data as unknown as AwsNodeData).service.shortName : ""}
            currentNote={noteNode ? ((noteNode.data as unknown as AwsNodeData).notes || "") : ""}
            onSave={state.handleSaveNote}
          />
        )}
        {state.showSaveDialog && (
          <SaveLoadDialog
            open={state.showSaveDialog}
            onOpenChange={state.setShowSaveDialog}
            mode="save"
            currentName={state.currentArchName}
            onSave={state.handleSave}
            onLoad={state.handleLoad}
          />
        )}
        {state.showLoadDialog && (
          <SaveLoadDialog
            open={state.showLoadDialog}
            onOpenChange={state.setShowLoadDialog}
            mode="load"
            onSave={state.handleSave}
            onLoad={state.handleLoad}
          />
        )}
      </Suspense>
    </div>
  );
}
