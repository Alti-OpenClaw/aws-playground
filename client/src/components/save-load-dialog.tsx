import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Save,
  FolderOpen,
  Trash2,
  Loader2,
  Clock,
  Layers,
  FileText,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

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

interface SaveLoadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "save" | "load";
  currentName?: string;
  onSave: (name: string, description: string) => Promise<void>;
  onLoad: (arch: Architecture) => void;
}

export function SaveLoadDialog({
  open,
  onOpenChange,
  mode,
  currentName,
  onSave,
  onLoad,
}: SaveLoadDialogProps) {
  const [architectures, setArchitectures] = useState<Architecture[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(currentName || "");
  const [description, setDescription] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch architectures when dialog opens
  useEffect(() => {
    if (open) {
      setLoading(true);
      setError(null);
      setSelectedId(null);
      if (mode === "save") {
        setName(currentName || "");
        setDescription("");
      }

      apiRequest("GET", "/api/architectures")
        .then((res) => res.json())
        .then((data: Architecture[]) => {
          setArchitectures(data);
        })
        .catch(() => {
          setError("Failed to load architectures");
          setArchitectures([]);
        })
        .finally(() => setLoading(false));
    }
  }, [open, mode, currentName]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(name.trim(), description.trim());
      onOpenChange(false);
    } catch (err) {
      setError("Failed to save architecture");
    } finally {
      setSaving(false);
    }
  };

  const handleLoad = () => {
    const arch = architectures.find((a) => a.id === selectedId);
    if (arch) {
      onLoad(arch);
      onOpenChange(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiRequest("DELETE", `/api/architectures/${id}`);
      setArchitectures((prev) => prev.filter((a) => a.id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch {
      setError("Failed to delete architecture");
    }
  };

  const handleOverwrite = async (arch: Architecture) => {
    setName(arch.name);
    setDescription(arch.description || "");
    setSelectedId(arch.id);
  };

  const parseNodeCount = (json: string): number => {
    try {
      return JSON.parse(json).length;
    } catch {
      return 0;
    }
  };

  const formatDate = (dateStr?: string | null): string => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle className="text-base flex items-center gap-2">
            {mode === "save" ? (
              <>
                <Save className="w-4 h-4 text-primary" />
                Save Architecture
              </>
            ) : (
              <>
                <FolderOpen className="w-4 h-4 text-primary" />
                Load Architecture
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {mode === "save"
              ? "Save your current architecture to pick up where you left off."
              : "Load a previously saved architecture."}
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 py-4">
          {/* Save mode: name + description inputs */}
          {mode === "save" && (
            <div className="space-y-3 mb-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 3-Tier Web App"
                  className="h-8 text-xs"
                  autoFocus
                  data-testid="input-arch-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Description{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this architecture"
                  className="h-8 text-xs"
                  data-testid="input-arch-desc"
                />
              </div>
            </div>
          )}

          {/* Existing architectures list */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Loading saved architectures...</p>
            </div>
          ) : architectures.length > 0 ? (
            <div className="space-y-1.5">
              {mode === "save" && (
                <p className="text-[10px] text-muted-foreground mb-2">
                  Or overwrite an existing save:
                </p>
              )}
              <ScrollArea className="max-h-[35vh]">
                <div className="space-y-1.5 pr-2">
                  {architectures.map((arch) => (
                    <div
                      key={arch.id}
                      className={`flex items-center gap-3 p-2.5 rounded-md border cursor-pointer transition-colors ${
                        selectedId === arch.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40 hover:bg-muted/50"
                      }`}
                      onClick={() =>
                        mode === "load"
                          ? setSelectedId(arch.id)
                          : handleOverwrite(arch)
                      }
                      data-testid={`arch-item-${arch.id}`}
                    >
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Layers className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {arch.name}
                        </p>
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
                        onClick={(e) => handleDelete(arch.id, e)}
                        data-testid={`btn-delete-arch-${arch.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-xs text-muted-foreground">
                {mode === "load"
                  ? "No saved architectures yet."
                  : "This will be your first saved architecture."}
              </p>
            </div>
          )}

          {error && (
            <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-md p-2.5">
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="px-5 py-3 border-t border-border bg-muted/30">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Cancel
          </Button>
          {mode === "save" ? (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="text-xs gap-1.5"
              data-testid="btn-save-arch"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3 h-3" />
                  {selectedId ? "Overwrite" : "Save"}
                </>
              )}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleLoad}
              disabled={selectedId === null}
              className="text-xs gap-1.5"
              data-testid="btn-load-arch"
            >
              <FolderOpen className="w-3 h-3" />
              Load
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
