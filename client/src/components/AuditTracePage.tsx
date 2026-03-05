import { useMemo, useState, useRef, useCallback } from "react";
import {
  Pencil,
  Upload,
  AlertTriangle,
  Calculator,
  ArrowLeftRight,
  ChevronDown,
  ChevronRight,
  Search,
  Download,
  Filter,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { HexagridEntry } from "@/components/HexagridSection";
import * as XLSX from "xlsx";

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
    notes?: string;
  };
  hexagridEntries: HexagridEntry[];
};

type Assumptions = {
  deviceRefreshYears: { laptop: number; desktop: number; thinClient: number };
  deviceUnitCost: { laptop: number; desktop: number; thinClient: number };
  supportOps: {
    avgTicketHandlingHours: number;
    deploymentHoursPerDevice: number;
    blendedLaborRateHourly: number;
    ticketsPerEndpointPerYear: number;
  };
  licensing: { avgCostPerUserPerYear: number; coveragePct: number };
  mgmtSecurity: { costPerEndpointPerYear: number };
  vdi: { platformCostPerVdiUserPerYear: number };
  overhead: { pctOfTotal: number };
};

const DEFAULT_ASSUMPTIONS: Assumptions = {
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
};

type Source = "user" | "intake" | "default" | "calculated" | "override";

type TraceCard = {
  id: string;
  section: string;
  fieldName: string;
  currentValue: string;
  rawValue?: number;
  source: Source;
  sourceDetail: string;
  formula?: string;
  formulaWithValues?: string;
  intermediateSteps?: string[];
  defaultValue?: string;
  defaultOverridden?: boolean;
  dependsOn?: string[];
};

function fmtMoney(v: number): string {
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmtNumber(v: number): string {
  return v.toLocaleString("en-US");
}
function fmtPct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}
function nonNeg(v?: number): number | undefined {
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0) return undefined;
  return v;
}

