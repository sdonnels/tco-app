import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  BookMarked,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Copy,
  Download,
  ExternalLink,
  FileDown,
  FileText,
  FileUp,
  HelpCircle,
  ImagePlus,
  Info,
  Link2,
  Mail,
  Plus,
  Printer,
  Settings,
  Shield,
  Sparkles,
  Table,
  Trash2,
  Upload,
  Wrench,
  X,
  XCircle,
  RotateCcw,
  FileSpreadsheet,
  Check,
  AlertTriangle,
  Sun,
  Moon,
  Bug,
} from "lucide-react";
import JSZip from "jszip";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { getDraftIndex, createDraft, saveDraftData, loadDraftData, deleteDraft, migrateLegacyDraft, updateDraftStatus, type DraftMeta } from "@/lib/drafts";
import {
  exportIntakeForm,
  parseIntakeImport,
  type ImportResult,
} from "@/lib/intake-excel";
import TcoHome from "@/pages/tco-home";
import AuditTracePage from "@/components/AuditTracePage";
import { OnboardingTour, useTourState, type TourStep } from "@/components/OnboardingTour";
import { useToast } from "@/hooks/use-toast";
import xentegraLogoWhite from "@/assets/xentegra-white.webp";
import xentegraLogoBlack from "@/assets/xentegra-black.webp";
import {
  EndpointMixChart,
  VdiComparisonChart,
  CostSourceChart,
  WhereMoneyGoesChart,
  ChartCard,
} from "@/components/TcoCharts";
import { HexagridSection, type HexagridEntry } from "@/components/HexagridSection";
import documentationMd from "@/../../docs/TCO_BASELINE_TOOL_DOCUMENTATION.md?raw";
import faqMd from "@/../../docs/TCO_BASELINE_FAQ.md?raw";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type YesNo = "yes" | "no" | "unknown";

type Inputs = {
  project: {
    clientName?: string;
    assessmentDate?: string;
    customerChampion?: string;
    engineerName?: string;
  };
  environment: {
    userCount?: number;
    laptopCount?: number;
    desktopCount?: number;
    thinClientCount?: number;
  };
  categoryRollups: {
    endUserDevicesAnnual?: number;
    supportOpsAnnual?: number;
    licensingAnnual?: number;
    mgmtSecurityAnnual?: number;
    vdiDaasAnnual?: number;
    overheadAnnual?: number;
  };
  vdiUserCounts: {
    daas?: number;
    vdi?: number;
  };
  vdiDaas: {
    vdiPresent: YesNo;
    vdiPctOfUsers?: number;
    citrixPresent: YesNo;
    citrixSpend?: number;
    avdPresent: YesNo;
    avdSpend?: number;
    w365Present: YesNo;
    w365Spend?: number;
    horizonPresent: YesNo;
    horizonSpend?: number;
    parallelsPresent: YesNo;
    parallelsSpend?: number;
    customPlatforms: { id: string; name: string; spend?: number }[];
  };
  toolPresence: {
    intunePresent: YesNo;
    intuneSpend?: number;
    sccmPresent: YesNo;
    sccmSpend?: number;
    workspaceOnePresent: YesNo;
    workspaceOneSpend?: number;
    jamfPresent: YesNo;
    jamfSpend?: number;
    controlUpPresent: YesNo;
    controlUpSpend?: number;
    nerdioPresent: YesNo;
    nerdioSpend?: number;
    customTools: { id: string; name: string; spend?: number }[];
  };
  managedServices: {
    totalAnnualSpend?: number;
    outsourcedEndpointMgmt: boolean;
    outsourcedSecurity: boolean;
    outsourcedPatching: boolean;
    outsourcedHelpdesk: boolean;
    outsourcedTier2Plus: boolean;
    outsourcedOther: boolean;
    otherDescription?: string;
    mspXentegra: boolean;
    mspOther: boolean;
    mspOtherProviders: string[];
  };
  observations: {
    notes: { observation: string; details: string }[];
  };
  hexagridEntries: HexagridEntry[];
};

type Assumptions = {
  deviceRefreshYears: {
    laptop: number;
    desktop: number;
    thinClient: number;
  };
  deviceUnitCost: {
    laptop: number;
    desktop: number;
    thinClient: number;
  };
  supportOps: {
    avgTicketHandlingHours: number;
    deploymentHoursPerDevice: number;
    blendedLaborRateHourly: number;
    ticketsPerEndpointPerYear: number;
  };
  licensing: {
    avgCostPerUserPerYear: number;
    coveragePct: number;
  };
  mgmtSecurity: {
    costPerEndpointPerYear: number;
  };
  vdi: {
    platformCostPerVdiUserPerYear: number;
  };
  overhead: {
    pctOfTotal: number;
  };
};

type CalcLine = {
  key: string;
  label: string;
  value: number;
  basis: string;
  isAssumed: boolean;
};

function n(v?: number) {
  if (typeof v !== "number") return undefined;
  if (!Number.isFinite(v)) return undefined;
  return v;
}

function nonNeg(v?: number) {
  const nv = n(v);
  if (nv === undefined) return undefined;
  return Math.max(0, nv);
}

function fmtMoney(v: number) {
  return v.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function fmtNumber(v: number) {
  return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function pct(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((numerator / denominator) * 100)));
}

function numberField(
  value: number | undefined,
  onChange: (next: number | undefined) => void,
) {
  return {
    type: "text" as const,
    value: value === undefined ? "" : String(value),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw.trim() === "") {
        onChange(undefined);
        return;
      }
      const next = Number(raw);
      if (!Number.isFinite(next)) return;
      onChange(next);
    },
    inputMode: "numeric" as const,
  };
}

const ASSUMPTION_JUSTIFICATIONS: Record<string, { source: string; rationale: string }> = {
  "deviceRefreshYears.laptop": {
    source: "EUC TCO Analysis, Hardware Section",
    rationale: "Industry standards suggest a 3-4 year refresh cycle where maintenance costs begin to exceed replacement costs. Maintenance costs escalate by 148% by year 5 and can reach 300% by year 7 compared to years 1-2."
  },
  "deviceRefreshYears.desktop": {
    source: "EUC TCO Analysis, Hardware Section",
    rationale: "Business desktops have a standard lifecycle of 4-5 years. A 3-year refresh aligns with optimal TCO before support costs escalate significantly."
  },
  "deviceRefreshYears.thinClient": {
    source: "EUC TCO Analysis, Hardware Section",
    rationale: "Thin clients have longer lifecycles (5+ years) due to simpler architecture and lower failure rates than full PCs."
  },
  "deviceUnitCost.laptop": {
    source: "EUC TCO Analysis, Endpoint Acquisition Table",
    rationale: "Mid-range business laptop costs range $900-$1,700. $1,200 represents a reasonable mid-point for standard knowledge worker provisioning."
  },
  "deviceUnitCost.desktop": {
    source: "EUC TCO Analysis, Endpoint Acquisition Table",
    rationale: "Business desktop costs range $600-$1,800. $1,100 represents mid-tier provisioning suitable for most business users."
  },
  "deviceUnitCost.thinClient": {
    source: "EUC TCO Analysis, Infrastructure Section",
    rationale: "Thin clients cost significantly less than full PCs, typically $400-$800. $600 represents a capable modern thin client."
  },
  "supportOps.ticketsPerEndpointPerYear": {
    source: "EUC TCO Analysis, Labor Section",
    rationale: "Industry benchmark of 2 tickets per endpoint per year based on standard service desk metrics for well-managed environments."
  },
  "supportOps.avgTicketHandlingHours": {
    source: "EUC TCO Analysis, Labor Section",
    rationale: "Average Level 1/2 ticket resolution time of 30 minutes (0.5 hours) based on typical IT service desk benchmarks."
  },
  "supportOps.deploymentHoursPerDevice": {
    source: "EUC TCO Analysis, Labor Section",
    rationale: "Standard device imaging, configuration, and deployment takes 1.5 hours with modern provisioning tools."
  },
  "supportOps.blendedLaborRateHourly": {
    source: "EUC TCO Analysis, True Cost of Support Personnel",
    rationale: "Blended rate of $50/hour accounts for mix of Level 1-3 support staff. Base salaries range $70K-$150K plus 25% payroll burden."
  },
  "licensing.avgCostPerUserPerYear": {
    source: "EUC TCO Analysis, Microsoft 365 Licensing",
    rationale: "M365 E3 at $36/month = $432/year. $400/user/year is conservative baseline for core productivity licensing."
  },
  "licensing.coveragePct": {
    source: "EUC TCO Analysis, Licensing Model",
    rationale: "100% coverage assumes all users require productivity suite licensing as baseline."
  },
  "mgmtSecurity.costPerEndpointPerYear": {
    source: "EUC TCO Analysis, Management Tools Section",
    rationale: "Combined UEM (Intune ~$96/yr) plus security/DEX tools. $200/endpoint covers endpoint management and security baseline."
  },
  "vdi.platformCostPerVdiUserPerYear": {
    source: "EUC TCO Analysis, Virtualization and DaaS",
    rationale: "Citrix DaaS ranges $156-$276/user/year. AVD $120/user/year. $800 accounts for platform licensing plus infrastructure costs."
  },
  "overhead.pctOfTotal": {
    source: "EUC TCO Analysis, Infrastructure Overhead",
    rationale: "7% overhead covers administrative costs, facilities allocation, and indirect IT costs not captured in direct categories."
  }
};

function SectionHeader(props: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  right?: React.ReactNode;
  testId: string;
}) {
  return (
    <div
      className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
      data-testid={props.testId}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl border bg-card shadow-sm">
          {props.icon}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium tracking-wide text-muted-foreground">
              {props.eyebrow}
            </span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
            <span className="text-xs text-muted-foreground">Baseline only</span>
          </div>
          <h2 className="mt-0.5 font-serif text-xl tracking-tight sm:text-2xl">
            {props.title}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {props.description}
          </p>
        </div>
      </div>
      {props.right ? <div className="pt-1">{props.right}</div> : null}
    </div>
  );
}

function MiniKpi(props: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "good" | "warn";
  testId: string;
}) {
  const tone = props.tone ?? "neutral";
  return (
    <div
      className={cn(
        "glass hairline rounded-2xl px-4 py-3",
        tone === "good" && "border-emerald-500/25",
        tone === "warn" && "border-amber-500/25",
      )}
      data-testid={props.testId}
    >
      <div className="text-xs font-medium text-muted-foreground">{props.label}</div>
      <div className="mt-1 text-lg font-semibold tracking-tight">{props.value}</div>
      {props.hint ? (
        <div className="mt-0.5 text-xs text-muted-foreground">{props.hint}</div>
      ) : null}
    </div>
  );
}

function InlineInfo(props: {
  title: string;
  body: string;
  icon?: React.ReactNode;
  testId: string;
}) {
  return (
    <div
      className="rounded-2xl border bg-card/70 px-4 py-3 text-sm shadow-sm"
      data-testid={props.testId}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5 text-muted-foreground">
          {props.icon ?? <Info className="h-4 w-4" />}
        </div>
        <div className="min-w-0">
          <div className="font-medium">{props.title}</div>
          <div className="mt-0.5 text-muted-foreground">{props.body}</div>
        </div>
      </div>
    </div>
  );
}

