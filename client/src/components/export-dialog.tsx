import { useState, useMemo } from "react";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Download,
  Copy,
  Check,
  Loader2,
  FileJson,
  FileCode,
  Terminal,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  Rocket,
} from "lucide-react";
import type { Node, Edge } from "@xyflow/react";
import type { AwsNodeData } from "@/components/aws-node";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ValidationError {
  rule: string;
  message: string;
  location: string;
  level: "error" | "warning" | "informational";
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodes: Node[];
  edges: Edge[];
  connectionConfigs: Record<string, Record<string, unknown>>;
  architectureName?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    || "my-stack";
}

export function ExportDialog({
  open,
  onOpenChange,
  nodes,
  edges,
  connectionConfigs,
  architectureName,
}: ExportDialogProps) {
  const [format, setFormat] = useState<"json" | "yaml">("yaml");
  const [template, setTemplate] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deployCopied, setDeployCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationOpen, setValidationOpen] = useState(false);
  const { toast } = useToast();

  const stackName = slugify(architectureName || "aws-architecture");
  const filename = `${stackName}.${format}`;

  const deployCommand = `aws cloudformation deploy \\
  --template-file ${filename} \\
  --stack-name ${stackName} \\
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \\
  --region us-east-1`;

  const errorCount = useMemo(
    () => validation?.errors.filter((e) => e.level === "error").length ?? 0,
    [validation]
  );
  const warningCount = useMemo(
    () => validation?.errors.filter((e) => e.level === "warning").length ?? 0,
    [validation]
  );
  const infoCount = useMemo(
    () => validation?.errors.filter((e) => e.level === "informational").length ?? 0,
    [validation]
  );

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setTemplate(null);
    setValidation(null);

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
      if (data.validation) {
        setValidation(data.validation);
        // Auto-expand if there are errors
        if (data.validation.errors?.length > 0) {
          setValidationOpen(true);
        }
      }
    } catch {
      setError("Failed to generate template. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (template) {
      navigator.clipboard.writeText(template);
      setCopied(true);
      toast({ title: "Copied!", description: "Template copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyDeploy = () => {
    navigator.clipboard.writeText(deployCommand);
    setDeployCopied(true);
    toast({ title: "Copied!", description: "Deploy command copied to clipboard." });
    setTimeout(() => setDeployCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!template) return;
    const mime = format === "yaml" ? "text/yaml" : "application/json";
    const blob = new Blob([template], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const templateWithLineNumbers = useMemo(() => {
    if (!template) return null;
    return template.split("\n");
  }, [template]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
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

        <div className="px-5 py-4 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
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
            <>
              {/* Validation Status */}
              {validation && (
                <Collapsible open={validationOpen} onOpenChange={setValidationOpen}>
                  <CollapsibleTrigger asChild>
                    <button
                      className="w-full flex items-center justify-between p-3 rounded-md border text-left hover:bg-muted/50 transition-colors"
                      style={{
                        borderColor: validation.valid
                          ? "hsl(var(--primary) / 0.3)"
                          : errorCount > 0
                          ? "hsl(var(--destructive) / 0.3)"
                          : "hsl(45 93% 47% / 0.3)",
                      }}
                      data-testid="validation-toggle"
                    >
                      <div className="flex items-center gap-2">
                        {validation.valid ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : errorCount > 0 ? (
                          <XCircle className="w-4 h-4 text-destructive" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        )}
                        <span className="text-xs font-medium">
                          {validation.valid
                            ? "Template is valid"
                            : `${errorCount} error${errorCount !== 1 ? "s" : ""}${warningCount > 0 ? `, ${warningCount} warning${warningCount !== 1 ? "s" : ""}` : ""}`}
                        </span>
                        {infoCount > 0 && (
                          <Badge variant="secondary" className="text-[9px]">
                            {infoCount} info
                          </Badge>
                        )}
                      </div>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${
                          validationOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {validation.errors.length > 0 && (
                      <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
                        {validation.errors.map((err, i) => (
                          <div
                            key={`${err.rule}-${i}`}
                            className={`flex items-start gap-2 p-2 rounded text-[11px] ${
                              err.level === "error"
                                ? "bg-destructive/10 text-destructive"
                                : err.level === "warning"
                                ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                                : "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                            }`}
                          >
                            {err.level === "error" ? (
                              <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            ) : err.level === "warning" ? (
                              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            ) : (
                              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <span className="font-mono font-medium">[{err.rule}]</span>{" "}
                              <span>{err.message}</span>
                              {err.location && err.location !== "template" && (
                                <span className="block text-[10px] opacity-70 mt-0.5 font-mono">
                                  at {err.location}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {validation.errors.length === 0 && (
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        No issues found. Template passes cfn-lint validation.
                      </p>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleDownload}
                  className="text-xs gap-1.5"
                  data-testid="btn-download-template"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download {filename}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="text-xs gap-1.5"
                  data-testid="btn-copy-template"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? "Copied!" : "Copy to Clipboard"}
                </Button>
              </div>

              {/* Template with Line Numbers */}
              <div className="relative rounded-md border bg-muted overflow-hidden">
                <div className="overflow-auto max-h-[35vh]">
                  <table className="w-full border-collapse">
                    <tbody>
                      {templateWithLineNumbers?.map((line, i) => (
                        <tr key={i} className="hover:bg-muted-foreground/5">
                          <td className="text-right pr-3 pl-3 py-0 text-[10px] text-muted-foreground select-none font-mono border-r border-border/50 sticky left-0 bg-muted w-[1%] whitespace-nowrap">
                            {i + 1}
                          </td>
                          <td className="pl-3 pr-4 py-0 text-[11px] font-mono whitespace-pre leading-relaxed">
                            {line || " "}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* How to Deploy */}
              <div className="border rounded-md p-4 space-y-3 bg-muted/30">
                <div className="flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-primary" />
                  <h4 className="text-xs font-semibold">How to Deploy</h4>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Download the template, then run the following command in your terminal:
                </p>
                <div className="relative">
                  <pre className="text-[11px] bg-background p-3 rounded-md border font-mono leading-relaxed overflow-x-auto">
                    {deployCommand}
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyDeploy}
                    className="absolute top-1.5 right-1.5 h-7 text-[10px] gap-1"
                    data-testid="btn-copy-deploy"
                  >
                    {deployCopied ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    {deployCopied ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Requires the{" "}
                  <a
                    href="https://aws.amazon.com/cli/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    AWS CLI
                  </a>{" "}
                  configured with appropriate credentials.
                </p>
              </div>
            </>
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
                setValidation(null);
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
