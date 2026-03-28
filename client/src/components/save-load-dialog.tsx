import { useState, useEffect, useCallback } from "react";
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
import { Save, FolderOpen, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { ArchitectureListItem, type Architecture } from "@/components/architecture-list-item";

interface SaveLoadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "save" | "load";
  currentName?: string;
  onSave: (name: string, description: string) => Promise<void>;
  onLoad: (arch: Architecture) => void;
}

export function SaveLoadDialog({
  open, onOpenChange, mode, currentName, onSave, onLoad,
}: SaveLoadDialogProps) {
  const [architectures, setArchitectures] = useState<Architecture[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(currentName || "");
  const [description, setDescription] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      setError(null);
      setSelectedId(null);
      if (mode === "save") { setName(currentName || ""); setDescription(""); }

      apiRequest("GET", "/api/architectures")
        .then((res) => res.json())
        .then((data: Architecture[]) => setArchitectures(data))
        .catch(() => { setError("Failed to load architectures"); setArchitectures([]); })
        .finally(() => setLoading(false));
    }
  }, [open, mode, currentName]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) return;
    setSaving(true);
    try { await onSave(name.trim(), description.trim()); onOpenChange(false); }
    catch { setError("Failed to save architecture"); }
    finally { setSaving(false); }
  }, [name, description, onSave, onOpenChange]);

  const handleLoad = useCallback(() => {
    const arch = architectures.find((a) => a.id === selectedId);
    if (arch) { onLoad(arch); onOpenChange(false); }
  }, [architectures, selectedId, onLoad, onOpenChange]);

  const handleDelete = useCallback(async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiRequest("DELETE", `/api/architectures/${id}`);
      setArchitectures((prev) => prev.filter((a) => a.id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch { setError("Failed to delete architecture"); }
  }, [selectedId]);

  const handleSelect = useCallback((arch: Architecture) => {
    if (mode === "load") { setSelectedId(arch.id); }
    else { setName(arch.name); setDescription(arch.description || ""); setSelectedId(arch.id); }
  }, [mode]);

  const isSave = mode === "save";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle className="text-base flex items-center gap-2">
            {isSave ? <><Save className="w-4 h-4 text-primary" />Save Architecture</> : <><FolderOpen className="w-4 h-4 text-primary" />Load Architecture</>}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isSave ? "Save your current architecture to pick up where you left off." : "Load a previously saved architecture."}
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 py-4">
          {isSave && (
            <div className="space-y-3 mb-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 3-Tier Web App" className="h-8 text-xs" autoFocus data-testid="input-arch-name" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of this architecture" className="h-8 text-xs" data-testid="input-arch-desc" />
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Loading saved architectures...</p>
            </div>
          ) : architectures.length > 0 ? (
            <div className="space-y-1.5">
              {isSave && <p className="text-[10px] text-muted-foreground mb-2">Or overwrite an existing save:</p>}
              <ScrollArea className="max-h-[35vh]">
                <div className="space-y-1.5 pr-2">
                  {architectures.map((arch) => (
                    <ArchitectureListItem key={arch.id} arch={arch} selected={selectedId === arch.id} onSelect={handleSelect} onDelete={handleDelete} />
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-xs text-muted-foreground">{mode === "load" ? "No saved architectures yet." : "This will be your first saved architecture."}</p>
            </div>
          )}

          {error && (
            <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-md p-2.5">
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="px-5 py-3 border-t border-border bg-muted/30">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">Cancel</Button>
          {isSave ? (
            <Button size="sm" onClick={handleSave} disabled={saving || !name.trim()} className="text-xs gap-1.5" data-testid="btn-save-arch">
              {saving ? <><Loader2 className="w-3 h-3 animate-spin" />Saving...</> : <><Save className="w-3 h-3" />{selectedId ? "Overwrite" : "Save"}</>}
            </Button>
          ) : (
            <Button size="sm" onClick={handleLoad} disabled={selectedId === null} className="text-xs gap-1.5" data-testid="btn-load-arch">
              <FolderOpen className="w-3 h-3" />Load
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
