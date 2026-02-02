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
  devices: {
    desktops?: number;
    laptops?: number;
    thinClients?: number;
    mobile?: number;
    sharedKiosk?: number;
  };
  support: {
    tier1Fte?: number;
    tier2Fte?: number;
    tier3Fte?: number;
    avgFullyBurdenedSalary?: number;
    ticketVolume?: number;
  };
  licensing: {
    eucPlatformAnnual?: number;
    endpointOsAnnual?: number;
    securityToolingAnnual?: number;
    managementToolingAnnual?: number;
  };
  presence: {
    uemPresent: YesNo;
    edrPresent: YesNo;
    patchToolingPresent: YesNo;
  };
  virtualization: {
    onPremVdiUsers?: number;
    cloudDaasUsers?: number;
    sessionDensity?: number;
    infraOwnership: "customer" | "provider" | "unknown";
  };
  overhead: {
    facilitiesAnnual?: number;
    trainingAnnual?: number;
    contractorAnnual?: number;
  };
  observations: {
    notes?: string;
  };
};

type Assumptions = {
  replacementCycleYears: {
    pc: number;
    thinClient: number;
  };
  supportRatio: {
    endpointsPerTier1: number;
    endpointsPerTier2: number;
    endpointsPerTier3: number;
  };
  salary: {
    tier1: number;
    tier2: number;
    tier3: number;
  };
  licensingBenchmarks: {
    uemPerEndpoint: number;
    securityPerEndpoint: number;
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
    devices: {},
    support: {},
    licensing: {},
    presence: {
      uemPresent: "unknown",
      edrPresent: "unknown",
      patchToolingPresent: "unknown",
    },
    virtualization: {
      infraOwnership: "unknown",
    },
    overhead: {},
    observations: {},
  });

  const [assumptions, setAssumptions] = useState<Assumptions>({
    replacementCycleYears: {
      pc: 4,
      thinClient: 5,
    },
    supportRatio: {
      endpointsPerTier1: 600,
      endpointsPerTier2: 1500,
      endpointsPerTier3: 4000,
    },
    salary: {
      tier1: 85000,
      tier2: 115000,
      tier3: 155000,
    },
    licensingBenchmarks: {
      uemPerEndpoint: 36,
      securityPerEndpoint: 48,
    },
  });

  const derived = useMemo(() => {
    const endpoints =
      (nonNeg(inputs.devices.desktops) ?? 0) +
      (nonNeg(inputs.devices.laptops) ?? 0) +
      (nonNeg(inputs.devices.thinClients) ?? 0) +
      (nonNeg(inputs.devices.mobile) ?? 0) +
      (nonNeg(inputs.devices.sharedKiosk) ?? 0);

    const tier1Salary =
      nonNeg(inputs.support.avgFullyBurdenedSalary) ?? assumptions.salary.tier1;
    const tier2Salary = assumptions.salary.tier2;
    const tier3Salary = assumptions.salary.tier3;

    const tier1Fte = nonNeg(inputs.support.tier1Fte);
    const tier2Fte = nonNeg(inputs.support.tier2Fte);
    const tier3Fte = nonNeg(inputs.support.tier3Fte);

    const derivedTier1 = endpoints / assumptions.supportRatio.endpointsPerTier1;
    const derivedTier2 = endpoints / assumptions.supportRatio.endpointsPerTier2;
    const derivedTier3 = endpoints / assumptions.supportRatio.endpointsPerTier3;

    const laborLines: CalcLine[] = [
      {
        key: "labor-tier1",
        label: "Tier 1 support labor",
        value: (tier1Fte ?? derivedTier1) * tier1Salary,
        basis:
          tier1Fte !== undefined
            ? `${tier1Fte} FTE × ${fmtMoney(tier1Salary)} (input salary)`
            : `${derivedTier1.toFixed(2)} FTE (assumed ratio) × ${fmtMoney(tier1Salary)} (assumed tier1 salary)`,
        isAssumed: tier1Fte === undefined,
      },
      {
        key: "labor-tier2",
        label: "Tier 2 support labor",
        value: (tier2Fte ?? derivedTier2) * tier2Salary,
        basis:
          tier2Fte !== undefined
            ? `${tier2Fte} FTE × ${fmtMoney(tier2Salary)} (assumed salary)`
            : `${derivedTier2.toFixed(2)} FTE (assumed ratio) × ${fmtMoney(tier2Salary)} (assumed salary)`,
        isAssumed: tier2Fte === undefined,
      },
      {
        key: "labor-tier3",
        label: "Tier 3 support labor",
        value: (tier3Fte ?? derivedTier3) * tier3Salary,
        basis:
          tier3Fte !== undefined
            ? `${tier3Fte} FTE × ${fmtMoney(tier3Salary)} (assumed salary)`
            : `${derivedTier3.toFixed(2)} FTE (assumed ratio) × ${fmtMoney(tier3Salary)} (assumed salary)`,
        isAssumed: tier3Fte === undefined,
      },
    ];

    const licensingLines: CalcLine[] = [
      {
        key: "lic-euc",
        label: "EUC platform licensing",
        value: nonNeg(inputs.licensing.eucPlatformAnnual) ?? 0,
        basis:
          inputs.licensing.eucPlatformAnnual !== undefined
            ? `${fmtMoney(inputs.licensing.eucPlatformAnnual)} (input)`
            : "Not provided (0 in baseline until known)",
        isAssumed: false,
      },
      {
        key: "lic-os",
        label: "Endpoint OS licensing",
        value: nonNeg(inputs.licensing.endpointOsAnnual) ?? 0,
        basis:
          inputs.licensing.endpointOsAnnual !== undefined
            ? `${fmtMoney(inputs.licensing.endpointOsAnnual)} (input)`
            : "Not provided (0 in baseline until known)",
        isAssumed: false,
      },
      {
        key: "lic-security",
        label: "Security tooling",
        value:
          nonNeg(inputs.licensing.securityToolingAnnual) ??
          endpoints * assumptions.licensingBenchmarks.securityPerEndpoint,
        basis:
          inputs.licensing.securityToolingAnnual !== undefined
            ? `${fmtMoney(inputs.licensing.securityToolingAnnual)} (input)`
            : `${fmtNumber(endpoints)} endpoints × ${fmtMoney(assumptions.licensingBenchmarks.securityPerEndpoint)} per endpoint (assumption)`,
        isAssumed: inputs.licensing.securityToolingAnnual === undefined,
      },
      {
        key: "lic-mgmt",
        label: "Management tooling",
        value:
          nonNeg(inputs.licensing.managementToolingAnnual) ??
          endpoints * assumptions.licensingBenchmarks.uemPerEndpoint,
        basis:
          inputs.licensing.managementToolingAnnual !== undefined
            ? `${fmtMoney(inputs.licensing.managementToolingAnnual)} (input)`
            : `${fmtNumber(endpoints)} endpoints × ${fmtMoney(assumptions.licensingBenchmarks.uemPerEndpoint)} per endpoint (assumption)`,
        isAssumed: inputs.licensing.managementToolingAnnual === undefined,
      },
    ];

    const virtualizationUsers =
      (nonNeg(inputs.virtualization.onPremVdiUsers) ?? 0) +
      (nonNeg(inputs.virtualization.cloudDaasUsers) ?? 0);

    const overheadLines: CalcLine[] = [
      {
        key: "overhead-facilities",
        label: "Facilities allocation",
        value: nonNeg(inputs.overhead.facilitiesAnnual) ?? 0,
        basis:
          inputs.overhead.facilitiesAnnual !== undefined
            ? `${fmtMoney(inputs.overhead.facilitiesAnnual)} (input)`
            : "Not provided (0 in baseline until known)",
        isAssumed: false,
      },
      {
        key: "overhead-training",
        label: "Training budget",
        value: nonNeg(inputs.overhead.trainingAnnual) ?? 0,
        basis:
          inputs.overhead.trainingAnnual !== undefined
            ? `${fmtMoney(inputs.overhead.trainingAnnual)} (input)`
            : "Not provided (0 in baseline until known)",
        isAssumed: false,
      },
      {
        key: "overhead-contractors",
        label: "Contractor spend",
        value: nonNeg(inputs.overhead.contractorAnnual) ?? 0,
        basis:
          inputs.overhead.contractorAnnual !== undefined
            ? `${fmtMoney(inputs.overhead.contractorAnnual)} (input)`
            : "Not provided (0 in baseline until known)",
        isAssumed: false,
      },
    ];

    const laborTotal = laborLines.reduce((s, l) => s + l.value, 0);
    const licensingTotal = licensingLines.reduce((s, l) => s + l.value, 0);
    const overheadTotal = overheadLines.reduce((s, l) => s + l.value, 0);

    const totalAnnualTco = laborTotal + licensingTotal + overheadTotal;
    const costPerEndpoint = endpoints > 0 ? totalAnnualTco / endpoints : 0;

    const assumedLines = [...laborLines, ...licensingLines, ...overheadLines].filter(
      (l) => l.isAssumed,
    );

    const readiness = {
      endpointsPresent: endpoints > 0,
      hasSomeSpend: totalAnnualTco > 0,
    };

    const readinessScore =
      (readiness.endpointsPresent ? 50 : 0) + (readiness.hasSomeSpend ? 50 : 0);

    return {
      endpoints,
      virtualizationUsers,
      laborLines,
      licensingLines,
      overheadLines,
      laborTotal,
      licensingTotal,
      overheadTotal,
      totalAnnualTco,
      costPerEndpoint,
      assumedLines,
      readiness,
      readinessScore,
      derivedTier1,
      derivedTier2,
      derivedTier3,
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
      version: "0.1-mockup",
      generatedAt: new Date().toISOString(),
      inputs,
      assumptions,
      derived: {
        endpoints: derived.endpoints,
        virtualizationUsers: derived.virtualizationUsers,
        totals: {
          laborTotal: derived.laborTotal,
          licensingTotal: derived.licensingTotal,
          overheadTotal: derived.overheadTotal,
          totalAnnualTco: derived.totalAnnualTco,
          costPerEndpoint: derived.costPerEndpoint,
        },
        trace: {
          laborLines: derived.laborLines,
          licensingLines: derived.licensingLines,
          overheadLines: derived.overheadLines,
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
                    Neutral / Unbiased Baseline
                  </Badge>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline">Mirror reality. No ROI.</span>
                </div>
                <h1
                  className="mt-2 font-serif text-3xl tracking-tight sm:text-4xl"
                  data-testid="text-title"
                >
                  TCO Baseline Assessment
                </h1>
                <p
                  className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground"
                  data-testid="text-subtitle"
                >
                  Define your current state with transparent inputs, explicit assumptions,
                  and defensible math. This produces a baseline only—no future-state
                  scenarios, no savings narratives.
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
                        devices: {},
                        support: {},
                        licensing: {},
                        presence: {
                          uemPresent: "unknown",
                          edrPresent: "unknown",
                          patchToolingPresent: "unknown",
                        },
                        virtualization: { infraOwnership: "unknown" },
                        overhead: {},
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
                          <Label htmlFor="desktops" data-testid="label-desktops">
                            Physical desktops
                          </Label>
                          <Input
                            id="desktops"
                            placeholder="e.g., 350"
                            {...numberField(inputs.devices.desktops, (v) =>
                              setInputs((s) => ({
                                ...s,
                                devices: { ...s.devices, desktops: nonNeg(v) },
                              })),
                            )}
                            data-testid="input-desktops"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="laptops" data-testid="label-laptops">
                            Physical laptops
                          </Label>
                          <Input
                            id="laptops"
                            placeholder="e.g., 1200"
                            {...numberField(inputs.devices.laptops, (v) =>
                              setInputs((s) => ({
                                ...s,
                                devices: { ...s.devices, laptops: nonNeg(v) },
                              })),
                            )}
                            data-testid="input-laptops"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="thinClients" data-testid="label-thinclients">
                            Thin clients
                          </Label>
                          <Input
                            id="thinClients"
                            placeholder="e.g., 80"
                            {...numberField(inputs.devices.thinClients, (v) =>
                              setInputs((s) => ({
                                ...s,
                                devices: {
                                  ...s.devices,
                                  thinClients: nonNeg(v),
                                },
                              })),
                            )}
                            data-testid="input-thinclients"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mobile" data-testid="label-mobile">
                            Mobile devices (optional)
                          </Label>
                          <Input
                            id="mobile"
                            placeholder="e.g., 200"
                            {...numberField(inputs.devices.mobile, (v) =>
                              setInputs((s) => ({
                                ...s,
                                devices: { ...s.devices, mobile: nonNeg(v) },
                              })),
                            )}
                            data-testid="input-mobile"
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="shared" data-testid="label-shared">
                            Shared / kiosk devices (optional)
                          </Label>
                          <Input
                            id="shared"
                            placeholder="e.g., 40"
                            {...numberField(inputs.devices.sharedKiosk, (v) =>
                              setInputs((s) => ({
                                ...s,
                                devices: {
                                  ...s.devices,
                                  sharedKiosk: nonNeg(v),
                                },
                              })),
                            )}
                            data-testid="input-shared"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5" data-testid="group-support">
                      <div>
                        <div className="text-sm font-semibold" data-testid="text-support-title">
                          Support & operations
                        </div>
                        <div className="text-xs text-muted-foreground" data-testid="text-support-subtitle">
                          Provide FTE counts if known. If not, the tool will derive staffing
                          from a visible ratio.
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="tier1" data-testid="label-tier1">
                            Tier 1 FTE
                          </Label>
                          <Input
                            id="tier1"
                            placeholder="e.g., 4"
                            {...numberField(inputs.support.tier1Fte, (v) =>
                              setInputs((s) => ({
                                ...s,
                                support: { ...s.support, tier1Fte: nonNeg(v) },
                              })),
                            )}
                            data-testid="input-tier1"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tier2" data-testid="label-tier2">
                            Tier 2 FTE
                          </Label>
                          <Input
                            id="tier2"
                            placeholder="e.g., 2"
                            {...numberField(inputs.support.tier2Fte, (v) =>
                              setInputs((s) => ({
                                ...s,
                                support: { ...s.support, tier2Fte: nonNeg(v) },
                              })),
                            )}
                            data-testid="input-tier2"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tier3" data-testid="label-tier3">
                            Tier 3 FTE
                          </Label>
                          <Input
                            id="tier3"
                            placeholder="e.g., 1"
                            {...numberField(inputs.support.tier3Fte, (v) =>
                              setInputs((s) => ({
                                ...s,
                                support: { ...s.support, tier3Fte: nonNeg(v) },
                              })),
                            )}
                            data-testid="input-tier3"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="salary" data-testid="label-salary">
                            Avg fully burdened salary (optional)
                          </Label>
                          <Input
                            id="salary"
                            placeholder="e.g., 90000"
                            {...numberField(inputs.support.avgFullyBurdenedSalary, (v) =>
                              setInputs((s) => ({
                                ...s,
                                support: {
                                  ...s.support,
                                  avgFullyBurdenedSalary: nonNeg(v),
                                },
                              })),
                            )}
                            data-testid="input-salary"
                          />
                        </div>
                      </div>

                      <div className="rounded-2xl border bg-card/60 p-4" data-testid="panel-support-derived">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold" data-testid="text-derived-title">
                              Derived staffing (if blanks)
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground" data-testid="text-derived-subtitle">
                              Based on your endpoint count and the visible ratios in
                              Assumptions.
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className="rounded-full"
                            data-testid="badge-derived"
                          >
                            Assumption-backed
                          </Badge>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-xl border bg-card px-3 py-2" data-testid="derived-tier1">
                            <div className="text-xs text-muted-foreground">Tier 1</div>
                            <div className="text-sm font-semibold">
                              {derived.derivedTier1.toFixed(2)} FTE
                            </div>
                          </div>
                          <div className="rounded-xl border bg-card px-3 py-2" data-testid="derived-tier2">
                            <div className="text-xs text-muted-foreground">Tier 2</div>
                            <div className="text-sm font-semibold">
                              {derived.derivedTier2.toFixed(2)} FTE
                            </div>
                          </div>
                          <div className="rounded-xl border bg-card px-3 py-2" data-testid="derived-tier3">
                            <div className="text-xs text-muted-foreground">Tier 3</div>
                            <div className="text-sm font-semibold">
                              {derived.derivedTier3.toFixed(2)} FTE
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="glass hairline rounded-3xl p-6">
                  <SectionHeader
                    icon={<Activity className="h-5 w-5 text-primary" />}
                    eyebrow="Inputs"
                    title="Licensing, tools, and overhead"
                    description="Enter known annual spend. If unknown, some categories can use per-endpoint assumptions (clearly labeled)."
                    testId="header-licensing"
                  />

                  <div className="mt-6 grid gap-6 lg:grid-cols-3">
                    <div className="space-y-4" data-testid="group-licensing">
                      <div className="text-sm font-semibold" data-testid="text-licensing-title">
                        Licensing (annual)
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="lic-euc" data-testid="label-lic-euc">
                            EUC platform
                          </Label>
                          <Input
                            id="lic-euc"
                            placeholder="e.g., 125000"
                            {...numberField(inputs.licensing.eucPlatformAnnual, (v) =>
                              setInputs((s) => ({
                                ...s,
                                licensing: {
                                  ...s.licensing,
                                  eucPlatformAnnual: nonNeg(v),
                                },
                              })),
                            )}
                            data-testid="input-lic-euc"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lic-os" data-testid="label-lic-os">
                            Endpoint OS
                          </Label>
                          <Input
                            id="lic-os"
                            placeholder="e.g., 48000"
                            {...numberField(inputs.licensing.endpointOsAnnual, (v) =>
                              setInputs((s) => ({
                                ...s,
                                licensing: {
                                  ...s.licensing,
                                  endpointOsAnnual: nonNeg(v),
                                },
                              })),
                            )}
                            data-testid="input-lic-os"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lic-sec" data-testid="label-lic-sec">
                            Security tooling
                          </Label>
                          <Input
                            id="lic-sec"
                            placeholder="blank = per-endpoint assumption"
                            {...numberField(inputs.licensing.securityToolingAnnual, (v) =>
                              setInputs((s) => ({
                                ...s,
                                licensing: {
                                  ...s.licensing,
                                  securityToolingAnnual: nonNeg(v),
                                },
                              })),
                            )}
                            data-testid="input-lic-sec"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lic-mgmt" data-testid="label-lic-mgmt">
                            Management tooling
                          </Label>
                          <Input
                            id="lic-mgmt"
                            placeholder="blank = per-endpoint assumption"
                            {...numberField(inputs.licensing.managementToolingAnnual, (v) =>
                              setInputs((s) => ({
                                ...s,
                                licensing: {
                                  ...s.licensing,
                                  managementToolingAnnual: nonNeg(v),
                                },
                              })),
                            )}
                            data-testid="input-lic-mgmt"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4" data-testid="group-presence">
                      <div className="text-sm font-semibold" data-testid="text-presence-title">
                        Presence (signals only)
                      </div>
                      <div className="rounded-2xl border bg-card/60 p-4" data-testid="panel-presence">
                        <div className="grid gap-4">
                          {([
                            { k: "uemPresent", label: "UEM present" },
                            { k: "edrPresent", label: "EDR present" },
                            { k: "patchToolingPresent", label: "Patch tooling present" },
                          ] as const).map((row) => (
                            <div
                              key={row.k}
                              className="flex items-center justify-between gap-3"
                              data-testid={`row-presence-${row.k}`}
                            >
                              <div className="text-sm" data-testid={`text-presence-${row.k}`}>
                                {row.label}
                              </div>
                              <div className="flex items-center gap-2">
                                {(["yes", "no", "unknown"] as const).map((v) => (
                                  <Button
                                    key={v}
                                    type="button"
                                    variant={
                                      inputs.presence[row.k] === v
                                        ? "default"
                                        : "secondary"
                                    }
                                    className="h-8 rounded-xl px-3 text-xs"
                                    onClick={() =>
                                      setInputs((s) => ({
                                        ...s,
                                        presence: { ...s.presence, [row.k]: v },
                                      }))
                                    }
                                    data-testid={`button-presence-${row.k}-${v}`}
                                  >
                                    {v === "yes" ? "Yes" : v === "no" ? "No" : "Unknown"}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <InlineInfo
                        title="Why this matters"
                        body="These are baseline context flags, not maturity scoring. They don't change totals unless you enter actual spend."
                        icon={<BookOpen className="h-4 w-4" />}
                        testId="info-presence"
                      />
                    </div>

                    <div className="space-y-4" data-testid="group-overhead">
                      <div className="text-sm font-semibold" data-testid="text-overhead-title">
                        Overhead (annual)
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="oh-fac" data-testid="label-oh-fac">
                            Facilities allocation
                          </Label>
                          <Input
                            id="oh-fac"
                            placeholder="e.g., 25000"
                            {...numberField(inputs.overhead.facilitiesAnnual, (v) =>
                              setInputs((s) => ({
                                ...s,
                                overhead: {
                                  ...s.overhead,
                                  facilitiesAnnual: nonNeg(v),
                                },
                              })),
                            )}
                            data-testid="input-oh-fac"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="oh-train" data-testid="label-oh-train">
                            Training budget
                          </Label>
                          <Input
                            id="oh-train"
                            placeholder="e.g., 15000"
                            {...numberField(inputs.overhead.trainingAnnual, (v) =>
                              setInputs((s) => ({
                                ...s,
                                overhead: {
                                  ...s.overhead,
                                  trainingAnnual: nonNeg(v),
                                },
                              })),
                            )}
                            data-testid="input-oh-train"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="oh-contract" data-testid="label-oh-contract">
                            Contractor spend
                          </Label>
                          <Input
                            id="oh-contract"
                            placeholder="e.g., 90000"
                            {...numberField(inputs.overhead.contractorAnnual, (v) =>
                              setInputs((s) => ({
                                ...s,
                                overhead: {
                                  ...s.overhead,
                                  contractorAnnual: nonNeg(v),
                                },
                              })),
                            )}
                            data-testid="input-oh-contract"
                          />
                        </div>
                      </div>
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
                  <div className="rounded-2xl border bg-card/60 p-4" data-testid="card-assumptions-support">
                    <div className="text-sm font-semibold" data-testid="text-assump-support-title">
                      Support ratios
                    </div>
                    <div className="mt-4 grid gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="a-t1" data-testid="label-a-t1">
                          Endpoints per Tier 1
                        </Label>
                        <Input
                          id="a-t1"
                          {...numberField(assumptions.supportRatio.endpointsPerTier1, (v) =>
                            setAssumptions((s) => ({
                              ...s,
                              supportRatio: {
                                ...s.supportRatio,
                                endpointsPerTier1: Math.max(1, nonNeg(v) ?? 1),
                              },
                            })),
                          )}
                          data-testid="input-a-t1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="a-t2" data-testid="label-a-t2">
                          Endpoints per Tier 2
                        </Label>
                        <Input
                          id="a-t2"
                          {...numberField(assumptions.supportRatio.endpointsPerTier2, (v) =>
                            setAssumptions((s) => ({
                              ...s,
                              supportRatio: {
                                ...s.supportRatio,
                                endpointsPerTier2: Math.max(1, nonNeg(v) ?? 1),
                              },
                            })),
                          )}
                          data-testid="input-a-t2"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="a-t3" data-testid="label-a-t3">
                          Endpoints per Tier 3
                        </Label>
                        <Input
                          id="a-t3"
                          {...numberField(assumptions.supportRatio.endpointsPerTier3, (v) =>
                            setAssumptions((s) => ({
                              ...s,
                              supportRatio: {
                                ...s.supportRatio,
                                endpointsPerTier3: Math.max(1, nonNeg(v) ?? 1),
                              },
                            })),
                          )}
                          data-testid="input-a-t3"
                        />
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground" data-testid="text-assump-support-hint">
                      Used to derive staffing if FTE counts are blank.
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-card/60 p-4" data-testid="card-assumptions-salary">
                    <div className="text-sm font-semibold" data-testid="text-assump-salary-title">
                      Salary benchmarks
                    </div>
                    <div className="mt-4 grid gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="a-s1" data-testid="label-a-s1">
                          Tier 1 salary
                        </Label>
                        <Input
                          id="a-s1"
                          {...numberField(assumptions.salary.tier1, (v) =>
                            setAssumptions((s) => ({
                              ...s,
                              salary: { ...s.salary, tier1: nonNeg(v) ?? 0 },
                            })),
                          )}
                          data-testid="input-a-s1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="a-s2" data-testid="label-a-s2">
                          Tier 2 salary
                        </Label>
                        <Input
                          id="a-s2"
                          {...numberField(assumptions.salary.tier2, (v) =>
                            setAssumptions((s) => ({
                              ...s,
                              salary: { ...s.salary, tier2: nonNeg(v) ?? 0 },
                            })),
                          )}
                          data-testid="input-a-s2"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="a-s3" data-testid="label-a-s3">
                          Tier 3 salary
                        </Label>
                        <Input
                          id="a-s3"
                          {...numberField(assumptions.salary.tier3, (v) =>
                            setAssumptions((s) => ({
                              ...s,
                              salary: { ...s.salary, tier3: nonNeg(v) ?? 0 },
                            })),
                          )}
                          data-testid="input-a-s3"
                        />
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground" data-testid="text-assump-salary-hint">
                      These are used only when an input salary isn't provided.
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-card/60 p-4" data-testid="card-assumptions-lic">
                    <div className="text-sm font-semibold" data-testid="text-assump-lic-title">
                      Per-endpoint licensing
                    </div>
                    <div className="mt-4 grid gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="a-uem" data-testid="label-a-uem">
                          UEM per endpoint (annual)
                        </Label>
                        <Input
                          id="a-uem"
                          {...numberField(assumptions.licensingBenchmarks.uemPerEndpoint, (v) =>
                            setAssumptions((s) => ({
                              ...s,
                              licensingBenchmarks: {
                                ...s.licensingBenchmarks,
                                uemPerEndpoint: nonNeg(v) ?? 0,
                              },
                            })),
                          )}
                          data-testid="input-a-uem"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="a-sec" data-testid="label-a-sec">
                          Security per endpoint (annual)
                        </Label>
                        <Input
                          id="a-sec"
                          {...numberField(assumptions.licensingBenchmarks.securityPerEndpoint, (v) =>
                            setAssumptions((s) => ({
                              ...s,
                              licensingBenchmarks: {
                                ...s.licensingBenchmarks,
                                securityPerEndpoint: nonNeg(v) ?? 0,
                              },
                            })),
                          )}
                          data-testid="input-a-sec"
                        />
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground" data-testid="text-assump-lic-hint">
                      Only applies when annual security/management spend is left blank.
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
                        { title: "Labor", lines: derived.laborLines },
                        { title: "Licensing", lines: derived.licensingLines },
                        { title: "Overhead", lines: derived.overheadLines },
                      ].map((block) => (
                        <div
                          key={block.title}
                          className="rounded-2xl border bg-card/60"
                          data-testid={`trace-block-${block.title.toLowerCase()}`}
                        >
                          <div className="flex items-center justify-between px-4 py-3">
                            <div className="text-sm font-semibold" data-testid={`text-trace-title-${block.title.toLowerCase()}`}>
                              {block.title}
                            </div>
                            <Badge
                              variant="secondary"
                              className="rounded-full"
                              data-testid={`badge-trace-${block.title.toLowerCase()}`}
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

                <div className="mt-6 grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
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
                    </div>

                    <div className="rounded-2xl border bg-card/60 p-4" data-testid="panel-category">
                      <div className="text-sm font-semibold" data-testid="text-category-title">
                        Category totals
                      </div>
                      <div className="mt-3 grid gap-2">
                        {([
                          {
                            k: "labor",
                            label: "Labor",
                            v: derived.laborTotal,
                            total: derived.totalAnnualTco,
                          },
                          {
                            k: "licensing",
                            label: "Licensing",
                            v: derived.licensingTotal,
                            total: derived.totalAnnualTco,
                          },
                          {
                            k: "overhead",
                            label: "Overhead",
                            v: derived.overheadTotal,
                            total: derived.totalAnnualTco,
                          },
                        ] as const).map((row) => (
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