export default function TcoBaseline() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("tco-dark-mode");
    if (saved !== null) return saved === "true";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [clientLogo, setClientLogo] = useState<string | null>(() => {
    return localStorage.getItem("tco-client-logo");
  });
  const [activeTab, setActiveTab] = useState<
    "home" | "inputs" | "assumptions" | "observations" | "summary" | "readme" | "audit"
  >("home");
  const [debugMode, setDebugMode] = useState(() => {
    return localStorage.getItem("tco-debug-mode") === "true";
  });

  const [currentDraftId, _setCurrentDraftId] = useState<string | null>(() => {
    return sessionStorage.getItem("tco_current_draft_id") ?? null;
  });
  const setCurrentDraftId = useCallback((id: string | null) => {
    _setCurrentDraftId(id);
    if (id) {
      sessionStorage.setItem("tco_current_draft_id", id);
    } else {
      sessionStorage.removeItem("tco_current_draft_id");
    }
  }, []);
  const [drafts, setDrafts] = useState<DraftMeta[]>([]);
  const hydrationDone = useRef(false);

  const [inputs, setInputs] = useState<Inputs>({
    project: {},
    environment: {},
    categoryRollups: {},
    vdiUserCounts: {},
    vdiDaas: {
      vdiPresent: "unknown",
      citrixPresent: "unknown",
      avdPresent: "unknown",
      w365Present: "unknown",
      horizonPresent: "unknown",
      parallelsPresent: "unknown",
      customPlatforms: [],
    },
    toolPresence: {
      intunePresent: "unknown",
      sccmPresent: "unknown",
      workspaceOnePresent: "unknown",
      jamfPresent: "unknown",
      controlUpPresent: "unknown",
      nerdioPresent: "unknown",
      customTools: [],
    },
    managedServices: {
      outsourcedEndpointMgmt: false,
      outsourcedSecurity: false,
      outsourcedPatching: false,
      outsourcedHelpdesk: false,
      outsourcedTier2Plus: false,
      outsourcedOther: false,
      mspXentegra: false,
      mspOther: false,
      mspOtherProviders: [],
    },
    observations: { notes: [] },
    hexagridEntries: [],
  });

  const [assumptions, setAssumptions] = useState<Assumptions>({
    deviceRefreshYears: {
      laptop: 3,
      desktop: 3,
      thinClient: 5,
    },
    deviceUnitCost: {
      laptop: 1200,
      desktop: 1100,
      thinClient: 600,
    },
    supportOps: {
      avgTicketHandlingHours: 0.5,
      deploymentHoursPerDevice: 1.5,
      blendedLaborRateHourly: 50,
      ticketsPerEndpointPerYear: 2,
    },
    licensing: {
      avgCostPerUserPerYear: 400,
      coveragePct: 1.0,
    },
    mgmtSecurity: {
      costPerEndpointPerYear: 200,
    },
    vdi: {
      platformCostPerVdiUserPerYear: 800,
    },
    overhead: {
      pctOfTotal: 0.07,
    },
  });

  const [restartDialogOpen, setRestartDialogOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);
  const [helpIssue, setHelpIssue] = useState("");
  const [helpSent, setHelpSent] = useState(false);

  const [excelExportOpen, setExcelExportOpen] = useState(false);
  const [excelClientName, setExcelClientName] = useState("");
  const [excelProjectName, setExcelProjectName] = useState("");
  const [excelImportResult, setExcelImportResult] = useState<ImportResult | null>(null);
  const [excelImportOpen, setExcelImportOpen] = useState(false);
  const [excelImportError, setExcelImportError] = useState<string | null>(null);
  const excelFileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const [intakeGuidanceOpen, setIntakeGuidanceOpen] = useState(() => {
    return localStorage.getItem("tco-intake-guidance-collapsed") !== "true";
  });
  const [googleFormUrl, setGoogleFormUrl] = useState(() => {
    return localStorage.getItem("tco-google-form-url") ?? "";
  });
  const [googleFormDialogOpen, setGoogleFormDialogOpen] = useState(false);
  const [googleFormSettingsOpen, setGoogleFormSettingsOpen] = useState(false);
  const [googleFormUrlDraft, setGoogleFormUrlDraft] = useState("");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailMethod, setEmailMethod] = useState<"google" | "excel">("google");
  const [emailDueDate, setEmailDueDate] = useState(() => {
    const d = new Date();
    let added = 0;
    while (added < 5) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0 && d.getDay() !== 6) added++;
    }
    return d.toISOString().slice(0, 10);
  });

  const migrateObservationsNotes = (obs: any): Inputs["observations"] => {
    if (!obs) return { notes: [] };
    if (typeof obs.notes === "string") {
      return { notes: obs.notes.trim() ? [{ observation: obs.notes, details: "" }] : [] };
    }
    if (Array.isArray(obs.notes)) return obs as Inputs["observations"];
    return { notes: [] };
  };

  const hydrateFromDraft = useCallback((draftId: string) => {
    const data = loadDraftData(draftId) as { inputs?: Partial<Inputs>; assumptions?: typeof assumptions; activeTab?: string } | null;
    if (data?.inputs) {
      setInputs((prev) => {
        const saved = data.inputs!;
        return {
          ...prev,
          ...saved,
          vdiUserCounts: {
            ...prev.vdiUserCounts,
            ...(saved.vdiUserCounts ?? {}),
          },
          managedServices: {
            ...prev.managedServices,
            ...(saved.managedServices ?? {}),
          },
          categoryRollups: {
            ...prev.categoryRollups,
            ...(saved.categoryRollups ?? {}),
          },
          hexagridEntries: saved.hexagridEntries ?? [],
          observations: migrateObservationsNotes(saved.observations),
        };
      });
    }
    if (data?.assumptions) setAssumptions(data.assumptions);
    return data;
  }, []);

  useEffect(() => {
    const migratedId = migrateLegacyDraft();
    if (migratedId) {
      setCurrentDraftId(migratedId);
      hydrateFromDraft(migratedId);
    } else if (currentDraftId) {
      const idx = getDraftIndex();
      if (idx.some((d) => d.id === currentDraftId)) {
        hydrateFromDraft(currentDraftId);
      } else {
        setCurrentDraftId(null);
      }
    }
    hydrationDone.current = true;
    setDrafts(getDraftIndex());
  }, []);

  useEffect(() => {
    if (!currentDraftId || !hydrationDone.current) return;
    try {
      saveDraftData(
        currentDraftId,
        { inputs, assumptions, activeTab },
        inputs.project.clientName ?? "",
        inputs.project.engineerName ?? "",
      );
      const idx = getDraftIndex();
      const entry = idx.find((d) => d.id === currentDraftId);
      if (entry && entry.status === "intake received") {
        updateDraftStatus(currentDraftId, "draft");
      }
      setDrafts(getDraftIndex());
    } catch {}
  }, [inputs, assumptions, currentDraftId, activeTab]);

  const clearAll = useCallback(() => {
    setInputs({
      project: {},
      environment: {},
      categoryRollups: {},
      vdiUserCounts: {},
      vdiDaas: {
        vdiPresent: "unknown",
        citrixPresent: "unknown",
        avdPresent: "unknown",
        w365Present: "unknown",
        horizonPresent: "unknown",
        parallelsPresent: "unknown",
        customPlatforms: [],
      },
      toolPresence: {
        intunePresent: "unknown",
        sccmPresent: "unknown",
        workspaceOnePresent: "unknown",
        jamfPresent: "unknown",
        controlUpPresent: "unknown",
        nerdioPresent: "unknown",
        customTools: [],
      },
      managedServices: {
        outsourcedEndpointMgmt: false,
        outsourcedSecurity: false,
        outsourcedPatching: false,
        outsourcedHelpdesk: false,
        outsourcedTier2Plus: false,
        outsourcedOther: false,
        mspXentegra: false,
        mspOther: false,
        mspOtherProviders: [],
      },
      observations: { notes: [] },
      hexagridEntries: [],
    });
    setAssumptions({
      deviceRefreshYears: { laptop: 3, desktop: 3, thinClient: 5 },
      deviceUnitCost: { laptop: 1200, desktop: 1100, thinClient: 600 },
      supportOps: {
        avgTicketHandlingHours: 0.5,
        deploymentHoursPerDevice: 1.5,
        blendedLaborRateHourly: 50,
        ticketsPerEndpointPerYear: 2,
      },
      licensing: { avgCostPerUserPerYear: 400, coveragePct: 1.0 },
      mgmtSecurity: { costPerEndpointPerYear: 200 },
      vdi: { platformCostPerVdiUserPerYear: 800 },
      overhead: { pctOfTotal: 0.07 },
    });
    if (currentDraftId) {
      deleteDraft(currentDraftId);
      setCurrentDraftId(null);
    }
    localStorage.removeItem("tco_tool_master");
    setClientLogo(null);
    localStorage.removeItem("tco-client-logo");
    setRestartDialogOpen(false);
    setDrafts(getDraftIndex());
    setActiveTab("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentDraftId]);

  const hasAnyData = useMemo(() => {
    const p = inputs.project;
    const e = inputs.environment;
    const hasProject = !!(p.clientName || p.assessmentDate || p.customerChampion || p.engineerName);
    const hasEnv = !!(e.userCount || e.laptopCount || e.desktopCount || e.thinClientCount);
    const hasHex = inputs.hexagridEntries.length > 0;
    const hasOverrides = Object.values(inputs.categoryRollups ?? {}).some((v) => v !== undefined && v !== 0);
    const hasObs = inputs.observations.notes.length > 0;
    return hasProject || hasEnv || hasHex || hasOverrides || hasObs;
  }, [inputs]);

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a PNG, JPG, SVG, or WebP image.");
      e.target.value = "";
      return;
    }
    const maxSize = 500 * 1024;
    if (file.size > maxSize) {
      alert("Logo file must be under 500 KB. Please resize and try again.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setClientLogo(dataUrl);
      try { localStorage.setItem("tco-client-logo", dataUrl); } catch {}
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  const removeClientLogo = useCallback(() => {
    setClientLogo(null);
    localStorage.removeItem("tco-client-logo");
  }, []);

  const { isTourOpen, startTour, closeTour, completeTour, hasCompletedTour } = useTourState();

  const tourSteps: TourStep[] = useMemo(() => [
    {
      target: "[data-testid='home-assessment-options']",
      title: "Choose Your Assessment Path",
      content: "Start with the Free Baseline Assessment to establish your current-state TCO. The Pro Assessment (coming soon) adds detailed optimization analysis.",
      placement: "bottom" as const,
    },
    {
      target: "[data-testid='tab-inputs']",
      title: "Input Your Environment",
      content: "Enter your user counts, device counts, and EUC vendor costs across 6 pillars — Access, Virtual Desktops, Device Management, Security, App Management, and Collaboration.",
      placement: "bottom" as const,
      action: () => {
        if (!currentDraftId) {
          const id = createDraft();
          setCurrentDraftId(id);
        }
        setActiveTab("inputs");
      },
    },
    {
      target: "[data-testid='readiness-panel']",
      title: "Track Your Readiness",
      content: "This panel shows how complete your assessment is. Fill in environment details and add vendor costs in the EUC Pillars section to reach 100%.",
      placement: "bottom" as const,
    },
    {
      target: "[data-testid='tab-assumptions']",
      title: "Review Assumptions",
      content: "Every derived value is backed by an explicit assumption. You can adjust these if your environment differs from industry benchmarks.",
      placement: "bottom" as const,
      action: () => setActiveTab("assumptions"),
    },
    {
      target: "[data-testid='tab-observations']",
      title: "Observations & Analysis",
      content: "See the full calculation trace showing how each number was derived. Add your own notes for documentation.",
      placement: "bottom" as const,
      action: () => setActiveTab("observations"),
    },
    {
      target: "[data-testid='tab-summary']",
      title: "Executive Summary",
      content: "Get a complete breakdown of your TCO baseline with per-endpoint and per-user metrics.",
      placement: "bottom" as const,
      action: () => setActiveTab("summary"),
    },
    {
      target: "[data-testid='button-export-csv']",
      title: "Export Your Baseline",
      content: "Download your baseline in multiple formats: CSV for spreadsheets, PDF for presentations, or full Audit Trail.",
      placement: "left" as const,
    },
  ], []);

  const handleStartTour = useCallback(() => {
    setActiveTab("home");
    setTimeout(() => startTour(), 100);
  }, [startTour]);

  const derived = useMemo(() => {
    const laptops = nonNeg(inputs.environment.laptopCount) ?? 0;
    const desktops = nonNeg(inputs.environment.desktopCount) ?? 0;
    const thinClients = nonNeg(inputs.environment.thinClientCount) ?? 0;
    const userCount = nonNeg(inputs.environment.userCount) ?? 0;
    const endpoints = laptops + desktops + thinClients;

    const vdiDirectCount = (nonNeg(inputs.vdiUserCounts?.daas) ?? 0) + (nonNeg(inputs.vdiUserCounts?.vdi) ?? 0);
    const vdiPresent = inputs.vdiDaas.vdiPresent === "yes" || vdiDirectCount > 0;
    const vdiUserCount = vdiDirectCount;

    const derivedEndUserDevices =
      (laptops * assumptions.deviceUnitCost.laptop / assumptions.deviceRefreshYears.laptop) +
      (desktops * assumptions.deviceUnitCost.desktop / assumptions.deviceRefreshYears.desktop) +
      (thinClients * assumptions.deviceUnitCost.thinClient / assumptions.deviceRefreshYears.thinClient);

    const avgRefreshYears = endpoints > 0
      ? (laptops * assumptions.deviceRefreshYears.laptop + 
         desktops * assumptions.deviceRefreshYears.desktop + 
         thinClients * assumptions.deviceRefreshYears.thinClient) / endpoints
      : assumptions.deviceRefreshYears.laptop;

    const derivedSupportOps =
      (endpoints * assumptions.supportOps.ticketsPerEndpointPerYear * assumptions.supportOps.avgTicketHandlingHours * assumptions.supportOps.blendedLaborRateHourly) +
      ((endpoints / avgRefreshYears) * assumptions.supportOps.deploymentHoursPerDevice * assumptions.supportOps.blendedLaborRateHourly);

    const derivedLicensing = userCount * assumptions.licensing.avgCostPerUserPerYear * assumptions.licensing.coveragePct;

    const hexPillarCost = (pillar: string) =>
      inputs.hexagridEntries
        .filter((e) => e.pillar === pillar)
        .reduce((sum, e) => sum + (e.yearlyCost ?? 0), 0);

    const hexHardware = hexPillarCost("Endpoint Hardware & OS");
    const hexAccess = hexPillarCost("Access");
    const hexVdi = hexPillarCost("Virtual Desktops & Applications");
    const hexMgmt = hexPillarCost("Device, OS & User Management");
    const hexSecurity = hexPillarCost("Security");
    const hexAppMgmt = hexPillarCost("App Management");
    const hexCollab = hexPillarCost("Collaboration, AI & Applications");
    const hexagridTotal = hexHardware + hexAccess + hexVdi + hexMgmt + hexSecurity + hexAppMgmt + hexCollab;

    const mgmtSecurityFromPillars = hexMgmt + hexSecurity;
    const hasToolSpend = mgmtSecurityFromPillars > 0;
    const derivedMgmtSecurity = hasToolSpend ? mgmtSecurityFromPillars : (endpoints * assumptions.mgmtSecurity.costPerEndpointPerYear);

    const hasVdiSpend = hexVdi > 0;
    const derivedVdiDaas = hasVdiSpend ? hexVdi : (vdiUserCount * assumptions.vdi.platformCostPerVdiUserPerYear);

    const endUserDevicesValue = nonNeg(inputs.categoryRollups.endUserDevicesAnnual) ?? derivedEndUserDevices;
    const supportOpsValue = nonNeg(inputs.categoryRollups.supportOpsAnnual) ?? derivedSupportOps;
    const licensingValue = nonNeg(inputs.categoryRollups.licensingAnnual) ?? derivedLicensing;
    const mgmtSecurityValue = nonNeg(inputs.categoryRollups.mgmtSecurityAnnual) ?? derivedMgmtSecurity;
    const vdiDaasValue = nonNeg(inputs.categoryRollups.vdiDaasAnnual) ?? derivedVdiDaas;

    const subtotalBeforeOverhead = endUserDevicesValue + supportOpsValue + licensingValue + mgmtSecurityValue + vdiDaasValue;
    const derivedOverhead = subtotalBeforeOverhead * assumptions.overhead.pctOfTotal;
    const overheadValue = nonNeg(inputs.categoryRollups.overheadAnnual) ?? derivedOverhead;

    const endUserDevicesLine: CalcLine = {
      key: "end-user-devices",
      label: "End-User Devices",
      value: endUserDevicesValue,
      basis: inputs.categoryRollups.endUserDevicesAnnual !== undefined
        ? `${fmtMoney(endUserDevicesValue)} (input)`
        : `${fmtNumber(laptops)} laptops × $${assumptions.deviceUnitCost.laptop}/${assumptions.deviceRefreshYears.laptop}yr + ${fmtNumber(desktops)} desktops × $${assumptions.deviceUnitCost.desktop}/${assumptions.deviceRefreshYears.desktop}yr + ${fmtNumber(thinClients)} thin clients × $${assumptions.deviceUnitCost.thinClient}/${assumptions.deviceRefreshYears.thinClient}yr`,
      isAssumed: inputs.categoryRollups.endUserDevicesAnnual === undefined,
    };

    const supportOpsLine: CalcLine = {
      key: "support-ops",
      label: "Support & Operations",
      value: supportOpsValue,
      basis: inputs.categoryRollups.supportOpsAnnual !== undefined
        ? `${fmtMoney(supportOpsValue)} (input)`
        : `${fmtNumber(endpoints)} endpoints × ${assumptions.supportOps.ticketsPerEndpointPerYear} tickets/yr × ${assumptions.supportOps.avgTicketHandlingHours}hr × $${assumptions.supportOps.blendedLaborRateHourly}/hr + deployment labor`,
      isAssumed: inputs.categoryRollups.supportOpsAnnual === undefined,
    };

    const licensingLine: CalcLine = {
      key: "licensing",
      label: "Licensing",
      value: licensingValue,
      basis: inputs.categoryRollups.licensingAnnual !== undefined
        ? `${fmtMoney(licensingValue)} (input)`
        : `${fmtNumber(userCount)} users × $${assumptions.licensing.avgCostPerUserPerYear}/user × ${(assumptions.licensing.coveragePct * 100).toFixed(0)}% coverage`,
      isAssumed: inputs.categoryRollups.licensingAnnual === undefined,
    };

    const mgmtSecurityFromInput = inputs.categoryRollups.mgmtSecurityAnnual !== undefined || hasToolSpend;
    const mgmtSecurityLine: CalcLine = {
      key: "mgmt-security",
      label: "Management & Security",
      value: mgmtSecurityValue,
      basis: inputs.categoryRollups.mgmtSecurityAnnual !== undefined
        ? `${fmtMoney(mgmtSecurityValue)} (input override)`
        : hasToolSpend
        ? `${fmtMoney(mgmtSecurityFromPillars)} (from EUC Pillars: Device Mgmt + Security)`
        : `${fmtNumber(endpoints)} endpoints × $${assumptions.mgmtSecurity.costPerEndpointPerYear}/endpoint`,
      isAssumed: !mgmtSecurityFromInput,
    };

    const vdiFromInput = inputs.categoryRollups.vdiDaasAnnual !== undefined || hasVdiSpend;
    const vdiDaasLine: CalcLine = {
      key: "vdi-daas",
      label: "VDI / DaaS",
      value: vdiDaasValue,
      basis: inputs.categoryRollups.vdiDaasAnnual !== undefined
        ? `${fmtMoney(vdiDaasValue)} (input override)`
        : hasVdiSpend
        ? `${fmtMoney(hexVdi)} (from EUC Pillars: Virtual Desktops & Applications)`
        : `${fmtNumber(vdiUserCount)} VDI users × $${assumptions.vdi.platformCostPerVdiUserPerYear}/user`,
      isAssumed: !vdiFromInput,
    };

    const overheadLine: CalcLine = {
      key: "overhead",
      label: "Overhead",
      value: overheadValue,
      basis: inputs.categoryRollups.overheadAnnual !== undefined
        ? `${fmtMoney(overheadValue)} (input)`
        : `${(assumptions.overhead.pctOfTotal * 100).toFixed(0)}% × ${fmtMoney(subtotalBeforeOverhead)} subtotal`,
      isAssumed: inputs.categoryRollups.overheadAnnual === undefined,
    };

    const categoryLines: CalcLine[] = [endUserDevicesLine, supportOpsLine, licensingLine, mgmtSecurityLine, vdiDaasLine, overheadLine];

    const mspSpend = nonNeg(inputs.managedServices.totalAnnualSpend) ?? 0;
    const mspCostPerDevice = endpoints > 0 ? mspSpend / endpoints : 0;
    const mspCostPerUser = userCount > 0 ? mspSpend / userCount : 0;

    const outsourcedServices: string[] = [];
    if (inputs.managedServices.outsourcedEndpointMgmt) outsourcedServices.push("Endpoint Management");
    if (inputs.managedServices.outsourcedSecurity) outsourcedServices.push("Security/EDR");
    if (inputs.managedServices.outsourcedPatching) outsourcedServices.push("Patching");
    if (inputs.managedServices.outsourcedHelpdesk) outsourcedServices.push("Tier 1 Support / Helpdesk");
    if (inputs.managedServices.outsourcedTier2Plus) outsourcedServices.push("Tier 2+ Support / Engineering");
    if (inputs.managedServices.outsourcedOther) outsourcedServices.push(inputs.managedServices.otherDescription || "Other");

    const mspProviders: string[] = [];
    if (inputs.managedServices.mspXentegra) mspProviders.push("XenTegra");
    if (inputs.managedServices.mspOther) {
      const others = inputs.managedServices.mspOtherProviders.filter(p => p.trim());
      if (others.length > 0) mspProviders.push(...others);
      else mspProviders.push("Other");
    }

    const managedServicesLines: CalcLine[] = [
      {
        key: "msp-total",
        label: "Managed services spend",
        value: mspSpend,
        basis:
          inputs.managedServices.totalAnnualSpend !== undefined
            ? `${fmtMoney(mspSpend)} (input)${outsourcedServices.length > 0 ? ` — covers: ${outsourcedServices.join(", ")}` : ""}${mspProviders.length > 0 ? ` — provider(s): ${mspProviders.join(", ")}` : ""}`
            : "Not provided (0 in baseline until known)",
        isAssumed: false,
      },
    ];

    const totalAnnualTco = endUserDevicesValue + supportOpsValue + licensingValue + mgmtSecurityValue + vdiDaasValue + overheadValue + mspSpend;
    const costPerEndpoint = endpoints > 0 ? totalAnnualTco / endpoints : 0;
    const costPerUser = userCount > 0 ? totalAnnualTco / userCount : 0;
    const vdiCostPerVdiUser = vdiUserCount > 0 ? vdiDaasValue / vdiUserCount : 0;
    const nonVdiCostPerUser = userCount > 0 ? (totalAnnualTco - vdiDaasValue) / userCount : 0;

    const assumedLines = categoryLines.filter((l) => l.isAssumed);

    const readiness = {
      endpointsPresent: endpoints > 0,
      hasSomeSpend: totalAnnualTco > 0,
    };

    const readinessScore =
      (readiness.endpointsPresent ? 50 : 0) + (readiness.hasSomeSpend ? 50 : 0);

    const mspIsInput = inputs.managedServices.totalAnnualSpend !== undefined;
    const costFromInputs = categoryLines.filter(l => !l.isAssumed).reduce((sum, l) => sum + l.value, 0) + (mspIsInput ? mspSpend : 0);
    const costFromAssumptions = categoryLines.filter(l => l.isAssumed).reduce((sum, l) => sum + l.value, 0);

    return {
      laptops,
      desktops,
      thinClients,
      endpoints,
      userCount,
      vdiPresent,
      vdiUserCount,
      categoryLines,
      managedServicesLines,
      endUserDevicesValue,
      supportOpsValue,
      licensingValue,
      mgmtSecurityValue,
      vdiDaasValue,
      overheadValue,
      mspSpend,
      mspCostPerDevice,
      mspCostPerUser,
      outsourcedServices,
      totalAnnualTco,
      costPerEndpoint,
      costPerUser,
      vdiCostPerVdiUser,
      nonVdiCostPerUser,
      assumedLines,
      readiness,
      readinessScore,
      costFromInputs,
      costFromAssumptions,
      hexagridTotal,
      hexHardware,
      hexAccess,
      hexVdi,
      hexMgmt,
      hexSecurity,
      hexAppMgmt,
      hexCollab,
    };
  }, [inputs, assumptions]);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("tco-dark-mode", String(dark));
  }, [dark]);

  const exportAuditTrail = () => {
    const lines: string[] = [];
    const hr = "═".repeat(70);
    const hr2 = "─".repeat(70);

    lines.push(hr);
    lines.push("TCO BASELINE MICRO-ASSESSMENT — AUDIT TRAIL REPORT");
    lines.push(hr);
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push("");

    lines.push("┌" + "─".repeat(68) + "┐");
    lines.push("│ PROJECT INFORMATION" + " ".repeat(48) + "│");
    lines.push("└" + "─".repeat(68) + "┘");
    lines.push(`  Client Name:        ${inputs.project.clientName ?? "(not provided)"}`);
    lines.push(`  Assessment Date:    ${inputs.project.assessmentDate ? new Date(inputs.project.assessmentDate).toLocaleDateString() : "(not provided)"}`);
    lines.push(`  Customer Champion:  ${inputs.project.customerChampion ?? "(not provided)"}`);
    lines.push(`  XenTegra Engineer:  ${inputs.project.engineerName ?? "(not provided)"}`);
    lines.push(`  Client Logo:        ${clientLogo ? "Included" : "Not provided"}`);
    lines.push("");

    lines.push("┌" + "─".repeat(68) + "┐");
    lines.push("│ ENVIRONMENT INPUTS" + " ".repeat(49) + "│");
    lines.push("└" + "─".repeat(68) + "┘");
    lines.push(`  User Count:         ${inputs.environment.userCount ?? "(not provided)"}`);
    lines.push(`  Laptop Count:       ${inputs.environment.laptopCount ?? "(not provided)"}`);
    lines.push(`  Desktop Count:      ${inputs.environment.desktopCount ?? "(not provided)"}`);
    lines.push(`  Thin Client Count:  ${inputs.environment.thinClientCount ?? "(not provided)"}`);
    lines.push(`  ─────────────────────────────────────────────`);
    lines.push(`  Total Endpoints:    ${derived.endpoints} (derived)`);
    lines.push(`  VDI Present:        ${inputs.vdiDaas.vdiPresent}`);
    lines.push(`  VDI % of Users:     ${inputs.vdiDaas.vdiPctOfUsers ?? 0}%`);
    lines.push(`  ─────────────────────────────────────────────`);
    lines.push(`  VDI Active:         ${derived.vdiPresent ? "Yes (VDI Present=yes OR VDI%>0)" : "No"}`);
    lines.push(`  VDI User Count:     ${derived.vdiUserCount} (derived)`);
    lines.push("");

    lines.push("┌" + "─".repeat(68) + "┐");
    lines.push("│ CATEGORY ROLLUP OVERRIDES" + " ".repeat(42) + "│");
    lines.push("└" + "─".repeat(68) + "┘");
    const overrides = [
      { label: "End-User Devices", value: inputs.categoryRollups.endUserDevicesAnnual, derived: derived.endUserDevicesValue },
      { label: "Support & Ops", value: inputs.categoryRollups.supportOpsAnnual, derived: derived.supportOpsValue },
      { label: "Licensing", value: inputs.categoryRollups.licensingAnnual, derived: derived.licensingValue },
      { label: "Mgmt & Security", value: inputs.categoryRollups.mgmtSecurityAnnual, derived: derived.mgmtSecurityValue },
      { label: "VDI/DaaS", value: inputs.categoryRollups.vdiDaasAnnual, derived: derived.vdiDaasValue },
      { label: "Overhead", value: inputs.categoryRollups.overheadAnnual, derived: derived.overheadValue },
    ];
    overrides.forEach(o => {
      const status = o.value !== undefined ? `OVERRIDE: ${fmtMoney(o.value)}` : `DERIVED: ${fmtMoney(o.derived)}`;
      lines.push(`  ${o.label.padEnd(20)} ${status}`);
    });
    lines.push("");

    lines.push("┌" + "─".repeat(68) + "┐");
    lines.push("│ EUC PILLARS & PLATFORMS VENDOR COSTS" + " ".repeat(31) + "│");
    lines.push("└" + "─".repeat(68) + "┘");
    if (inputs.hexagridEntries.length === 0) {
      lines.push("  (No vendor entries)");
    } else {
      const pillarGroups = inputs.hexagridEntries.reduce((acc, e) => {
        if (!acc[e.pillar]) acc[e.pillar] = [];
        acc[e.pillar].push(e);
        return acc;
      }, {} as Record<string, typeof inputs.hexagridEntries>);
      Object.entries(pillarGroups).forEach(([pillar, entries]) => {
        const pillarTotal = entries.reduce((s, e) => s + (e.yearlyCost ?? 0), 0);
        lines.push(`  ${pillar}: ${fmtMoney(pillarTotal)}`);
        entries.forEach((e) => {
          const flagStr = e.scoringFlag ? ` [${e.scoringFlag}]` : "";
          const nameStr = e.isCustom ? `${e.vendorName}${e.customProductName ? " — " + e.customProductName : ""}` : e.vendorName;
          const licStr = e.licenseCount ? ` | ${e.licenseCount} licenses${e.licenseSku ? ` (${e.licenseSku})` : ""}` : "";
          lines.push(`    ${nameStr} (${e.subPillar}): ${e.yearlyCost ? fmtMoney(e.yearlyCost) + "/yr" : "(no cost)"}${flagStr}${licStr}${e.notes ? ` — ${e.notes}` : ""}`);
        });
      });
      lines.push(`  ─────────────────────────────────────────────`);
      lines.push(`  EUC PILLARS TOTAL:  ${fmtMoney(derived.hexagridTotal)}`);
    }
    lines.push("");

    lines.push("┌" + "─".repeat(68) + "┐");
    lines.push("│ MANAGED SERVICES" + " ".repeat(51) + "│");
    lines.push("└" + "─".repeat(68) + "┘");
    lines.push(`  Total Annual Spend: ${inputs.managedServices.totalAnnualSpend !== undefined ? fmtMoney(inputs.managedServices.totalAnnualSpend) : "(not provided)"}`);
    lines.push("  Outsourced Functions:");
    lines.push(`    Endpoint Mgmt:    ${inputs.managedServices.outsourcedEndpointMgmt ? "Yes" : "No"}`);
    lines.push(`    Security/EDR:     ${inputs.managedServices.outsourcedSecurity ? "Yes" : "No"}`);
    lines.push(`    Patching:         ${inputs.managedServices.outsourcedPatching ? "Yes" : "No"}`);
    lines.push(`    Tier 1 Support / Helpdesk:  ${inputs.managedServices.outsourcedHelpdesk ? "Yes" : "No"}`);
    lines.push(`    Tier 2+ Support / Engineering:  ${inputs.managedServices.outsourcedTier2Plus ? "Yes" : "No"}`);
    lines.push(`    Other:            ${inputs.managedServices.outsourcedOther ? "Yes" : "No"}`);
    lines.push(`    Other Description: ${inputs.managedServices.otherDescription ?? "(none)"}`);
    lines.push("  MSP Providers:");
    lines.push(`    XenTegra:         ${inputs.managedServices.mspXentegra ? "Yes" : "No"}`);
    lines.push(`    Other:            ${inputs.managedServices.mspOther ? "Yes" : "No"}`);
    if (inputs.managedServices.mspOther && inputs.managedServices.mspOtherProviders.length > 0) {
      lines.push(`    Other Providers:  ${inputs.managedServices.mspOtherProviders.filter(p => p.trim()).join(", ") || "(none)"}`);
    }
    lines.push("");

    lines.push("┌" + "─".repeat(68) + "┐");
    lines.push("│ ASSUMPTIONS REFERENCE TABLE (15 VALUES)" + " ".repeat(27) + "│");
    lines.push("└" + "─".repeat(68) + "┘");
    lines.push("  DEVICE REFRESH CYCLES:");
    lines.push(`    Laptop:           ${assumptions.deviceRefreshYears.laptop} years`);
    lines.push(`    Desktop:          ${assumptions.deviceRefreshYears.desktop} years`);
    lines.push(`    Thin Client:      ${assumptions.deviceRefreshYears.thinClient} years`);
    lines.push("");
    lines.push("  DEVICE UNIT COSTS:");
    lines.push(`    Laptop:           $${assumptions.deviceUnitCost.laptop}`);
    lines.push(`    Desktop:          $${assumptions.deviceUnitCost.desktop}`);
    lines.push(`    Thin Client:      $${assumptions.deviceUnitCost.thinClient}`);
    lines.push("");
    lines.push("  SUPPORT OPERATIONS:");
    lines.push(`    Tickets/Endpoint: ${assumptions.supportOps.ticketsPerEndpointPerYear} per year`);
    lines.push(`    Ticket Time:      ${assumptions.supportOps.avgTicketHandlingHours} hours`);
    lines.push(`    Deploy Time:      ${assumptions.supportOps.deploymentHoursPerDevice} hours/device`);
    lines.push(`    Labor Rate:       $${assumptions.supportOps.blendedLaborRateHourly}/hour`);
    lines.push("");
    lines.push("  LICENSING:");
    lines.push(`    Cost/User/Year:   $${assumptions.licensing.avgCostPerUserPerYear}`);
    lines.push(`    Coverage:         ${(assumptions.licensing.coveragePct * 100).toFixed(0)}%`);
    lines.push("");
    lines.push("  MANAGEMENT & SECURITY:");
    lines.push(`    Cost/Endpoint:    $${assumptions.mgmtSecurity.costPerEndpointPerYear}/year`);
    lines.push("");
    lines.push("  VDI/DaaS:");
    lines.push(`    Cost/VDI User:    $${assumptions.vdi.platformCostPerVdiUserPerYear}/year`);
    lines.push("");
    lines.push("  OVERHEAD:");
    lines.push(`    % of Subtotal:    ${(assumptions.overhead.pctOfTotal * 100).toFixed(0)}%`);
    lines.push("");

    lines.push("┌" + "─".repeat(68) + "┐");
    lines.push("│ CALCULATION WIRING — STEP-BY-STEP DERIVATIONS" + " ".repeat(21) + "│");
    lines.push("└" + "─".repeat(68) + "┘");
    lines.push("");

    derived.categoryLines.forEach((line, idx) => {
      lines.push(`  [${idx + 1}] ${line.label.toUpperCase()}`);
      lines.push(`      Source: ${line.isAssumed ? "DERIVED (using assumptions)" : "INPUT (customer-provided)"}`);
      lines.push(`      Value:  ${fmtMoney(line.value)}`);
      lines.push(`      Basis:  ${line.basis}`);
      lines.push("");
    });

    derived.managedServicesLines.forEach((line, idx) => {
      lines.push(`  [${derived.categoryLines.length + idx + 1}] ${line.label.toUpperCase()}`);
      lines.push(`      Source: ${line.isAssumed ? "DERIVED (using assumptions)" : "INPUT (customer-provided)"}`);
      lines.push(`      Value:  ${fmtMoney(line.value)}`);
      lines.push(`      Basis:  ${line.basis}`);
      lines.push("");
    });

    lines.push(hr2);
    lines.push("");

    lines.push("┌" + "─".repeat(68) + "┐");
    lines.push("│ SUMMARY TOTALS" + " ".repeat(53) + "│");
    lines.push("└" + "─".repeat(68) + "┘");
    lines.push(`  End-User Devices:       ${fmtMoney(derived.endUserDevicesValue)}`);
    lines.push(`  Support & Operations:   ${fmtMoney(derived.supportOpsValue)}`);
    lines.push(`  Licensing:              ${fmtMoney(derived.licensingValue)}`);
    lines.push(`  Management & Security:  ${fmtMoney(derived.mgmtSecurityValue)}`);
    lines.push(`  VDI/DaaS:               ${fmtMoney(derived.vdiDaasValue)}`);
    lines.push(`  Overhead:               ${fmtMoney(derived.overheadValue)}`);
    lines.push(`  Managed Services:       ${fmtMoney(derived.mspSpend)}`);
    lines.push(`  ─────────────────────────────────────────────`);
    lines.push(`  TOTAL ANNUAL BASELINE:  ${fmtMoney(derived.totalAnnualTco)}`);
    lines.push("");

    lines.push("┌" + "─".repeat(68) + "┐");
    lines.push("│ PER-UNIT METRICS" + " ".repeat(51) + "│");
    lines.push("└" + "─".repeat(68) + "┘");
    lines.push(`  Cost per Endpoint:      ${derived.endpoints > 0 ? fmtMoney(derived.costPerEndpoint) : "N/A"}`);
    lines.push(`  Cost per User:          ${derived.userCount > 0 ? fmtMoney(derived.costPerUser) : "N/A"}`);
    lines.push(`  VDI Cost per VDI User:  ${derived.vdiUserCount > 0 ? fmtMoney(derived.vdiCostPerVdiUser) : "N/A"}`);
    lines.push(`  Non-VDI Cost per User:  ${derived.userCount > 0 ? fmtMoney(derived.nonVdiCostPerUser) : "N/A"}`);
    lines.push("");

    lines.push("┌" + "─".repeat(68) + "┐");
    lines.push("│ ASSUMPTIONS USED IN THIS ASSESSMENT" + " ".repeat(31) + "│");
    lines.push("└" + "─".repeat(68) + "┘");
    if (derived.assumedLines.length === 0) {
      lines.push("  None. All values were provided as inputs.");
    } else {
      derived.assumedLines.forEach((line) => {
        lines.push(`  • ${line.label}: ${line.basis}`);
      });
    }
    lines.push("");

    lines.push("┌" + "─".repeat(68) + "┐");
    lines.push("│ OBSERVATIONS & NOTES" + " ".repeat(47) + "│");
    lines.push("└" + "─".repeat(68) + "┘");
    if (inputs.observations.notes.length > 0) {
      inputs.observations.notes.forEach((n, i) => {
        lines.push(`  ${i + 1}. ${n.observation}`);
        if (n.details.trim()) lines.push(`     ${n.details}`);
      });
    } else {
      lines.push("  (No observations recorded)");
    }
    lines.push("");

    lines.push(hr);
    lines.push("END OF AUDIT TRAIL REPORT");
    lines.push(hr);

    return lines.join("\n");
  };

  const getAuditTrailContent = exportAuditTrail;

  const downloadAuditTrail = () => {
    const content = getAuditTrailContent();
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const clientSlug = inputs.project.clientName?.replace(/\s+/g, "_").toLowerCase() ?? "baseline";
    a.download = `tco-audit-trail-${clientSlug}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJustificationReport = () => {
    const lines: string[] = [];
    const hr = "═".repeat(72);
    const date = new Date().toLocaleDateString();

    lines.push(hr);
    lines.push("TCO ASSUMPTION JUSTIFICATION REPORT");
    lines.push(`Generated: ${date}`);
    lines.push(hr);
    lines.push("");
    lines.push("This report provides industry-sourced justifications for each assumption");
    lines.push("used in the TCO baseline calculation. All assumptions are derived from");
    lines.push("the EUC TCO Analysis and Discovery Roadmap document.");
    lines.push("");

    lines.push("┌" + "─".repeat(70) + "┐");
    lines.push("│ DEVICE REFRESH & COST ASSUMPTIONS" + " ".repeat(35) + "│");
    lines.push("└" + "─".repeat(70) + "┘");
    lines.push("");

    const deviceKeys = [
      { key: "deviceRefreshYears.laptop", label: "Laptop Refresh Cycle", value: `${assumptions.deviceRefreshYears.laptop} years` },
      { key: "deviceRefreshYears.desktop", label: "Desktop Refresh Cycle", value: `${assumptions.deviceRefreshYears.desktop} years` },
      { key: "deviceRefreshYears.thinClient", label: "Thin Client Refresh Cycle", value: `${assumptions.deviceRefreshYears.thinClient} years` },
      { key: "deviceUnitCost.laptop", label: "Laptop Unit Cost", value: `$${assumptions.deviceUnitCost.laptop}` },
      { key: "deviceUnitCost.desktop", label: "Desktop Unit Cost", value: `$${assumptions.deviceUnitCost.desktop}` },
      { key: "deviceUnitCost.thinClient", label: "Thin Client Unit Cost", value: `$${assumptions.deviceUnitCost.thinClient}` },
    ];

    deviceKeys.forEach(({ key, label, value }) => {
      const justification = ASSUMPTION_JUSTIFICATIONS[key];
      lines.push(`  ${label}: ${value}`);
      lines.push(`    Source: ${justification?.source ?? "Industry benchmark"}`);
      lines.push(`    Rationale: ${justification?.rationale ?? "Standard industry assumption"}`);
      lines.push("");
    });

    lines.push("┌" + "─".repeat(70) + "┐");
    lines.push("│ SUPPORT & OPERATIONS ASSUMPTIONS" + " ".repeat(36) + "│");
    lines.push("└" + "─".repeat(70) + "┘");
    lines.push("");

    const supportKeys = [
      { key: "supportOps.ticketsPerEndpointPerYear", label: "Tickets per Endpoint/Year", value: `${assumptions.supportOps.ticketsPerEndpointPerYear}` },
      { key: "supportOps.avgTicketHandlingHours", label: "Avg Ticket Handling Time", value: `${assumptions.supportOps.avgTicketHandlingHours} hours` },
      { key: "supportOps.deploymentHoursPerDevice", label: "Deployment Hours/Device", value: `${assumptions.supportOps.deploymentHoursPerDevice} hours` },
      { key: "supportOps.blendedLaborRateHourly", label: "Blended Labor Rate", value: `$${assumptions.supportOps.blendedLaborRateHourly}/hour` },
    ];

    supportKeys.forEach(({ key, label, value }) => {
      const justification = ASSUMPTION_JUSTIFICATIONS[key];
      lines.push(`  ${label}: ${value}`);
      lines.push(`    Source: ${justification?.source ?? "Industry benchmark"}`);
      lines.push(`    Rationale: ${justification?.rationale ?? "Standard industry assumption"}`);
      lines.push("");
    });

    lines.push("┌" + "─".repeat(70) + "┐");
    lines.push("│ LICENSING & MANAGEMENT ASSUMPTIONS" + " ".repeat(34) + "│");
    lines.push("└" + "─".repeat(70) + "┘");
    lines.push("");

    const licensingKeys = [
      { key: "licensing.avgCostPerUserPerYear", label: "Licensing Cost/User/Year", value: `$${assumptions.licensing.avgCostPerUserPerYear}` },
      { key: "licensing.coveragePct", label: "Licensing Coverage", value: `${(assumptions.licensing.coveragePct * 100).toFixed(0)}%` },
      { key: "mgmtSecurity.costPerEndpointPerYear", label: "Management & Security/Endpoint", value: `$${assumptions.mgmtSecurity.costPerEndpointPerYear}/year` },
    ];

    licensingKeys.forEach(({ key, label, value }) => {
      const justification = ASSUMPTION_JUSTIFICATIONS[key];
      lines.push(`  ${label}: ${value}`);
      lines.push(`    Source: ${justification?.source ?? "Industry benchmark"}`);
      lines.push(`    Rationale: ${justification?.rationale ?? "Standard industry assumption"}`);
      lines.push("");
    });

    lines.push("┌" + "─".repeat(70) + "┐");
    lines.push("│ VDI/DaaS & OVERHEAD ASSUMPTIONS" + " ".repeat(37) + "│");
    lines.push("└" + "─".repeat(70) + "┘");
    lines.push("");

    const vdiKeys = [
      { key: "vdi.platformCostPerVdiUserPerYear", label: "VDI Platform Cost/User/Year", value: `$${assumptions.vdi.platformCostPerVdiUserPerYear}` },
      { key: "overhead.pctOfTotal", label: "Overhead Percentage", value: `${(assumptions.overhead.pctOfTotal * 100).toFixed(0)}%` },
    ];

    vdiKeys.forEach(({ key, label, value }) => {
      const justification = ASSUMPTION_JUSTIFICATIONS[key];
      lines.push(`  ${label}: ${value}`);
      lines.push(`    Source: ${justification?.source ?? "Industry benchmark"}`);
      lines.push(`    Rationale: ${justification?.rationale ?? "Standard industry assumption"}`);
      lines.push("");
    });

    lines.push(hr);
    lines.push("REFERENCE DOCUMENT");
    lines.push(hr);
    lines.push("");
    lines.push("Strategic Financial Architecture of End User Computing:");
    lines.push("A Comprehensive Total Cost of Ownership Analysis");
    lines.push("");
    lines.push("This report is based on industry research and benchmarks compiled in the");
    lines.push("EUC TCO Analysis and Discovery Roadmap document, which synthesizes data");
    lines.push("from Gartner, IDC, Microsoft, Citrix, and other authoritative sources.");
    lines.push("");
    lines.push(hr);

    return lines.join("\n");
  };

  const getJustificationContent = exportJustificationReport;

  const downloadJustificationReport = () => {
    const content = getJustificationContent();
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tco-assumption-justifications-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const rows: string[][] = [];
    
    rows.push(["TCO Baseline Micro-Assessment - CSV Export"]);
    rows.push(["Generated", new Date().toLocaleString()]);
    rows.push([]);
    
    rows.push(["PROJECT INFORMATION"]);
    rows.push(["Client Name", inputs.project.clientName ?? ""]);
    rows.push(["Assessment Date", inputs.project.assessmentDate ?? ""]);
    rows.push(["Customer Champion", inputs.project.customerChampion ?? ""]);
    rows.push(["XenTegra Engineer", inputs.project.engineerName ?? ""]);
    rows.push(["Client Logo", clientLogo ? "Included" : "Not provided"]);
    rows.push([]);
    
    rows.push(["ENVIRONMENT"]);
    rows.push(["User Count", String(inputs.environment.userCount ?? 0)]);
    rows.push(["Laptop Count", String(inputs.environment.laptopCount ?? 0)]);
    rows.push(["Desktop Count", String(inputs.environment.desktopCount ?? 0)]);
    rows.push(["Thin Client Count", String(inputs.environment.thinClientCount ?? 0)]);
    rows.push(["Total Endpoints", String(derived.endpoints)]);
    rows.push(["VDI Present", inputs.vdiDaas.vdiPresent]);
    rows.push(["VDI % of Users", String(inputs.vdiDaas.vdiPctOfUsers ?? 0)]);
    rows.push(["VDI User Count", String(derived.vdiUserCount)]);
    rows.push([]);
    
    rows.push(["COST CATEGORIES", "Annual Amount", "Source"]);
    rows.push(["End-User Devices", String(derived.endUserDevicesValue), inputs.categoryRollups.endUserDevicesAnnual !== undefined ? "Override" : "Calculated"]);
    rows.push(["Support & Operations", String(derived.supportOpsValue), inputs.categoryRollups.supportOpsAnnual !== undefined ? "Override" : "Calculated"]);
    rows.push(["Licensing", String(derived.licensingValue), inputs.categoryRollups.licensingAnnual !== undefined ? "Override" : "Calculated"]);
    rows.push(["Management & Security", String(derived.mgmtSecurityValue), inputs.categoryRollups.mgmtSecurityAnnual !== undefined ? "Override" : "Calculated"]);
    rows.push(["VDI/DaaS", String(derived.vdiDaasValue), inputs.categoryRollups.vdiDaasAnnual !== undefined ? "Override" : "Calculated"]);
    rows.push(["Overhead", String(derived.overheadValue), inputs.categoryRollups.overheadAnnual !== undefined ? "Override" : "Calculated"]);
    rows.push(["Managed Services", String(derived.mspSpend), "Input"]);
    rows.push([]);
    
    rows.push(["SUMMARY METRICS"]);
    rows.push(["Total Annual Baseline", String(derived.totalAnnualTco)]);
    rows.push(["Cost per Endpoint", derived.endpoints > 0 ? String(derived.costPerEndpoint) : "N/A"]);
    rows.push(["Cost per User", derived.userCount > 0 ? String(derived.costPerUser) : "N/A"]);
    rows.push(["VDI Cost per VDI User", derived.vdiUserCount > 0 ? String(derived.vdiCostPerVdiUser) : "N/A"]);
    rows.push(["Non-VDI Cost per User", derived.userCount > 0 ? String(derived.nonVdiCostPerUser) : "N/A"]);
    rows.push([]);
    
    rows.push(["ASSUMPTIONS"]);
    rows.push(["Laptop Refresh Years", String(assumptions.deviceRefreshYears.laptop)]);
    rows.push(["Desktop Refresh Years", String(assumptions.deviceRefreshYears.desktop)]);
    rows.push(["Thin Client Refresh Years", String(assumptions.deviceRefreshYears.thinClient)]);
    rows.push(["Laptop Unit Cost", String(assumptions.deviceUnitCost.laptop)]);
    rows.push(["Desktop Unit Cost", String(assumptions.deviceUnitCost.desktop)]);
    rows.push(["Thin Client Unit Cost", String(assumptions.deviceUnitCost.thinClient)]);
    rows.push(["Tickets per Endpoint/Year", String(assumptions.supportOps.ticketsPerEndpointPerYear)]);
    rows.push(["Avg Ticket Handling Hours", String(assumptions.supportOps.avgTicketHandlingHours)]);
    rows.push(["Deployment Hours/Device", String(assumptions.supportOps.deploymentHoursPerDevice)]);
    rows.push(["Blended Labor Rate ($/hr)", String(assumptions.supportOps.blendedLaborRateHourly)]);
    rows.push(["License Cost/User/Year", String(assumptions.licensing.avgCostPerUserPerYear)]);
    rows.push(["License Coverage %", String(assumptions.licensing.coveragePct * 100)]);
    rows.push(["Mgmt & Security/Endpoint", String(assumptions.mgmtSecurity.costPerEndpointPerYear)]);
    rows.push(["VDI Platform Cost/User", String(assumptions.vdi.platformCostPerVdiUserPerYear)]);
    rows.push(["Overhead %", String(assumptions.overhead.pctOfTotal * 100)]);
    rows.push([]);

    rows.push(["EUC PILLARS & PLATFORMS", "Sub-Pillar", "Vendor", "Annual Cost", "Scoring Flag", "License Count", "License SKU", "Notes"]);
    if (inputs.hexagridEntries.length > 0) {
      const pillarGroups = inputs.hexagridEntries.reduce((acc, e) => {
        if (!acc[e.pillar]) acc[e.pillar] = [];
        acc[e.pillar].push(e);
        return acc;
      }, {} as Record<string, typeof inputs.hexagridEntries>);
      Object.entries(pillarGroups).forEach(([pillar, entries]) => {
        entries.forEach((e) => {
          const csvName = e.isCustom ? `${e.vendorName}${e.customProductName ? " — " + e.customProductName : ""}` : e.vendorName;
          rows.push([pillar, e.subPillar, csvName, String(e.yearlyCost ?? 0), e.scoringFlag ?? "", String(e.licenseCount ?? ""), e.licenseSku ?? "", e.notes ?? ""]);
        });
      });
      rows.push(["EUC Pillars Total", "", "", String(derived.hexagridTotal), "", "", "", ""]);
    } else {
      rows.push(["(No vendor entries)", "", "", "", "", "", "", ""]);
    }
    rows.push([]);

    rows.push(["MANAGED SERVICES"]);
    rows.push(["Total Annual MSP Spend", inputs.managedServices.totalAnnualSpend !== undefined ? String(inputs.managedServices.totalAnnualSpend) : ""]);
    rows.push(["Outsourced Endpoint Management", inputs.managedServices.outsourcedEndpointMgmt ? "Yes" : "No"]);
    rows.push(["Outsourced Security/EDR", inputs.managedServices.outsourcedSecurity ? "Yes" : "No"]);
    rows.push(["Outsourced Patching", inputs.managedServices.outsourcedPatching ? "Yes" : "No"]);
    rows.push(["Outsourced Tier 1 Support / Helpdesk", inputs.managedServices.outsourcedHelpdesk ? "Yes" : "No"]);
    rows.push(["Outsourced Tier 2+ Support / Engineering", inputs.managedServices.outsourcedTier2Plus ? "Yes" : "No"]);
    rows.push(["Outsourced Other", inputs.managedServices.outsourcedOther ? "Yes" : "No"]);
    rows.push(["Other Description", inputs.managedServices.otherDescription ?? ""]);
    rows.push(["MSP Provider: XenTegra", inputs.managedServices.mspXentegra ? "Yes" : "No"]);
    rows.push(["MSP Provider: Other", inputs.managedServices.mspOther ? "Yes" : "No"]);
    if (inputs.managedServices.mspOther && inputs.managedServices.mspOtherProviders.length > 0) {
      rows.push(["MSP Other Providers", inputs.managedServices.mspOtherProviders.filter(p => p.trim()).join(", ")]);
    }
    rows.push([]);

    rows.push(["OBSERVATIONS"]);
    if (inputs.observations.notes.length > 0) {
      rows.push(["Observation", "Details"]);
      inputs.observations.notes.forEach((n) => rows.push([n.observation, n.details]));
    } else {
      rows.push(["(No observations recorded)"]);
    }
    
    const escapeCSV = (value: string) => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };
    
    return rows.map(row => row.map(escapeCSV).join(",")).join("\n");
  };

  const getCsvContent = exportCSV;

  const downloadCSV = () => {
    const csvContent = getCsvContent();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const clientSlug = inputs.project.clientName?.replace(/\s+/g, "_").toLowerCase() ?? "baseline";
    a.download = `tco-baseline-${clientSlug}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const imgToBase64 = useCallback(async (src: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve("");
      img.src = src;
    });
  }, []);

  const exportPDF = async () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to generate PDF");
      return;
    }

    const clientName = inputs.project.clientName ?? "TCO Baseline";
    const date = new Date().toLocaleDateString();
    const xentegraB64 = await imgToBase64(xentegraLogoBlack);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>TCO Baseline Report - ${clientName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.5;
      color: #1a1a1a;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 { font-size: 28px; margin-bottom: 8px; color: #0f172a; }
    h2 { font-size: 18px; margin: 24px 0 12px; color: #334155; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
    h3 { font-size: 14px; margin: 16px 0 8px; color: #475569; }
    .header { border-bottom: 3px solid #3b82f6; padding-bottom: 16px; margin-bottom: 24px; }
    .header-logos { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .header-logos img { max-height: 40px; max-width: 160px; object-fit: contain; }
    .subtitle { color: #64748b; font-size: 14px; }
    .meta { display: flex; gap: 32px; margin-top: 12px; font-size: 12px; color: #64748b; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #64748b; }
    td { font-size: 13px; }
    .amount { text-align: right; font-family: 'SF Mono', Monaco, monospace; }
    .total-row { background: #f1f5f9; font-weight: 600; }
    .total-row td { border-top: 2px solid #cbd5e1; }
    .metric-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 16px 0; }
    .metric-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
    .metric-value { font-size: 24px; font-weight: 700; color: #0f172a; }
    .metric-label { font-size: 12px; color: #64748b; margin-top: 4px; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
    .disclaimer { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; padding: 12px; font-size: 11px; color: #92400e; margin: 16px 0; }
    .chart-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 16px 0; page-break-inside: avoid; }
    .chart-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; min-height: 180px; page-break-inside: avoid; }
    .chart-title { font-size: 14px; font-weight: 600; color: #334155; margin-bottom: 12px; }
    .bar-chart { display: flex; flex-direction: column; gap: 10px; }
    .bar-row { display: flex; align-items: center; gap: 8px; }
    .bar-label { width: 80px; font-size: 11px; color: #64748b; flex-shrink: 0; }
    .bar-container { flex: 1; height: 20px; background: #e2e8f0; border-radius: 4px; overflow: hidden; min-width: 80px; }
    .bar-fill { height: 100%; border-radius: 4px; }
    .bar-value { min-width: 90px; font-size: 11px; text-align: right; color: #334155; font-weight: 500; white-space: nowrap; }
    .donut-legend { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
    .legend-item { display: flex; align-items: center; gap: 4px; font-size: 11px; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; }
    .comparison-bars { display: flex; gap: 24px; align-items: flex-end; height: 140px; justify-content: center; padding: 10px 0; }
    .comparison-bar { display: flex; flex-direction: column; align-items: center; min-width: 100px; }
    .comparison-bar-fill { width: 70px; border-radius: 4px 4px 0 0; }
    .comparison-bar-label { font-size: 11px; color: #64748b; margin-top: 8px; text-align: center; }
    .comparison-bar-value { font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 4px; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
      .chart-grid { break-inside: avoid; page-break-inside: avoid; }
      .chart-card { break-inside: avoid; page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-logos">
      ${clientLogo ? `<img src="${clientLogo}" alt="Client logo" />` : `<div></div>`}
      ${xentegraB64 ? `<img src="${xentegraB64}" alt="XenTegra" />` : ``}
    </div>
    <h1>TCO Baseline Report</h1>
    <p class="subtitle">End User Computing Total Cost of Ownership Assessment</p>
    <div class="meta">
      <span><strong>Client:</strong> ${clientName}</span>
      <span><strong>Assessment Date:</strong> ${inputs.project.assessmentDate ? new Date(inputs.project.assessmentDate + "T00:00:00").toLocaleDateString() : date}</span>
      ${inputs.project.customerChampion ? `<span><strong>Champion:</strong> ${inputs.project.customerChampion}</span>` : ""}
    </div>
  </div>

  <div class="disclaimer">
    <strong>Disclaimer:</strong> This report represents a current-state TCO baseline only. 
    It does not include ROI projections, savings estimates, or solution recommendations.
  </div>

  <h2>Environment Summary</h2>
  <table>
    <tr><td>Total Users</td><td class="amount">${fmtNumber(derived.userCount)}</td></tr>
    <tr><td>Total Endpoints</td><td class="amount">${fmtNumber(derived.endpoints)}</td></tr>
    <tr><td>Laptops</td><td class="amount">${fmtNumber(inputs.environment.laptopCount ?? 0)}</td></tr>
    <tr><td>Desktops</td><td class="amount">${fmtNumber(inputs.environment.desktopCount ?? 0)}</td></tr>
    <tr><td>Thin Clients</td><td class="amount">${fmtNumber(inputs.environment.thinClientCount ?? 0)}</td></tr>
    ${derived.vdiPresent ? `<tr><td>VDI Users</td><td class="amount">${fmtNumber(derived.vdiUserCount)} (${inputs.vdiDaas.vdiPctOfUsers ?? 0}%)</td></tr>` : ""}
  </table>

  <h2>Annual Cost Breakdown</h2>
  <table>
    <thead>
      <tr><th>Category</th><th class="amount">Annual Cost</th><th class="amount">% of Total</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>End-User Devices</td>
        <td class="amount">${fmtMoney(derived.endUserDevicesValue)}</td>
        <td class="amount">${pct(derived.endUserDevicesValue, derived.totalAnnualTco)}%</td>
      </tr>
      <tr>
        <td>Support & Operations</td>
        <td class="amount">${fmtMoney(derived.supportOpsValue)}</td>
        <td class="amount">${pct(derived.supportOpsValue, derived.totalAnnualTco)}%</td>
      </tr>
      <tr>
        <td>Licensing</td>
        <td class="amount">${fmtMoney(derived.licensingValue)}</td>
        <td class="amount">${pct(derived.licensingValue, derived.totalAnnualTco)}%</td>
      </tr>
      <tr>
        <td>Management & Security</td>
        <td class="amount">${fmtMoney(derived.mgmtSecurityValue)}</td>
        <td class="amount">${pct(derived.mgmtSecurityValue, derived.totalAnnualTco)}%</td>
      </tr>
      ${derived.vdiPresent ? `
      <tr>
        <td>VDI/DaaS</td>
        <td class="amount">${fmtMoney(derived.vdiDaasValue)}</td>
        <td class="amount">${pct(derived.vdiDaasValue, derived.totalAnnualTco)}%</td>
      </tr>` : ""}
      <tr>
        <td>Overhead</td>
        <td class="amount">${fmtMoney(derived.overheadValue)}</td>
        <td class="amount">${pct(derived.overheadValue, derived.totalAnnualTco)}%</td>
      </tr>
      ${derived.mspSpend > 0 ? `
      <tr>
        <td>Managed Services</td>
        <td class="amount">${fmtMoney(derived.mspSpend)}</td>
        <td class="amount">${pct(derived.mspSpend, derived.totalAnnualTco)}%</td>
      </tr>` : ""}
      <tr class="total-row">
        <td><strong>Total Annual Baseline</strong></td>
        <td class="amount"><strong>${fmtMoney(derived.totalAnnualTco)}</strong></td>
        <td class="amount"><strong>100%</strong></td>
      </tr>
    </tbody>
  </table>

  <h2>Per-Unit Metrics</h2>
  <div class="metric-grid">
    <div class="metric-card">
      <div class="metric-value">${derived.endpoints > 0 ? fmtMoney(derived.costPerEndpoint) : "N/A"}</div>
      <div class="metric-label">Cost per Endpoint</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${derived.userCount > 0 ? fmtMoney(derived.costPerUser) : "N/A"}</div>
      <div class="metric-label">Cost per User</div>
    </div>
    ${derived.vdiPresent ? `
    <div class="metric-card">
      <div class="metric-value">${derived.vdiUserCount > 0 ? fmtMoney(derived.vdiCostPerVdiUser) : "N/A"}</div>
      <div class="metric-label">VDI Cost per VDI User</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${derived.userCount > 0 ? fmtMoney(derived.nonVdiCostPerUser) : "N/A"}</div>
      <div class="metric-label">Non-VDI Cost per User</div>
    </div>` : ""}
  </div>

  ${inputs.observations.notes.length > 0 ? `
  <h2>Observations</h2>
  <ul style="font-size: 13px; color: #475569;">
    ${inputs.observations.notes.map((n) => `<li><strong>${n.observation}</strong>${n.details.trim() ? `<br/>${n.details}` : ""}</li>`).join("")}
  </ul>
  ` : ""}

  <h2>Visualizations</h2>
  <div class="chart-grid">
    <div class="chart-card">
      <div class="chart-title">Endpoint Mix</div>
      <div class="bar-chart">
        ${derived.endpoints > 0 ? `
        <div class="bar-row">
          <span class="bar-label">Laptops</span>
          <div class="bar-container">
            <div class="bar-fill" style="width: ${pct(derived.laptops, derived.endpoints)}%; background: #3b82f6;"></div>
          </div>
          <span class="bar-value">${fmtNumber(derived.laptops)} (${pct(derived.laptops, derived.endpoints)}%)</span>
        </div>
        <div class="bar-row">
          <span class="bar-label">Desktops</span>
          <div class="bar-container">
            <div class="bar-fill" style="width: ${pct(derived.desktops, derived.endpoints)}%; background: #8b5cf6;"></div>
          </div>
          <span class="bar-value">${fmtNumber(derived.desktops)} (${pct(derived.desktops, derived.endpoints)}%)</span>
        </div>
        <div class="bar-row">
          <span class="bar-label">Thin Clients</span>
          <div class="bar-container">
            <div class="bar-fill" style="width: ${pct(derived.thinClients, derived.endpoints)}%; background: #22c55e;"></div>
          </div>
          <span class="bar-value">${fmtNumber(derived.thinClients)} (${pct(derived.thinClients, derived.endpoints)}%)</span>
        </div>
        ` : `<p style="color: #64748b; font-size: 12px;">No device data entered</p>`}
      </div>
    </div>

    <div class="chart-card">
      <div class="chart-title">Cost by Category</div>
      <div class="bar-chart">
        <div class="bar-row">
          <span class="bar-label">Devices</span>
          <div class="bar-container">
            <div class="bar-fill" style="width: ${pct(derived.endUserDevicesValue, derived.totalAnnualTco)}%; background: #3b82f6;"></div>
          </div>
          <span class="bar-value">${pct(derived.endUserDevicesValue, derived.totalAnnualTco)}%</span>
        </div>
        <div class="bar-row">
          <span class="bar-label">Support</span>
          <div class="bar-container">
            <div class="bar-fill" style="width: ${pct(derived.supportOpsValue, derived.totalAnnualTco)}%; background: #f59e0b;"></div>
          </div>
          <span class="bar-value">${pct(derived.supportOpsValue, derived.totalAnnualTco)}%</span>
        </div>
        <div class="bar-row">
          <span class="bar-label">Licensing</span>
          <div class="bar-container">
            <div class="bar-fill" style="width: ${pct(derived.licensingValue, derived.totalAnnualTco)}%; background: #22c55e;"></div>
          </div>
          <span class="bar-value">${pct(derived.licensingValue, derived.totalAnnualTco)}%</span>
        </div>
        <div class="bar-row">
          <span class="bar-label">Mgmt/Sec</span>
          <div class="bar-container">
            <div class="bar-fill" style="width: ${pct(derived.mgmtSecurityValue, derived.totalAnnualTco)}%; background: #06b6d4;"></div>
          </div>
          <span class="bar-value">${pct(derived.mgmtSecurityValue, derived.totalAnnualTco)}%</span>
        </div>
        ${derived.vdiPresent ? `
        <div class="bar-row">
          <span class="bar-label">VDI/DaaS</span>
          <div class="bar-container">
            <div class="bar-fill" style="width: ${pct(derived.vdiDaasValue, derived.totalAnnualTco)}%; background: #8b5cf6;"></div>
          </div>
          <span class="bar-value">${pct(derived.vdiDaasValue, derived.totalAnnualTco)}%</span>
        </div>
        ` : ""}
        <div class="bar-row">
          <span class="bar-label">Overhead</span>
          <div class="bar-container">
            <div class="bar-fill" style="width: ${pct(derived.overheadValue, derived.totalAnnualTco)}%; background: #6b7280;"></div>
          </div>
          <span class="bar-value">${pct(derived.overheadValue, derived.totalAnnualTco)}%</span>
        </div>
      </div>
    </div>

    ${derived.vdiPresent && derived.userCount > 0 ? `
    <div class="chart-card">
      <div class="chart-title">VDI vs Non-VDI User Cost</div>
      <div class="comparison-bars">
        <div class="comparison-bar">
          <div class="comparison-bar-value">${fmtMoney(derived.nonVdiCostPerUser)}</div>
          <div class="comparison-bar-fill" style="height: ${Math.min(100, (derived.nonVdiCostPerUser / Math.max(derived.nonVdiCostPerUser, derived.nonVdiCostPerUser + derived.vdiCostPerVdiUser)) * 100)}px; background: #3b82f6;"></div>
          <div class="comparison-bar-label">Non-VDI User</div>
        </div>
        <div class="comparison-bar">
          <div class="comparison-bar-value">${fmtMoney(derived.nonVdiCostPerUser + derived.vdiCostPerVdiUser)}</div>
          <div class="comparison-bar-fill" style="height: ${Math.min(100, ((derived.nonVdiCostPerUser + derived.vdiCostPerVdiUser) / Math.max(derived.nonVdiCostPerUser, derived.nonVdiCostPerUser + derived.vdiCostPerVdiUser)) * 100)}px; background: #8b5cf6;"></div>
          <div class="comparison-bar-label">VDI User</div>
        </div>
      </div>
    </div>
    ` : ""}

    <div class="chart-card">
      <div class="chart-title">Cost Source Composition</div>
      <div class="bar-chart">
        <div class="bar-row">
          <span class="bar-label">From Inputs</span>
          <div class="bar-container">
            <div class="bar-fill" style="width: ${pct(derived.costFromInputs, derived.totalAnnualTco)}%; background: #3b82f6;"></div>
          </div>
          <span class="bar-value">${fmtMoney(derived.costFromInputs)}</span>
        </div>
        <div class="bar-row">
          <span class="bar-label">Assumed</span>
          <div class="bar-container">
            <div class="bar-fill" style="width: ${pct(derived.costFromAssumptions, derived.totalAnnualTco)}%; background: #f59e0b;"></div>
          </div>
          <span class="bar-value">${fmtMoney(derived.costFromAssumptions)}</span>
        </div>
      </div>
      <div style="margin-top: 8px; font-size: 11px; color: #64748b;">
        ${pct(derived.costFromInputs, derived.totalAnnualTco)}% from your inputs, ${pct(derived.costFromAssumptions, derived.totalAnnualTco)}% from assumptions
      </div>
    </div>
  </div>

  <div class="footer">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      ${clientLogo ? `<img src="${clientLogo}" alt="Client" style="max-height: 24px; max-width: 100px; object-fit: contain;" />` : `<div></div>`}
      ${xentegraB64 ? `<img src="${xentegraB64}" alt="XenTegra" style="max-height: 24px; max-width: 100px; object-fit: contain;" />` : ``}
    </div>
    <p>TCO Baseline Micro-Assessment Tool | Assessment Date: ${inputs.project.assessmentDate ? new Date(inputs.project.assessmentDate + "T00:00:00").toLocaleDateString() : date}</p>
    <p style="margin-top: 4px;">This is a vendor-neutral, current-state baseline assessment.</p>
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const downloadAllExports = async () => {
    const zip = new JSZip();
    const dateStr = inputs.project.assessmentDate
      ? new Date(inputs.project.assessmentDate + "T00:00:00").toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);
    const clientSlug = (inputs.project.clientName ?? "Baseline").replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_");
    const folderName = `${dateStr}_${clientSlug}_TCO Micro-Assessment_Export`;

    zip.file(`${folderName}/tco-baseline.csv`, getCsvContent());
    zip.file(`${folderName}/tco-audit-trail.txt`, getAuditTrailContent());
    zip.file(`${folderName}/tco-assumption-justifications.txt`, getJustificationContent());

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${folderName}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadDocumentation = () => {
    const blob = new Blob([documentationMd], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "TCO_Baseline_Tool_Documentation.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadFaq = () => {
    const blob = new Blob([faqMd], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "TCO_Baseline_FAQ.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateIntakeForm = useCallback(() => {
    setExcelClientName(inputs.project.clientName ?? "");
    setExcelProjectName("");
    setExcelExportOpen(true);
  }, [inputs.project.clientName]);

  const importIntakeData = useCallback(() => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".xlsx,.csv";
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const buf = await file.arrayBuffer();
        const result = parseIntakeImport(buf, file.name);
        setExcelImportResult(result);
        setExcelImportOpen(true);
        setExcelImportError(null);
      } catch {
        setExcelImportError(
          "This file doesn't match the expected intake form template. Please ensure you're uploading a completed TCO Intake Form.",
        );
      }
    };
    fileInput.click();
  }, []);

  const handleExcelExport = useCallback(async () => {
    if (!excelClientName.trim()) return;
    await exportIntakeForm(excelClientName.trim(), excelProjectName.trim());
    setExcelExportOpen(false);
    setExcelClientName("");
    setExcelProjectName("");
  }, [excelClientName, excelProjectName]);

  const handleExcelFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".csv")) {
        setExcelImportError("Please upload an Excel (.xlsx) or CSV (.csv) file.");
        return;
      }
      try {
        const buf = await file.arrayBuffer();
        const result = parseIntakeImport(buf, file.name);
        setExcelImportResult(result);
        setExcelImportOpen(true);
        setExcelImportError(null);
      } catch {
        setExcelImportError(
          "This file doesn't match the expected intake form template. Please ensure you're uploading a completed TCO Intake Form.",
        );
      }
    },
    [],
  );

  const toggleIntakeGuidance = useCallback(() => {
    setIntakeGuidanceOpen((prev) => {
      const next = !prev;
      localStorage.setItem("tco-intake-guidance-collapsed", next ? "false" : "true");
      return next;
    });
  }, []);

  const handleCopyGoogleFormLink = useCallback(() => {
    if (!googleFormUrl.trim()) {
      setGoogleFormUrlDraft("");
      setGoogleFormSettingsOpen(true);
      return;
    }
    navigator.clipboard.writeText(googleFormUrl).then(
      () => toast({ title: "Link copied!", description: "Google Form URL copied to clipboard." }),
      () => toast({ title: "Copy failed", description: "Could not copy to clipboard. Try copying the URL manually.", variant: "destructive" }),
    );
  }, [googleFormUrl, toast]);

  const handleSaveGoogleFormUrl = useCallback(() => {
    const url = googleFormUrlDraft.trim();
    setGoogleFormUrl(url);
    localStorage.setItem("tco-google-form-url", url);
    setGoogleFormSettingsOpen(false);
    if (url) {
      toast({ title: "Saved", description: "Google Form URL has been saved." });
    }
  }, [googleFormUrlDraft, toast]);

  const handleSendEmail = useCallback(async () => {
    const clientName = inputs.project.clientName || "[Client Name]";
    const engineerName = inputs.project.engineerName || "[XenTegra Engineer Name]";
    const dueDate = emailDueDate
      ? new Date(emailDueDate + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : "[DATE]";

    let body = `Hi,\n\nWe're preparing a Total Cost of Ownership baseline assessment for ${clientName}'s end-user computing environment. To make the most of our engagement, we'd like to gather some information about your current environment ahead of our first working session.\n\n`;

    if (emailMethod === "google" && googleFormUrl.trim()) {
      body += `Please fill out this brief questionnaire at your convenience:\n${googleFormUrl}\n\nAll questions are optional — fill in what you know and leave the rest blank. We'll work through any gaps together.\n\n`;
    } else {
      body += `Please find the attached intake form (Excel). Fill in what you know in the highlighted "Your Response" column and return it to me when complete. All fields are optional.\n\n`;
    }

    body += `The form covers:\n• Environment basics (user counts, device counts)\n• Your current technology stack across 7 EUC pillars\n• Managed services and support arrangements\n\nThere are no wrong answers — approximate numbers and "best guess" responses are perfectly fine. Anything left blank, we'll address together with explicit assumptions.\n\nPlease return your responses by ${dueDate} so we can come prepared for our first session.\n\nThank you,\n${engineerName}\nXenTegra`;

    const subject = `TCO Assessment — Intake Form for ${clientName}`;
    const mailto = `mailto:${encodeURIComponent(emailRecipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    if (emailMethod === "excel") {
      const clientName2 = inputs.project.clientName?.trim() || "Client";
      await exportIntakeForm(clientName2, "");
    }

    window.open(mailto, "_self");
    setEmailDialogOpen(false);
  }, [inputs.project.clientName, inputs.project.engineerName, emailDueDate, emailMethod, googleFormUrl, emailRecipient]);

  const handleExcelCreateDraft = useCallback(() => {
    if (!excelImportResult) return;
    const result = excelImportResult;
    const id = createDraft({
      clientName: result.clientName,
      projectName: result.projectName,
      status: "intake received",
    });
    const intakeInputs: Partial<Inputs> = {
      project: {
        clientName: result.clientName || undefined,
      },
    };
    const raw = result.inputs as Record<string, unknown>;
    if (raw.userCount !== undefined) intakeInputs.userCount = raw.userCount as number;
    if (raw.laptopCount !== undefined) intakeInputs.laptopCount = raw.laptopCount as number;
    if (raw.desktopCount !== undefined) intakeInputs.desktopCount = raw.desktopCount as number;
    if (raw.thinClientCount !== undefined) intakeInputs.thinClientCount = raw.thinClientCount as number;
    if (raw.categoryRollups) {
      intakeInputs.categoryRollups = {
        ...inputs.categoryRollups,
        ...(raw.categoryRollups as Partial<Inputs["categoryRollups"]>),
      };
    }
    if (raw.managedServices) intakeInputs.managedServices = {
      ...inputs.managedServices,
      ...(raw.managedServices as Partial<Inputs["managedServices"]>),
    };
    if (raw.hexagridEntries) intakeInputs.hexagridEntries = raw.hexagridEntries as Inputs["hexagridEntries"];
    if (raw.vdiUserCounts) intakeInputs.vdiUserCounts = raw.vdiUserCounts as Inputs["vdiUserCounts"];

    saveDraftData(id, { inputs: intakeInputs }, result.clientName, result.projectName);
    setDrafts(getDraftIndex());
    setInputs((prev) => ({ ...prev, ...intakeInputs }));
    setCurrentDraftId(id);
    setExcelImportOpen(false);
    setExcelImportResult(null);
    setActiveTab("inputs");
  }, [excelImportResult, inputs.categoryRollups, inputs.managedServices]);

  const sendHelpEmail = useCallback(() => {
    const subject = encodeURIComponent("TCO Baseline Tool - Support Request");
    const body = encodeURIComponent(
      `Support Request\n` +
      `────────────────\n` +
      `Tool: TCO Baseline Micro-Assessment Tool\n` +
      `Version: 0.4.0\n` +
      `Date: ${new Date().toLocaleString()}\n` +
      `Client: ${inputs.project.clientName || "(not set)"}\n` +
      `Engineer: ${inputs.project.engineerName || "(not set)"}\n\n` +
      `Issue Description:\n${helpIssue}\n\n` +
      `────────────────\n` +
      `Browser: ${navigator.userAgent}\n`
    );
    window.location.href = `mailto:support@xentegra.com?subject=${subject}&body=${body}`;
    setHelpSent(true);
    setTimeout(() => {
      setHelpSent(false);
      setHelpIssue("");
      setHelpDialogOpen(false);
    }, 2000);
  }, [helpIssue, inputs.project.clientName, inputs.project.engineerName]);

  const tabOrder: { value: string; label: string }[] = [
    { value: "home", label: "Home" },
    { value: "inputs", label: "Inputs" },
    { value: "assumptions", label: "Assumptions" },
    { value: "observations", label: "Observations" },
    { value: "summary", label: "Summary" },
    { value: "readme", label: "Tools" },
    ...(debugMode ? [{ value: "audit", label: "Audit / Trace" }] : []),
  ];

  const TabNav = ({ current }: { current: string }) => {
    const idx = tabOrder.findIndex((t) => t.value === current);
    const prev = idx > 1 ? tabOrder[idx - 1] : null;
    const next = idx < tabOrder.length - 1 ? tabOrder[idx + 1] : null;
    return (
      <div className="mt-8 flex items-center justify-between" data-testid={`tab-nav-${current}`}>
        {prev ? (
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => { setActiveTab(prev.value as any); window.scrollTo(0, 0); }}
            data-testid={`button-prev-${current}`}
          >
            <ChevronLeft className="h-4 w-4" /> {prev.label}
          </Button>
        ) : <div />}
        {next ? (
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => { setActiveTab(next.value as any); window.scrollTo(0, 0); }}
            data-testid={`button-next-${current}`}
          >
            {next.label} <ChevronRight className="h-4 w-4" />
          </Button>
        ) : <div />}
      </div>
    );
  };

  return (
    <div className="app-shell grain min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
        <header className="flex flex-col gap-6" data-testid="section-header">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="glass hairline rounded-3xl px-6 py-5"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge
                    variant="secondary"
                    className="rounded-full"
                    data-testid="badge-neutral"
                  >
                    EUC Total Cost of Ownership
                  </Badge>
                  {debugMode && (
                    <Badge variant="outline" className="rounded-full border-amber-500 text-amber-600 dark:text-amber-400 text-[10px]" data-testid="badge-debug">
                      DEBUG
                    </Badge>
                  )}
                </div>
                <h1
                  className="mt-2 font-serif text-3xl tracking-tight sm:text-4xl"
                  data-testid="text-title"
                >
                  TCO Micro-Assessment Platform
                </h1>
                <p
                  className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground"
                  data-testid="text-subtitle"
                >
                  {activeTab === "home"
                    ? "Two distinct assessment paths to help you understand your current EUC environment. Each has a specific mandate and guardrails to keep it true to its intended purpose."
                    : "Define your current state with transparent inputs, explicit assumptions, and defensible math. This produces a baseline only—no future-state scenarios, no savings narratives."}
                </p>
              </div>

              <div className="flex flex-col items-stretch gap-2 sm:items-end">
                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <div className="flex items-center gap-3">
                    {debugMode && (
                      <Badge variant="outline" className="border-amber-400 text-amber-600 dark:text-amber-400 text-[10px]">
                        DEBUG
                      </Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" data-testid="button-tools">
                          <Wrench className="h-4 w-4 mr-1" /> Tools
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={generateIntakeForm} data-testid="menu-generate-intake">
                          <FileDown className="h-4 w-4 mr-2" /> Generate Intake Form
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={importIntakeData} data-testid="menu-import-intake">
                          <FileUp className="h-4 w-4 mr-2" /> Import Intake Data
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault();
                            setDark(!dark);
                          }}
                          data-testid="menu-toggle-theme"
                        >
                          {dark ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                          {dark ? "Light Mode" : "Dark Mode"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault();
                            const next = !debugMode;
                            setDebugMode(next);
                            localStorage.setItem("tco-debug-mode", String(next));
                            if (!next && activeTab === "audit") setActiveTab("home");
                          }}
                          data-testid="menu-toggle-debug"
                        >
                          <Bug className="h-4 w-4 mr-2" />
                          {debugMode ? "Disable Debug Mode" : "Enable Debug Mode"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setHelpDialogOpen(true)} data-testid="menu-help">
                          <HelpCircle className="h-4 w-4 mr-2" /> Help
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAboutDialogOpen(true)} data-testid="menu-about">
                          <Info className="h-4 w-4 mr-2" /> About
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {activeTab !== "home" && hasAnyData && (
                  <div className="flex items-center gap-2 sm:justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setRestartDialogOpen(true)}
                      data-testid="button-restart-assessment"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" /> Restart Assessment
                    </Button>
                    <Dialog open={restartDialogOpen} onOpenChange={setRestartDialogOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle data-testid="text-restart-title">Restart Assessment?</DialogTitle>
                          <DialogDescription data-testid="text-restart-description">
                            This will clear all of your current selections and progress. This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setRestartDialogOpen(false)} data-testid="button-restart-cancel">
                            Cancel
                          </Button>
                          <Button variant="destructive" onClick={clearAll} data-testid="button-restart-confirm">
                            Restart
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}

              </div>
            </div>

            {activeTab !== "home" && (
              <>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <MiniKpi
                    label="Total endpoints"
                    value={fmtNumber(derived.endpoints)}
                    hint="Derived from device counts"
                    testId="kpi-endpoints"
                  />
                  <MiniKpi
                    label="Annual baseline TCO"
                    value={fmtMoney(derived.totalAnnualTco)}
                    hint="Labor + licensing + overhead"
                    testId="kpi-total-tco"
                  />
                  <MiniKpi
                    label="Cost per endpoint"
                    value={derived.endpoints > 0 ? fmtMoney(derived.costPerEndpoint) : "$0"}
                    hint="Baseline ÷ endpoints"
                    testId="kpi-cost-per-endpoint"
                  />
                </div>

              </>
            )}
          </motion.div>
        </header>

        <main className="mt-8 grid gap-6">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as typeof activeTab)}
            className="w-full"
            data-testid="tabs-root"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {activeTab === "home" ? null : (
                <TabsList className="rounded-2xl" data-testid="tabs-list">
                  <TabsTrigger value="home" data-testid="tab-home">
                    Home
                  </TabsTrigger>
                  <TabsTrigger value="inputs" data-testid="tab-inputs">
                    Inputs
                  </TabsTrigger>
                  <TabsTrigger value="assumptions" data-testid="tab-assumptions">
                    Assumptions
                  </TabsTrigger>
                  <TabsTrigger value="observations" data-testid="tab-observations">
                    Observations & Analysis
                  </TabsTrigger>
                  <TabsTrigger value="summary" data-testid="tab-summary">
                    Summary
                  </TabsTrigger>
                  <TabsTrigger value="readme" data-testid="tab-tools">
                    Tools
                  </TabsTrigger>
                  {debugMode && (
                    <TabsTrigger value="audit" data-testid="tab-audit">
                      Audit / Trace
                    </TabsTrigger>
                  )}
                </TabsList>
              )}

              {activeTab !== "home" && (
                <div
                  className="flex w-full items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-3 py-2 sm:w-auto sm:min-w-[280px]"
                  data-testid="readiness-panel"
                >
                  <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Readiness</span>
                  <span
                    className={cn(
                      "text-xs font-semibold whitespace-nowrap",
                      derived.readinessScore >= 100
                        ? "text-green-600 dark:text-green-400"
                        : derived.readinessScore >= 50
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-red-600 dark:text-red-400"
                    )}
                    data-testid="text-readiness"
                  >
                    {derived.readinessScore >= 100
                      ? "Ready"
                      : derived.readinessScore >= 50
                        ? "In progress"
                        : "Not ready"}
                  </span>
                  <div className="flex-1 min-w-[80px]">
                    <Progress value={derived.readinessScore} className="h-2" data-testid="progress-readiness" />
                  </div>
                  <span className="kbd text-xs" data-testid="kbd-score">
                    {derived.readinessScore}/100
                  </span>
                </div>
              )}
            </div>

            <TabsContent value="home" className="mt-5" data-testid="panel-home">
              <TcoHome
                onStartBaseline={() => {
                  const id = createDraft();
                  setCurrentDraftId(id);
                  setActiveTab("inputs");
                }}
                onStartTour={handleStartTour}
                drafts={drafts}
                onResumeDraft={(id) => {
                  const data = hydrateFromDraft(id);
                  setCurrentDraftId(id);
                  const validTabs = ["inputs", "assumptions", "observations", "summary", "readme"] as const;
                  const savedTab = (data as any)?.activeTab as typeof validTabs[number] | undefined;
                  setActiveTab(savedTab && validTabs.includes(savedTab) ? savedTab : "inputs");
                }}
                onDeleteDraft={(id) => {
                  deleteDraft(id);
                  setDrafts(getDraftIndex());
                  if (currentDraftId === id) {
                    setCurrentDraftId(null);
                  }
                }}
              />
            </TabsContent>

            <TabsContent value="inputs" className="mt-5" data-testid="panel-inputs">
              <div className="grid gap-6">
                <Card className="glass hairline rounded-3xl p-6">
                  <SectionHeader
                    icon={<ClipboardCheck className="h-5 w-5 text-primary" />}
                    eyebrow="Inputs"
                    title="Project Information"
                    description="Identify the assessment for documentation and traceability."
                    testId="header-project"
                  />

                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientName" data-testid="label-clientname">
                        Client name
                      </Label>
                      <Input
                        id="clientName"
                        placeholder="e.g., Acme Corp"
                        value={inputs.project.clientName ?? ""}
                        onChange={(e) =>
                          setInputs((s) => ({
                            ...s,
                            project: { ...s.project, clientName: e.target.value || undefined },
                          }))
                        }
                        data-testid="input-clientname"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assessmentDate" data-testid="label-assessmentdate">
                        Assessment date
                      </Label>
                      <Input
                        id="assessmentDate"
                        type="date"
                        value={inputs.project.assessmentDate ?? ""}
                        onChange={(e) =>
                          setInputs((s) => ({
                            ...s,
                            project: { ...s.project, assessmentDate: e.target.value || undefined },
                          }))
                        }
                        data-testid="input-assessmentdate"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="champion" data-testid="label-champion">
                        Customer champion
                      </Label>
                      <Input
                        id="champion"
                        placeholder="e.g., John Smith"
                        value={inputs.project.customerChampion ?? ""}
                        onChange={(e) =>
                          setInputs((s) => ({
                            ...s,
                            project: { ...s.project, customerChampion: e.target.value || undefined },
                          }))
                        }
                        data-testid="input-champion"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="engineer" data-testid="label-engineer">
                        XenTegra engineer
                      </Label>
                      <Input
                        id="engineer"
                        placeholder="e.g., Jane Doe"
                        value={inputs.project.engineerName ?? ""}
                        onChange={(e) =>
                          setInputs((s) => ({
                            ...s,
                            project: { ...s.project, engineerName: e.target.value || undefined },
                          }))
                        }
                        data-testid="input-engineer"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-start gap-4" data-testid="logo-upload-section">
                    <div className="flex-1 space-y-2">
                      <Label data-testid="label-client-logo">Client logo (optional)</Label>
                      <div className="flex items-center gap-3">
                        {clientLogo ? (
                          <div className="flex items-center gap-3">
                            <img
                              src={clientLogo}
                              alt="Client logo"
                              className="h-10 max-w-[120px] object-contain rounded border border-border bg-white p-1"
                              data-testid="img-client-logo-preview"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={removeClientLogo}
                              className="text-muted-foreground hover:text-destructive"
                              data-testid="button-remove-logo"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept=".png,.jpg,.jpeg,.svg,.webp"
                              onChange={handleLogoUpload}
                              className="hidden"
                              data-testid="input-client-logo"
                            />
                            <div className="inline-flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                              <ImagePlus className="h-4 w-4" />
                              Upload logo
                            </div>
                          </label>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, SVG, or WebP — max 500 KB. Best at 200 × 60 px or similar wide format.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="glass hairline rounded-3xl p-6">
                  <SectionHeader
                    icon={<ClipboardCheck className="h-5 w-5 text-primary" />}
                    eyebrow="Inputs"
                    title="Environment Facts"
                    description="Enter what you know. Leave unknowns blank—assumptions will be explicit and challengeable."
                    testId="header-inputs"
                  />

                  <div className="mt-6 space-y-5">
                    <div className="space-y-2" data-testid="group-total-users">
                      <Label htmlFor="userCount" data-testid="label-usercount">
                        Total users
                      </Label>
                      <Input
                        id="userCount"
                        className="max-w-[240px]"
                        placeholder="e.g., 1500"
                        {...numberField(inputs.environment.userCount, (v) =>
                          setInputs((s) => ({
                            ...s,
                            environment: { ...s.environment, userCount: nonNeg(v) },
                          })),
                        )}
                        data-testid="input-usercount"
                      />
                    </div>

                    <div className="space-y-5" data-testid="group-devices">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold" data-testid="text-devices-title">
                            End-user devices
                          </div>
                          <div className="text-xs text-muted-foreground" data-testid="text-devices-subtitle">
                            Counts only. No pricing here.
                          </div>
                        </div>
                        {derived.endpoints > 0 && (
                          <Badge
                            variant="outline"
                            className="rounded-full"
                            data-testid="badge-endpoints"
                          >
                            {fmtNumber(derived.endpoints)} endpoints
                          </Badge>
                        )}
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="laptops" data-testid="label-laptops">
                            Laptops
                          </Label>
                          <Input
                            id="laptops"
                            placeholder="e.g., 1200"
                            {...numberField(inputs.environment.laptopCount, (v) =>
                              setInputs((s) => ({
                                ...s,
                                environment: { ...s.environment, laptopCount: nonNeg(v) },
                              })),
                            )}
                            data-testid="input-laptops"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="desktops" data-testid="label-desktops">
                            Desktops
                          </Label>
                          <Input
                            id="desktops"
                            placeholder="e.g., 350"
                            {...numberField(inputs.environment.desktopCount, (v) =>
                              setInputs((s) => ({
                                ...s,
                                environment: { ...s.environment, desktopCount: nonNeg(v) },
                              })),
                            )}
                            data-testid="input-desktops"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="thinClients" data-testid="label-thinclients">
                            Thin clients
                          </Label>
                          <Input
                            id="thinClients"
                            placeholder="e.g., 80"
                            {...numberField(inputs.environment.thinClientCount, (v) =>
                              setInputs((s) => ({
                                ...s,
                                environment: { ...s.environment, thinClientCount: nonNeg(v) },
                              })),
                            )}
                            data-testid="input-thinclients"
                          />
                        </div>
                      </div>
                    </div>

                    <InlineInfo
                      title="How This Works"
                      body="Enter device counts here — they drive annualized hardware cost via Assumptions. Add vendors & costs in EUC Pillars below — those become your real spend data. Use Overrides if you have known annual spend that should replace derived calculations."
                      icon={<BookOpen className="h-4 w-4" />}
                      testId="info-environment"
                    />
                  </div>
                </Card>

                <Card className="glass hairline rounded-3xl p-6">
                  <SectionHeader
                    icon={<Activity className="h-5 w-5 text-primary" />}
                    eyebrow="Inputs"
                    title="EUC Pillars - Platform Cost Rollups (Optional Overrides)"
                    description="If you know total annual spend for a category, enter it here to override the calculated value. Otherwise, the tool calculates from environment data, EUC Pillar vendor costs, and assumptions."
                    testId="header-rollups"
                  />

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="space-y-4" data-testid="group-rollups-1">
                      <div className="text-sm font-semibold" data-testid="text-rollups-title">
                        Access & Infrastructure
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="rollup-devices" data-testid="label-rollup-devices">
                            End-User Devices (Access)
                          </Label>
                          <Input
                            id="rollup-devices"
                            placeholder={`derived: ${fmtMoney(derived.endUserDevicesValue)}`}
                            {...numberField(inputs.categoryRollups.endUserDevicesAnnual, (v) =>
                              setInputs((s) => ({
                                ...s,
                                categoryRollups: {
                                  ...s.categoryRollups,
                                  endUserDevicesAnnual: nonNeg(v),
                                },
                              })),
                            )}
                            data-testid="input-rollup-devices"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="rollup-support" data-testid="label-rollup-support">
                            Support & Ops
                          </Label>
                          <Input
                            id="rollup-support"
                            placeholder={`derived: ${fmtMoney(derived.supportOpsValue)}`}
                            {...numberField(inputs.categoryRollups.supportOpsAnnual, (v) =>
                              setInputs((s) => ({
                                ...s,
                                categoryRollups: {
                                  ...s.categoryRollups,
                                  supportOpsAnnual: nonNeg(v),
                                },
                              })),
                            )}
                            data-testid="input-rollup-support"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="rollup-licensing" data-testid="label-rollup-licensing">
                            Licensing (Collaboration, AI & Apps)
                          </Label>
                          <Input
                            id="rollup-licensing"
                            placeholder={`derived: ${fmtMoney(derived.licensingValue)}`}
                            {...numberField(inputs.categoryRollups.licensingAnnual, (v) =>
                              setInputs((s) => ({
                                ...s,
                                categoryRollups: {
                                  ...s.categoryRollups,
                                  licensingAnnual: nonNeg(v),
                                },
                              })),
                            )}
                            data-testid="input-rollup-licensing"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4" data-testid="group-rollups-2">
                      <div className="text-sm font-semibold" data-testid="text-rollups-title-2">
                        Management, Security & VDI
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="rollup-mgmt" data-testid="label-rollup-mgmt">
                            Device, OS & User Mgmt + Security
                          </Label>
                          <Input
                            id="rollup-mgmt"
                            placeholder={`derived: ${fmtMoney(derived.mgmtSecurityValue)}`}
                            {...numberField(inputs.categoryRollups.mgmtSecurityAnnual, (v) =>
                              setInputs((s) => ({
                                ...s,
                                categoryRollups: {
                                  ...s.categoryRollups,
                                  mgmtSecurityAnnual: nonNeg(v),
                                },
                              })),
                            )}
                            data-testid="input-rollup-mgmt"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="rollup-vdi" data-testid="label-rollup-vdi">
                            Virtual Desktops & Applications
                          </Label>
                          <Input
                            id="rollup-vdi"
                            placeholder={`derived: ${fmtMoney(derived.vdiDaasValue)}`}
                            {...numberField(inputs.categoryRollups.vdiDaasAnnual, (v) =>
                              setInputs((s) => ({
                                ...s,
                                categoryRollups: {
                                  ...s.categoryRollups,
                                  vdiDaasAnnual: nonNeg(v),
                                },
                              })),
                            )}
                            data-testid="input-rollup-vdi"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="rollup-overhead" data-testid="label-rollup-overhead">
                            Overhead
                          </Label>
                          <Input
                            id="rollup-overhead"
                            placeholder={`derived: ${fmtMoney(derived.overheadValue)}`}
                            {...numberField(inputs.categoryRollups.overheadAnnual, (v) =>
                              setInputs((s) => ({
                                ...s,
                                categoryRollups: {
                                  ...s.categoryRollups,
                                  overheadAnnual: nonNeg(v),
                                },
                              })),
                            )}
                            data-testid="input-rollup-overhead"
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  <div className="mt-4">
                    <InlineInfo
                      title="How this works"
                      body="These rollup fields let you override any calculated cost category with a known annual spend. When blank, the tool uses EUC Pillar vendor costs (if entered) or falls back to industry-standard assumptions. Overrides take highest priority, then actual vendor costs from pillars, then calculated assumptions."
                      icon={<BookOpen className="h-4 w-4" />}
                      testId="info-rollups"
                    />
                  </div>
                </Card>

                <Card className="glass hairline rounded-3xl p-6">
                  <SectionHeader
                    icon={<Activity className="h-5 w-5 text-primary" />}
                    eyebrow="Inputs"
                    title="EUC Pillars & Platforms"
                    description="Capture vendor costs organized by EUC domain. Costs flow into the TCO baseline, replacing assumptions with real spend data."
                    testId="header-euc-pillars"
                  />

                  <div className="mt-6">
                    <HexagridSection
                      entries={inputs.hexagridEntries}
                      onChange={(entries) =>
                        setInputs((s) => ({ ...s, hexagridEntries: entries }))
                      }
                      vdiUserCounts={inputs.vdiUserCounts}
                      onVdiUserCountsChange={(counts) =>
                        setInputs((s) => ({ ...s, vdiUserCounts: counts }))
                      }
                    />

                    {derived.hexagridTotal > 0 && (
                      <div className="mt-4 rounded-2xl border bg-card/60 p-4" data-testid="panel-hexgrid-total">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">EUC Pillars vendor spend total</span>
                          <Badge variant="secondary" className="rounded-full text-sm" data-testid="badge-hexgrid-total">
                            {fmtMoney(derived.hexagridTotal)}
                          </Badge>
                        </div>
                      </div>
                    )}

                    <div className="mt-4">
                      <InlineInfo
                        title="How This Works"
                        body="Add vendors under each EUC pillar with their annual cost. Costs from Device Management, Security, and Virtual Desktops pillars replace assumption-based estimates. Leave pillars empty to use industry-standard assumptions."
                        icon={<BookOpen className="h-4 w-4" />}
                        testId="info-hexagrid"
                      />
                    </div>
                  </div>
                </Card>

                <Card className="glass hairline rounded-3xl p-6">
                  <SectionHeader
                    icon={<Activity className="h-5 w-5 text-primary" />}
                    eyebrow="Inputs"
                    title="Outsourced Services & MSP"
                    description="Capture any outsourced EUC functions, MSP providers, and annual managed-services spend."
                    testId="header-managed-services"
                  />

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="space-y-4" data-testid="group-msp-spend">
                      <div className="text-sm font-semibold">Annual spend</div>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="msp-total">Total MSP / managed services</Label>
                          <Input
                            id="msp-total"
                            placeholder="e.g., 250000"
                            {...numberField(inputs.managedServices.totalAnnualSpend, (v) =>
                              setInputs((s) => ({
                                ...s,
                                managedServices: {
                                  ...s.managedServices,
                                  totalAnnualSpend: nonNeg(v),
                                },
                              })),
                            )}
                            data-testid="input-msp-total"
                          />
                        </div>
                      </div>

                      {(inputs.managedServices.totalAnnualSpend ?? 0) > 0 && (
                        <div className="rounded-2xl border bg-card/60 p-4">
                          <div className="text-sm font-semibold">Derived cost metrics</div>
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <div className="rounded-xl border bg-card px-3 py-2">
                              <div className="text-xs text-muted-foreground">Per device</div>
                              <div className="text-sm font-semibold">
                                {derived.endpoints > 0 ? fmtMoney(derived.mspCostPerDevice) : "—"}
                              </div>
                              {derived.endpoints === 0 && (
                                <div className="text-xs text-muted-foreground mt-1">Enter device counts above</div>
                              )}
                            </div>
                            <div className="rounded-xl border bg-card px-3 py-2">
                              <div className="text-xs text-muted-foreground">Per user</div>
                              <div className="text-sm font-semibold">
                                {derived.userCount > 0 ? fmtMoney(derived.mspCostPerUser) : "—"}
                              </div>
                              {derived.userCount === 0 && (
                                <div className="text-xs text-muted-foreground mt-1">Enter user count above</div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3 mt-4">
                        <div className="text-sm font-semibold">MSP Provider</div>
                        <div className="rounded-2xl border bg-card/60 p-4">
                          <div className="grid gap-3">
                            <div className="flex items-center gap-3" data-testid="row-msp-xentegra">
                              <input
                                type="checkbox"
                                id="msp-xentegra"
                                checked={inputs.managedServices.mspXentegra}
                                onChange={(e) =>
                                  setInputs((s) => ({
                                    ...s,
                                    managedServices: {
                                      ...s.managedServices,
                                      mspXentegra: e.target.checked,
                                    },
                                  }))
                                }
                                className="h-4 w-4 rounded border-gray-300 accent-primary"
                                data-testid="checkbox-msp-xentegra"
                              />
                              <Label htmlFor="msp-xentegra" className="cursor-pointer text-sm">
                                XenTegra
                              </Label>
                            </div>
                            <div className="flex items-center gap-3" data-testid="row-msp-other">
                              <input
                                type="checkbox"
                                id="msp-other-provider"
                                checked={inputs.managedServices.mspOther}
                                onChange={(e) =>
                                  setInputs((s) => ({
                                    ...s,
                                    managedServices: {
                                      ...s.managedServices,
                                      mspOther: e.target.checked,
                                      mspOtherProviders: e.target.checked ? s.managedServices.mspOtherProviders : [],
                                    },
                                  }))
                                }
                                className="h-4 w-4 rounded border-gray-300 accent-primary"
                                data-testid="checkbox-msp-other"
                              />
                              <Label htmlFor="msp-other-provider" className="cursor-pointer text-sm">
                                Other
                              </Label>
                            </div>
                          </div>
                          {inputs.managedServices.mspOther && (
                            <div className="mt-3 space-y-2">
                              {inputs.managedServices.mspOtherProviders.map((prov, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <Input
                                    className="h-7 text-xs flex-1"
                                    placeholder="Provider name..."
                                    value={prov}
                                    onChange={(e) =>
                                      setInputs((s) => {
                                        const updated = [...s.managedServices.mspOtherProviders];
                                        updated[idx] = e.target.value;
                                        return {
                                          ...s,
                                          managedServices: { ...s.managedServices, mspOtherProviders: updated },
                                        };
                                      })
                                    }
                                    data-testid={`input-msp-provider-${idx}`}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                    onClick={() =>
                                      setInputs((s) => ({
                                        ...s,
                                        managedServices: {
                                          ...s.managedServices,
                                          mspOtherProviders: s.managedServices.mspOtherProviders.filter((_, i) => i !== idx),
                                        },
                                      }))
                                    }
                                    data-testid={`button-remove-provider-${idx}`}
                                  >
                                    ×
                                  </Button>
                                </div>
                              ))}
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() =>
                                  setInputs((s) => ({
                                    ...s,
                                    managedServices: {
                                      ...s.managedServices,
                                      mspOtherProviders: [...s.managedServices.mspOtherProviders, ""],
                                    },
                                  }))
                                }
                                data-testid="button-add-provider"
                              >
                                + Add provider
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4" data-testid="group-msp-services">
                      <div className="text-sm font-semibold">What's outsourced?</div>
                      <div className="rounded-2xl border bg-card/60 p-4">
                        <div className="grid gap-3">
                          {([
                            { k: "outsourcedEndpointMgmt", label: "Endpoint management (UEM, imaging, lifecycle)" },
                            { k: "outsourcedSecurity", label: "Security / EDR / SOC" },
                            { k: "outsourcedPatching", label: "Patching & updates" },
                            { k: "outsourcedHelpdesk", label: "Tier 1 Support / Helpdesk" },
                            { k: "outsourcedTier2Plus", label: "Tier 2+ Support / Engineering" },
                            { k: "outsourcedOther", label: "Other" },
                          ] as const).map((row) => (
                            <div
                              key={row.k}
                              className="flex items-center gap-3"
                              data-testid={`row-msp-${row.k}`}
                            >
                              <input
                                type="checkbox"
                                id={row.k}
                                checked={Boolean(inputs.managedServices[row.k as keyof typeof inputs.managedServices])}
                                onChange={(e) =>
                                  setInputs((s) => ({
                                    ...s,
                                    managedServices: {
                                      ...s.managedServices,
                                      [row.k]: e.target.checked,
                                    },
                                  }))
                                }
                                className="h-4 w-4 rounded border-gray-300 accent-primary"
                                data-testid={`checkbox-${row.k}`}
                              />
                              <Label htmlFor={row.k} className="cursor-pointer text-sm">
                                {row.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                        {inputs.managedServices.outsourcedOther && (
                          <div className="mt-3">
                            <Input
                              placeholder="Describe other outsourced services"
                              value={inputs.managedServices.otherDescription ?? ""}
                              onChange={(e) =>
                                setInputs((s) => ({
                                  ...s,
                                  managedServices: {
                                    ...s.managedServices,
                                    otherDescription: e.target.value,
                                  },
                                }))
                              }
                              data-testid="input-msp-other-desc"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <InlineInfo
                      title="How this works"
                      body="Managed services spend is part of your total baseline TCO. Identify which functions are outsourced and to which providers so the cost picture is complete and traceable."
                      icon={<BookOpen className="h-4 w-4" />}
                      testId="info-msp"
                    />
                  </div>
                </Card>

              </div>
              <TabNav current="inputs" />
            </TabsContent>

            <TabsContent value="assumptions" className="mt-5" data-testid="panel-assumptions">
              <Card className="glass hairline rounded-3xl p-6">
                <SectionHeader
                  icon={<BookOpen className="h-5 w-5 text-primary" />}
                  eyebrow="Assumptions"
                  title="Explicit, Labeled, Overrideable"
                  description="These values are used only when an input is missing. Inputs always override assumptions."
                  testId="header-assumptions"
                  right={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadJustificationReport}
                      className="flex items-center gap-2"
                      data-testid="btn-export-justifications"
                    >
                      <FileText className="h-4 w-4" />
                      Export Justifications
                    </Button>
                  }
                />

                <div className="mt-6 grid gap-6 lg:grid-cols-3">
                  <div className="rounded-2xl border bg-card/60 p-4" data-testid="card-assumptions-devices">
                    <div className="text-sm font-semibold" data-testid="text-assump-devices-title">
                      Device refresh & cost
                    </div>
                    <div className="mt-4 grid gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="a-laptop-refresh" data-testid="label-a-laptop-refresh">
                          Laptop refresh (years)
                        </Label>
                        <Input
                          id="a-laptop-refresh"
                          {...numberField(assumptions.deviceRefreshYears.laptop, (v) =>
                            setAssumptions((s) => ({
                              ...s,
                              deviceRefreshYears: {
                                ...s.deviceRefreshYears,
                                laptop: Math.max(1, nonNeg(v) ?? 3),
                              },
                            })),
                          )}
                          data-testid="input-a-laptop-refresh"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="a-laptop-cost" data-testid="label-a-laptop-cost">
                          Laptop unit cost ($)
                        </Label>
                        <Input
                          id="a-laptop-cost"
                          {...numberField(assumptions.deviceUnitCost.laptop, (v) =>
                            setAssumptions((s) => ({
                              ...s,
                              deviceUnitCost: {
                                ...s.deviceUnitCost,
                                laptop: nonNeg(v) ?? 1200,
                              },
                            })),
                          )}
                          data-testid="input-a-laptop-cost"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="a-desktop-refresh" data-testid="label-a-desktop-refresh">
                          Desktop refresh (years)
                        </Label>
                        <Input
                          id="a-desktop-refresh"
                          {...numberField(assumptions.deviceRefreshYears.desktop, (v) =>
                            setAssumptions((s) => ({
                              ...s,
                              deviceRefreshYears: {
                                ...s.deviceRefreshYears,
                                desktop: Math.max(1, nonNeg(v) ?? 3),
                              },
                            })),
                          )}
                          data-testid="input-a-desktop-refresh"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="a-desktop-cost" data-testid="label-a-desktop-cost">
                          Desktop unit cost ($)
                        </Label>
                        <Input
                          id="a-desktop-cost"
                          {...numberField(assumptions.deviceUnitCost.desktop, (v) =>
                            setAssumptions((s) => ({
                              ...s,
                              deviceUnitCost: {
                                ...s.deviceUnitCost,
                                desktop: nonNeg(v) ?? 1100,
                              },
                            })),
                          )}
                          data-testid="input-a-desktop-cost"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="a-thin-refresh" data-testid="label-a-thin-refresh">
                          Thin client refresh (years)
                        </Label>
                        <Input
                          id="a-thin-refresh"
                          {...numberField(assumptions.deviceRefreshYears.thinClient, (v) =>
                            setAssumptions((s) => ({
                              ...s,
                              deviceRefreshYears: {
                                ...s.deviceRefreshYears,
                                thinClient: Math.max(1, nonNeg(v) ?? 5),
                              },
                            })),
                          )}
                          data-testid="input-a-thin-refresh"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="a-thin-cost" data-testid="label-a-thin-cost">
                          Thin client unit cost ($)
                        </Label>
                        <Input
                          id="a-thin-cost"
                          {...numberField(assumptions.deviceUnitCost.thinClient, (v) =>
                            setAssumptions((s) => ({
                              ...s,
                              deviceUnitCost: {
                                ...s.deviceUnitCost,
                                thinClient: nonNeg(v) ?? 600,
                              },
                            })),
                          )}
                          data-testid="input-a-thin-cost"
                        />
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground" data-testid="text-assump-devices-hint">
                      Used to calculate annualized device costs.
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-card/60 p-4" data-testid="card-assumptions-support">
                    <div className="text-sm font-semibold" data-testid="text-assump-support-title">
                      Support & operations
                    </div>
                    <div className="mt-4 grid gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="a-tickets" data-testid="label-a-tickets">
                          Tickets per endpoint/year
                        </Label>
                        <Input
                          id="a-tickets"
                          {...numberField(assumptions.supportOps.ticketsPerEndpointPerYear, (v) =>
                            setAssumptions((s) => ({
                              ...s,
                              supportOps: {
                                ...s.supportOps,
                                ticketsPerEndpointPerYear: nonNeg(v) ?? 2,
                              },
                            })),
                          )}
                          data-testid="input-a-tickets"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="a-ticket-hours" data-testid="label-a-ticket-hours">
                          Avg ticket handling hours
                        </Label>
                        <Input
                          id="a-ticket-hours"
                          {...numberField(assumptions.supportOps.avgTicketHandlingHours, (v) =>
                            setAssumptions((s) => ({
                              ...s,
                              supportOps: {
                                ...s.supportOps,
                                avgTicketHandlingHours: nonNeg(v) ?? 0.5,
                              },
                            })),
                          )}
                          data-testid="input-a-ticket-hours"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="a-deploy-hours" data-testid="label-a-deploy-hours">
                          Deployment hours/device
                        </Label>
                        <Input
                          id="a-deploy-hours"
                          {...numberField(assumptions.supportOps.deploymentHoursPerDevice, (v) =>
                            setAssumptions((s) => ({
                              ...s,
                              supportOps: {
                                ...s.supportOps,
                                deploymentHoursPerDevice: nonNeg(v) ?? 1.5,
                              },
                            })),
                          )}
                          data-testid="input-a-deploy-hours"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="a-labor-rate" data-testid="label-a-labor-rate">
                          Blended labor rate ($/hr)
                        </Label>
                        <Input
                          id="a-labor-rate"
                          {...numberField(assumptions.supportOps.blendedLaborRateHourly, (v) =>
                            setAssumptions((s) => ({
                              ...s,
                              supportOps: {
                                ...s.supportOps,
                                blendedLaborRateHourly: nonNeg(v) ?? 50,
                              },
                            })),
                          )}
                          data-testid="input-a-labor-rate"
                        />
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground" data-testid="text-assump-support-hint">
                      Used to calculate support & ops costs if not provided.
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-card/60 p-4" data-testid="card-assumptions-other">
                    <div className="text-sm font-semibold" data-testid="text-assump-other-title">
                      Licensing, VDI & Overhead
                    </div>
                    <div className="mt-4 grid gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="a-lic-user" data-testid="label-a-lic-user">
                          Licensing $/user/year
                        </Label>
                        <Input
                          id="a-lic-user"
                          {...numberField(assumptions.licensing.avgCostPerUserPerYear, (v) =>
                            setAssumptions((s) => ({
                              ...s,
                              licensing: {
                                ...s.licensing,
                                avgCostPerUserPerYear: nonNeg(v) ?? 400,
                              },
                            })),
                          )}
                          data-testid="input-a-lic-user"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="a-mgmt-endpoint" data-testid="label-a-mgmt-endpoint">
                          Mgmt & Security $/endpoint/year
                        </Label>
                        <Input
                          id="a-mgmt-endpoint"
                          {...numberField(assumptions.mgmtSecurity.costPerEndpointPerYear, (v) =>
                            setAssumptions((s) => ({
                              ...s,
                              mgmtSecurity: {
                                ...s.mgmtSecurity,
                                costPerEndpointPerYear: nonNeg(v) ?? 200,
                              },
                            })),
                          )}
                          data-testid="input-a-mgmt-endpoint"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="a-vdi-user" data-testid="label-a-vdi-user">
                          VDI/DaaS $/user/year
                        </Label>
                        <Input
                          id="a-vdi-user"
                          {...numberField(assumptions.vdi.platformCostPerVdiUserPerYear, (v) =>
                            setAssumptions((s) => ({
                              ...s,
                              vdi: {
                                ...s.vdi,
                                platformCostPerVdiUserPerYear: nonNeg(v) ?? 800,
                              },
                            })),
                          )}
                          data-testid="input-a-vdi-user"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="a-overhead-pct" data-testid="label-a-overhead-pct">
                          Overhead % of total
                        </Label>
                        <Input
                          id="a-overhead-pct"
                          value={Math.round(assumptions.overhead.pctOfTotal * 100)}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw.trim() === "") {
                              setAssumptions((s) => ({ ...s, overhead: { ...s.overhead, pctOfTotal: 0.07 } }));
                              return;
                            }
                            const next = Number(raw);
                            if (!Number.isFinite(next)) return;
                            setAssumptions((s) => ({
                              ...s,
                              overhead: { ...s.overhead, pctOfTotal: Math.max(0, next) / 100 },
                            }));
                          }}
                          type="text"
                          inputMode="numeric"
                          data-testid="input-a-overhead-pct"
                        />
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground" data-testid="text-assump-other-hint">
                      Applied when category rollups are not provided.
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <InlineInfo
                  title="How this works"
                  body="Input present → use input. Input missing → use assumption. Input always overrides assumption."
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  testId="info-logic"
                />
              </Card>
              <TabNav current="assumptions" />
            </TabsContent>

            <TabsContent value="observations" className="mt-5" data-testid="panel-observations">
              <Card className="glass hairline rounded-3xl p-6">
                <SectionHeader
                  icon={<Sparkles className="h-5 w-5 text-primary" />}
                  eyebrow="Observations & Analysis"
                  title="Human Commentary and Trace"
                  description="This is the defensibility layer: capture caveats and show the math behind each line item."
                  testId="header-observations"
                />

                <div className="mt-6 grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2 space-y-6">
                    <div data-testid="section-notes-caveats">
                      <div className="flex items-center justify-between">
                        <Label data-testid="label-notes">Notes & Caveats</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() =>
                            setInputs((s) => ({
                              ...s,
                              observations: {
                                ...s.observations,
                                notes: [...s.observations.notes, { observation: "", details: "" }],
                              },
                            }))
                          }
                          data-testid="button-add-note"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add Note
                        </Button>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground" data-testid="text-notes-hint">
                        This section does not affect calculations.
                      </div>

                      {inputs.observations.notes.length === 0 && (
                        <div className="mt-4 text-sm text-muted-foreground italic" data-testid="text-notes-empty">
                          No notes yet. Click "Add Note" to capture an observation.
                        </div>
                      )}

                      <div className="mt-4 space-y-4">
                        {inputs.observations.notes.map((note, idx) => (
                          <div
                            key={idx}
                            className="rounded-2xl border bg-card/60 p-4 space-y-3"
                            data-testid={`note-card-${idx}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 space-y-3">
                                <div>
                                  <Label htmlFor={`obs-${idx}`} className="text-xs text-muted-foreground">
                                    Observation
                                  </Label>
                                  <Input
                                    id={`obs-${idx}`}
                                    placeholder="What did you observe?"
                                    className="mt-1"
                                    value={note.observation}
                                    onChange={(e) =>
                                      setInputs((s) => {
                                        const updated = [...s.observations.notes];
                                        updated[idx] = { ...updated[idx], observation: e.target.value };
                                        return { ...s, observations: { ...s.observations, notes: updated } };
                                      })
                                    }
                                    data-testid={`input-observation-${idx}`}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`details-${idx}`} className="text-xs text-muted-foreground">
                                    Details
                                  </Label>
                                  <Textarea
                                    id={`details-${idx}`}
                                    placeholder="Additional context, caveats, or supporting notes..."
                                    className="mt-1 min-h-16"
                                    value={note.details}
                                    onChange={(e) =>
                                      setInputs((s) => {
                                        const updated = [...s.observations.notes];
                                        updated[idx] = { ...updated[idx], details: e.target.value };
                                        return { ...s, observations: { ...s.observations, notes: updated } };
                                      })
                                    }
                                    data-testid={`textarea-details-${idx}`}
                                  />
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0 mt-5"
                                onClick={() =>
                                  setInputs((s) => ({
                                    ...s,
                                    observations: {
                                      ...s.observations,
                                      notes: s.observations.notes.filter((_, i) => i !== idx),
                                    },
                                  }))
                                }
                                data-testid={`button-delete-note-${idx}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4" data-testid="trace-section">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">Calculation trace</div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={downloadAuditTrail}
                          data-testid="button-export-audit"
                        >
                          <FileDown className="h-4 w-4" /> Export audit trail
                        </Button>
                      </div>
                      {[
                        { title: "Cost Categories", lines: derived.categoryLines },
                        { title: "Managed Services", lines: derived.managedServicesLines },
                      ].map((block) => (
                        <div
                          key={block.title}
                          className="rounded-2xl border bg-card/60"
                          data-testid={`trace-block-${block.title.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          <div className="flex items-center justify-between px-4 py-3">
                            <div className="text-sm font-semibold" data-testid={`text-trace-title-${block.title.toLowerCase().replace(/\s+/g, "-")}`}>
                              {block.title}
                            </div>
                            <Badge
                              variant="secondary"
                              className="rounded-full"
                              data-testid={`badge-trace-${block.title.toLowerCase().replace(/\s+/g, "-")}`}
                            >
                              {block.lines.filter((l) => l.isAssumed).length} assumed
                            </Badge>
                          </div>
                          <Separator />
                          <div className="divide-y">
                            {block.lines.map((l) => (
                              <div
                                key={l.key}
                                className="px-4 py-3"
                                data-testid={`trace-line-${l.key}`}
                              >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <div className="text-sm font-semibold" data-testid={`text-line-label-${l.key}`}>
                                        {l.label}
                                      </div>
                                      {l.isAssumed ? (
                                        <Badge
                                          variant="outline"
                                          className="rounded-full"
                                          data-testid={`badge-assumed-${l.key}`}
                                        >
                                          Assumed
                                        </Badge>
                                      ) : null}
                                    </div>
                                    <div className="mt-1 text-xs text-muted-foreground" data-testid={`text-line-basis-${l.key}`}>
                                      {l.basis}
                                    </div>
                                  </div>
                                  <div className="text-sm font-semibold" data-testid={`text-line-value-${l.key}`}>
                                    {fmtMoney(l.value)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border bg-card/60 p-4" data-testid="panel-assumed-list">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold" data-testid="text-assumed-title">
                          Assumptions used
                        </div>
                        <Badge variant="secondary" className="rounded-full" data-testid="badge-assumed-count">
                          {derived.assumedLines.length}
                        </Badge>
                      </div>
                      <div className="mt-3 space-y-2">
                        {derived.assumedLines.length === 0 ? (
                          <div className="text-sm text-muted-foreground" data-testid="text-assumed-empty">
                            None. Everything is input-based.
                          </div>
                        ) : (
                          derived.assumedLines.map((l) => (
                            <div key={l.key} className="rounded-xl border bg-card px-3 py-2" data-testid={`card-assumed-${l.key}`}>
                              <div className="text-xs font-medium" data-testid={`text-assumed-label-${l.key}`}>
                                {l.label}
                              </div>
                              <div className="mt-0.5 text-xs text-muted-foreground" data-testid={`text-assumed-basis-${l.key}`}>
                                {l.basis}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <InlineInfo
                    title="How this works"
                    body="Capture notes and caveats to document what you observed during the assessment. The calculation trace shows exactly how each line item was derived — every assumed value is labeled, and every input is traceable. Nothing silently defaults."
                    icon={<BookOpen className="h-4 w-4" />}
                    testId="info-observations"
                  />
                </div>
              </Card>
              <TabNav current="observations" />
            </TabsContent>

            <TabsContent value="summary" className="mt-5" data-testid="panel-summary">
              <Card className="glass hairline rounded-3xl p-6">
                <SectionHeader
                  icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
                  eyebrow="Summary"
                  title="Baseline Snapshot"
                  description="A client-safe view of the baseline, plus caveats. (No assumptions shown here.)"
                  testId="header-summary"
                />

                {(inputs.project.clientName || inputs.project.assessmentDate) && (
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground" data-testid="panel-project-summary">
                    {inputs.project.clientName && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Client:</span>
                        <span>{inputs.project.clientName}</span>
                      </div>
                    )}
                    {inputs.project.assessmentDate && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Date:</span>
                        <span>{new Date(inputs.project.assessmentDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {inputs.project.customerChampion && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Champion:</span>
                        <span>{inputs.project.customerChampion}</span>
                      </div>
                    )}
                    {inputs.project.engineerName && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Engineer:</span>
                        <span>{inputs.project.engineerName}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <MiniKpi
                        label="Total annual baseline"
                        value={fmtMoney(derived.totalAnnualTco)}
                        hint="Includes assumed line items if inputs were blank"
                        testId="kpi-sum-total"
                      />
                      <MiniKpi
                        label="Cost per endpoint"
                        value={derived.endpoints > 0 ? fmtMoney(derived.costPerEndpoint) : "$0"}
                        hint="Baseline ÷ endpoints"
                        testId="kpi-sum-cpe"
                      />
                      <MiniKpi
                        label="Cost per user"
                        value={derived.userCount > 0 ? fmtMoney(derived.costPerUser) : "$0"}
                        hint="Baseline ÷ user count"
                        testId="kpi-sum-cpu"
                      />
                      <MiniKpi
                        label="VDI cost per VDI user"
                        value={derived.vdiUserCount > 0 ? fmtMoney(derived.vdiCostPerVdiUser) : "$0"}
                        hint="VDI/DaaS spend ÷ VDI users"
                        testId="kpi-sum-vdicpu"
                      />
                    </div>

                    <div className="rounded-2xl border bg-card/60 p-4" data-testid="panel-vdi-analytics">
                      <div className="text-sm font-semibold" data-testid="text-vdi-analytics-title">
                        VDI analytics
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border bg-card px-3 py-2">
                          <div className="text-xs text-muted-foreground">VDI users</div>
                          <div className="text-sm font-semibold">{fmtNumber(derived.vdiUserCount)}</div>
                        </div>
                        <div className="rounded-xl border bg-card px-3 py-2">
                          <div className="text-xs text-muted-foreground">Non-VDI cost per user</div>
                          <div className="text-sm font-semibold">{derived.userCount > 0 ? fmtMoney(derived.nonVdiCostPerUser) : "$0"}</div>
                        </div>
                        <div className="rounded-xl border bg-card px-3 py-2">
                          <div className="text-xs text-muted-foreground">VDI user premium</div>
                          <div className="text-sm font-semibold">{derived.vdiUserCount > 0 && derived.userCount > 0 ? fmtMoney(derived.vdiCostPerVdiUser) : "N/A"}</div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border bg-card/60 p-4" data-testid="panel-category">
                      <div className="text-sm font-semibold" data-testid="text-category-title">
                        Category totals
                      </div>
                      <div className="mt-3 grid gap-2">
                        {[
                          {
                            k: "devices",
                            label: "End-User Devices",
                            v: derived.endUserDevicesValue,
                            total: derived.totalAnnualTco,
                          },
                          {
                            k: "support",
                            label: "Support & Ops",
                            v: derived.supportOpsValue,
                            total: derived.totalAnnualTco,
                          },
                          {
                            k: "licensing",
                            label: "Licensing",
                            v: derived.licensingValue,
                            total: derived.totalAnnualTco,
                          },
                          {
                            k: "mgmt",
                            label: "Mgmt & Security",
                            v: derived.mgmtSecurityValue,
                            total: derived.totalAnnualTco,
                          },
                          {
                            k: "vdi",
                            label: "VDI / DaaS",
                            v: derived.vdiDaasValue,
                            total: derived.totalAnnualTco,
                          },
                          {
                            k: "overhead",
                            label: "Overhead",
                            v: derived.overheadValue,
                            total: derived.totalAnnualTco,
                          },
                          {
                            k: "msp",
                            label: "Managed Services",
                            v: derived.mspSpend,
                            total: derived.totalAnnualTco,
                          },
                        ].map((row) => (
                          <div
                            key={row.k}
                            className="rounded-xl border bg-card px-3 py-2"
                            data-testid={`row-category-${row.k}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium" data-testid={`text-category-${row.k}`}>
                                {row.label}
                              </div>
                              <div className="text-sm font-semibold" data-testid={`text-category-value-${row.k}`}>
                                {fmtMoney(row.v)}
                              </div>
                            </div>
                            <div className="mt-2">
                              <Progress
                                value={pct(row.v, row.total)}
                                data-testid={`progress-category-${row.k}`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border bg-card/60 p-4" data-testid="panel-notes-summary">
                      <div className="text-sm font-semibold" data-testid="text-notes-summary-title">
                        Observations
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground" data-testid="text-notes-summary">
                        {inputs.observations.notes.length > 0
                          ? inputs.observations.notes.map((n, i) => (
                              <div key={i} className="mb-2">
                                <div className="font-medium text-sm">{n.observation || "(Untitled)"}</div>
                                {n.details.trim() && <div className="text-xs mt-0.5">{n.details}</div>}
                              </div>
                            ))
                          : "No observations captured."}
                      </div>
                    </div>

                    <div className="text-sm font-semibold mt-6 mb-3">Visualizations</div>
                    <div className="grid gap-4 sm:grid-cols-2" data-testid="panel-charts">
                      <ChartCard
                        title="Endpoint Mix"
                        description="Device distribution by type"
                        testId="chart-card-endpoint-mix"
                      >
                        <EndpointMixChart
                          data={{
                            laptops: derived.laptops,
                            desktops: derived.desktops,
                            thinClients: derived.thinClients,
                          }}
                        />
                      </ChartCard>

                      <ChartCard
                        title="Where Does The Money Go?"
                        description="Annual spend by category"
                        testId="chart-card-money"
                      >
                        <WhereMoneyGoesChart
                          data={{
                            endUserDevices: derived.endUserDevicesValue,
                            supportOps: derived.supportOpsValue,
                            licensing: derived.licensingValue,
                            mgmtSecurity: derived.mgmtSecurityValue,
                            vdiDaas: derived.vdiDaasValue,
                            overhead: derived.overheadValue,
                          }}
                        />
                      </ChartCard>

                      <ChartCard
                        title="VDI vs Non-VDI User Cost"
                        description="Annual cost per user comparison"
                        testId="chart-card-vdi"
                      >
                        <VdiComparisonChart
                          data={{
                            vdiCostPerUser: derived.nonVdiCostPerUser + derived.vdiCostPerVdiUser,
                            nonVdiCostPerUser: derived.nonVdiCostPerUser,
                          }}
                        />
                      </ChartCard>

                      <ChartCard
                        title="Cost Source Composition"
                        description="From your inputs vs. assumptions"
                        testId="chart-card-source"
                      >
                        <CostSourceChart
                          data={{
                            derived: derived.costFromInputs,
                            assumed: derived.costFromAssumptions,
                          }}
                        />
                      </ChartCard>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border bg-card/60 p-4">
                      <div className="text-sm font-semibold mb-3">Export Options</div>
                      <div className="grid gap-2">
                        <Button
                          variant="outline"
                          className="w-full gap-2 justify-start"
                          onClick={downloadCSV}
                          data-testid="button-export-csv"
                        >
                          <Table className="h-4 w-4" /> CSV (spreadsheet)
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full gap-2 justify-start"
                          onClick={exportPDF}
                          data-testid="button-export-pdf"
                        >
                          <Printer className="h-4 w-4" /> PDF (print-ready)
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full gap-2 justify-start"
                          onClick={downloadAuditTrail}
                          data-testid="button-export-audit"
                        >
                          <FileText className="h-4 w-4" /> Audit Trail (full traceability)
                        </Button>
                        <Separator className="my-1" />
                        <Button
                          className="w-full gap-2 justify-start"
                          onClick={downloadAllExports}
                          data-testid="button-export-all"
                        >
                          <Download className="h-4 w-4" /> Download All (.zip)
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
              <TabNav current="summary" />
            </TabsContent>

            <TabsContent value="readme" className="mt-5" data-testid="panel-tools">
              <div className="grid gap-6">
                <Card className="glass hairline rounded-3xl p-6">
                  <SectionHeader
                    icon={<FileSpreadsheet className="h-5 w-5 text-primary" />}
                    eyebrow="Customer Intake"
                    title="Intake Forms"
                    description="Collect customer environment data before an assessment — via Google Form, Excel workbook, or direct entry."
                    testId="header-intake"
                  />

                  <div className="mt-4">
                    <button
                      onClick={toggleIntakeGuidance}
                      className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      data-testid="button-toggle-intake-guidance"
                    >
                      <Info className="h-4 w-4 text-primary" />
                      Which intake method should I use?
                      <ChevronRight className={cn("h-4 w-4 transition-transform", intakeGuidanceOpen && "rotate-90")} />
                    </button>
                    {intakeGuidanceOpen && (
                      <div className="mt-3 rounded-xl border bg-muted/40 p-4 text-sm space-y-2" data-testid="intake-guidance-box">
                        <p><strong>Google Form</strong> — Best for most customers. They fill it out in their browser, works on mobile, no files to manage. You get responses as a .csv you can import directly.</p>
                        <p><strong>Excel Template</strong> — Best for enterprise IT teams who prefer spreadsheets, need to circulate the form internally, or work offline. You email the .xlsx, they fill it out and return it.</p>
                        <p><strong>Skip Intake</strong> — If you're running the assessment live in a meeting, enter data directly on the Inputs tab. No intake form needed.</p>
                        <p className="text-muted-foreground">All paths feed the same import. Choose whichever fits your customer.</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border bg-card/60 p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <Download className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-sm">Export Intake Form</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Generate a structured .xlsx workbook with Cover Sheet and data tabs to send to the customer before the assessment meeting.
                      </p>
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => setExcelExportOpen(true)}
                        data-testid="button-export-intake"
                      >
                        <FileSpreadsheet className="h-4 w-4" /> Export Intake Form (.xlsx)
                      </Button>
                    </div>

                    <div className="rounded-2xl border bg-card/60 p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <Link2 className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-sm">Copy Google Form Link</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {googleFormUrl.trim()
                          ? "Copy your Google Form intake link to send to customers. They fill it out online and you import the .csv responses."
                          : "Set up your Google Form URL first, then copy the link to share with customers."}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 gap-2"
                          onClick={handleCopyGoogleFormLink}
                          data-testid="button-copy-google-form"
                        >
                          <Copy className="h-4 w-4" /> {googleFormUrl.trim() ? "Copy Link" : "Set Up Google Form"}
                        </Button>
                        {googleFormUrl.trim() && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setGoogleFormUrlDraft(googleFormUrl);
                              setGoogleFormSettingsOpen(true);
                            }}
                            data-testid="button-google-form-settings"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border bg-card/60 p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-sm">Send via Email</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Open your email client with a pre-written message and intake form link or attachment instructions.
                      </p>
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => {
                          setEmailRecipient("");
                          setEmailMethod(googleFormUrl.trim() ? "google" : "excel");
                          setEmailDialogOpen(true);
                        }}
                        data-testid="button-send-email"
                      >
                        <Mail className="h-4 w-4" /> Send via Email
                      </Button>
                    </div>

                    <div className="rounded-2xl border bg-card/60 p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <FileUp className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-sm">Import Intake Responses</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Upload a completed .xlsx or .csv to parse responses and create a pre-filled draft assessment.
                      </p>
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => excelFileInputRef.current?.click()}
                        data-testid="button-import-intake"
                      >
                        <FileUp className="h-4 w-4" /> Import Responses
                      </Button>
                      <input
                        ref={excelFileInputRef}
                        type="file"
                        accept=".xlsx,.csv"
                        className="hidden"
                        onChange={handleExcelFileSelect}
                        data-testid="input-import-file"
                      />
                    </div>
                  </div>

                  {excelImportError && (
                    <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                      <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      {excelImportError}
                      <button
                        className="ml-auto text-xs underline"
                        onClick={() => setExcelImportError(null)}
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </Card>

                <Card className="glass hairline rounded-3xl p-6">
                  <SectionHeader
                    icon={<BookMarked className="h-5 w-5 text-primary" />}
                    eyebrow="Resources"
                    title="Documentation & Resources"
                    description="Download reference materials and learn how to use the tool."
                    testId="header-readme"
                  />

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border bg-card/60 p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-sm">Full Documentation</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Complete reference covering all features, calculations, EUC Pillars framework, export formats, and technical details.
                      </p>
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={downloadDocumentation}
                        data-testid="button-download-docs"
                      >
                        <Download className="h-4 w-4" /> Download Documentation
                      </Button>
                    </div>

                    <div className="rounded-2xl border bg-card/60 p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-sm">Frequently Asked Questions</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Common questions about the tool, inputs, assumptions, exports, and troubleshooting tips.
                      </p>
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={downloadFaq}
                        data-testid="button-download-faq"
                      >
                        <Download className="h-4 w-4" /> Download FAQ
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card className="glass hairline rounded-3xl p-6">
                  <SectionHeader
                    icon={<ChevronRight className="h-5 w-5 text-primary" />}
                    eyebrow="Quick Start"
                    title="How to Use This Tool"
                    description="A step-by-step walkthrough of each section and what to expect."
                    testId="header-quickstart"
                  />

                  <div className="mt-6 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary font-bold text-sm">1</div>
                        <div>
                          <h4 className="font-semibold text-sm" data-testid="text-qs-step1-title">Start on the Home Tab</h4>
                          <p className="text-sm text-muted-foreground mt-1" data-testid="text-qs-step1-desc">
                            The Home tab is your landing page. From here you can launch the <strong>Free Baseline Assessment</strong> (a 10–15 minute guided assessment) or take the <strong>Interactive Tour</strong> to familiarize yourself with the interface before entering data. The Home tab also shows an overview of what the tool does and its core principles.
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-start gap-3">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary font-bold text-sm">2</div>
                        <div>
                          <h4 className="font-semibold text-sm" data-testid="text-qs-step2-title">Fill in Project Information (Inputs Tab)</h4>
                          <p className="text-sm text-muted-foreground mt-1" data-testid="text-qs-step2-desc">
                            Enter the <strong>Client Name</strong>, <strong>Assessment Date</strong>, <strong>Customer Champion</strong>, and <strong>XenTegra Engineer</strong>. You can also upload a <strong>Client Logo</strong> (PNG, JPG, SVG, or WebP, max 500 KB) which will appear in exported reports and PDF visualizations alongside the XenTegra branding.
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-start gap-3">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary font-bold text-sm">3</div>
                        <div>
                          <h4 className="font-semibold text-sm" data-testid="text-qs-step3-title">Enter Environment Facts (Inputs Tab)</h4>
                          <p className="text-sm text-muted-foreground mt-1" data-testid="text-qs-step3-desc">
                            Provide your <strong>User Count</strong> and device counts (<strong>Laptops</strong>, <strong>Desktops</strong>, <strong>Thin Clients</strong>). These numbers drive the cost calculations. The total endpoint count is calculated automatically.
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-start gap-3">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary font-bold text-sm">4</div>
                        <div>
                          <h4 className="font-semibold text-sm" data-testid="text-qs-step4-title">Map Your EUC Pillars & Platforms (Inputs Tab)</h4>
                          <p className="text-sm text-muted-foreground mt-1" data-testid="text-qs-step4-desc">
                            This is the core of the assessment. Your EUC environment is organized into <strong>6 pillars</strong> (Access, Virtual Desktops & Applications, Device/OS/User Management, Security, App Management, and Collaboration/AI/Applications) with <strong>17 sub-pillars</strong> and <strong>60+ vendors</strong>. For each pillar, select the vendors you use and enter their annual cost. If you don't know a cost, leave it blank — the tool will use an assumption instead.
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-start gap-3">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary font-bold text-sm">5</div>
                        <div>
                          <h4 className="font-semibold text-sm" data-testid="text-qs-step5-title">Override Cost Categories (Inputs Tab, Optional)</h4>
                          <p className="text-sm text-muted-foreground mt-1" data-testid="text-qs-step5-desc">
                            If you know your total annual spend for an entire category (e.g., total Security spend), you can enter it as a <strong>Platform Cost Rollup Override</strong>. The priority chain is: <strong>Override &gt; EUC Pillar costs &gt; Assumptions</strong>. This gives you maximum flexibility in how you supply cost data.
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-start gap-3">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary font-bold text-sm">6</div>
                        <div>
                          <h4 className="font-semibold text-sm" data-testid="text-qs-step6-title">Review Assumptions (Assumptions Tab)</h4>
                          <p className="text-sm text-muted-foreground mt-1" data-testid="text-qs-step6-desc">
                            The tool uses <strong>15 industry-sourced default values</strong> covering device refresh cycles, unit costs, support operations, licensing, management, VDI platform costs, and overhead. Every assumption is transparent, labeled, and fully editable. Modified values are highlighted. You can download a <strong>Justification Report</strong> showing the source for every default.
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-start gap-3">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary font-bold text-sm">7</div>
                        <div>
                          <h4 className="font-semibold text-sm" data-testid="text-qs-step7-title">Add Notes & Observations (Observations Tab)</h4>
                          <p className="text-sm text-muted-foreground mt-1" data-testid="text-qs-step7-desc">
                            This is the defensibility layer. Add <strong>Notes & Caveats</strong> to document context, known gaps, or special circumstances. The tab also shows a <strong>Calculation Trace</strong> — a line-by-line breakdown of how every cost was derived — so every number is fully auditable.
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-start gap-3">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary font-bold text-sm">8</div>
                        <div>
                          <h4 className="font-semibold text-sm" data-testid="text-qs-step8-title">Review the Summary (Summary Tab)</h4>
                          <p className="text-sm text-muted-foreground mt-1" data-testid="text-qs-step8-desc">
                            The Summary tab presents your <strong>Total Annual Baseline</strong>, <strong>Cost per Endpoint</strong>, <strong>Cost per User</strong>, and VDI-specific metrics. Five interactive charts visualize your data: Endpoint Mix, Where Money Goes, Cost by Category, VDI vs. Non-VDI Comparison, and Cost Source Composition. Use the export options to download your results as CSV, PDF, Audit Trail, or a bundled zip file.
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-start gap-3">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary font-bold text-sm">9</div>
                        <div>
                          <h4 className="font-semibold text-sm" data-testid="text-qs-step9-title">Track Your Progress (Readiness Bar)</h4>
                          <p className="text-sm text-muted-foreground mt-1" data-testid="text-qs-step9-desc">
                            The <strong>Readiness Tracker</strong> in the tab header shows your assessment completeness as a percentage. It turns green at 100% when all key fields are populated. This helps ensure you haven't missed any important inputs before exporting your baseline.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <p className="text-sm text-muted-foreground">
                          <strong>Tip:</strong> All data stays entirely in your browser — nothing is sent to a server. Use the <strong>Download All (.zip)</strong> button on the Summary tab to export everything at once, or use individual export buttons for specific formats.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
              <TabNav current="readme" />
            </TabsContent>

            {debugMode && (
              <TabsContent value="audit" className="mt-5" data-testid="panel-audit">
                <AuditTracePage inputs={inputs} assumptions={assumptions} />
                <TabNav current="audit" />
              </TabsContent>
            )}
          </Tabs>
        </main>

        <footer className="mt-10" data-testid="section-footer">
          <div className="glass hairline rounded-3xl px-6 py-4">
            <div className="flex items-center justify-end">
              <div className="flex flex-col items-end gap-1">
                <img
                  src={dark ? xentegraLogoWhite : xentegraLogoBlack}
                  alt="XenTegra"
                  className="h-6 object-contain"
                  data-testid="img-footer-logo"
                />
                <div className="text-xs text-muted-foreground" data-testid="text-footer-date">
                  Assessment Date: {inputs.project.assessmentDate
                    ? new Date(inputs.project.assessmentDate + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                    : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <OnboardingTour
        steps={tourSteps}
        isOpen={isTourOpen}
        onClose={closeTour}
        onComplete={completeTour}
      />

      <Dialog open={helpDialogOpen} onOpenChange={(open) => { setHelpDialogOpen(open); if (!open) { setHelpSent(false); setHelpIssue(""); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" /> Get Help
            </DialogTitle>
            <DialogDescription>
              Describe the issue you're experiencing and we'll generate a support email for you.
            </DialogDescription>
          </DialogHeader>
          {helpSent ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <p className="text-sm font-medium">Email client opened! Send the pre-filled email to complete your request.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="helpIssue" data-testid="label-help-issue">Describe your issue</Label>
                <Textarea
                  id="helpIssue"
                  placeholder="Please describe what happened, what you expected, and any steps to reproduce the issue..."
                  value={helpIssue}
                  onChange={(e) => setHelpIssue(e.target.value)}
                  className="min-h-[120px]"
                  data-testid="textarea-help-issue"
                />
              </div>
              <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
                <p><strong>The following will be included automatically:</strong></p>
                <p>Tool version, browser info, client name, and engineer name</p>
                <p>Email will be sent to: <span className="font-mono">support@xentegra.com</span></p>
              </div>
            </div>
          )}
          {!helpSent && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setHelpDialogOpen(false)} data-testid="button-help-cancel">
                Cancel
              </Button>
              <Button onClick={sendHelpEmail} disabled={!helpIssue.trim()} className="gap-2" data-testid="button-help-send">
                <Mail className="h-4 w-4" /> Open Email
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={aboutDialogOpen} onOpenChange={setAboutDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg" data-testid="text-about-title">About TCO Baseline Tool</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <img
                src={dark ? xentegraLogoWhite : xentegraLogoBlack}
                alt="XenTegra"
                className="h-10 object-contain mt-1"
                data-testid="img-about-logo"
              />
              <div className="space-y-1">
                <h3 className="font-semibold text-base" data-testid="text-about-name">TCO Baseline Micro-Assessment Tool</h3>
                <p className="text-sm text-muted-foreground" data-testid="text-about-version">Version 0.4.0 (Build 2026.02)</p>
                <p className="text-sm text-muted-foreground">EUC Workbook Alignment: v2.0</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Product Information</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>A vendor-neutral, solution-agnostic Total Cost of Ownership baseline tool for enterprise End User Computing environments.</p>
                <p>Designed for XenTegra engineers and their customers to establish credible, defensible cost baselines.</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Technical Details</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>Framework</span><span className="font-mono">React 18 + TypeScript</span>
                <span>UI Library</span><span className="font-mono">shadcn/ui + Radix</span>
                <span>Charts</span><span className="font-mono">Recharts</span>
                <span>Data Storage</span><span className="font-mono">Client-side (localStorage)</span>
                <span>Export Formats</span><span className="font-mono">CSV, PDF, Audit Trail</span>
              </div>
            </div>

            <Separator />

            <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground space-y-2">
              <p className="font-semibold text-foreground">XenTegra, Inc.</p>
              <p>Copyright &copy; 2026 XenTegra, Inc. All rights reserved.</p>
              <p>This tool is provided by XenTegra for use in EUC assessment engagements. All data entered remains entirely within the user's browser. No data is transmitted to any server. The tool is provided "as is" without warranty of any kind, express or implied.</p>
              <p>XenTegra and the XenTegra logo are trademarks of XenTegra, Inc. All other trademarks are the property of their respective owners.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAboutDialogOpen(false)} data-testid="button-about-close">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={excelExportOpen} onOpenChange={setExcelExportOpen}>
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
                value={excelClientName}
                onChange={(e) => setExcelClientName(e.target.value)}
                data-testid="input-export-client"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="intake-project">Project Name (optional)</Label>
              <Input
                id="intake-project"
                placeholder="e.g., Q1 2026 Assessment"
                value={excelProjectName}
                onChange={(e) => setExcelProjectName(e.target.value)}
                data-testid="input-export-project"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExcelExportOpen(false)} data-testid="button-export-cancel">
              Cancel
            </Button>
            <Button
              onClick={handleExcelExport}
              disabled={!excelClientName.trim()}
              className="gap-2"
              data-testid="button-export-confirm"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Download .xlsx
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={googleFormSettingsOpen} onOpenChange={setGoogleFormSettingsOpen}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-google-form-settings">
          <DialogHeader>
            <DialogTitle>Google Form Template URL</DialogTitle>
            <DialogDescription>
              Paste the URL of your master Google Form template. This is the link that "Copy Google Form Link" will share.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="google-form-url">Google Form URL</Label>
              <Input
                id="google-form-url"
                placeholder="https://docs.google.com/forms/d/..."
                value={googleFormUrlDraft}
                onChange={(e) => setGoogleFormUrlDraft(e.target.value)}
                data-testid="input-google-form-url"
              />
              <p className="text-xs text-muted-foreground">
                Duplicate the master form in Google Drive for each new customer, then paste the form URL here.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGoogleFormSettingsOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveGoogleFormUrl} data-testid="button-save-google-form-url">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-lg" data-testid="dialog-send-email">
          <DialogHeader>
            <DialogTitle>Send Intake Form via Email</DialogTitle>
            <DialogDescription>
              Compose a pre-written email to send the intake form to your customer contact.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="email-recipient">Recipient Email *</Label>
              <Input
                id="email-recipient"
                type="email"
                placeholder="contact@customer.com"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                data-testid="input-email-recipient"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-client">Client Name</Label>
              <Input
                id="email-client"
                value={inputs.project.clientName ?? ""}
                disabled
                className="bg-muted/50"
                data-testid="input-email-client"
              />
            </div>
            <div className="space-y-2">
              <Label>Intake Method</Label>
              <div className="rounded-lg border p-3 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="emailMethod"
                    checked={emailMethod === "google"}
                    onChange={() => setEmailMethod("google")}
                    disabled={!googleFormUrl.trim()}
                    className="accent-primary"
                    data-testid="radio-method-google"
                  />
                  Google Form link
                  {!googleFormUrl.trim() && <span className="text-xs text-muted-foreground">(no URL configured)</span>}
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="emailMethod"
                    checked={emailMethod === "excel"}
                    onChange={() => setEmailMethod("excel")}
                    className="accent-primary"
                    data-testid="radio-method-excel"
                  />
                  Excel attachment
                  <span className="text-xs text-muted-foreground">(downloads .xlsx to attach manually)</span>
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-due-date">Response Due Date</Label>
              <Input
                id="email-due-date"
                type="date"
                value={emailDueDate}
                onChange={(e) => setEmailDueDate(e.target.value)}
                data-testid="input-email-due-date"
              />
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="text-xs font-medium text-muted-foreground mb-1">Email Preview</div>
              <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                <strong>Subject:</strong> TCO Assessment — Intake Form for {inputs.project.clientName || "[Client Name]"}{"\n\n"}
                {emailMethod === "google" && googleFormUrl.trim()
                  ? `Includes a link to your Google Form for the customer to fill out online.`
                  : `Instructs the customer to fill out the attached Excel workbook and return it.`
                }
                {"\n\n"}Response due by {emailDueDate
                  ? new Date(emailDueDate + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                  : "[DATE]"}.
                {"\n"}Signed by {inputs.project.engineerName || "[XenTegra Engineer Name]"}.
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSendEmail}
              disabled={!emailRecipient.trim()}
              className="gap-2"
              data-testid="button-open-email-client"
            >
              <ExternalLink className="h-4 w-4" /> Open in Email Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={excelImportOpen} onOpenChange={setExcelImportOpen}>
        <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto" data-testid="dialog-import-review">
          <DialogHeader>
            <DialogTitle>Import Review</DialogTitle>
            <DialogDescription>
              Review the imported data before creating a draft assessment.
            </DialogDescription>
          </DialogHeader>

          {excelImportResult && (
            <div className="space-y-4 py-2">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Client</div>
                  <div className="text-sm font-medium">{excelImportResult.clientName || "—"}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Project</div>
                  <div className="text-sm font-medium">{excelImportResult.projectName || "—"}</div>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <Check className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="text-lg font-semibold">{excelImportResult.mapped.length}</div>
                    <div className="text-[11px] text-muted-foreground">Mapped fields</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                  <div>
                    <div className="text-lg font-semibold">{excelImportResult.blankCount}</div>
                    <div className="text-[11px] text-muted-foreground">Blank (skipped)</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <div>
                    <div className="text-lg font-semibold">{excelImportResult.errors.length}</div>
                    <div className="text-[11px] text-muted-foreground">Errors</div>
                  </div>
                </div>
              </div>

              {excelImportResult.mapped.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Mapped Fields
                  </div>
                  <div className="rounded-lg border divide-y max-h-48 overflow-y-auto">
                    {excelImportResult.mapped.map((m, i) => (
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

              {excelImportResult.errors.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-destructive mb-2">
                    Errors
                  </div>
                  <div className="rounded-lg border border-destructive/30 divide-y max-h-32 overflow-y-auto">
                    {excelImportResult.errors.map((e, i) => (
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
            <Button variant="outline" onClick={() => setExcelImportOpen(false)} data-testid="button-import-cancel">
              Cancel
            </Button>
            <Button
              onClick={handleExcelCreateDraft}
              className="gap-2"
              disabled={!excelImportResult || (!excelImportResult.clientName && excelImportResult.mapped.length === 0)}
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
