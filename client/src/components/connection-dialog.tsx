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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  Info,
  AlertCircle,
  Loader2,
  ArrowRight,
  Shield,
  Zap,
} from "lucide-react";
import { getServiceIconUrl, type AwsService } from "@/data/aws-services";
import { apiRequest } from "@/lib/queryClient";
import { ConnectionQuestionField, type ConnectionQuestion } from "@/components/connection-question";

interface ConnectionNote {
  severity: "info" | "warning" | "critical";
  text: string;
}

interface ConnectionPromptData {
  questions: ConnectionQuestion[];
  notes: ConnectionNote[];
  iamPolicy?: string;
  cloudformationHint?: string;
  sources?: string[];
}

interface ConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: AwsService | null;
  target: AwsService | null;
  onConfirm: (config: Record<string, unknown>) => void;
  onCancel: () => void;
}

const severityIcon = {
  info: <Info className="w-3.5 h-3.5 text-blue-500" />,
  warning: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />,
  critical: <AlertCircle className="w-3.5 h-3.5 text-red-500" />,
};

const severityBg = {
  info: "bg-blue-500/10 border-blue-500/20",
  warning: "bg-amber-500/10 border-amber-500/20",
  critical: "bg-red-500/10 border-red-500/20",
};

export function ConnectionDialog({
  open,
  onOpenChange,
  source,
  target,
  onConfirm,
  onCancel,
}: ConnectionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [promptData, setPromptData] = useState<ConnectionPromptData | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && source && target) {
      setLoading(true);
      setError(null);
      setPromptData(null);
      setAnswers({});

      apiRequest("POST", "/api/connection-prompts", {
        sourceService: source.name,
        targetService: target.name,
        sourceCategory: source.category,
        targetCategory: target.category,
        sourceCfnType: source.cfnType,
        targetCfnType: target.cfnType,
      })
        .then((res) => res.json())
        .then((data: ConnectionPromptData) => {
          setPromptData(data);
          const defaults: Record<string, unknown> = {};
          data.questions?.forEach((q) => {
            if (q.default !== undefined) defaults[q.id] = q.default;
          });
          setAnswers(defaults);
        })
        .catch(() => {
          setError("Failed to generate configuration prompts. You can still connect these services.");
          setPromptData({
            questions: [],
            notes: [{ severity: "info", text: "AI-generated prompts unavailable. Configure manually after connecting." }],
          });
        })
        .finally(() => setLoading(false));
    }
  }, [open, source, target]);

  const handleAnswerChange = useCallback((id: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }, []);

  if (!source || !target) return null;

  const handleConfirm = () => {
    onConfirm({
      ...answers,
      _source: source.id,
      _target: target.id,
      _iamPolicy: promptData?.iamPolicy,
      _cloudformationHint: promptData?.cloudformationHint,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Configure Connection
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium" style={{ backgroundColor: `${source.color}15`, color: source.color }}>
                <img src={getServiceIconUrl(source.iconSlug)} alt="" className="w-4 h-4" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                {source.shortName}
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium" style={{ backgroundColor: `${target.color}15`, color: target.color }}>
                <img src={getServiceIconUrl(target.iconSlug)} alt="" className="w-4 h-4" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                {target.shortName}
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh]">
          <div className="px-5 py-4 space-y-4">
            {loading && (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Analyzing connection requirements...</p>
              </div>
            )}

            {error && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3">
                <p className="text-xs text-amber-600 dark:text-amber-400">{error}</p>
              </div>
            )}

            {promptData?.notes && promptData.notes.length > 0 && (
              <div className="space-y-2">
                {promptData.notes.map((note, i) => (
                  <div key={i} className={`flex gap-2 p-3 rounded-md border ${severityBg[note.severity]}`}>
                    <div className="flex-shrink-0 mt-0.5">{severityIcon[note.severity]}</div>
                    <p className="text-xs leading-relaxed">{note.text}</p>
                  </div>
                ))}
              </div>
            )}

            {promptData?.questions && promptData.questions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  <h3 className="text-xs font-semibold text-foreground">Configuration</h3>
                </div>
                {promptData.questions.map((q) => (
                  <ConnectionQuestionField key={q.id} question={q} value={answers[q.id]} onChange={handleAnswerChange} />
                ))}
              </div>
            )}

            {promptData?.iamPolicy && promptData.iamPolicy !== "{}" && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-amber-500" />
                  <h3 className="text-xs font-semibold text-foreground">Required IAM Policy</h3>
                </div>
                <pre className="text-[10px] bg-muted p-3 rounded-md overflow-x-auto font-mono leading-relaxed max-h-32 overflow-y-auto">
                  {typeof promptData.iamPolicy === "string" ? promptData.iamPolicy : JSON.stringify(promptData.iamPolicy, null, 2)}
                </pre>
              </div>
            )}

            {promptData?.sources && promptData.sources.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-emerald-500" />
                  <h3 className="text-xs font-semibold text-foreground">Grounded in AWS Documentation</h3>
                </div>
                <div className="space-y-1">
                  {promptData.sources.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block text-[10px] text-blue-500 hover:text-blue-400 hover:underline truncate" title={url}>
                      {url.replace("https://docs.aws.amazon.com/", "📄 ")}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="px-5 py-3 border-t border-border bg-muted/30">
          <Button variant="outline" size="sm" onClick={onCancel} className="text-xs" data-testid="btn-cancel-connection">Cancel</Button>
          <Button size="sm" onClick={handleConfirm} disabled={loading} className="text-xs" data-testid="btn-confirm-connection">
            {loading ? (<><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Analyzing...</>) : "Connect Services"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