const SOURCE_CONFIG: Record<Source, { label: string; color: string; icon: typeof Pencil }> = {
  user: { label: "User Entry", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300", icon: Pencil },
  intake: { label: "Intake Import", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300", icon: Upload },
  default: { label: "Default / Assumption", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 ring-2 ring-amber-400/50", icon: AlertTriangle },
  calculated: { label: "Calculated", color: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300", icon: Calculator },
  override: { label: "Override", color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300", icon: ArrowLeftRight },
};

function SourceBadge({ source }: { source: Source }) {
  const cfg = SOURCE_CONFIG[source];
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", cfg.color)} data-testid={`badge-source-${source}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function buildTraceCards(inputs: Inputs, assumptions: Assumptions, intakeFields: Set<string>): TraceCard[] {
  const cards: TraceCard[] = [];

  const getSource = (fieldPath: string, value: unknown, defaultVal?: unknown): Source => {
    if (intakeFields.has(fieldPath) && value !== undefined && value !== null && value !== "") return "intake";
    if (value !== undefined && value !== null && value !== "") return "user";
    return "default";
  };

  cards.push({
    id: "env-user-count",
    section: "Environment Facts",
    fieldName: "Total User Count",
    currentValue: inputs.environment.userCount !== undefined ? fmtNumber(inputs.environment.userCount) : "Not set",
    rawValue: inputs.environment.userCount,
    source: getSource("environment.userCount", inputs.environment.userCount),
    sourceDetail: "Inputs → Environment Facts → User Count",
  });
  cards.push({
    id: "env-laptop-count",
    section: "Environment Facts",
    fieldName: "Laptop Count",
    currentValue: inputs.environment.laptopCount !== undefined ? fmtNumber(inputs.environment.laptopCount) : "Not set",
    rawValue: inputs.environment.laptopCount,
    source: getSource("environment.laptopCount", inputs.environment.laptopCount),
    sourceDetail: "Inputs → Environment Facts → Laptop Count",
  });
  cards.push({
    id: "env-desktop-count",
    section: "Environment Facts",
    fieldName: "Desktop Count",
    currentValue: inputs.environment.desktopCount !== undefined ? fmtNumber(inputs.environment.desktopCount) : "Not set",
    rawValue: inputs.environment.desktopCount,
    source: getSource("environment.desktopCount", inputs.environment.desktopCount),
    sourceDetail: "Inputs → Environment Facts → Desktop Count",
  });
  cards.push({
    id: "env-thin-client-count",
    section: "Environment Facts",
    fieldName: "Thin Client Count",
    currentValue: inputs.environment.thinClientCount !== undefined ? fmtNumber(inputs.environment.thinClientCount) : "Not set",
    rawValue: inputs.environment.thinClientCount,
    source: getSource("environment.thinClientCount", inputs.environment.thinClientCount),
    sourceDetail: "Inputs → Environment Facts → Thin Client Count",
  });

  const laptops = nonNeg(inputs.environment.laptopCount) ?? 0;
  const desktops = nonNeg(inputs.environment.desktopCount) ?? 0;
  const thinClients = nonNeg(inputs.environment.thinClientCount) ?? 0;
  const endpoints = laptops + desktops + thinClients;
  const userCount = nonNeg(inputs.environment.userCount) ?? 0;
  const vdiDirectCount = (nonNeg(inputs.vdiUserCounts?.daas) ?? 0) + (nonNeg(inputs.vdiUserCounts?.vdi) ?? 0);

  cards.push({
    id: "calc-total-endpoints",
    section: "Environment Facts",
    fieldName: "Total Endpoint Count",
    currentValue: fmtNumber(endpoints),
    rawValue: endpoints,
    source: "calculated",
    sourceDetail: "Sum of Laptop + Desktop + Thin Client counts",
    formula: "Total Endpoints = Laptop Count + Desktop Count + Thin Client Count",
    formulaWithValues: `= ${fmtNumber(laptops)} + ${fmtNumber(desktops)} + ${fmtNumber(thinClients)} = ${fmtNumber(endpoints)}`,
    dependsOn: ["env-laptop-count", "env-desktop-count", "env-thin-client-count"],
  });

  cards.push({
    id: "env-vdi-daas-users",
    section: "Environment Facts",
    fieldName: "VDI/DaaS User Count (Direct)",
    currentValue: fmtNumber(vdiDirectCount),
    rawValue: vdiDirectCount,
    source: vdiDirectCount > 0 ? getSource("vdiUserCounts", vdiDirectCount) : "default",
    sourceDetail: "Sum of DaaS users + VDI users entered in EUC Pillars sub-pillars",
    formula: "VDI User Count = DaaS Users + VDI Users",
    formulaWithValues: `= ${fmtNumber(nonNeg(inputs.vdiUserCounts?.daas) ?? 0)} + ${fmtNumber(nonNeg(inputs.vdiUserCounts?.vdi) ?? 0)} = ${fmtNumber(vdiDirectCount)}`,
  });

  const hexPillarCost = (pillar: string) =>
    inputs.hexagridEntries
      .filter((e) => e.pillar === pillar)
      .reduce((sum, e) => sum + (e.yearlyCost ?? 0), 0);

  const pillars = [
    { name: "Endpoint Hardware & OS", id: "hex-hardware" },
    { name: "Access", id: "hex-access" },
    { name: "Virtual Desktops & Applications", id: "hex-vdi" },
    { name: "Device, OS & User Management", id: "hex-mgmt" },
    { name: "Security", id: "hex-security" },
    { name: "App Management", id: "hex-app-mgmt" },
    { name: "Collaboration, AI & Applications", id: "hex-collab" },
  ];

  for (const p of pillars) {
    const cost = hexPillarCost(p.name);
    const entries = inputs.hexagridEntries.filter(e => e.pillar === p.name);
    const entryDetails = entries.filter(e => (e.yearlyCost ?? 0) > 0).map(e =>
      `${e.vendorName}${e.platform ? ` / ${e.platform}` : ""}: ${fmtMoney(e.yearlyCost ?? 0)}`
    ).join("; ");

    cards.push({
      id: p.id,
      section: "EUC Pillars & Platforms",
      fieldName: `${p.name} — Total Annual Cost`,
      currentValue: fmtMoney(cost),
      rawValue: cost,
      source: cost > 0 ? "user" : "default",
      sourceDetail: cost > 0
        ? `Sum of ${entries.length} vendor entries: ${entryDetails || "see entries"}`
        : "No vendor costs entered for this pillar",
      formula: `${p.name} Cost = Σ(Vendor Yearly Cost)`,
      formulaWithValues: entries.length > 0
        ? `= ${entries.map(e => fmtMoney(e.yearlyCost ?? 0)).join(" + ")} = ${fmtMoney(cost)}`
        : "= $0 (no entries)",
    });
  }

  const hexMgmt = hexPillarCost("Device, OS & User Management");
  const hexSecurity = hexPillarCost("Security");
  const hexVdi = hexPillarCost("Virtual Desktops & Applications");
  const mgmtSecurityFromPillars = hexMgmt + hexSecurity;
  const hasToolSpend = mgmtSecurityFromPillars > 0;
  const hasVdiSpend = hexVdi > 0;

  const overrideFields: { key: keyof Inputs["categoryRollups"]; id: string; label: string }[] = [
    { key: "endUserDevicesAnnual", id: "override-devices", label: "End-User Devices Annual Override" },
    { key: "supportOpsAnnual", id: "override-support", label: "Support & Operations Annual Override" },
    { key: "licensingAnnual", id: "override-licensing", label: "Licensing Annual Override" },
    { key: "mgmtSecurityAnnual", id: "override-mgmt", label: "Management & Security Annual Override" },
    { key: "vdiDaasAnnual", id: "override-vdi", label: "VDI / DaaS Annual Override" },
    { key: "overheadAnnual", id: "override-overhead", label: "Overhead Annual Override" },
  ];

  for (const f of overrideFields) {
    const val = inputs.categoryRollups[f.key];
    cards.push({
      id: f.id,
      section: "Platform Cost Overrides",
      fieldName: f.label,
      currentValue: val !== undefined ? fmtMoney(val) : "Not set (using calculated value)",
      rawValue: val,
      source: val !== undefined ? "override" : "default",
      sourceDetail: val !== undefined
        ? `Manually entered override in Platform Cost Rollups`
        : "No override — calculation or EUC Pillar costs used instead",
    });
  }

  cards.push({
    id: "msp-total-spend",
    section: "Managed Services & Outsourcing",
    fieldName: "Total MSP / Managed Services Spend",
    currentValue: inputs.managedServices.totalAnnualSpend !== undefined ? fmtMoney(inputs.managedServices.totalAnnualSpend) : "Not provided",
    rawValue: inputs.managedServices.totalAnnualSpend,
    source: inputs.managedServices.totalAnnualSpend !== undefined ? getSource("managedServices.totalAnnualSpend", inputs.managedServices.totalAnnualSpend) : "default",
    sourceDetail: inputs.managedServices.totalAnnualSpend !== undefined ? "Inputs → Outsourced Services & MSP → Total Annual Spend" : "No spend entered — $0 used in baseline",
  });

  const outsourcedFlags: { key: keyof Inputs["managedServices"]; label: string }[] = [
    { key: "outsourcedEndpointMgmt", label: "Outsourced: Endpoint Management" },
    { key: "outsourcedSecurity", label: "Outsourced: Security / EDR / SOC" },
    { key: "outsourcedPatching", label: "Outsourced: Patching & Updates" },
    { key: "outsourcedHelpdesk", label: "Outsourced: Tier 1 Support / Helpdesk" },
    { key: "outsourcedTier2Plus", label: "Outsourced: Tier 2+ Support / Engineering" },
    { key: "outsourcedOther", label: "Outsourced: Other" },
  ];

  for (const f of outsourcedFlags) {
    const val = inputs.managedServices[f.key] as boolean;
    cards.push({
      id: `msp-${f.key}`,
      section: "Managed Services & Outsourcing",
      fieldName: f.label,
      currentValue: val ? "Yes" : "No",
      source: val ? "user" : "default",
      sourceDetail: `Inputs → Outsourced Services & MSP → ${f.label}`,
    });
  }

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

  const derivedMgmtSecurity = hasToolSpend ? mgmtSecurityFromPillars : (endpoints * assumptions.mgmtSecurity.costPerEndpointPerYear);

  const derivedVdiDaas = hasVdiSpend ? hexVdi : (vdiDirectCount * assumptions.vdi.platformCostPerVdiUserPerYear);

  const endUserDevicesValue = nonNeg(inputs.categoryRollups.endUserDevicesAnnual) ?? derivedEndUserDevices;
  const supportOpsValue = nonNeg(inputs.categoryRollups.supportOpsAnnual) ?? derivedSupportOps;
  const licensingValue = nonNeg(inputs.categoryRollups.licensingAnnual) ?? derivedLicensing;
  const mgmtSecurityValue = nonNeg(inputs.categoryRollups.mgmtSecurityAnnual) ?? derivedMgmtSecurity;
  const vdiDaasValue = nonNeg(inputs.categoryRollups.vdiDaasAnnual) ?? derivedVdiDaas;
  const subtotalBeforeOverhead = endUserDevicesValue + supportOpsValue + licensingValue + mgmtSecurityValue + vdiDaasValue;
  const derivedOverhead = subtotalBeforeOverhead * assumptions.overhead.pctOfTotal;
  const overheadValue = nonNeg(inputs.categoryRollups.overheadAnnual) ?? derivedOverhead;
  const mspSpend = nonNeg(inputs.managedServices.totalAnnualSpend) ?? 0;
  const totalAnnualTco = endUserDevicesValue + supportOpsValue + licensingValue + mgmtSecurityValue + vdiDaasValue + overheadValue + mspSpend;

  const isOverridden = (key: keyof Inputs["categoryRollups"]) => inputs.categoryRollups[key] !== undefined;
  const isAssumptionChanged = (path: string, current: number, def: number) => current !== def;

  cards.push({
    id: "calc-end-user-devices",
    section: "Calculated Outputs / Results",
    fieldName: "End-User Devices (Annual)",
    currentValue: fmtMoney(endUserDevicesValue),
    rawValue: endUserDevicesValue,
    source: isOverridden("endUserDevicesAnnual") ? "override" : "calculated",
    sourceDetail: isOverridden("endUserDevicesAnnual")
      ? "Manual override entered in Platform Cost Rollups"
      : "Calculated from device counts × unit costs ÷ refresh years",
    formula: "End-User Devices = (Laptops × Laptop Cost ÷ Laptop Refresh) + (Desktops × Desktop Cost ÷ Desktop Refresh) + (Thin Clients × TC Cost ÷ TC Refresh)",
    formulaWithValues: `= (${fmtNumber(laptops)} × $${fmtNumber(assumptions.deviceUnitCost.laptop)} ÷ ${assumptions.deviceRefreshYears.laptop}) + (${fmtNumber(desktops)} × $${fmtNumber(assumptions.deviceUnitCost.desktop)} ÷ ${assumptions.deviceRefreshYears.desktop}) + (${fmtNumber(thinClients)} × $${fmtNumber(assumptions.deviceUnitCost.thinClient)} ÷ ${assumptions.deviceRefreshYears.thinClient}) = ${fmtMoney(derivedEndUserDevices)}`,
    intermediateSteps: [
      `Laptop annualized: ${fmtNumber(laptops)} × $${fmtNumber(assumptions.deviceUnitCost.laptop)} ÷ ${assumptions.deviceRefreshYears.laptop}yr = ${fmtMoney(laptops * assumptions.deviceUnitCost.laptop / assumptions.deviceRefreshYears.laptop)}`,
      `Desktop annualized: ${fmtNumber(desktops)} × $${fmtNumber(assumptions.deviceUnitCost.desktop)} ÷ ${assumptions.deviceRefreshYears.desktop}yr = ${fmtMoney(desktops * assumptions.deviceUnitCost.desktop / assumptions.deviceRefreshYears.desktop)}`,
      `Thin client annualized: ${fmtNumber(thinClients)} × $${fmtNumber(assumptions.deviceUnitCost.thinClient)} ÷ ${assumptions.deviceRefreshYears.thinClient}yr = ${fmtMoney(thinClients * assumptions.deviceUnitCost.thinClient / assumptions.deviceRefreshYears.thinClient)}`,
    ],
    defaultValue: isOverridden("endUserDevicesAnnual") ? `Calculated value would be ${fmtMoney(derivedEndUserDevices)}` : undefined,
    defaultOverridden: isOverridden("endUserDevicesAnnual"),
    dependsOn: ["env-laptop-count", "env-desktop-count", "env-thin-client-count"],
  });

  const ticketLabor = endpoints * assumptions.supportOps.ticketsPerEndpointPerYear * assumptions.supportOps.avgTicketHandlingHours * assumptions.supportOps.blendedLaborRateHourly;
  const deployLabor = (endpoints / avgRefreshYears) * assumptions.supportOps.deploymentHoursPerDevice * assumptions.supportOps.blendedLaborRateHourly;
  cards.push({
    id: "calc-support-ops",
    section: "Calculated Outputs / Results",
    fieldName: "Support & Operations (Annual)",
    currentValue: fmtMoney(supportOpsValue),
    rawValue: supportOpsValue,
    source: isOverridden("supportOpsAnnual") ? "override" : "calculated",
    sourceDetail: isOverridden("supportOpsAnnual")
      ? "Manual override entered in Platform Cost Rollups"
      : "Calculated from endpoints × ticket volume × labor rates + deployment labor",
    formula: "Support & Ops = (Endpoints × Tickets/Yr × Handling Hours × Labor Rate) + (Annual Deployments × Deploy Hours × Labor Rate)",
    formulaWithValues: `= (${fmtNumber(endpoints)} × ${assumptions.supportOps.ticketsPerEndpointPerYear} × ${assumptions.supportOps.avgTicketHandlingHours}hr × $${assumptions.supportOps.blendedLaborRateHourly}/hr) + (${fmtNumber(Math.round(endpoints / avgRefreshYears))} deploys × ${assumptions.supportOps.deploymentHoursPerDevice}hr × $${assumptions.supportOps.blendedLaborRateHourly}/hr) = ${fmtMoney(derivedSupportOps)}`,
    intermediateSteps: [
      `Ticket labor: ${fmtNumber(endpoints)} × ${assumptions.supportOps.ticketsPerEndpointPerYear} × ${assumptions.supportOps.avgTicketHandlingHours}hr × $${assumptions.supportOps.blendedLaborRateHourly}/hr = ${fmtMoney(ticketLabor)}`,
      `Annual deployments: ${fmtNumber(endpoints)} ÷ ${avgRefreshYears.toFixed(1)}yr avg refresh = ${fmtNumber(Math.round(endpoints / avgRefreshYears))}`,
      `Deploy labor: ${fmtNumber(Math.round(endpoints / avgRefreshYears))} × ${assumptions.supportOps.deploymentHoursPerDevice}hr × $${assumptions.supportOps.blendedLaborRateHourly}/hr = ${fmtMoney(deployLabor)}`,
      `Total: ${fmtMoney(ticketLabor)} + ${fmtMoney(deployLabor)} = ${fmtMoney(derivedSupportOps)}`,
    ],
    defaultValue: isOverridden("supportOpsAnnual") ? `Calculated value would be ${fmtMoney(derivedSupportOps)}` : undefined,
    defaultOverridden: isOverridden("supportOpsAnnual"),
    dependsOn: ["calc-total-endpoints"],
  });

  cards.push({
    id: "calc-licensing",
    section: "Calculated Outputs / Results",
    fieldName: "Licensing (Annual)",
    currentValue: fmtMoney(licensingValue),
    rawValue: licensingValue,
    source: isOverridden("licensingAnnual") ? "override" : "calculated",
    sourceDetail: isOverridden("licensingAnnual")
      ? "Manual override entered in Platform Cost Rollups"
      : "Calculated from user count × license cost × coverage",
    formula: "Licensing = User Count × Avg Cost/User/Year × Coverage %",
    formulaWithValues: `= ${fmtNumber(userCount)} × $${fmtNumber(assumptions.licensing.avgCostPerUserPerYear)} × ${fmtPct(assumptions.licensing.coveragePct)} = ${fmtMoney(derivedLicensing)}`,
    defaultValue: isOverridden("licensingAnnual") ? `Calculated value would be ${fmtMoney(derivedLicensing)}` : undefined,
    defaultOverridden: isOverridden("licensingAnnual"),
    dependsOn: ["env-user-count"],
  });

  cards.push({
    id: "calc-mgmt-security",
    section: "Calculated Outputs / Results",
    fieldName: "Management & Security (Annual)",
    currentValue: fmtMoney(mgmtSecurityValue),
    rawValue: mgmtSecurityValue,
    source: isOverridden("mgmtSecurityAnnual") ? "override" : hasToolSpend ? "calculated" : "default",
    sourceDetail: isOverridden("mgmtSecurityAnnual")
      ? "Manual override entered in Platform Cost Rollups"
      : hasToolSpend
      ? `Derived from EUC Pillars: Device Mgmt (${fmtMoney(hexMgmt)}) + Security (${fmtMoney(hexSecurity)})`
      : `Default assumption: ${fmtNumber(endpoints)} endpoints × $${fmtNumber(assumptions.mgmtSecurity.costPerEndpointPerYear)}/endpoint`,
    formula: isOverridden("mgmtSecurityAnnual")
      ? undefined
      : hasToolSpend
      ? "Mgmt & Security = Device Mgmt Pillar Cost + Security Pillar Cost"
      : "Mgmt & Security = Total Endpoints × Cost per Endpoint per Year",
    formulaWithValues: isOverridden("mgmtSecurityAnnual")
      ? undefined
      : hasToolSpend
      ? `= ${fmtMoney(hexMgmt)} + ${fmtMoney(hexSecurity)} = ${fmtMoney(mgmtSecurityFromPillars)}`
      : `= ${fmtNumber(endpoints)} × $${fmtNumber(assumptions.mgmtSecurity.costPerEndpointPerYear)} = ${fmtMoney(derivedMgmtSecurity)}`,
    defaultValue: isOverridden("mgmtSecurityAnnual") ? `Calculated value would be ${fmtMoney(derivedMgmtSecurity)}` : undefined,
    defaultOverridden: isOverridden("mgmtSecurityAnnual"),
    dependsOn: hasToolSpend ? ["hex-mgmt", "hex-security"] : ["calc-total-endpoints"],
  });

  cards.push({
    id: "calc-vdi-daas",
    section: "Calculated Outputs / Results",
    fieldName: "VDI / DaaS (Annual)",
    currentValue: fmtMoney(vdiDaasValue),
    rawValue: vdiDaasValue,
    source: isOverridden("vdiDaasAnnual") ? "override" : hasVdiSpend ? "calculated" : "default",
    sourceDetail: isOverridden("vdiDaasAnnual")
      ? "Manual override entered in Platform Cost Rollups"
      : hasVdiSpend
      ? `Derived from EUC Pillars: Virtual Desktops & Applications total`
      : `Default assumption: ${fmtNumber(vdiDirectCount)} VDI users × $${fmtNumber(assumptions.vdi.platformCostPerVdiUserPerYear)}/user`,
    formula: isOverridden("vdiDaasAnnual")
      ? undefined
      : hasVdiSpend
      ? "VDI/DaaS = Σ(Virtual Desktop & App vendor costs)"
      : "VDI/DaaS = VDI User Count × Platform Cost per VDI User per Year",
    formulaWithValues: isOverridden("vdiDaasAnnual")
      ? undefined
      : hasVdiSpend
      ? `= ${fmtMoney(hexVdi)}`
      : `= ${fmtNumber(vdiDirectCount)} × $${fmtNumber(assumptions.vdi.platformCostPerVdiUserPerYear)} = ${fmtMoney(derivedVdiDaas)}`,
    defaultValue: isOverridden("vdiDaasAnnual") ? `Calculated value would be ${fmtMoney(derivedVdiDaas)}` : undefined,
    defaultOverridden: isOverridden("vdiDaasAnnual"),
    dependsOn: hasVdiSpend ? ["hex-vdi"] : ["env-vdi-daas-users"],
  });

  cards.push({
    id: "calc-overhead",
    section: "Calculated Outputs / Results",
    fieldName: "Overhead (Annual)",
    currentValue: fmtMoney(overheadValue),
    rawValue: overheadValue,
    source: isOverridden("overheadAnnual") ? "override" : "calculated",
    sourceDetail: isOverridden("overheadAnnual")
      ? "Manual override entered in Platform Cost Rollups"
      : `${fmtPct(assumptions.overhead.pctOfTotal)} of subtotal before overhead`,
    formula: "Overhead = Overhead % × Subtotal Before Overhead",
    formulaWithValues: `= ${fmtPct(assumptions.overhead.pctOfTotal)} × ${fmtMoney(subtotalBeforeOverhead)} = ${fmtMoney(derivedOverhead)}`,
    intermediateSteps: [
      `Subtotal = Devices + Support + Licensing + Mgmt/Security + VDI = ${fmtMoney(endUserDevicesValue)} + ${fmtMoney(supportOpsValue)} + ${fmtMoney(licensingValue)} + ${fmtMoney(mgmtSecurityValue)} + ${fmtMoney(vdiDaasValue)} = ${fmtMoney(subtotalBeforeOverhead)}`,
      `Overhead = ${fmtPct(assumptions.overhead.pctOfTotal)} × ${fmtMoney(subtotalBeforeOverhead)} = ${fmtMoney(derivedOverhead)}`,
    ],
    defaultValue: isOverridden("overheadAnnual") ? `Calculated value would be ${fmtMoney(derivedOverhead)}` : undefined,
    defaultOverridden: isOverridden("overheadAnnual"),
    dependsOn: ["calc-end-user-devices", "calc-support-ops", "calc-licensing", "calc-mgmt-security", "calc-vdi-daas"],
  });

  cards.push({
    id: "calc-total-tco",
    section: "Calculated Outputs / Results",
    fieldName: "Total Annual TCO Baseline",
    currentValue: fmtMoney(totalAnnualTco),
    rawValue: totalAnnualTco,
    source: "calculated",
    sourceDetail: "Sum of all cost categories + managed services spend",
    formula: "Total TCO = Devices + Support + Licensing + Mgmt/Security + VDI + Overhead + MSP",
    formulaWithValues: `= ${fmtMoney(endUserDevicesValue)} + ${fmtMoney(supportOpsValue)} + ${fmtMoney(licensingValue)} + ${fmtMoney(mgmtSecurityValue)} + ${fmtMoney(vdiDaasValue)} + ${fmtMoney(overheadValue)} + ${fmtMoney(mspSpend)} = ${fmtMoney(totalAnnualTco)}`,
    dependsOn: ["calc-end-user-devices", "calc-support-ops", "calc-licensing", "calc-mgmt-security", "calc-vdi-daas", "calc-overhead", "msp-total-spend"],
  });

  const costPerEndpoint = endpoints > 0 ? totalAnnualTco / endpoints : 0;
  cards.push({
    id: "calc-cost-per-endpoint",
    section: "Calculated Outputs / Results",
    fieldName: "Cost per Endpoint",
    currentValue: endpoints > 0 ? fmtMoney(costPerEndpoint) : "$0",
    rawValue: costPerEndpoint,
    source: "calculated",
    sourceDetail: "Total TCO ÷ Total Endpoints",
    formula: "Cost per Endpoint = Total Annual TCO ÷ Total Endpoints",
    formulaWithValues: endpoints > 0 ? `= ${fmtMoney(totalAnnualTco)} ÷ ${fmtNumber(endpoints)} = ${fmtMoney(costPerEndpoint)}` : "= $0 (no endpoints)",
    dependsOn: ["calc-total-tco", "calc-total-endpoints"],
  });

  const costPerUser = userCount > 0 ? totalAnnualTco / userCount : 0;
  cards.push({
    id: "calc-cost-per-user",
    section: "Calculated Outputs / Results",
    fieldName: "Cost per User",
    currentValue: userCount > 0 ? fmtMoney(costPerUser) : "$0",
    rawValue: costPerUser,
    source: "calculated",
    sourceDetail: "Total TCO ÷ Total Users",
    formula: "Cost per User = Total Annual TCO ÷ Total Users",
    formulaWithValues: userCount > 0 ? `= ${fmtMoney(totalAnnualTco)} ÷ ${fmtNumber(userCount)} = ${fmtMoney(costPerUser)}` : "= $0 (no users)",
    dependsOn: ["calc-total-tco", "env-user-count"],
  });

  const vdiCostPerVdiUser = vdiDirectCount > 0 ? vdiDaasValue / vdiDirectCount : 0;
  cards.push({
    id: "calc-vdi-cost-per-user",
    section: "Calculated Outputs / Results",
    fieldName: "VDI Cost per VDI User",
    currentValue: vdiDirectCount > 0 ? fmtMoney(vdiCostPerVdiUser) : "$0",
    rawValue: vdiCostPerVdiUser,
    source: "calculated",
    sourceDetail: "VDI/DaaS annual cost ÷ VDI user count",
    formula: "VDI Cost per VDI User = VDI/DaaS Annual ÷ VDI User Count",
    formulaWithValues: vdiDirectCount > 0 ? `= ${fmtMoney(vdiDaasValue)} ÷ ${fmtNumber(vdiDirectCount)} = ${fmtMoney(vdiCostPerVdiUser)}` : "= $0 (no VDI users)",
    dependsOn: ["calc-vdi-daas", "env-vdi-daas-users"],
  });

  const assumptionCards: { id: string; fieldName: string; current: number; defaultVal: number; unit: string }[] = [
    { id: "assum-laptop-refresh", fieldName: "Laptop Refresh (years)", current: assumptions.deviceRefreshYears.laptop, defaultVal: DEFAULT_ASSUMPTIONS.deviceRefreshYears.laptop, unit: "years" },
    { id: "assum-desktop-refresh", fieldName: "Desktop Refresh (years)", current: assumptions.deviceRefreshYears.desktop, defaultVal: DEFAULT_ASSUMPTIONS.deviceRefreshYears.desktop, unit: "years" },
    { id: "assum-tc-refresh", fieldName: "Thin Client Refresh (years)", current: assumptions.deviceRefreshYears.thinClient, defaultVal: DEFAULT_ASSUMPTIONS.deviceRefreshYears.thinClient, unit: "years" },
    { id: "assum-laptop-cost", fieldName: "Laptop Unit Cost", current: assumptions.deviceUnitCost.laptop, defaultVal: DEFAULT_ASSUMPTIONS.deviceUnitCost.laptop, unit: "$" },
    { id: "assum-desktop-cost", fieldName: "Desktop Unit Cost", current: assumptions.deviceUnitCost.desktop, defaultVal: DEFAULT_ASSUMPTIONS.deviceUnitCost.desktop, unit: "$" },
    { id: "assum-tc-cost", fieldName: "Thin Client Unit Cost", current: assumptions.deviceUnitCost.thinClient, defaultVal: DEFAULT_ASSUMPTIONS.deviceUnitCost.thinClient, unit: "$" },
    { id: "assum-ticket-hours", fieldName: "Avg Ticket Handling Hours", current: assumptions.supportOps.avgTicketHandlingHours, defaultVal: DEFAULT_ASSUMPTIONS.supportOps.avgTicketHandlingHours, unit: "hrs" },
    { id: "assum-deploy-hours", fieldName: "Deployment Hours/Device", current: assumptions.supportOps.deploymentHoursPerDevice, defaultVal: DEFAULT_ASSUMPTIONS.supportOps.deploymentHoursPerDevice, unit: "hrs" },
    { id: "assum-labor-rate", fieldName: "Blended Labor Rate", current: assumptions.supportOps.blendedLaborRateHourly, defaultVal: DEFAULT_ASSUMPTIONS.supportOps.blendedLaborRateHourly, unit: "$/hr" },
    { id: "assum-tickets-per-ep", fieldName: "Tickets per Endpoint/Year", current: assumptions.supportOps.ticketsPerEndpointPerYear, defaultVal: DEFAULT_ASSUMPTIONS.supportOps.ticketsPerEndpointPerYear, unit: "" },
    { id: "assum-license-cost", fieldName: "Avg License Cost/User/Year", current: assumptions.licensing.avgCostPerUserPerYear, defaultVal: DEFAULT_ASSUMPTIONS.licensing.avgCostPerUserPerYear, unit: "$" },
    { id: "assum-coverage-pct", fieldName: "License Coverage %", current: assumptions.licensing.coveragePct, defaultVal: DEFAULT_ASSUMPTIONS.licensing.coveragePct, unit: "%" },
    { id: "assum-mgmt-per-ep", fieldName: "Mgmt & Security $/Endpoint/Year", current: assumptions.mgmtSecurity.costPerEndpointPerYear, defaultVal: DEFAULT_ASSUMPTIONS.mgmtSecurity.costPerEndpointPerYear, unit: "$" },
    { id: "assum-vdi-per-user", fieldName: "VDI Platform $/User/Year", current: assumptions.vdi.platformCostPerVdiUserPerYear, defaultVal: DEFAULT_ASSUMPTIONS.vdi.platformCostPerVdiUserPerYear, unit: "$" },
    { id: "assum-overhead-pct", fieldName: "Overhead % of Subtotal", current: assumptions.overhead.pctOfTotal, defaultVal: DEFAULT_ASSUMPTIONS.overhead.pctOfTotal, unit: "%" },
  ];

  for (const a of assumptionCards) {
    const changed = a.current !== a.defaultVal;
    const displayValue = a.unit === "$"
      ? fmtMoney(a.current)
      : a.unit === "%"
      ? fmtPct(a.current)
      : `${a.current} ${a.unit}`.trim();
    const defaultDisplay = a.unit === "$"
      ? fmtMoney(a.defaultVal)
      : a.unit === "%"
      ? fmtPct(a.defaultVal)
      : `${a.defaultVal} ${a.unit}`.trim();

    cards.push({
      id: a.id,
      section: "Assumptions",
      fieldName: a.fieldName,
      currentValue: displayValue,
      rawValue: a.current,
      source: changed ? "user" : "default",
      sourceDetail: changed
        ? `Modified from default (${defaultDisplay}) in Assumptions tab`
        : `Industry default — defined in Assumptions tab`,
      defaultValue: defaultDisplay,
      defaultOverridden: changed,
    });
  }

  return cards;
}

const SECTIONS = [
  "Environment Facts",
  "EUC Pillars & Platforms",
  "Platform Cost Overrides",
  "Managed Services & Outsourcing",
  "Assumptions",
  "Calculated Outputs / Results",
];

type Props = {
  inputs: Inputs;
  assumptions: Assumptions;
  intakeFields?: Set<string>;
};

export default function AuditTracePage({ inputs, assumptions, intakeFields = new Set() }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilters, setSourceFilters] = useState<Record<Source, boolean>>({
    user: true,
    intake: true,
    default: true,
    calculated: true,
    override: true,
  });
  const [showDefaultsOnly, setShowDefaultsOnly] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [highlightedCard, setHighlightedCard] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const allCards = useMemo(() => buildTraceCards(inputs, assumptions, intakeFields), [inputs, assumptions, intakeFields]);

  const summary = useMemo(() => {
    const counts: Record<Source, number> = { user: 0, intake: 0, default: 0, calculated: 0, override: 0 };
    for (const c of allCards) counts[c.source]++;
    return {
      total: allCards.length,
      ...counts,
      lastRecalc: new Date().toLocaleString("en-US", { month: "numeric", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }),
    };
  }, [allCards]);

  const filteredCards = useMemo(() => {
    let result = allCards;
    if (showDefaultsOnly) {
      result = result.filter((c) => c.source === "default");
    } else {
      result = result.filter((c) => sourceFilters[c.source]);
    }
    if (sectionFilter !== "all") {
      result = result.filter((c) => c.section === sectionFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.fieldName.toLowerCase().includes(q) ||
          c.currentValue.toLowerCase().includes(q) ||
          (c.formula?.toLowerCase().includes(q)) ||
          (c.sourceDetail.toLowerCase().includes(q))
      );
    }
    return result;
  }, [allCards, sourceFilters, showDefaultsOnly, sectionFilter, searchQuery]);

  const groupedCards = useMemo(() => {
    const groups: Record<string, TraceCard[]> = {};
    for (const s of SECTIONS) groups[s] = [];
    for (const c of filteredCards) {
      if (!groups[c.section]) groups[c.section] = [];
      groups[c.section].push(c);
    }
    return groups;
  }, [filteredCards]);

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const scrollToCard = useCallback((cardId: string) => {
    setHighlightedCard(cardId);
    const el = cardRefs.current[cardId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => setHighlightedCard(null), 2000);
    }
  }, []);

  const toggleSourceFilter = (source: Source) => {
    setShowDefaultsOnly(false);
    setSourceFilters((prev) => ({ ...prev, [source]: !prev[source] }));
  };

  const handleExport = useCallback(() => {
    const wb = XLSX.utils.book_new();

    for (const section of SECTIONS) {
      const sectionCards = allCards.filter((c) => c.section === section);
      if (sectionCards.length === 0) continue;

      const headers = ["Field Name", "Current Value", "Source", "Source Detail", "Formula", "Formula with Values", "Intermediate Steps", "Default Value", "Default Overridden"];
      const rows = sectionCards.map((c) => [
        c.fieldName,
        c.currentValue,
        SOURCE_CONFIG[c.source].label,
        c.sourceDetail,
        c.formula ?? "",
        c.formulaWithValues ?? "",
        c.intermediateSteps?.join(" → ") ?? "",
        c.defaultValue ?? "",
        c.defaultOverridden ? "Yes" : "",
      ]);

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const colWidths = headers.map((_, i) => {
        const maxLen = Math.max(headers[i].length, ...rows.map((r) => String(r[i]).length));
        return { wch: Math.min(maxLen + 2, 60) };
      });
      ws["!cols"] = colWidths;

      const sheetName = section.length > 31 ? section.slice(0, 31) : section;
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }

    const clientName = inputs.project.clientName || "Client";
    const slug = clientName.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_");
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `TCO_Audit_Trace_${slug}_${dateStr}.xlsx`);
  }, [allCards, inputs.project.clientName]);

  return (
    <div className="space-y-6" data-testid="audit-trace-page">
      <Card className="p-4" data-testid="audit-summary-dashboard">
        <h3 className="text-sm font-semibold mb-3">Trace Summary</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <SummaryMetric label="Total Fields" value={summary.total} testId="metric-total" />
          <SummaryMetric label="User Entry" value={summary.user} color="text-blue-600 dark:text-blue-400" testId="metric-user" />
          <SummaryMetric label="Intake Import" value={summary.intake} color="text-purple-600 dark:text-purple-400" testId="metric-intake" />
          <SummaryMetric label="Defaults" value={summary.default} color="text-amber-600 dark:text-amber-400" highlight testId="metric-default" />
          <SummaryMetric label="Calculated" value={summary.calculated} color="text-green-600 dark:text-green-400" testId="metric-calculated" />
          <SummaryMetric label="Overridden" value={summary.override} color="text-red-600 dark:text-red-400" testId="metric-override" />
          <div className="flex flex-col" data-testid="metric-last-recalc">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Last Recalc</span>
            <span className="text-xs font-medium mt-0.5">{summary.lastRecalc}</span>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3" data-testid="audit-filters">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search fields, values, formulas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-audit-search"
          />
        </div>

        <select
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm"
          data-testid="select-section-filter"
        >
          <option value="all">All Sections</option>
          {SECTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {(Object.entries(SOURCE_CONFIG) as [Source, typeof SOURCE_CONFIG[Source]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => toggleSourceFilter(key)}
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium transition-opacity",
                cfg.color,
                !sourceFilters[key] && !showDefaultsOnly && "opacity-30"
              )}
              data-testid={`filter-source-${key}`}
            >
              {cfg.label}
            </button>
          ))}
        </div>

        <Button
          variant={showDefaultsOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setShowDefaultsOnly(!showDefaultsOnly)}
          data-testid="button-show-defaults-only"
        >
          <AlertTriangle className="h-3.5 w-3.5 mr-1" />
          Show Defaults Only
        </Button>

        <Button variant="outline" size="sm" onClick={handleExport} data-testid="button-export-audit">
          <Download className="h-3.5 w-3.5 mr-1" />
          Export Audit Trace
        </Button>
      </div>

      <div className="text-xs text-muted-foreground" data-testid="text-filter-count">
        Showing {filteredCards.length} of {allCards.length} fields
      </div>

      <div className="space-y-4">
        {SECTIONS.map((section) => {
          const sectionCards = groupedCards[section] ?? [];
          if (sectionCards.length === 0 && sectionFilter !== "all" && sectionFilter !== section) return null;
          const isCollapsed = collapsedSections[section];

          return (
            <div key={section} data-testid={`audit-section-${section.replace(/[^a-zA-Z]/g, "-").toLowerCase()}`}>
              <button
                onClick={() => toggleSection(section)}
                className="flex w-full items-center gap-2 rounded-lg bg-muted/50 px-4 py-2.5 text-left hover:bg-muted/80 transition-colors"
                data-testid={`button-toggle-${section.replace(/[^a-zA-Z]/g, "-").toLowerCase()}`}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                )}
                <span className="font-semibold text-sm">{section}</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {sectionCards.length}
                </Badge>
              </button>

              {!isCollapsed && (
                <div className="mt-2 space-y-2 pl-2">
                  {sectionCards.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-4 py-2">No matching fields in this section.</p>
                  ) : (
                    sectionCards.map((card) => (
                      <div
                        key={card.id}
                        ref={(el) => { cardRefs.current[card.id] = el; }}
                        className={cn(
                          "rounded-lg border p-4 transition-all",
                          highlightedCard === card.id && "ring-2 ring-primary bg-primary/5",
                          card.source === "default" && "border-amber-300/50 dark:border-amber-700/50"
                        )}
                        data-testid={`trace-card-${card.id}`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-semibold" data-testid={`trace-field-${card.id}`}>{card.fieldName}</h4>
                              <SourceBadge source={card.source} />
                            </div>
                            <div className="mt-1 text-lg font-mono font-bold" data-testid={`trace-value-${card.id}`}>
                              {card.currentValue}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 space-y-2 text-xs">
                          <div>
                            <span className="text-muted-foreground font-medium">Source: </span>
                            <span>{card.sourceDetail}</span>
                          </div>

                          {card.formula && (
                            <div>
                              <span className="text-muted-foreground font-medium">Formula: </span>
                              <span className="font-mono">{card.formula}</span>
                            </div>
                          )}

                          {card.formulaWithValues && (
                            <div>
                              <span className="text-muted-foreground font-medium">With values: </span>
                              <span className="font-mono">{card.formulaWithValues}</span>
                            </div>
                          )}

                          {card.intermediateSteps && card.intermediateSteps.length > 0 && (
                            <div>
                              <span className="text-muted-foreground font-medium">Steps:</span>
                              <ol className="mt-1 ml-4 space-y-0.5 list-decimal">
                                {card.intermediateSteps.map((step, i) => (
                                  <li key={i} className="font-mono">{step}</li>
                                ))}
                              </ol>
                            </div>
                          )}

                          {card.defaultValue && (
                            <div>
                              <span className="text-muted-foreground font-medium">Default: </span>
                              <span>{card.defaultValue}</span>
                              {card.defaultOverridden && (
                                <Badge variant="outline" className="ml-2 text-[10px]">overridden</Badge>
                              )}
                            </div>
                          )}

                          {card.dependsOn && card.dependsOn.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-muted-foreground font-medium">Depends on: </span>
                              {card.dependsOn.map((depId) => {
                                const depCard = allCards.find((c) => c.id === depId);
                                return (
                                  <button
                                    key={depId}
                                    onClick={() => scrollToCard(depId)}
                                    className="text-primary underline underline-offset-2 hover:text-primary/80 font-mono"
                                    data-testid={`link-dep-${depId}`}
                                  >
                                    {depCard?.fieldName ?? depId}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryMetric({ label, value, color, highlight, testId }: { label: string; value: number; color?: string; highlight?: boolean; testId: string }) {
  return (
    <div className={cn("flex flex-col", highlight && "bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2 -m-2")} data-testid={testId}>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className={cn("text-xl font-bold mt-0.5", color)}>{value}</span>
    </div>
  );
}
