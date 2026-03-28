import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Copy,
  Check,
  Loader2,
  FileJson,
  FileCode,
  Terminal,
} from "lucide-react";
import type { Node, Edge } from "@xyflow/react";
import type { AwsNodeData } from "@/components/aws-node";
import { apiRequest } from "@/lib/queryClient";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodes: Node[];
  edges: Edge[];
  connectionConfigs: Record<string, Record<string, any>>;
}

export function ExportDialog({
  open,
  onOpenChange,
  nodes,
  edges,
  connectionConfigs,
}: ExportDialogProps) {
  const [format, setFormat] = useState<"json" | "yaml">("yaml");
  const [template, setTemplate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setTemplate(null);

    try {
      const serviceNodes = nodes.map((n) => {
        const d = n.data as unknown as AwsNodeData;
        return {
          id: n.id,
          service: d.service.name,
          serviceId: d.service.id,
          cfnType: d.service.cfnType,
          notes: d.notes,
        };
      });

      const connections = edges.map((e) => {
        const sourceNode = nodes.find((n) => n.id === e.source);
        const targetNode = nodes.find((n) => n.id === e.target);
        const fromData = sourceNode ? (sourceNode.data as unknown as AwsNodeData) : null;
        const toData = targetNode ? (targetNode.data as unknown as AwsNodeData) : null;
        return {
          from: e.source,
          to: e.target,
          fromService: fromData ? fromData.service.name : e.source,
          toService: toData ? toData.service.name : e.target,
        };
      });

      const res = await apiRequest("POST", "/api/export-cloudformation", {
        nodes: serviceNodes,
        edges: connections,
        connectionConfigs,
        format,
      });
      const data = await res.json();
      setTemplate(data.template);
    } catch (err: any) {
      setError("Failed to generate template. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (template) {
      navigator.clipboard.writeText(template);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!template) return;
    const ext = format === "yaml" ? "yaml" : "json";
    const mime = format === "yaml" ? "text/yaml" : "application/json";
    const blob = new Blob([template], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aws-architecture.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle className="text-base flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            Export CloudFormation Template
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Generate an Infrastructure-as-Code template from your architecture.
            Share it with Claude Code or any CLI to deploy on AWS.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 py-4 space-y-4">
          {/* Summary */}
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-[10px]">
              {nodes.length} services
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              {edges.length} connections
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              {Object.keys(connectionConfigs).length} configured
            </Badge>
          </div>

          {/* Format tabs */}
          <Tabs value={format} onValueChange={(v) => setFormat(v as "json" | "yaml")}>
            <TabsList className="h-8">
              <TabsTrigger value="yaml" className="text-xs h-6 gap-1.5" data-testid="tab-yaml">
                <FileCode className="w-3 h-3" />
                YAML
              </TabsTrigger>
              <TabsTrigger value="json" className="text-xs h-6 gap-1.5" data-testid="tab-json">
                <FileJson className="w-3 h-3" />
                JSON
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Generate button or template */}
          {!template && !loading && (
            <div className="flex flex-col items-center py-6 gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Terminal className="w-6 h-6 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground text-center max-w-xs">
                AI will analyze your architecture and generate a production-ready
                CloudFormation template in {format.toUpperCase()} format.
              </p>
              <Button
                onClick={handleGenerate}
                className="text-xs"
                data-testid="btn-generate-template"
              >
                Generate Template
              </Button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">
                Generating CloudFormation template...
              </p>
              <p className="text-[10px] text-muted-foreground">
                This may take 15-30 seconds for complex architectures.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          {template && (
            <div className="relative">
              <div className="absolute top-2 right-2 flex gap-1.5 z-10">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopy}
                  className="h-7 text-[10px]"
                  data-testid="btn-copy-template"
                >
                  {copied ? (
                    <Check className="w-3 h-3 mr-1" />
                  ) : (
                    <Copy className="w-3 h-3 mr-1" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownload}
                  className="h-7 text-[10px]"
                  data-testid="btn-download-template"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download .{format}
                </Button>
              </div>
              <pre className="text-[11px] bg-muted p-4 pt-10 rounded-md overflow-auto font-mono leading-relaxed max-h-[40vh]">
                {template}
              </pre>
            </div>
          )}
        </div>

        <DialogFooter className="px-5 py-3 border-t border-border bg-muted/30">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
            data-testid="btn-close-export"
          >
            Close
          </Button>
          {template && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTemplate(null);
                setFormat(format === "yaml" ? "json" : "yaml");
              }}
              className="text-xs"
              data-testid="btn-regenerate"
            >
              Generate in {format === "yaml" ? "JSON" : "YAML"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
