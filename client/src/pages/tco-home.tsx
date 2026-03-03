import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileUp,
  Lock,
  Shield,
  Sparkles,
  Zap,
  Trash2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { DraftMeta } from "@/lib/drafts";
import {
  exportIntakeForm,
  parseIntakeFile,
  type IntakeSections,
  type ImportResult,
} from "@/lib/intake-excel";

interface TcoHomeProps {
  onStartBaseline: () => void;
  onStartTour?: () => void;
  drafts: DraftMeta[];
  onResumeDraft: (id: string) => void;
  onDeleteDraft: (id: string) => void;
  onImportIntake?: (result: ImportResult) => void;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

export default function TcoHome({
  onStartBaseline,
  onStartTour,
  drafts,
  onResumeDraft,
  onDeleteDraft,
  onImportIntake,
}: TcoHomeProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const [exportClientName, setExportClientName] = useState("");
  const [exportProjectName, setExportProjectName] = useState("");
  const [exportSections, setExportSections] = useState<IntakeSections>({
    environmentFacts: true,
    eucPillars: true,
    platformCostOverrides: true,
    managedServices: true,
  });

  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = useCallback(() => {
    if (!exportClientName.trim()) return;
    exportIntakeForm(exportClientName.trim(), exportProjectName.trim(), exportSections);
    setExportOpen(false);
    setExportClientName("");
    setExportProjectName("");
  }, [exportClientName, exportProjectName, exportSections]);

  const toggleSection = (key: keyof IntakeSections) => {
    setExportSections((s) => ({ ...s, [key]: !s[key] }));
  };

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";

      if (!file.name.endsWith(".xlsx")) {
        setImportError("Please upload an Excel file (.xlsx).");
        return;
      }

      try {
        const buf = await file.arrayBuffer();
        const result = parseIntakeFile(buf);
        setImportResult(result);
        setImportOpen(true);
        setImportError(null);
      } catch {
        setImportError(
          "This file doesn't match the expected intake form template. Please ensure you're uploading a completed TCO Intake Form.",
        );
      }
    },
    [],
  );

  const handleCreateDraft = useCallback(() => {
    if (!importResult) return;
    onImportIntake?.(importResult);
    setImportOpen(false);
    setImportResult(null);
  }, [importResult, onImportIntake]);

  return (
    <div className="grid gap-6" data-testid="home-root">
      <div className="grid gap-6 lg:grid-cols-2" data-testid="home-assessment-options">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
        >
          <Card className="glass hairline relative overflow-hidden rounded-3xl p-6">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-primary/5 blur-2xl" />
            
            <div className="relative">
              <div className="flex items-center justify-between">
                <Badge
                  variant="default"
                  className="rounded-full"
                  data-testid="badge-baseline-free"
                >
                  Free Assessment
                </Badge>
                <Zap className="h-5 w-5 text-primary" />
              </div>

              <h2
                className="mt-4 font-serif text-2xl tracking-tight"
                data-testid="text-baseline-title"
              >
                Baseline TCO Assessment
              </h2>
              <p
                className="mt-2 text-sm leading-relaxed text-muted-foreground"
                data-testid="text-baseline-desc"
              >
                A rapid, vendor-neutral current-state baseline. Define what your
                environment costs today with transparent inputs, explicit assumptions, and
                defensible math.
              </p>

              <div className="mt-5 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>10–15 minute assessment</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>No data gathering required</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Instant baseline artifact export</span>
                </div>
              </div>

              <Separator className="my-5" />

              <div className="space-y-3">
                <div className="text-xs font-medium tracking-wide text-muted-foreground">
                  Guardrails
                </div>
                <div className="grid gap-2">
                  <div className="flex items-start gap-2 text-sm">
                    <Shield className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Baseline only — no ROI or future-state modeling
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Lock className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      All math traceable, assumptions explicit
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <ClipboardCheck className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Mirror reality, don't prescribe solutions
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <Button
                  onClick={onStartBaseline}
                  className="w-full gap-2"
                  size="lg"
                  data-testid="button-start-baseline"
                >
                  Start Baseline Assessment
                  <ArrowRight className="h-4 w-4" />
                </Button>
                {onStartTour && (
                  <Button
                    variant="outline"
                    onClick={onStartTour}
                    className="w-full gap-2"
                    size="sm"
                    data-testid="button-take-tour"
                  >
                    Take a Quick Tour
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.2, ease: "easeOut" }}
        >
          <Card className="glass hairline relative overflow-hidden rounded-3xl border-accent/30 p-6">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-accent/5 blur-2xl" />
            
            <div className="relative">
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className="rounded-full border-accent/50 text-accent"
                  data-testid="badge-pro"
                >
                  Pro Assessment
                </Badge>
                <Sparkles className="h-5 w-5 text-accent" />
              </div>

              <h2
                className="mt-4 font-serif text-2xl tracking-tight"
                data-testid="text-pro-title"
              >
                Pro TCO Assessment
              </h2>
              <p
                className="mt-2 text-sm leading-relaxed text-muted-foreground"
                data-testid="text-pro-desc"
              >
                A comprehensive 30–60 day data-gathering engagement using Liquidware
                Stratosphere. Goes beyond baseline to identify optimization opportunities
                and waste reduction.
              </p>

              <div className="mt-5 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  <span>Agent-based data collection</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  <span>Detailed usage & performance metrics</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  <span>Optimization & waste analysis</span>
                </div>
              </div>

              <Separator className="my-5" />

              <div className="space-y-3">
                <div className="text-xs font-medium tracking-wide text-muted-foreground">
                  Mandate
                </div>
                <div className="grid gap-2">
                  <div className="flex items-start gap-2 text-sm">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      "How might we optimize or reduce spend/waste?"
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Built on actual usage data, not assumptions
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <ClipboardCheck className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Includes future-state modeling
                    </span>
                  </div>
                </div>
              </div>

              <Button
                disabled
                variant="outline"
                className="mt-6 w-full gap-2"
                size="lg"
                data-testid="button-start-pro"
              >
                Coming Soon
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" }}
      >
        <Card className="glass hairline rounded-2xl p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground mr-auto">
              Customer Intake
            </span>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 h-8 text-xs"
              onClick={() => setExportOpen(true)}
              data-testid="button-export-intake"
            >
              <Download className="h-3.5 w-3.5" />
              Export Intake Form
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 h-8 text-xs"
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-import-intake"
            >
              <FileUp className="h-3.5 w-3.5" />
              Import Intake Responses
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleFileSelect}
              data-testid="input-import-file"
            />
          </div>
          {importError && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {importError}
              <button
                className="ml-auto text-xs underline"
                onClick={() => setImportError(null)}
              >
                Dismiss
              </button>
            </div>
          )}
        </Card>
      </motion.div>

      {drafts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
          data-testid="recent-activity-section"
        >
          <h2 className="mb-3 text-lg font-semibold tracking-tight" data-testid="text-recent-activity-title">
            Recent Activity
          </h2>
          <div className="rounded-2xl border bg-card/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-recent-activity">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Client / Project
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Pack
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Last Modified
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {drafts.map((draft) => (
                    <tr
                      key={draft.id}
                      className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                      data-testid={`draft-row-${draft.id}`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium" data-testid={`draft-client-${draft.id}`}>
                          {draft.clientName || "Untitled"}
                        </div>
                        {draft.projectName && (
                          <div className="text-xs text-muted-foreground" data-testid={`draft-project-${draft.id}`}>
                            {draft.projectName}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {draft.pack}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(draft.lastModified)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                            draft.status === "intake received"
                              ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                              : "text-muted-foreground"
                          }`}
                          data-testid={`draft-status-${draft.id}`}
                        >
                          {draft.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-3"
                            onClick={() => onResumeDraft(draft.id)}
                            data-testid={`button-resume-${draft.id}`}
                          >
                            Resume
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => onDeleteDraft(draft.id)}
                            data-testid={`button-delete-draft-${draft.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-export-intake">
          <DialogHeader>
            <DialogTitle>Export Intake Form</DialogTitle>
            <DialogDescription>
              Generate a structured Excel workbook to send to the customer for pre-meeting data collection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="intake-client">Client Name *</Label>
              <Input
                id="intake-client"
                placeholder="e.g., Globex Corp"
                value={exportClientName}
                onChange={(e) => setExportClientName(e.target.value)}
                data-testid="input-export-client"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="intake-project">Project Name (optional)</Label>
              <Input
                id="intake-project"
                placeholder="e.g., Q1 2026 Assessment"
                value={exportProjectName}
                onChange={(e) => setExportProjectName(e.target.value)}
                data-testid="input-export-project"
              />
            </div>
            <div className="space-y-2">
              <Label>Sections to include</Label>
              <div className="rounded-lg border p-3 space-y-2">
                {([
                  { key: "environmentFacts" as const, label: "Environment Facts" },
                  { key: "platformCostOverrides" as const, label: "Platform Cost Overrides" },
                  { key: "eucPillars" as const, label: "EUC Pillars" },
                  { key: "managedServices" as const, label: "Managed Services" },
                ] as const).map((s) => (
                  <label key={s.key} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={exportSections[s.key]}
                      onChange={() => toggleSection(s.key)}
                      className="h-4 w-4 rounded accent-primary"
                      data-testid={`checkbox-section-${s.key}`}
                    />
                    {s.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)} data-testid="button-export-cancel">
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={!exportClientName.trim()}
              className="gap-2"
              data-testid="button-export-confirm"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Download .xlsx
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto" data-testid="dialog-import-review">
          <DialogHeader>
            <DialogTitle>Import Review</DialogTitle>
            <DialogDescription>
              Review the imported data before creating a draft assessment.
            </DialogDescription>
          </DialogHeader>

          {importResult && (
            <div className="space-y-4 py-2">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Client</div>
                  <div className="text-sm font-medium">{importResult.clientName || "—"}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Project</div>
                  <div className="text-sm font-medium">{importResult.projectName || "—"}</div>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <Check className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="text-lg font-semibold">{importResult.mapped.length}</div>
                    <div className="text-[11px] text-muted-foreground">Mapped fields</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                  <div>
                    <div className="text-lg font-semibold">{importResult.blankCount}</div>
                    <div className="text-[11px] text-muted-foreground">Blank (skipped)</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <div>
                    <div className="text-lg font-semibold">{importResult.errors.length}</div>
                    <div className="text-[11px] text-muted-foreground">Errors</div>
                  </div>
                </div>
              </div>

              {importResult.mapped.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Mapped Fields
                  </div>
                  <div className="rounded-lg border divide-y max-h-48 overflow-y-auto">
                    {importResult.mapped.map((m, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-1.5 text-xs">
                        <Check className="h-3 w-3 text-green-500 shrink-0" />
                        <span className="font-medium truncate">{m.field}</span>
                        <span className="text-muted-foreground ml-auto truncate max-w-[120px]">
                          {String(m.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {importResult.errors.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-destructive mb-2">
                    Errors
                  </div>
                  <div className="rounded-lg border border-destructive/30 divide-y max-h-32 overflow-y-auto">
                    {importResult.errors.map((e, i) => (
                      <div key={i} className="flex items-start gap-2 px-3 py-1.5 text-xs">
                        <AlertTriangle className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium">{e.field}:</span>{" "}
                          <span className="text-muted-foreground">"{e.value}"</span>
                          {e.errorMsg && (
                            <span className="text-destructive ml-1">— {e.errorMsg}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)} data-testid="button-import-cancel">
              Cancel
            </Button>
            <Button
              onClick={handleCreateDraft}
              className="gap-2"
              disabled={!importResult || (!importResult.clientName && importResult.mapped.length === 0)}
              data-testid="button-import-create-draft"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Create Draft Assessment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
