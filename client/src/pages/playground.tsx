import { useState, useCallback, useRef, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
  type OnConnect,
  BackgroundVariant,
  MarkerType,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

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
  ZoomIn,
  ZoomOut,
  Save,
  FolderOpen,
  Layout,
} from "lucide-react";

import { AwsNode, type AwsNodeData } from "@/components/aws-node";
import { ServicePalette } from "@/components/service-palette";
import { ConnectionDialog } from "@/components/connection-dialog";
import { ExportDialog } from "@/components/export-dialog";
import { NoteDialog } from "@/components/note-dialog";
import { type AwsService, getServiceById } from "@/data/aws-services";

const nodeTypes = { awsService: AwsNode };

export default function Playground() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [connectionConfigs, setConnectionConfigs] = useState<
    Record<string, Record<string, any>>
  >({});

  // Dialog state
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteNodeId, setNoteNodeId] = useState<string | null>(null);

  // Theme
  const [isDark, setIsDark] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  // Counter for unique node ids
  const nodeCounter = useRef(0);

  // Toggle dark mode
  const toggleTheme = useCallback(() => {
    setIsDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  }, []);

  // Set dark mode on mount
  useState(() => {
    document.documentElement.classList.toggle("dark", isDark);
  });

  // Handle drag from palette
  const handleDragStart = useCallback(
    (event: React.DragEvent, service: AwsService) => {
      event.dataTransfer.setData("application/aws-service", JSON.stringify(service));
      event.dataTransfer.effectAllowed = "move";
    },
    []
  );

  // Handle drop on canvas
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const data = event.dataTransfer.getData("application/aws-service");
      if (!data) return;

      const service: AwsService = JSON.parse(data);

      // Get canvas-relative position
      const reactFlowBounds = (
        event.currentTarget as HTMLElement
      ).getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 70,
        y: event.clientY - reactFlowBounds.top - 30,
      };

      nodeCounter.current += 1;
      const newNode: Node = {
        id: `${service.id}-${nodeCounter.current}`,
        type: "awsService",
        position,
        data: {
          service,
          notes: "",
          config: {},
          onDelete: handleDeleteNode,
          onAddNote: handleOpenNoteDialog,
        } satisfies AwsNodeData,
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
  );

  // Handle connection attempt
  const onConnect: OnConnect = useCallback(
    (connection) => {
      if (!connection.source || !connection.target) return;

      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);
      if (!sourceNode || !targetNode) return;

      setPendingConnection(connection);
      setShowConnectionDialog(true);
    },
    [nodes]
  );

  // Confirm connection with config
  const handleConfirmConnection = useCallback(
    (config: Record<string, any>) => {
      if (!pendingConnection) return;

      const edgeId = `${pendingConnection.source}-${pendingConnection.target}`;
      const newEdge: Edge = {
        id: edgeId,
        source: pendingConnection.source!,
        target: pendingConnection.target!,
        sourceHandle: pendingConnection.sourceHandle,
        targetHandle: pendingConnection.targetHandle,
        animated: true,
        style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "hsl(var(--primary))",
          width: 16,
          height: 16,
        },
        label: "",
      };

      setEdges((eds) => addEdge(newEdge, eds));
      setConnectionConfigs((prev) => ({ ...prev, [edgeId]: config }));
      setShowConnectionDialog(false);
      setPendingConnection(null);
    },
    [pendingConnection, setEdges]
  );

  // Cancel connection
  const handleCancelConnection = useCallback(() => {
    setShowConnectionDialog(false);
    setPendingConnection(null);
  }, []);

  // Delete node
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) =>
        eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
      );
    },
    [setNodes, setEdges]
  );

  // Note dialog
  const handleOpenNoteDialog = useCallback(
    (nodeId: string) => {
      setNoteNodeId(nodeId);
      setShowNoteDialog(true);
    },
    []
  );

  const handleSaveNote = useCallback(
    (nodeId: string, note: string) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === nodeId) {
            return {
              ...n,
              data: { ...n.data, notes: note },
            };
          }
          return n;
        })
      );
    },
    [setNodes]
  );

  // Clear canvas
  const handleClear = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setConnectionConfigs({});
  }, [setNodes, setEdges]);

  // Get source and target services for connection dialog
  const sourceService = useMemo(() => {
    if (!pendingConnection?.source) return null;
    const node = nodes.find((n) => n.id === pendingConnection.source);
    return node ? (node.data as AwsNodeData).service : null;
  }, [pendingConnection, nodes]);

  const targetService = useMemo(() => {
    if (!pendingConnection?.target) return null;
    const node = nodes.find((n) => n.id === pendingConnection.target);
    return node ? (node.data as AwsNodeData).service : null;
  }, [pendingConnection, nodes]);

  // Get note info for note dialog
  const noteNode = useMemo(() => {
    if (!noteNodeId) return null;
    return nodes.find((n) => n.id === noteNodeId);
  }, [noteNodeId, nodes]);

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      {/* Service Palette Sidebar */}
      <div className="w-64 flex-shrink-0 overflow-hidden">
        <ServicePalette onDragStart={handleDragStart} />
      </div>

      {/* Main Canvas */}
      <div
        className="flex-1 relative"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <ReactFlow
          nodes={nodes.map((n) => ({
            ...n,
            data: {
              ...n.data,
              onDelete: handleDeleteNode,
              onAddNote: handleOpenNoteDialog,
            },
          }))}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[16, 16]}
          minZoom={0.2}
          maxZoom={2}
          deleteKeyCode={["Backspace", "Delete"]}
          defaultEdgeOptions={{
            animated: true,
            style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "hsl(var(--primary))",
            },
          }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={16}
            size={1}
            color={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
          />
          <Controls className="!shadow-md" showInteractive={false} />
          <MiniMap
            nodeColor={(node: Node) => {
              const service = (node.data as AwsNodeData)?.service;
              return service?.color || "#888";
            }}
            maskColor={isDark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.7)"}
            className="!bg-card !border-card-border"
          />

          {/* Top toolbar */}
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
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                  {nodes.length} services
                </Badge>
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                  {edges.length} connections
                </Badge>
              </div>

              {/* Actions */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleTheme}
                    className="h-7 w-7 p-0"
                    data-testid="btn-toggle-theme"
                  >
                    {isDark ? (
                      <Sun className="w-3.5 h-3.5" />
                    ) : (
                      <Moon className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle theme</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="h-7 w-7 p-0"
                    disabled={nodes.length === 0}
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
                    size="sm"
                    onClick={() => setShowExportDialog(true)}
                    disabled={nodes.length === 0}
                    className="h-7 text-[11px] px-3 gap-1.5"
                    data-testid="btn-export"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Export CloudFormation template
                </TooltipContent>
              </Tooltip>
            </div>
          </Panel>

          {/* Empty state */}
          {nodes.length === 0 && (
            <Panel position="top-center" className="!top-1/2 !-translate-y-1/2">
              <div className="text-center max-w-sm">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Layout className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  Start Building
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  Drag AWS services from the sidebar onto the canvas.
                  Connect them by dragging from one handle to another.
                  You'll be guided through configuration at each step.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    Drag to add
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    Connect handles
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    Export IaC
                  </Badge>
                </div>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>

      {/* Connection Dialog */}
      <ConnectionDialog
        open={showConnectionDialog}
        onOpenChange={setShowConnectionDialog}
        source={sourceService}
        target={targetService}
        onConfirm={handleConfirmConnection}
        onCancel={handleCancelConnection}
      />

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        nodes={nodes}
        edges={edges}
        connectionConfigs={connectionConfigs}
      />

      {/* Note Dialog */}
      <NoteDialog
        open={showNoteDialog}
        onOpenChange={setShowNoteDialog}
        nodeId={noteNodeId}
        serviceName={
          noteNode ? (noteNode.data as AwsNodeData).service.shortName : ""
        }
        currentNote={
          noteNode ? ((noteNode.data as AwsNodeData).notes || "") : ""
        }
        onSave={handleSaveNote}
      />
    </div>
  );
}
