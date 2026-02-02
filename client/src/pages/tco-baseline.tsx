import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileDown,
  Info,
  Lock,
  Shield,
  Sparkles,
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
    avdPresent: YesNo;
    w365Present: YesNo;
    horizonPresent: YesNo;
    parallelsPresent: YesNo;
  };
  toolPresence: {
    intunePresent: YesNo;
    sccmPresent: YesNo;
    workspaceOnePresent: YesNo;
    jamfPresent: YesNo;
    controlUpPresent: YesNo;
    nerdioPresent: YesNo;
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
    value: value === undefined ? "" : String(value),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw.trim() === "") return onChange(undefined);
      const next = Number(raw);
      if (!Number.isFinite(next)) return;
      onChange(next);
    },
    inputMode: "numeric" as const,
  };
}

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
    },
    toolPresence: {
      intunePresent: "unknown",
      sccmPresent: "unknown",
      workspaceOnePresent: "unknown",
      jamfPresent: "unknown",
      controlUpPresent: "unknown",
      nerdioPresent: "unknown",
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

    const derivedMgmtSecurity = endpoints * assumptions.mgmtSecurity.costPerEndpointPerYear;

    const derivedVdiDaas = vdiUserCount * assumptions.vdi.platformCostPerVdiUserPerYear;

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

    const mgmtSecurityLine: CalcLine = {
      key: "mgmt-security",
      label: "Management & Security",
      value: mgmtSecurityValue,
      basis: inputs.categoryRollups.mgmtSecurityAnnual !== undefined
        ? `${fmtMoney(mgmtSecurityValue)} (input)`
        : `${fmtNumber(endpoints)} endpoints × $${assumptions.mgmtSecurity.costPerEndpointPerYear}/endpoint`,
      isAssumed: inputs.categoryRollups.mgmtSecurityAnnual === undefined,
    };

    const vdiDaasLine: CalcLine = {
      key: "vdi-daas",
      label: "VDI / DaaS",
      value: vdiDaasValue,
      basis: inputs.categoryRollups.vdiDaasAnnual !== undefined
        ? `${fmtMoney(vdiDaasValue)} (input)`
        : `${fmtNumber(vdiUserCount)} VDI users × $${assumptions.vdi.platformCostPerVdiUserPerYear}/user`,
      isAssumed: inputs.categoryRollups.vdiDaasAnnual === undefined,
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

    return {
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

                <div className="flex flex-col gap-2 sm:flex-row">
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
                        },
                        toolPresence: {
                          intunePresent: "unknown",
                          sccmPresent: "unknown",
                          workspaceOnePresent: "unknown",
                          jamfPresent: "unknown",
                          controlUpPresent: "unknown",
                          nerdioPresent: "unknown",
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
                  <Button
                    onClick={exportJson}
                    className="gap-2"
                    data-testid="button-export"
                  >
                    <FileDown className="h-4 w-4" /> Export baseline
                  </Button>
                </div>
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

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <InlineInfo
                    title="Governed inputs → traceable output"
                    body="Every total is explainable. When an input is missing, the tool uses an explicit assumption and labels it."
                    icon={<Lock className="h-4 w-4" />}
                    testId="info-governance"
                  />
                  <InlineInfo
                    title="Baseline only (no ROI)"
                    body="This tool won't model future state, savings, or vendor comparisons. It's designed to earn trust first."
                    icon={<Shield className="h-4 w-4" />}
                    testId="info-baseline-only"
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
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

              {activeTab === "home" ? null : <div
                className="glass hairline rounded-2xl px-4 py-3"
                data-testid="readiness-panel"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">
                      Readiness
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm font-semibold" data-testid="text-readiness">
                        {derived.readinessScore >= 100
                          ? "Ready"
                          : derived.readinessScore >= 50
                            ? "In progress"
                            : "Not ready"}
                      </span>
                      <span className="kbd" data-testid="kbd-score">
                        {derived.readinessScore}/100
                      </span>
                    </div>
                  </div>
                  <div className="w-36">
                    <Progress value={derived.readinessScore} data-testid="progress-readiness" />
                  </div>
                </div>
                <div
                  className="mt-2 text-xs text-muted-foreground"
                  data-testid="text-readiness-hint"
                >
                  Endpoints present + some spend captured.
                </div>
              </div>}
            </div>

            <TabsContent value="home" className="mt-5" data-testid="panel-home">
              <TcoHome onStartBaseline={() => setActiveTab("inputs")} />
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

                  <div className="mt-6 grid gap-6 lg:grid-cols-3">
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

                    <div className="space-y-4" data-testid="group-vdi-platforms">
                      <div className="text-sm font-semibold" data-testid="text-vdi-platforms-title">
                        VDI / DaaS platforms
                      </div>
                      <div className="rounded-2xl border bg-card/60 p-4" data-testid="panel-vdi-platforms">
                        <div className="grid gap-4">
                          {([
                            { k: "citrixPresent", label: "Citrix" },
                            { k: "avdPresent", label: "Azure Virtual Desktop" },
                            { k: "w365Present", label: "Windows 365" },
                            { k: "horizonPresent", label: "VMware Horizon" },
                            { k: "parallelsPresent", label: "Parallels RAS" },
                          ] as const).map((row) => (
                            <div
                              key={row.k}
                              className="flex items-center justify-between gap-3"
                              data-testid={`row-vdi-${row.k}`}
                            >
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
                          ))}
                        </div>
                      </div>
                      <div className="text-sm font-semibold mt-4" data-testid="text-tool-presence-title">
                        Endpoint & management tools
                      </div>
                      <div className="rounded-2xl border bg-card/60 p-4" data-testid="panel-tool-presence">
                        <div className="grid gap-4">
                          {([
                            { k: "intunePresent", label: "Intune" },
                            { k: "sccmPresent", label: "SCCM" },
                            { k: "workspaceOnePresent", label: "Workspace ONE" },
                            { k: "jamfPresent", label: "Jamf" },
                            { k: "controlUpPresent", label: "ControlUp" },
                            { k: "nerdioPresent", label: "Nerdio" },
                          ] as const).map((row) => (
                            <div
                              key={row.k}
                              className="flex items-center justify-between gap-3"
                              data-testid={`row-tool-${row.k}`}
                            >
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
                          ))}
                        </div>
                      </div>
                      <InlineInfo
                        title="Why this matters"
                        body="These are baseline context flags for discovery. They don't change totals unless you enter actual spend."
                        icon={<BookOpen className="h-4 w-4" />}
                        testId="info-tool-presence"
                      />
                    </div>
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
                                {derived.endpoints > 0 ? fmtMoney(derived.mspCostPerDevice) : "N/A"}
                              </div>
                            </div>
                            <div className="rounded-xl border bg-card px-3 py-2">
                              <div className="text-xs text-muted-foreground">Per user</div>
                              <div className="text-sm font-semibold">
                                {derived.userCount > 0 ? fmtMoney(derived.mspCostPerUser) : "N/A"}
                              </div>
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
                                checked={inputs.managedServices[row.k]}
                                onChange={(e) =>
                                  setInputs((s) => ({
                                    ...s,
                                    managedServices: {
                                      ...s.managedServices,
                                      [row.k]: e.target.checked,
                                    },
                                  }))
                                }
                                className="h-4 w-4 rounded border-gray-300"
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
                          {...numberField(assumptions.overhead.pctOfTotal * 100, (v) =>
                            setAssumptions((s) => ({
                              ...s,
                              overhead: {
                                ...s.overhead,
                                pctOfTotal: (nonNeg(v) ?? 7) / 100,
                              },
                            })),
                          )}
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
                      <div className="text-sm font-semibold">Calculation trace</div>
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
                  </div>

                  <div className="space-y-4">
                    <InlineInfo
                      title="Client-safe view"
                      body="This summary intentionally hides numeric assumptions. Use Observations & Analysis for defensibility when needed."
                      icon={<Shield className="h-4 w-4" />}
                      testId="info-client-safe"
                    />
                    <InlineInfo
                      title="Ready means: not missing everything"
                      body="Readiness here is a simple gating aid. It does not imply completeness or audit-grade accuracy."
                      icon={<Info className="h-4 w-4" />}
                      testId="info-ready"
                    />
                    <Button className="w-full gap-2" onClick={exportJson} data-testid="button-export-summary">
                      <FileDown className="h-4 w-4" /> Export baseline JSON
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-full gap-2"
                      onClick={() => window.print()}
                      data-testid="button-print"
                    >
                      <FileDown className="h-4 w-4" /> Print / PDF
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </main>

        <footer className="mt-10" data-testid="section-footer">
          <div className="glass hairline rounded-3xl px-6 py-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-medium" data-testid="text-footer-title">
                Guardrails
              </div>
              <div className="text-xs text-muted-foreground" data-testid="text-footer-subtitle">
                Baseline first. No future-state math. No ROI.
              </div>
            </div>
            <Separator className="my-4" />
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: <Shield className="h-4 w-4" />,
                  t: "Vendor-neutral",
                  d: "No comparisons or bias.",
                },
                {
                  icon: <Lock className="h-4 w-4" />,
                  t: "Traceable",
                  d: "Every number is explainable.",
                },
                {
                  icon: <CheckCircle2 className="h-4 w-4" />,
                  t: "Assumption-backed",
                  d: "Unknowns are explicit.",
                },
              ].map((b, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border bg-card/60 px-4 py-3"
                  data-testid={`card-guardrail-${idx}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="text-muted-foreground">{b.icon}</div>
                    <div className="text-sm font-semibold" data-testid={`text-guardrail-title-${idx}`}>
                      {b.t}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground" data-testid={`text-guardrail-desc-${idx}`}>
                    {b.d}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
