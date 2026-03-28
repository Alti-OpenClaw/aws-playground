import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ConnectionQuestion {
  id: string;
  question: string;
  type: "select" | "multiselect" | "text" | "boolean";
  options?: string[];
  default?: string;
  explanation?: string;
}

interface ConnectionQuestionFieldProps {
  question: ConnectionQuestion;
  value: unknown;
  onChange: (id: string, value: unknown) => void;
}

export const ConnectionQuestionField = memo(function ConnectionQuestionField({
  question: q,
  value,
  onChange,
}: ConnectionQuestionFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{q.question}</Label>
      {q.explanation && (
        <p className="text-[10px] text-muted-foreground">{q.explanation}</p>
      )}

      {q.type === "text" && (
        <Input
          value={(value as string) || ""}
          onChange={(e) => onChange(q.id, e.target.value)}
          placeholder={q.default || "Enter value..."}
          className="h-8 text-xs"
          data-testid={`input-${q.id}`}
        />
      )}

      {q.type === "select" && q.options && (
        <Select
          value={(value as string) || q.default || ""}
          onValueChange={(val) => onChange(q.id, val)}
        >
          <SelectTrigger className="h-8 text-xs" data-testid={`select-${q.id}`}>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {q.options.map((opt) => (
              <SelectItem key={opt} value={opt} className="text-xs">
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {q.type === "boolean" && (
        <div className="flex items-center gap-2">
          <Switch
            checked={value === true || value === "true"}
            onCheckedChange={(checked) => onChange(q.id, checked)}
            data-testid={`switch-${q.id}`}
          />
          <span className="text-xs text-muted-foreground">
            {value ? "Enabled" : "Disabled"}
          </span>
        </div>
      )}

      {q.type === "multiselect" && q.options && (
        <div className="flex flex-wrap gap-1.5">
          {q.options.map((opt) => {
            const current = (value as string[]) || [];
            const selected = current.includes(opt);
            return (
              <Badge
                key={opt}
                variant={selected ? "default" : "outline"}
                className="cursor-pointer text-[10px] h-6"
                onClick={() => {
                  const next = selected
                    ? current.filter((v) => v !== opt)
                    : [...current, opt];
                  onChange(q.id, next);
                }}
                data-testid={`option-${q.id}-${opt}`}
              >
                {opt}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
});

export type { ConnectionQuestion };
