import { useState, useCallback, useRef, useEffect } from "react";
import {
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
  type OnConnect,
  MarkerType,
} from "@xyflow/react";
import type { AwsNodeData } from "@/components/aws-node";
import type { AwsService } from "@/data/aws-services";
import type { BoundaryType } from "@/components/service-palette";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUndoRedo } from "@/hooks/use-undo-redo";

export function usePlaygroundState() {
  const { toast } = useToast();
  const { takeSnapshot, undo, redo, canUndo, canRedo } = useUndoRedo();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [connectionConfigs, setConnectionConfigs] = useState<
    Record<string, Record<string, unknown>>
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const lastSavedState = useRef<string>("");

  // Theme
  const [isDark, setIsDark] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  const nodeCounter = useRef(0);
  const clipboard = useRef<{ nodes: Node[]; edges: Edge[] }>({ nodes: [], edges: [] });

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

  // Track unsaved changes
  useEffect(() => {
    const currentState = JSON.stringify({ n: nodes.length, e: edges.length });
    if (lastSavedState.current && currentState !== lastSavedState.current) {
      setHasUnsavedChanges(true);
    }
  }, [nodes, edges]);

  // Undo/redo
  const handleUndo = useCallback(() => {
    undo(nodes, edges, setNodes, setEdges);
  }, [nodes, edges, setNodes, setEdges, undo]);

  const handleRedo = useCallback(() => {
    redo(nodes, edges, setNodes, setEdges);
  }, [nodes, edges, setNodes, setEdges, redo]);

  // Copy/paste
  const handleCopy = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected);
    if (selectedNodes.length === 0) return;
    const selectedIds = new Set(selectedNodes.map((n) => n.id));
    const selectedEdges = edges.filter(
      (e) => selectedIds.has(e.source) && selectedIds.has(e.target)
    );
    clipboard.current = {
      nodes: JSON.parse(JSON.stringify(selectedNodes)),
      edges: JSON.parse(JSON.stringify(selectedEdges)),
    };
    toast({ title: "Copied", description: `${selectedNodes.length} node(s) copied.` });
  }, [nodes, edges, toast]);

  const handlePaste = useCallback(() => {
    const { nodes: copiedNodes, edges: copiedEdges } = clipboard.current;
    if (copiedNodes.length === 0) return;
    takeSnapshot(nodes, edges);

    const idMap = new Map<string, string>();
    const newNodes: Node[] = copiedNodes.map((n) => {
      nodeCounter.current += 1;
      const newId = `${n.id.split("-").slice(0, -1).join("-")}-${nodeCounter.current}`;
      idMap.set(n.id, newId);
      return {
        ...n,
        id: newId,
        position: { x: n.position.x + 40, y: n.position.y + 40 },
        selected: true,
        parentId: undefined,
        extent: undefined,
      };
    });

    const newEdges: Edge[] = copiedEdges.map((e) => {
      const newSource = idMap.get(e.source) || e.source;
      const newTarget = idMap.get(e.target) || e.target;
      return {
        ...e,
        id: `${newSource}-${newTarget}`,
        source: newSource,
        target: newTarget,
        selected: false,
      };
    });

    setNodes((nds) => [
      ...nds.map((n) => ({ ...n, selected: false })),
      ...newNodes,
    ]);
    setEdges((eds) => [...eds, ...newEdges]);
    toast({ title: "Pasted", description: `${newNodes.length} node(s) pasted.` });
  }, [nodes, edges, setNodes, setEdges, takeSnapshot, toast]);

  // Find parent group for a drop point
  const findParentGroup = useCallback(
    (dropX: number, dropY: number): Node | null => {
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

  // Delete node
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      takeSnapshot(nodes, edges);
      setNodes((nds) => {
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
      setEdges((eds) => eds.filter(() => true));
    },
    [setNodes, setEdges, takeSnapshot, nodes, edges]
  );

  // Note dialog
  const handleOpenNoteDialog = useCallback((nodeId: string) => {
    setNoteNodeId(nodeId);
    setShowNoteDialog(true);
  }, []);

  const handleSaveNote = useCallback(
    (nodeId: string, note: string) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, notes: note } } : n))
      );
    },
    [setNodes]
  );

  // Drop handlers
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleDragStart = useCallback(
    (event: React.DragEvent, service: AwsService) => {
      event.dataTransfer.setData("application/aws-service", JSON.stringify(service));
      event.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      takeSnapshot(nodes, edges);

      const reactFlowBounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      // Boundary drop
      const boundaryData = event.dataTransfer.getData("application/aws-boundary");
      if (boundaryData) {
        const boundary: BoundaryType = JSON.parse(boundaryData);
        nodeCounter.current += 1;
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
          },
          ...(parentGroup ? { parentId: parentGroup.id, extent: "parent" as const } : {}),
        };

        setNodes((nds) => [...nds, groupNode]);
        return;
      }

      // Service drop
      const serviceData = event.dataTransfer.getData("application/aws-service");
      if (!serviceData) return;

      const service: AwsService = JSON.parse(serviceData);
      nodeCounter.current += 1;
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
    [setNodes, findParentGroup, takeSnapshot, nodes, edges, handleDeleteNode, handleOpenNoteDialog]
  );

  // Connection handling
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

  const handleConfirmConnection = useCallback(
    (config: Record<string, unknown>) => {
      if (!pendingConnection) return;
      takeSnapshot(nodes, edges);

      const edgeId = `${pendingConnection.source}-${pendingConnection.target}`;

      let edgeLabel = "";
      const labelKeys = ["connection_type", "protocol", "access_type", "integration_type"];
      for (const key of labelKeys) {
        if (config[key] && typeof config[key] === "string") {
          edgeLabel = config[key] as string;
          break;
        }
      }
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

  const handleCancelConnection = useCallback(() => {
    setShowConnectionDialog(false);
    setPendingConnection(null);
  }, []);

  // Save/Load
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
      setHasUnsavedChanges(false);
      lastSavedState.current = JSON.stringify({ n: nodes.length, e: edges.length });
      toast({ title: "Architecture saved", description: `"${name}" saved successfully.` });
    },
    [nodes, edges, connectionConfigs, currentArchId, toast]
  );

  const handleLoad = useCallback(
    (arch: { id: number; name: string; nodesJson?: string | null; edgesJson?: string | null; connectionConfigsJson?: string | null }) => {
      try {
        const loadedNodes: Node[] = JSON.parse(arch.nodesJson || "[]");
        const loadedEdges: Edge[] = JSON.parse(arch.edgesJson || "[]");
        const loadedConfigs: Record<string, Record<string, unknown>> = arch.connectionConfigsJson
          ? JSON.parse(arch.connectionConfigsJson)
          : {};

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
        setHasUnsavedChanges(false);
        lastSavedState.current = JSON.stringify({ n: loadedNodes.length, e: loadedEdges.length });
        toast({ title: "Architecture loaded", description: `"${arch.name}" loaded successfully.` });
      } catch (err) {
        console.error("Failed to load architecture:", err);
        toast({ title: "Load failed", description: "Could not load architecture.", variant: "destructive" });
      }
    },
    [setNodes, setEdges, toast]
  );

  const handleClear = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setConnectionConfigs({});
    setCurrentArchId(null);
    setCurrentArchName("");
    toast({ title: "Canvas cleared", description: "All services and connections removed." });
  }, [setNodes, setEdges, toast]);

  return {
    // State
    nodes, edges, connectionConfigs,
    pendingConnection, showConnectionDialog, showExportDialog, showNoteDialog,
    noteNodeId, showSaveDialog, showLoadDialog, currentArchName, isDark,
    hasUnsavedChanges, clipboard,
    // Setters
    setShowConnectionDialog, setShowExportDialog, setShowNoteDialog,
    setShowSaveDialog, setShowLoadDialog,
    // Computed
    canUndo, canRedo, onNodesChange, onEdgesChange,
    // Handlers
    toggleTheme, handleUndo, handleRedo, handleCopy, handlePaste,
    handleDeleteNode, handleOpenNoteDialog, handleSaveNote,
    handleDragOver, handleDragStart, handleDrop, onConnect,
    handleConfirmConnection, handleCancelConnection,
    handleSave, handleLoad, handleClear,
  };
}
