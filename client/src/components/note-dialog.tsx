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
import { Textarea } from "@/components/ui/textarea";
import { StickyNote } from "lucide-react";

interface NoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeId: string | null;
  serviceName: string;
  currentNote: string;
  onSave: (nodeId: string, note: string) => void;
}

export function NoteDialog({
  open,
  onOpenChange,
  nodeId,
  serviceName,
  currentNote,
  onSave,
}: NoteDialogProps) {
  const [note, setNote] = useState(currentNote);

  useEffect(() => {
    setNote(currentNote);
  }, [currentNote, open]);

  if (!nodeId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-primary" />
            Note for {serviceName}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Add a reminder or configuration note for this service.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g., Remember to enable versioning on both buckets for cross-region replication..."
          className="text-xs min-h-[100px] resize-none"
          data-testid="textarea-note"
        />

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
            data-testid="btn-cancel-note"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onSave(nodeId, note);
              onOpenChange(false);
            }}
            className="text-xs"
            data-testid="btn-save-note"
          >
            Save Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
