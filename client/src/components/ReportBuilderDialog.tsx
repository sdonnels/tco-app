import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { FileText, Loader2 } from "lucide-react";
import type { ReportConfig } from "../lib/report-data";

type SectionDef = {
  key: keyof ReportConfig["sections"];
  label: string;
  description: string;
};

const SECTION_DEFS: SectionDef[] = [
  { key: "executiveSummary", label: "Executive Summary", description: "Auto-generated narrative overview" },
  { key: "environmentOverview", label: "Environment Overview", description: "User counts, endpoint mix, device breakdown" },
  { key: "vendorLandscape", label: "EUC Vendor Landscape", description: "All vendors across 7 pillars in a structured table" },
  { key: "costBreakdown", label: "Cost Breakdown", description: "Category totals with annotated charts" },
  { key: "costWaterfall", label: "Cost Waterfall", description: "Visual build-up from $0 to total TCO" },
  { key: "perUserEconomics", label: "Per-User Economics", description: "Cost per user, per endpoint, monthly equivalents" },
  { key: "vdiAnalysis", label: "VDI Analysis", description: "VDI user premium, stacked comparison chart" },
  { key: "threeYearProjection", label: "3-Year Projection", description: "\"If nothing changes\" cost trajectory" },
  { key: "dataConfidence", label: "Data Confidence", description: "% from real inputs vs. assumptions, pillar heatmap" },
  { key: "scoringRiskFlags", label: "Scoring & Risk Flags", description: "Critical Risk, Aging, Legacy badges by sub-pillar" },
  { key: "keyFindings", label: "Key Findings", description: "Auto-generated algorithmic insights" },
  { key: "observations", label: "Observations", description: "Consultant-entered qualitative notes" },
  { key: "recommendedNextSteps", label: "Recommended Next Steps", description: "Conditional recommendations based on assessment results" },
  { key: "methodologyAppendix", label: "Methodology & Appendix", description: "How every number was calculated, with source links" },
  { key: "glossary", label: "Glossary", description: "EUC terminology explained for non-technical readers" },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultClientName: string;
  defaultEngineer: string;
  hasClientLogo: boolean;
  onGenerate: (config: ReportConfig) => Promise<void>;
};

export function ReportBuilderDialog({ open, onOpenChange, defaultClientName, defaultEngineer, hasClientLogo, onGenerate }: Props) {
  const [clientName, setClientName] = useState(defaultClientName);
  const [reportTitle, setReportTitle] = useState("EUC Total Cost of Ownership — Baseline Assessment");
  const [reportDate, setReportDate] = useState(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }));
  const [preparedBy, setPreparedBy] = useState(defaultEngineer);
  const [includeLogo, setIncludeLogo] = useState(hasClientLogo);
  const [outputFormat, setOutputFormat] = useState<"pdf" | "excel" | "both">("pdf");
  const [generating, setGenerating] = useState(false);

  const [sections, setSections] = useState<ReportConfig["sections"]>({
    executiveSummary: true,
    environmentOverview: true,
    vendorLandscape: true,
    costBreakdown: true,
    costWaterfall: true,
    perUserEconomics: true,
    vdiAnalysis: true,
    threeYearProjection: true,
    dataConfidence: true,
    scoringRiskFlags: true,
    keyFindings: true,
    observations: true,
    recommendedNextSteps: true,
    methodologyAppendix: true,
    glossary: true,
  });

  const toggleSection = (key: keyof ReportConfig["sections"]) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecked = Object.values(sections).every(Boolean);
  const toggleAll = () => {
    const newVal = !allChecked;
    const updated = {} as ReportConfig["sections"];
    for (const k of Object.keys(sections) as (keyof ReportConfig["sections"])[]) {
      updated[k] = newVal;
    }
    setSections(updated);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await onGenerate({
        clientName: clientName || defaultClientName,
        reportTitle,
        reportDate,
        preparedBy: preparedBy || defaultEngineer,
        includeClientLogo: includeLogo && hasClientLogo,
        outputFormat,
        sections,
      });
      onOpenChange(false);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-report-builder">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Generate Client Report
          </DialogTitle>
          <DialogDescription>
            Configure the report sections and settings, then generate a polished client deliverable.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Report Settings</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="rpt-client" className="text-xs">Client Name</Label>
                <Input id="rpt-client" value={clientName} onChange={e => setClientName(e.target.value)} data-testid="input-report-client" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rpt-date" className="text-xs">Report Date</Label>
                <Input id="rpt-date" value={reportDate} onChange={e => setReportDate(e.target.value)} data-testid="input-report-date" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="rpt-title" className="text-xs">Report Title</Label>
                <Input id="rpt-title" value={reportTitle} onChange={e => setReportTitle(e.target.value)} data-testid="input-report-title" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rpt-author" className="text-xs">Prepared By</Label>
                <Input id="rpt-author" value={preparedBy} onChange={e => setPreparedBy(e.target.value)} data-testid="input-report-author" />
              </div>
              <div className="flex items-center gap-3 pt-5">
                <Switch
                  checked={includeLogo && hasClientLogo}
                  onCheckedChange={setIncludeLogo}
                  disabled={!hasClientLogo}
                  data-testid="toggle-report-logo"
                />
                <Label className="text-xs">Include Client Logo{!hasClientLogo ? " (no logo uploaded)" : ""}</Label>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Report Sections</h4>
              <Button variant="ghost" size="sm" onClick={toggleAll} className="text-xs h-7" data-testid="button-toggle-all-sections">
                {allChecked ? "Uncheck All" : "Check All"}
              </Button>
            </div>
            <div className="grid gap-2">
              {SECTION_DEFS.map(s => (
                <label
                  key={s.key}
                  className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/40 transition-colors"
                  data-testid={`section-toggle-${s.key}`}
                >
                  <Checkbox
                    checked={sections[s.key]}
                    onCheckedChange={() => toggleSection(s.key)}
                    className="mt-0.5"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium leading-tight">{s.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Output Format</h4>
            <RadioGroup value={outputFormat} onValueChange={v => setOutputFormat(v as "pdf" | "excel" | "both")} className="flex gap-6">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="pdf" id="fmt-pdf" data-testid="radio-format-pdf" />
                <Label htmlFor="fmt-pdf" className="text-sm cursor-pointer">PDF</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="excel" id="fmt-excel" data-testid="radio-format-excel" />
                <Label htmlFor="fmt-excel" className="text-sm cursor-pointer">Excel</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="both" id="fmt-both" data-testid="radio-format-both" />
                <Label htmlFor="fmt-both" className="text-sm cursor-pointer">Both</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-report-cancel">Cancel</Button>
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="gap-2 bg-[#1e3a5f] hover:bg-[#162d4a] text-white"
            data-testid="button-generate-report"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            {generating ? "Generating..." : "Generate Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
