import { useState, useCallback, useRef, useMemo, useEffect } from "react";
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
  Save,
  FolderOpen,
  Layout,
} from "lucide-react";

import { AwsNode, type AwsNodeData } from "@/components/aws-node";
import { GroupNode, type GroupNodeData } from "@/components/group-node";
import { ServicePalette, type BoundaryType } from "@/components/service-palette";
import { ConnectionDialog } from "@/components/connection-dialog";
import { ExportDialog } from "@/components/export-dialog";
import { NoteDialog } from "@/components/note-dialog";
import { SaveLoadDialog } from "@/components/save-load-dialog";
import { type AwsService } from "@/data/aws-services";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUndoRedo } from "@/hooks/use-undo-redo";

const nodeTypes = { awsService: AwsNode, group: GroupNode };

export default function Playground() {
  const { toast } = useToast();
  const { takeSnapshot, undo, redo, canUndo, canRedo } = useUndoRedo();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [connectionConfigs, setConnectionConfigs] = useState<
    Record<string, Record<string, any>>
  >({});

  // Dialog state
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteNodeId, setNoteNodeId] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [currentArchId, setCurrentArchId] = useState<number | null>(null);
  const [currentArchName, setCurrentArchName] = useState<string>("");

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

  // Undo/redo handlers
  const handleUndo = useCallback(() => {
    undo(nodes, edges, setNodes, setEdges);
  }, [nodes, edges, setNodes, setEdges, undo]);

  const handleRedo = useCallback(() => {
    redo(nodes, edges, setNodes, setEdges);
  }, [nodes, edges, setNodes, setEdges, redo]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;

      // Ctrl+Z — undo, Ctrl+Shift+Z — redo
      if (isCtrl && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }
      if (isCtrl && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        handleRedo();
        return;
      }
      // Ctrl+S — save
      if (isCtrl && e.key === "s") {
        e.preventDefault();
        if (nodes.length > 0) setShowSaveDialog(true);
        return;
      }
      // Ctrl+E — export
      if (isCtrl && e.key === "e") {
        e.preventDefault();
        if (nodes.length > 0) setShowExportDialog(true);
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleUndo, handleRedo, nodes.length]);

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

  // Find which group node (if any) contains a drop point
  const findParentGroup = useCallback(
    (dropX: number, dropY: number): Node | null => {
      // Check group nodes from smallest to largest (most specific parent)
      const groups = nodes
        .filter((n) => n.type === "group")
        .map((n) => ({
          node: n,
          area: (n.measured?.width || n.width || 400) * (n.measured?.height || n.height || 300),
        }))
        .sort((a, b) => a.area - b.area);

      for (const { node } of groups) {
        const nx = node.position.x;
        const ny = node.position.y;
        const nw = node.measured?.width || node.width || 400;
        const nh = node.measured?.height || node.height || 300;

        if (dropX >= nx && dropX <= nx + nw && dropY >= ny && dropY <= ny + nh) {
          return node;
        }
      }
      return null;
    },
    [nodes]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      takeSnapshot(nodes, edges);

      const reactFlowBounds = (
        event.currentTarget as HTMLElement
      ).getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      // Check for boundary drop
      const boundaryData = event.dataTransfer.getData("application/aws-boundary");
      if (boundaryData) {
        const boundary: BoundaryType = JSON.parse(boundaryData);
        nodeCounter.current += 1;

        // Find parent group for nesting
        const parentGroup = findParentGroup(position.x, position.y);

        const groupNode: Node = {
          id: `${boundary.id}-${nodeCounter.current}`,
          type: "group",
          position: parentGroup
            ? { x: position.x - parentGroup.position.x - 100, y: position.y - parentGroup.position.y - 75 }
            : { x: position.x - 100, y: position.y - 75 },
          style: { width: 400, height: 300 },
          data: {
            label: boundary.label,
            groupType: boundary.groupType,
            onDelete: handleDeleteNode,
          } as GroupNodeData,
          ...(parentGroup ? { parentId: parentGroup.id, extent: "parent" as const } : {}),
        };

        setNodes((nds) => [...nds, groupNode]);
        return;
      }

      // Check for service drop
      const serviceData = event.dataTransfer.getData("application/aws-service");
      if (!serviceData) return;

      const service: AwsService = JSON.parse(serviceData);
      nodeCounter.current += 1;

      // Find parent group for auto-nesting
      const parentGroup = findParentGroup(position.x, position.y);

      const newNode: Node = {
        id: `${service.id}-${nodeCounter.current}`,
        type: "awsService",
        position: parentGroup
          ? { x: position.x - parentGroup.position.x - 70, y: position.y - parentGroup.position.y - 30 }
          : { x: position.x - 70, y: position.y - 30 },
        data: {
          service,
          notes: "",
          config: {},
          onDelete: handleDeleteNode,
          onAddNote: handleOpenNoteDialog,
        } satisfies AwsNodeData,
        ...(parentGroup ? { parentId: parentGroup.id, extent: "parent" as const, expandParent: true } : {}),
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, findParentGroup, takeSnapshot, nodes, edges]
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
      takeSnapshot(nodes, edges);

      const edgeId = `${pendingConnection.source}-${pendingConnection.target}`;

      // Derive edge label from config answers (use connection_type, protocol, or first meaningful answer)
      let edgeLabel = "";
      const labelKeys = ["connection_type", "protocol", "access_type", "integration_type"];
      for (const key of labelKeys) {
        if (config[key] && typeof config[key] === "string") {
          edgeLabel = config[key];
          break;
        }
      }
      // Fallback: use first non-internal answer
      if (!edgeLabel) {
        for (const [key, val] of Object.entries(config)) {
          if (!key.startsWith("_") && typeof val === "string" && val.length < 30) {
            edgeLabel = val;
            break;
          }
        }
      }

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
        label: edgeLabel,
        labelStyle: { fontSize: 10, fontWeight: 500, fill: "hsl(var(--foreground))" },
        labelBgStyle: { fill: "hsl(var(--card))", fillOpacity: 0.9 },
        labelBgPadding: [6, 3] as [number, number],
        labelBgBorderRadius: 4,
      };

      setEdges((eds) => addEdge(newEdge, eds));
      setConnectionConfigs((prev) => ({ ...prev, [edgeId]: config }));
      setShowConnectionDialog(false);
      setPendingConnection(null);
      toast({ title: "Connection created", description: "Services linked successfully." });
    },
    [pendingConnection, setEdges, toast, takeSnapshot, nodes, edges]
  );

  // Cancel connection
  const handleCancelConnection = useCallback(() => {
    setShowConnectionDialog(false);
    setPendingConnection(null);
  }, []);

  // Delete node (and children if it's a group)
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      takeSnapshot(nodes, edges);
      setNodes((nds) => {
        // Collect all descendant IDs (recursive for nested groups)
        const toDelete = new Set<string>([nodeId]);
        let changed = true;
        while (changed) {
          changed = false;
          for (const n of nds) {
            if (n.parentId && toDelete.has(n.parentId) && !toDelete.has(n.id)) {
              toDelete.add(n.id);
              changed = true;
            }
          }
        }
        return nds.filter((n) => !toDelete.has(n.id));
      });
      setEdges((eds) =>
        eds.filter((e) => {
          // Will be cleaned up since nodes are gone, but be explicit
          return true;
        })
      );
    },
    [setNodes, setEdges, takeSnapshot, nodes, edges]
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

  // Save architecture
  const handleSave = useCallback(
    async (name: string, description: string) => {
      const nodesJson = JSON.stringify(nodes);
      const edgesJson = JSON.stringify(edges);
      const connectionConfigsJson = JSON.stringify(connectionConfigs);
      const now = new Date().toISOString();

      const body = {
        name,
        description: description || null,
        nodesJson,
        edgesJson,
        notesJson: null,
        connectionConfigsJson,
        updatedAt: now,
        createdAt: now,
      };

      if (currentArchId) {
        await apiRequest("PUT", `/api/architectures/${currentArchId}`, body);
      } else {
        const res = await apiRequest("POST", "/api/architectures", body);
        const created = await res.json();
        setCurrentArchId(created.id);
      }
      setCurrentArchName(name);
      toast({ title: "Architecture saved", description: `"${name}" saved successfully.` });
    },
    [nodes, edges, connectionConfigs, currentArchId, toast]
  );

  // Load architecture
  const handleLoad = useCallback(
    (arch: { id: number; name: string; nodesJson?: string | null; edgesJson?: string | null; connectionConfigsJson?: string | null }) => {
      try {
        const loadedNodes: Node[] = JSON.parse(arch.nodesJson || "[]");
        const loadedEdges: Edge[] = JSON.parse(arch.edgesJson || "[]");
        const loadedConfigs: Record<string, Record<string, unknown>> = arch.connectionConfigsJson
          ? JSON.parse(arch.connectionConfigsJson)
          : {};

        // Update the node counter to avoid id collisions
        let maxCounter = 0;
        loadedNodes.forEach((n) => {
          const parts = n.id.split("-");
          const num = parseInt(parts[parts.length - 1], 10);
          if (!isNaN(num) && num > maxCounter) maxCounter = num;
        });
        nodeCounter.current = maxCounter;

        setNodes(loadedNodes);
        setEdges(loadedEdges);
        setConnectionConfigs(loadedConfigs);
        setCurrentArchId(arch.id);
        setCurrentArchName(arch.name);
        toast({ title: "Architecture loaded", description: `"${arch.name}" loaded successfully.` });
      } catch (err) {
        console.error("Failed to load architecture:", err);
        toast({ title: "Load failed", description: "Could not load architecture.", variant: "destructive" });
      }
    },
    [setNodes, setEdges, toast]
  );

  // Clear canvas
  const handleClear = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setConnectionConfigs({});
    setCurrentArchId(null);
    setCurrentArchName("");
    toast({ title: "Canvas cleared", description: "All services and connections removed." });
  }, [setNodes, setEdges, toast]);

  // Get source and target services for connection dialog
  const sourceService = useMemo(() => {
    if (!pendingConnection?.source) return null;
    const node = nodes.find((n) => n.id === pendingConnection.source);
    return node ? (node.data as unknown as AwsNodeData).service : null;
  }, [pendingConnection, nodes]);

  const targetService = useMemo(() => {
    if (!pendingConnection?.target) return null;
    const node = nodes.find((n) => n.id === pendingConnection.target);
    return node ? (node.data as unknown as AwsNodeData).service : null;
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
              ...(n.type !== "group" ? { onAddNote: handleOpenNoteDialog } : {}),
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
              const service = (node.data as unknown as AwsNodeData)?.service;
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
                {currentArchName && (
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-primary border-primary/30">
                    {currentArchName}
                  </Badge>
                )}
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

              <div className="w-px h-5 bg-border mx-0.5" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUndo}
                    className="h-7 w-7 p-0"
                    disabled={!canUndo()}
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
                    onClick={handleRedo}
                    className="h-7 w-7 p-0"
                    disabled={!canRedo()}
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
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSaveDialog(true)}
                    disabled={nodes.length === 0}
                    className="h-7 w-7 p-0"
                    data-testid="btn-save"
                  >
                    <Save className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save architecture</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLoadDialog(true)}
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
          noteNode ? (noteNode.data as unknown as AwsNodeData).service.shortName : ""
        }
        currentNote={
          noteNode ? ((noteNode.data as unknown as AwsNodeData).notes || "") : ""
        }
        onSave={handleSaveNote}
      />

      {/* Save Dialog */}
      <SaveLoadDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        mode="save"
        currentName={currentArchName}
        onSave={handleSave}
        onLoad={handleLoad}
      />

      {/* Load Dialog */}
      <SaveLoadDialog
        open={showLoadDialog}
        onOpenChange={setShowLoadDialog}
        mode="load"
        onSave={handleSave}
        onLoad={handleLoad}
      />
    </div>
  );
}
