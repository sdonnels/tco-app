import { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileDown,
  FileText,
  Info,
  Lock,
  Plus,
  Printer,
  Shield,
  Sparkles,
  Table,
  X,
} from "lucide-react";
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
import TcoHome from "@/pages/tco-home";
import { OnboardingTour, useTourState, type TourStep } from "@/components/OnboardingTour";
import xentegraLogoWhite from "@/assets/xentegra-white.webp";
import xentegraLogoBlack from "@/assets/xentegra-black.webp";
import {
  EndpointMixChart,
  VdiComparisonChart,
  CostSourceChart,
  WhereMoneyGoesChart,
  ChartCard,
} from "@/components/TcoCharts";

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
  };
  observations: {
    notes?: string;
  };
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
  const [dark, setDark] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "home" | "inputs" | "assumptions" | "observations" | "summary"
  >("home");

  const [inputs, setInputs] = useState<Inputs>({
    project: {},
    environment: {},
    categoryRollups: {},
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
    },
    observations: {},
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
      content: "Enter your user counts, device counts, and any known spending. The tool will derive costs from what you provide.",
      placement: "bottom" as const,
      action: () => setActiveTab("inputs"),
    },
    {
      target: "[data-testid='readiness-panel']",
      title: "Track Your Readiness",
      content: "This panel shows how complete your assessment is. Hit 100% when you have endpoints and some spending captured.",
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
      target: "[data-testid='button-export-json']",
      title: "Export Your Baseline",
      content: "Download your baseline in multiple formats: JSON for data interchange, CSV for spreadsheets, PDF for presentations, or full Audit Trail.",
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

    const vdiPctOfUsers = nonNeg(inputs.vdiDaas.vdiPctOfUsers) ?? 0;
    const vdiPresent = inputs.vdiDaas.vdiPresent === "yes" || vdiPctOfUsers > 0;
    const vdiUserCount = vdiPresent ? Math.round(userCount * vdiPctOfUsers / 100) : 0;

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

    const customToolsSpend = inputs.toolPresence.customTools.reduce((sum, t) => sum + (nonNeg(t.spend) ?? 0), 0);
    const toolSpendTotal = 
      (inputs.toolPresence.intunePresent === "yes" ? (nonNeg(inputs.toolPresence.intuneSpend) ?? 0) : 0) +
      (inputs.toolPresence.sccmPresent === "yes" ? (nonNeg(inputs.toolPresence.sccmSpend) ?? 0) : 0) +
      (inputs.toolPresence.workspaceOnePresent === "yes" ? (nonNeg(inputs.toolPresence.workspaceOneSpend) ?? 0) : 0) +
      (inputs.toolPresence.jamfPresent === "yes" ? (nonNeg(inputs.toolPresence.jamfSpend) ?? 0) : 0) +
      (inputs.toolPresence.controlUpPresent === "yes" ? (nonNeg(inputs.toolPresence.controlUpSpend) ?? 0) : 0) +
      (inputs.toolPresence.nerdioPresent === "yes" ? (nonNeg(inputs.toolPresence.nerdioSpend) ?? 0) : 0) +
      customToolsSpend;
    const hasToolSpend = toolSpendTotal > 0;
    const derivedMgmtSecurity = hasToolSpend ? toolSpendTotal : (endpoints * assumptions.mgmtSecurity.costPerEndpointPerYear);

    const customPlatformsSpend = inputs.vdiDaas.customPlatforms.reduce((sum, p) => sum + (nonNeg(p.spend) ?? 0), 0);
    const vdiPlatformSpendTotal =
      (inputs.vdiDaas.citrixPresent === "yes" ? (nonNeg(inputs.vdiDaas.citrixSpend) ?? 0) : 0) +
      (inputs.vdiDaas.avdPresent === "yes" ? (nonNeg(inputs.vdiDaas.avdSpend) ?? 0) : 0) +
      (inputs.vdiDaas.w365Present === "yes" ? (nonNeg(inputs.vdiDaas.w365Spend) ?? 0) : 0) +
      (inputs.vdiDaas.horizonPresent === "yes" ? (nonNeg(inputs.vdiDaas.horizonSpend) ?? 0) : 0) +
      (inputs.vdiDaas.parallelsPresent === "yes" ? (nonNeg(inputs.vdiDaas.parallelsSpend) ?? 0) : 0) +
      customPlatformsSpend;
    const hasVdiSpend = vdiPlatformSpendTotal > 0;
    const derivedVdiDaas = hasVdiSpend ? vdiPlatformSpendTotal : (vdiUserCount * assumptions.vdi.platformCostPerVdiUserPerYear);

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
        ? `${fmtMoney(toolSpendTotal)} (from tool spend inputs)`
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
        ? `${fmtMoney(vdiPlatformSpendTotal)} (from platform spend inputs)`
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
    if (inputs.managedServices.outsourcedHelpdesk) outsourcedServices.push("Helpdesk/Tier 1");
    if (inputs.managedServices.outsourcedTier2Plus) outsourcedServices.push("Tier 2+ Support");
    if (inputs.managedServices.outsourcedOther) outsourcedServices.push(inputs.managedServices.otherDescription || "Other");

    const managedServicesLines: CalcLine[] = [
      {
        key: "msp-total",
        label: "Managed services spend",
        value: mspSpend,
        basis:
          inputs.managedServices.totalAnnualSpend !== undefined
            ? `${fmtMoney(mspSpend)} (input)${outsourcedServices.length > 0 ? ` — covers: ${outsourcedServices.join(", ")}` : ""}`
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
    };
  }, [inputs, assumptions]);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [dark]);

  const exportJson = () => {
    const payload = {
      tool: "tco-baseline-micro-assessment",
      version: "0.3-excel-aligned",
      generatedAt: new Date().toISOString(),
      project: {
        clientName: inputs.project.clientName ?? null,
        assessmentDate: inputs.project.assessmentDate ?? null,
        customerChampion: inputs.project.customerChampion ?? null,
        engineerName: inputs.project.engineerName ?? null,
      },
      inputs,
      assumptions,
      derived: {
        endpoints: derived.endpoints,
        userCount: derived.userCount,
        vdiPresent: derived.vdiPresent,
        vdiUserCount: derived.vdiUserCount,
        totals: {
          endUserDevices: derived.endUserDevicesValue,
          supportOps: derived.supportOpsValue,
          licensing: derived.licensingValue,
          mgmtSecurity: derived.mgmtSecurityValue,
          vdiDaas: derived.vdiDaasValue,
          overhead: derived.overheadValue,
          managedServices: derived.mspSpend,
          totalAnnualTco: derived.totalAnnualTco,
          costPerEndpoint: derived.costPerEndpoint,
          costPerUser: derived.costPerUser,
          vdiCostPerVdiUser: derived.vdiCostPerVdiUser,
          nonVdiCostPerUser: derived.nonVdiCostPerUser,
        },
        trace: {
          categoryLines: derived.categoryLines,
          managedServicesLines: derived.managedServicesLines,
        },
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tco-baseline-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
    lines.push("│ VDI / DaaS PLATFORM PRESENCE" + " ".repeat(39) + "│");
    lines.push("└" + "─".repeat(68) + "┘");
    lines.push(`  Citrix:             ${inputs.vdiDaas.citrixPresent}${inputs.vdiDaas.citrixPresent === "yes" && inputs.vdiDaas.citrixSpend ? ` (${fmtMoney(inputs.vdiDaas.citrixSpend)}/yr)` : ""}`);
    lines.push(`  Azure Virtual Desktop: ${inputs.vdiDaas.avdPresent}${inputs.vdiDaas.avdPresent === "yes" && inputs.vdiDaas.avdSpend ? ` (${fmtMoney(inputs.vdiDaas.avdSpend)}/yr)` : ""}`);
    lines.push(`  Windows 365:        ${inputs.vdiDaas.w365Present}${inputs.vdiDaas.w365Present === "yes" && inputs.vdiDaas.w365Spend ? ` (${fmtMoney(inputs.vdiDaas.w365Spend)}/yr)` : ""}`);
    lines.push(`  VMware Horizon:     ${inputs.vdiDaas.horizonPresent}${inputs.vdiDaas.horizonPresent === "yes" && inputs.vdiDaas.horizonSpend ? ` (${fmtMoney(inputs.vdiDaas.horizonSpend)}/yr)` : ""}`);
    lines.push(`  Parallels RAS:      ${inputs.vdiDaas.parallelsPresent}${inputs.vdiDaas.parallelsPresent === "yes" && inputs.vdiDaas.parallelsSpend ? ` (${fmtMoney(inputs.vdiDaas.parallelsSpend)}/yr)` : ""}`);
    if (inputs.vdiDaas.customPlatforms.length > 0) {
      lines.push("  Custom Platforms:");
      inputs.vdiDaas.customPlatforms.forEach((p) => {
        lines.push(`    ${p.name || "(unnamed)"}:  ${p.spend ? fmtMoney(p.spend) + "/yr" : "(no spend)"}`);
      });
    }
    lines.push("");

    lines.push("┌" + "─".repeat(68) + "┐");
    lines.push("│ ENDPOINT & MANAGEMENT TOOL PRESENCE" + " ".repeat(31) + "│");
    lines.push("└" + "─".repeat(68) + "┘");
    lines.push(`  Intune:             ${inputs.toolPresence.intunePresent}${inputs.toolPresence.intunePresent === "yes" && inputs.toolPresence.intuneSpend ? ` (${fmtMoney(inputs.toolPresence.intuneSpend)}/yr)` : ""}`);
    lines.push(`  SCCM:               ${inputs.toolPresence.sccmPresent}${inputs.toolPresence.sccmPresent === "yes" && inputs.toolPresence.sccmSpend ? ` (${fmtMoney(inputs.toolPresence.sccmSpend)}/yr)` : ""}`);
    lines.push(`  Workspace ONE:      ${inputs.toolPresence.workspaceOnePresent}${inputs.toolPresence.workspaceOnePresent === "yes" && inputs.toolPresence.workspaceOneSpend ? ` (${fmtMoney(inputs.toolPresence.workspaceOneSpend)}/yr)` : ""}`);
    lines.push(`  Jamf:               ${inputs.toolPresence.jamfPresent}${inputs.toolPresence.jamfPresent === "yes" && inputs.toolPresence.jamfSpend ? ` (${fmtMoney(inputs.toolPresence.jamfSpend)}/yr)` : ""}`);
    lines.push(`  ControlUp:          ${inputs.toolPresence.controlUpPresent}${inputs.toolPresence.controlUpPresent === "yes" && inputs.toolPresence.controlUpSpend ? ` (${fmtMoney(inputs.toolPresence.controlUpSpend)}/yr)` : ""}`);
    lines.push(`  Nerdio:             ${inputs.toolPresence.nerdioPresent}${inputs.toolPresence.nerdioPresent === "yes" && inputs.toolPresence.nerdioSpend ? ` (${fmtMoney(inputs.toolPresence.nerdioSpend)}/yr)` : ""}`);
    if (inputs.toolPresence.customTools.length > 0) {
      lines.push("  Custom Tools:");
      inputs.toolPresence.customTools.forEach((t) => {
        lines.push(`    ${t.name || "(unnamed)"}:  ${t.spend ? fmtMoney(t.spend) + "/yr" : "(no spend)"}`);
      });
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
    lines.push(`    Helpdesk/Tier 1:  ${inputs.managedServices.outsourcedHelpdesk ? "Yes" : "No"}`);
    lines.push(`    Tier 2+ Support:  ${inputs.managedServices.outsourcedTier2Plus ? "Yes" : "No"}`);
    lines.push(`    Other:            ${inputs.managedServices.outsourcedOther ? "Yes" : "No"}`);
    lines.push(`    Other Description: ${inputs.managedServices.otherDescription ?? "(none)"}`);
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
    if (inputs.observations.notes?.trim()) {
      lines.push(`  ${inputs.observations.notes}`);
    } else {
      lines.push("  (No observations recorded)");
    }
    lines.push("");

    lines.push(hr);
    lines.push("END OF AUDIT TRAIL REPORT");
    lines.push(hr);

    const content = lines.join("\n");
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

    const content = lines.join("\n");
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
    
    const escapeCSV = (value: string) => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };
    
    const csvContent = rows.map(row => row.map(escapeCSV).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const clientSlug = inputs.project.clientName?.replace(/\s+/g, "_").toLowerCase() ?? "baseline";
    a.download = `tco-baseline-${clientSlug}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to generate PDF");
      return;
    }

    const clientName = inputs.project.clientName ?? "TCO Baseline";
    const date = new Date().toLocaleDateString();

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
    <h1>TCO Baseline Report</h1>
    <p class="subtitle">End User Computing Total Cost of Ownership Assessment</p>
    <div class="meta">
      <span><strong>Client:</strong> ${clientName}</span>
      <span><strong>Date:</strong> ${date}</span>
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

  ${inputs.observations.notes?.trim() ? `
  <h2>Observations</h2>
  <p style="font-size: 13px; color: #475569;">${inputs.observations.notes}</p>
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
          <div class="comparison-bar-fill" style="height: ${Math.min(100, (derived.nonVdiCostPerUser / Math.max(derived.nonVdiCostPerUser, derived.vdiCostPerVdiUser)) * 100)}px; background: #3b82f6;"></div>
          <div class="comparison-bar-label">Non-VDI User</div>
        </div>
        <div class="comparison-bar">
          <div class="comparison-bar-value">${fmtMoney(derived.vdiCostPerVdiUser)}</div>
          <div class="comparison-bar-fill" style="height: ${Math.min(100, (derived.vdiCostPerVdiUser / Math.max(derived.nonVdiCostPerUser, derived.vdiCostPerVdiUser)) * 100)}px; background: #8b5cf6;"></div>
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
    <p>TCO Baseline Micro-Assessment Tool | Generated ${new Date().toLocaleString()}</p>
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Dark</span>
                    <Switch
                      checked={dark}
                      onCheckedChange={setDark}
                      data-testid="switch-theme"
                    />
                  </div>
                </div>

                {activeTab !== "home" && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setInputs({
                        project: {},
                        environment: {},
                        categoryRollups: {},
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
                        },
                        observations: {},
                      });
                    }}
                    data-testid="button-reset"
                  >
                    Reset
                  </Button>
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
              <TcoHome onStartBaseline={() => setActiveTab("inputs")} onStartTour={handleStartTour} />
            </TabsContent>

            <TabsContent value="inputs" className="mt-5" data-testid="panel-inputs">
              <div className="grid gap-6">
                <Card className="glass hairline rounded-3xl p-6">
                  <SectionHeader
                    icon={<ClipboardCheck className="h-5 w-5 text-primary" />}
                    eyebrow="Inputs"
                    title="Project information"
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
                </Card>

                <Card className="glass hairline rounded-3xl p-6">
                  <SectionHeader
                    icon={<ClipboardCheck className="h-5 w-5 text-primary" />}
                    eyebrow="Inputs"
                    title="Environment facts"
                    description="Enter what you know. Leave unknowns blank—assumptions will be explicit and challengeable."
                    testId="header-inputs"
                  />

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
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
                        <Badge
                          variant="outline"
                          className="rounded-full"
                          data-testid="badge-endpoints"
                        >
                          {fmtNumber(derived.endpoints)} endpoints
                        </Badge>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="userCount" data-testid="label-usercount">
                            Total users
                          </Label>
                          <Input
                            id="userCount"
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

                    <div className="space-y-5" data-testid="group-vdi">
                      <div>
                        <div className="text-sm font-semibold" data-testid="text-vdi-title">
                          VDI / DaaS
                        </div>
                        <div className="text-xs text-muted-foreground" data-testid="text-vdi-subtitle">
                          Percentage of users on virtual desktop infrastructure.
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="vdiPct" data-testid="label-vdipct">
                            VDI % of users
                          </Label>
                          <Input
                            id="vdiPct"
                            placeholder="e.g., 20"
                            {...numberField(inputs.vdiDaas.vdiPctOfUsers, (v) =>
                              setInputs((s) => ({
                                ...s,
                                vdiDaas: { ...s.vdiDaas, vdiPctOfUsers: nonNeg(v) },
                              })),
                            )}
                            data-testid="input-tier1"
                          />
                        </div>
                      </div>

                      <div className="rounded-2xl border bg-card/60 p-4" data-testid="panel-vdi-derived">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold" data-testid="text-derived-title">
                              Derived VDI users
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground" data-testid="text-derived-subtitle">
                              Based on user count and VDI percentage.
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className="rounded-full"
                            data-testid="badge-derived"
                          >
                            {fmtNumber(derived.vdiUserCount)} VDI users
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="glass hairline rounded-3xl p-6">
                  <SectionHeader
                    icon={<Activity className="h-5 w-5 text-primary" />}
                    eyebrow="Inputs"
                    title="Category rollups (optional overrides)"
                    description="If you know total annual spend for a category, enter it here. Otherwise, the tool calculates from environment data and assumptions."
                    testId="header-rollups"
                  />

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="space-y-4" data-testid="group-rollups-1">
                      <div className="text-sm font-semibold" data-testid="text-rollups-title">
                        Cost categories (annual)
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="rollup-devices" data-testid="label-rollup-devices">
                            End-User Devices
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
                            Licensing
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
                        More categories (annual)
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="rollup-mgmt" data-testid="label-rollup-mgmt">
                            Management & Security
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
                            VDI / DaaS
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

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="space-y-4" data-testid="group-vdi-platforms">
                      <div className="text-sm font-semibold" data-testid="text-vdi-platforms-title">
                        VDI / DaaS platforms
                      </div>
                      <div className="rounded-2xl border bg-card/60 p-4" data-testid="panel-vdi-platforms">
                        <div className="grid gap-4">
                          {([
                            { k: "citrixPresent", spendKey: "citrixSpend", label: "Citrix" },
                            { k: "avdPresent", spendKey: "avdSpend", label: "Azure Virtual Desktop" },
                            { k: "w365Present", spendKey: "w365Spend", label: "Windows 365" },
                            { k: "horizonPresent", spendKey: "horizonSpend", label: "VMware Horizon" },
                            { k: "parallelsPresent", spendKey: "parallelsSpend", label: "Parallels RAS" },
                          ] as const).map((row) => (
                            <div
                              key={row.k}
                              className="space-y-2"
                              data-testid={`row-vdi-${row.k}`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-sm" data-testid={`text-vdi-${row.k}`}>
                                  {row.label}
                                </div>
                                <div className="flex items-center gap-2">
                                  {(["yes", "no", "unknown"] as const).map((v) => (
                                    <Button
                                      key={v}
                                      type="button"
                                      variant={
                                        inputs.vdiDaas[row.k] === v
                                          ? "default"
                                          : "secondary"
                                      }
                                      className="h-8 rounded-xl px-3 text-xs"
                                      onClick={() =>
                                        setInputs((s) => ({
                                          ...s,
                                          vdiDaas: { ...s.vdiDaas, [row.k]: v },
                                        }))
                                      }
                                      data-testid={`button-vdi-${row.k}-${v}`}
                                    >
                                      {v === "yes" ? "Yes" : v === "no" ? "No" : "?"}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                              {inputs.vdiDaas[row.k] === "yes" && (
                                <div className="ml-4 flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">Annual spend:</span>
                                  <div className="relative flex-1 max-w-[160px]">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                                    <Input
                                      type="number"
                                      placeholder="Optional"
                                      className="h-8 pl-6 text-sm"
                                      value={inputs.vdiDaas[row.spendKey] ?? ""}
                                      onChange={(e) =>
                                        setInputs((s) => ({
                                          ...s,
                                          vdiDaas: {
                                            ...s.vdiDaas,
                                            [row.spendKey]: e.target.value ? Number(e.target.value) : undefined,
                                          },
                                        }))
                                      }
                                      data-testid={`input-vdi-${row.spendKey}`}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}

                          {inputs.vdiDaas.customPlatforms.map((platform) => (
                            <div key={platform.id} className="space-y-2" data-testid={`row-custom-platform-${platform.id}`}>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="text"
                                  placeholder="Platform name"
                                  className="h-8 text-sm flex-1"
                                  value={platform.name}
                                  onChange={(e) =>
                                    setInputs((s) => ({
                                      ...s,
                                      vdiDaas: {
                                        ...s.vdiDaas,
                                        customPlatforms: s.vdiDaas.customPlatforms.map((p) =>
                                          p.id === platform.id ? { ...p, name: e.target.value } : p
                                        ),
                                      },
                                    }))
                                  }
                                  data-testid={`input-custom-platform-name-${platform.id}`}
                                />
                                <div className="relative w-[140px]">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                                  <Input
                                    type="number"
                                    placeholder="Spend"
                                    className="h-8 pl-6 text-sm"
                                    value={platform.spend ?? ""}
                                    onChange={(e) =>
                                      setInputs((s) => ({
                                        ...s,
                                        vdiDaas: {
                                          ...s.vdiDaas,
                                          customPlatforms: s.vdiDaas.customPlatforms.map((p) =>
                                            p.id === platform.id ? { ...p, spend: e.target.value ? Number(e.target.value) : undefined } : p
                                          ),
                                        },
                                      }))
                                    }
                                    data-testid={`input-custom-platform-spend-${platform.id}`}
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                  onClick={() =>
                                    setInputs((s) => ({
                                      ...s,
                                      vdiDaas: {
                                        ...s.vdiDaas,
                                        customPlatforms: s.vdiDaas.customPlatforms.filter((p) => p.id !== platform.id),
                                      },
                                    }))
                                  }
                                  data-testid={`button-remove-platform-${platform.id}`}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full h-8 text-xs"
                            onClick={() =>
                              setInputs((s) => ({
                                ...s,
                                vdiDaas: {
                                  ...s.vdiDaas,
                                  customPlatforms: [
                                    ...s.vdiDaas.customPlatforms,
                                    { id: crypto.randomUUID(), name: "", spend: undefined },
                                  ],
                                },
                              }))
                            }
                            data-testid="button-add-custom-platform"
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add other platform
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4" data-testid="group-tool-presence">
                      <div className="text-sm font-semibold" data-testid="text-tool-presence-title">
                        Endpoint & management tools
                      </div>
                      <div className="rounded-2xl border bg-card/60 p-4" data-testid="panel-tool-presence">
                        <div className="grid gap-4">
                          {([
                            { k: "intunePresent", spendKey: "intuneSpend", label: "Intune" },
                            { k: "sccmPresent", spendKey: "sccmSpend", label: "SCCM" },
                            { k: "workspaceOnePresent", spendKey: "workspaceOneSpend", label: "Workspace ONE" },
                            { k: "jamfPresent", spendKey: "jamfSpend", label: "Jamf" },
                            { k: "controlUpPresent", spendKey: "controlUpSpend", label: "ControlUp" },
                            { k: "nerdioPresent", spendKey: "nerdioSpend", label: "Nerdio" },
                          ] as const).map((row) => (
                            <div
                              key={row.k}
                              className="space-y-2"
                              data-testid={`row-tool-${row.k}`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-sm" data-testid={`text-tool-${row.k}`}>
                                  {row.label}
                                </div>
                                <div className="flex items-center gap-2">
                                  {(["yes", "no", "unknown"] as const).map((v) => (
                                    <Button
                                      key={v}
                                      type="button"
                                      variant={
                                        inputs.toolPresence[row.k] === v
                                          ? "default"
                                          : "secondary"
                                      }
                                      className="h-8 rounded-xl px-3 text-xs"
                                      onClick={() =>
                                        setInputs((s) => ({
                                          ...s,
                                          toolPresence: { ...s.toolPresence, [row.k]: v },
                                        }))
                                      }
                                      data-testid={`button-tool-${row.k}-${v}`}
                                    >
                                      {v === "yes" ? "Yes" : v === "no" ? "No" : "?"}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                              {inputs.toolPresence[row.k] === "yes" && (
                                <div className="ml-4 flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">Annual spend:</span>
                                  <div className="relative flex-1 max-w-[160px]">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                                    <Input
                                      type="number"
                                      placeholder="Optional"
                                      className="h-8 pl-6 text-sm"
                                      value={inputs.toolPresence[row.spendKey] ?? ""}
                                      onChange={(e) =>
                                        setInputs((s) => ({
                                          ...s,
                                          toolPresence: {
                                            ...s.toolPresence,
                                            [row.spendKey]: e.target.value ? Number(e.target.value) : undefined,
                                          },
                                        }))
                                      }
                                      data-testid={`input-tool-${row.spendKey}`}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}

                          {inputs.toolPresence.customTools.map((tool) => (
                            <div key={tool.id} className="space-y-2" data-testid={`row-custom-tool-${tool.id}`}>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="text"
                                  placeholder="Tool name"
                                  className="h-8 text-sm flex-1"
                                  value={tool.name}
                                  onChange={(e) =>
                                    setInputs((s) => ({
                                      ...s,
                                      toolPresence: {
                                        ...s.toolPresence,
                                        customTools: s.toolPresence.customTools.map((t) =>
                                          t.id === tool.id ? { ...t, name: e.target.value } : t
                                        ),
                                      },
                                    }))
                                  }
                                  data-testid={`input-custom-tool-name-${tool.id}`}
                                />
                                <div className="relative w-[140px]">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                                  <Input
                                    type="number"
                                    placeholder="Spend"
                                    className="h-8 pl-6 text-sm"
                                    value={tool.spend ?? ""}
                                    onChange={(e) =>
                                      setInputs((s) => ({
                                        ...s,
                                        toolPresence: {
                                          ...s.toolPresence,
                                          customTools: s.toolPresence.customTools.map((t) =>
                                            t.id === tool.id ? { ...t, spend: e.target.value ? Number(e.target.value) : undefined } : t
                                          ),
                                        },
                                      }))
                                    }
                                    data-testid={`input-custom-tool-spend-${tool.id}`}
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                  onClick={() =>
                                    setInputs((s) => ({
                                      ...s,
                                      toolPresence: {
                                        ...s.toolPresence,
                                        customTools: s.toolPresence.customTools.filter((t) => t.id !== tool.id),
                                      },
                                    }))
                                  }
                                  data-testid={`button-remove-tool-${tool.id}`}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full h-8 text-xs"
                            onClick={() =>
                              setInputs((s) => ({
                                ...s,
                                toolPresence: {
                                  ...s.toolPresence,
                                  customTools: [
                                    ...s.toolPresence.customTools,
                                    { id: crypto.randomUUID(), name: "", spend: undefined },
                                  ],
                                },
                              }))
                            }
                            data-testid="button-add-custom-tool"
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add other tool
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <InlineInfo
                      title="How this works"
                      body="When you enter actual annual spend for a tool, we use your real data instead of assumptions. Leave spend blank to use industry-standard cost estimates."
                      icon={<BookOpen className="h-4 w-4" />}
                      testId="info-tool-presence"
                    />
                  </div>
                </Card>

                <Card className="glass hairline rounded-3xl p-6">
                  <SectionHeader
                    icon={<Activity className="h-5 w-5 text-primary" />}
                    eyebrow="Inputs"
                    title="Managed services & outsourcing"
                    description="If you pay an MSP or outsource any EUC functions, capture the annual spend and what's covered."
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
                    </div>

                    <div className="space-y-4" data-testid="group-msp-services">
                      <div className="text-sm font-semibold">What's outsourced?</div>
                      <div className="rounded-2xl border bg-card/60 p-4">
                        <div className="grid gap-3">
                          {([
                            { k: "outsourcedEndpointMgmt", label: "Endpoint management (UEM, imaging, lifecycle)" },
                            { k: "outsourcedSecurity", label: "Security / EDR / SOC" },
                            { k: "outsourcedPatching", label: "Patching & updates" },
                            { k: "outsourcedHelpdesk", label: "Helpdesk / Tier 1 support" },
                            { k: "outsourcedTier2Plus", label: "Tier 2+ support / engineering" },
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

                      <InlineInfo
                        title="Why this matters"
                        body="Managed services spend is part of your total baseline TCO. Showing what's outsourced helps understand the full cost picture."
                        icon={<BookOpen className="h-4 w-4" />}
                        testId="info-msp"
                      />
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="assumptions" className="mt-5" data-testid="panel-assumptions">
              <Card className="glass hairline rounded-3xl p-6">
                <SectionHeader
                  icon={<BookOpen className="h-5 w-5 text-primary" />}
                  eyebrow="Assumptions"
                  title="Explicit, labeled, overrideable"
                  description="These values are used only when an input is missing. Inputs always override assumptions."
                  testId="header-assumptions"
                  right={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportJustificationReport}
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

                <div className="grid gap-4 lg:grid-cols-2">
                  <InlineInfo
                    title="Assumption application logic"
                    body="Input present → use input. Input missing → use assumption. Input always overrides assumption."
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    testId="info-logic"
                  />
                  <InlineInfo
                    title="Frozen engine (mockup)"
                    body="This prototype shows the structure and traceability model. Version-locking and audit logs come later."
                    icon={<Lock className="h-4 w-4" />}
                    testId="info-frozen"
                  />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="observations" className="mt-5" data-testid="panel-observations">
              <Card className="glass hairline rounded-3xl p-6">
                <SectionHeader
                  icon={<Sparkles className="h-5 w-5 text-primary" />}
                  eyebrow="Observations & Analysis"
                  title="Human commentary and trace"
                  description="This is the defensibility layer: capture caveats and show the math behind each line item."
                  testId="header-observations"
                />

                <div className="mt-6 grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <Label htmlFor="notes" data-testid="label-notes">
                        Notes & caveats
                      </Label>
                      <Textarea
                        id="notes"
                        placeholder="Example: Ticket counts are estimated. Licensing invoices pending. Some endpoints are shared in call centers."
                        className="mt-2 min-h-28"
                        value={inputs.observations.notes ?? ""}
                        onChange={(e) =>
                          setInputs((s) => ({
                            ...s,
                            observations: {
                              ...s.observations,
                              notes: e.target.value,
                            },
                          }))
                        }
                        data-testid="textarea-notes"
                      />
                      <div className="mt-2 text-xs text-muted-foreground" data-testid="text-notes-hint">
                        This section does not affect calculations.
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
                          onClick={exportAuditTrail}
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
                    <InlineInfo
                      title="Mirror, not microscope"
                      body="The tool reflects the current state back to the customer. No optimization hints, no scoring."
                      icon={<ChevronRight className="h-4 w-4" />}
                      testId="info-mirror"
                    />
                    <InlineInfo
                      title="No hidden logic"
                      body="If a line is assumed, it's labeled. If it's input, it's labeled. Nothing silently defaults."
                      icon={<Shield className="h-4 w-4" />}
                      testId="info-no-hidden"
                    />
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
              </Card>
            </TabsContent>

            <TabsContent value="summary" className="mt-5" data-testid="panel-summary">
              <Card className="glass hairline rounded-3xl p-6">
                <SectionHeader
                  icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
                  eyebrow="Summary"
                  title="Baseline snapshot"
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
                        {inputs.observations.notes?.trim() ? inputs.observations.notes : "No observations captured."}
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
                            vdiCostPerUser: derived.vdiCostPerVdiUser,
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
                          onClick={exportJson}
                          data-testid="button-export-json"
                        >
                          <FileDown className="h-4 w-4" /> JSON (data interchange)
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full gap-2 justify-start"
                          onClick={exportCSV}
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
                          onClick={exportAuditTrail}
                          data-testid="button-export-audit"
                        >
                          <FileText className="h-4 w-4" /> Audit Trail (full traceability)
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </main>

        <footer className="mt-10" data-testid="section-footer">
          <div className="glass hairline rounded-3xl px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground" data-testid="text-footer-date">
                {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </div>
              <img
                src={dark ? xentegraLogoWhite : xentegraLogoBlack}
                alt="XenTegra"
                className="h-6 object-contain"
                data-testid="img-footer-logo"
              />
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
    </div>
  );
}
