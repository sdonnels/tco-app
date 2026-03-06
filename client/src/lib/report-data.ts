import type { HexagridEntry } from "../components/HexagridSection";

type CalcLine = {
  key: string;
  label: string;
  value: number;
  basis: string;
  isAssumed: boolean;
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
  projection: { annualEscalationRate: number };
};

export type ReportConfig = {
  clientName: string;
  reportTitle: string;
  reportDate: string;
  preparedBy: string;
  includeClientLogo: boolean;
  outputFormat: "pdf" | "excel" | "both";
  sections: {
    executiveSummary: boolean;
    environmentOverview: boolean;
    vendorLandscape: boolean;
    costBreakdown: boolean;
    costWaterfall: boolean;
    perUserEconomics: boolean;
    vdiAnalysis: boolean;
    threeYearProjection: boolean;
    dataConfidence: boolean;
    scoringRiskFlags: boolean;
    keyFindings: boolean;
    observations: boolean;
    recommendedNextSteps: boolean;
    methodologyAppendix: boolean;
    glossary: boolean;
  };
};

export type ReportData = {
  config: ReportConfig;
  inputs: {
    project: { clientName: string; assessmentDate?: string; customerChampion?: string; xentegraEngineer?: string };
    environment: { userCount: number; laptopCount: number; desktopCount: number; thinClientCount: number };
    managedServices: { totalAnnualSpend: number; outsourcedServices: string[]; providers: string[] };
    observations: { observation: string; details: string }[];
  };
  derived: {
    endpoints: number;
    totalAnnualTco: number;
    costPerEndpoint: number;
    costPerUser: number;
    baseCostPerUser: number;
    vdiPlatformCostPerUser: number;
    fullyLoadedVdiCostPerUser: number;
    nonVdiCostPerUser: number;
    vdiUserPremium: number;
    vdiUserCount: number;
    categoryLines: CalcLine[];
    managedServicesLines: CalcLine[];
    endUserDevicesValue: number;
    supportOpsValue: number;
    licensingValue: number;
    mgmtSecurityValue: number;
    vdiDaasValue: number;
    overheadValue: number;
    mspSpend: number;
    costFromInputs: number;
    costFromAssumptions: number;
  };
  assumptions: Assumptions;
  hexagridEntries: HexagridEntry[];
  clientLogo?: string;
};

function fmtMoney(v: number): string {
  return v.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function fmtNumber(v: number): string {
  return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

export function generateExecutiveSummary(data: ReportData): string {
  const { config, inputs, derived } = data;
  const client = config.clientName || "The organization";
  const sentences: string[] = [];

  const ep = derived.endpoints;
  const laptops = inputs.environment.laptopCount;
  const desktops = inputs.environment.desktopCount;
  const thinClients = inputs.environment.thinClientCount;

  sentences.push(
    `${client} supports ${fmtNumber(inputs.environment.userCount)} end users across ${fmtNumber(ep)} managed endpoints (${fmtNumber(laptops)} laptops, ${fmtNumber(desktops)} desktops, ${fmtNumber(thinClients)} thin clients).`
  );

  sentences.push(
    `The annual EUC Total Cost of Ownership is estimated at ${fmtMoney(derived.totalAnnualTco)}, or ${fmtMoney(derived.costPerUser)} per user per year.`
  );

  const allCategories = [
    { name: "End-User Devices", value: derived.endUserDevicesValue },
    { name: "Support & Operations", value: derived.supportOpsValue },
    { name: "Licensing", value: derived.licensingValue },
    { name: "Management & Security", value: derived.mgmtSecurityValue },
    { name: "VDI / DaaS", value: derived.vdiDaasValue },
    { name: "Overhead", value: derived.overheadValue },
    { name: "Managed Services", value: derived.mspSpend },
  ].filter(c => c.value > 0).sort((a, b) => b.value - a.value);

  if (allCategories.length > 0) {
    const largest = allCategories[0];
    sentences.push(
      `${largest.name} is the single largest cost driver at ${pct(largest.value, derived.totalAnnualTco)}% of total spend (${fmtMoney(largest.value)}).`
    );
  }

  if (derived.vdiUserCount > 0) {
    const vdiPctOfWorkforce = pct(derived.vdiUserCount, inputs.environment.userCount);
    sentences.push(
      `${fmtNumber(derived.vdiUserCount)} users (${vdiPctOfWorkforce}% of the workforce) operate on virtual desktop platforms, adding a ${fmtMoney(derived.vdiUserPremium)} per-user premium over standard endpoint users.`
    );
  }

  const totalFields = derived.costFromInputs + derived.costFromAssumptions;
  const inputPct = totalFields > 0 ? pct(derived.costFromInputs, totalFields) : 0;
  const assumptionPct = 100 - inputPct;
  const confidenceLabel = inputPct > 70 ? "high" : inputPct >= 40 ? "moderate" : "preliminary";
  sentences.push(
    `This baseline is built from ${inputPct}% direct client data and ${assumptionPct}% industry-standard assumptions, providing a ${confidenceLabel} confidence foundation.`
  );

  if (derived.mspSpend > 0) {
    const mspPct = pct(derived.mspSpend, derived.totalAnnualTco);
    sentences.push(
      `Managed services account for ${fmtMoney(derived.mspSpend)} annually (${mspPct}% of total TCO).`
    );
  }

  return sentences.join(" ");
}

export type ProjectionRow = {
  category: string;
  year1: number;
  year2: number;
  year3: number;
  total: number;
};

export function generate3YearProjection(data: ReportData): ProjectionRow[] {
  const rate = data.assumptions.projection.annualEscalationRate;
  const categories = [
    { name: "End-User Devices", value: data.derived.endUserDevicesValue },
    { name: "Support & Operations", value: data.derived.supportOpsValue },
    { name: "Licensing", value: data.derived.licensingValue },
    { name: "Management & Security", value: data.derived.mgmtSecurityValue },
    { name: "VDI / DaaS", value: data.derived.vdiDaasValue },
    { name: "Overhead", value: data.derived.overheadValue },
    { name: "Managed Services", value: data.derived.mspSpend },
  ];

  const rows: ProjectionRow[] = categories.map(c => {
    const y1 = c.value;
    const y2 = y1 * (1 + rate);
    const y3 = y1 * Math.pow(1 + rate, 2);
    return { category: c.name, year1: y1, year2: y2, year3: y3, total: y1 + y2 + y3 };
  });

  const totalRow: ProjectionRow = {
    category: "Total",
    year1: rows.reduce((s, r) => s + r.year1, 0),
    year2: rows.reduce((s, r) => s + r.year2, 0),
    year3: rows.reduce((s, r) => s + r.year3, 0),
    total: rows.reduce((s, r) => s + r.total, 0),
  };
  rows.push(totalRow);
  return rows;
}

export type ConfidenceTier = "HIGH" | "MODERATE" | "PRELIMINARY";

export type DataConfidenceResult = {
  inputPct: number;
  assumptionPct: number;
  tier: ConfidenceTier;
  pillarCoverage: { pillar: string; subPillar: string; hasVendor: boolean; hasCost: boolean; status: "complete" | "partial" | "none" }[];
};

const ALL_SUB_PILLARS: { pillar: string; subPillar: string }[] = [
  { pillar: "Endpoint Hardware & OS", subPillar: "1.1 PC / AI / Mobile Hardware" },
  { pillar: "Endpoint Hardware & OS", subPillar: "1.2 Endpoint OS" },
  { pillar: "Access", subPillar: "2.1 VPN" },
  { pillar: "Access", subPillar: "2.2 Secure Enterprise Browser" },
  { pillar: "Virtual Desktops & Applications", subPillar: "3.1 DaaS Cloud PC / Hosted Desktop" },
  { pillar: "Virtual Desktops & Applications", subPillar: "3.2 VDI On-Premises" },
  { pillar: "Device, OS & User Management", subPillar: "4.1 UEM" },
  { pillar: "Device, OS & User Management", subPillar: "4.2 DEX" },
  { pillar: "Security", subPillar: "5.1 Endpoint Security" },
  { pillar: "Security", subPillar: "5.2 IAM" },
  { pillar: "Security", subPillar: "5.3 SASE" },
  { pillar: "App Management", subPillar: "6.1 App Layering" },
  { pillar: "App Management", subPillar: "6.2 App Readiness" },
  { pillar: "App Management", subPillar: "6.3 Apps Config" },
  { pillar: "Collaboration, AI & Applications", subPillar: "7.1 Workspace AI" },
  { pillar: "Collaboration, AI & Applications", subPillar: "7.2 Unified Comms & Collab" },
];

export function calculateDataConfidence(data: ReportData): DataConfidenceResult {
  const total = data.derived.costFromInputs + data.derived.costFromAssumptions;
  const inputPct = total > 0 ? Math.round((data.derived.costFromInputs / total) * 100) : 0;
  const assumptionPct = 100 - inputPct;
  const tier: ConfidenceTier = inputPct > 70 ? "HIGH" : inputPct >= 40 ? "MODERATE" : "PRELIMINARY";

  const pillarCoverage = ALL_SUB_PILLARS.map(sp => {
    const entries = data.hexagridEntries.filter(e => e.subPillar === sp.subPillar);
    const hasVendor = entries.some(e => e.vendorName && e.vendorName.trim() !== "");
    const hasCost = entries.some(e => (e.yearlyCost ?? 0) > 0);
    const status: "complete" | "partial" | "none" = hasVendor && hasCost ? "complete" : hasVendor ? "partial" : "none";
    return { pillar: sp.pillar, subPillar: sp.subPillar, hasVendor, hasCost, status };
  });

  return { inputPct, assumptionPct, tier, pillarCoverage };
}

export type ScoringFlagEntry = {
  subPillar: string;
  vendorName: string;
  platform: string;
  flag: string;
};

export function collectScoringFlags(entries: HexagridEntry[]): ScoringFlagEntry[] {
  return entries
    .filter(e => e.scoringFlag && e.scoringFlag.trim() !== "")
    .map(e => ({
      subPillar: e.subPillar,
      vendorName: e.vendorName,
      platform: e.platform || e.customProductName || "",
      flag: e.scoringFlag!,
    }));
}

export type VendorLandscapeRow = {
  pillar: string;
  subPillar: string;
  vendorName: string;
  platform: string;
  licenseCount?: number;
  licenseSku?: string;
  scoringFlag?: string;
};

export function collectVendorLandscape(entries: HexagridEntry[]): VendorLandscapeRow[] {
  return entries
    .filter(e => e.vendorName && e.vendorName.trim() !== "")
    .map(e => ({
      pillar: e.pillar,
      subPillar: e.subPillar,
      vendorName: e.vendorName,
      platform: e.platform || e.customProductName || "",
      licenseCount: e.licenseCount,
      licenseSku: e.licenseSku,
      scoringFlag: e.scoringFlag,
    }));
}

export type KeyFinding = {
  text: string;
  appendixRef: string;
};

export function generateKeyFindings(data: ReportData): KeyFinding[] {
  const findings: KeyFinding[] = [];
  const { derived, inputs } = data;

  const allCategories = [
    { name: "End-User Devices", value: derived.endUserDevicesValue },
    { name: "Support & Operations", value: derived.supportOpsValue },
    { name: "Licensing", value: derived.licensingValue },
    { name: "Management & Security", value: derived.mgmtSecurityValue },
    { name: "VDI / DaaS", value: derived.vdiDaasValue },
    { name: "Overhead", value: derived.overheadValue },
    { name: "Managed Services", value: derived.mspSpend },
  ].filter(c => c.value > 0).sort((a, b) => b.value - a.value);

  if (allCategories.length > 0) {
    const largest = allCategories[0];
    findings.push({
      text: `${largest.name} represents ${pct(largest.value, derived.totalAnnualTco)}% of total TCO — the largest single cost driver.`,
      appendixRef: "A.3",
    });
  }

  if (derived.vdiUserCount > 0 && derived.vdiUserPremium > 0) {
    findings.push({
      text: `VDI users carry a ${fmtMoney(derived.vdiUserPremium)}/year premium over standard users, driven by virtual desktop platform costs.`,
      appendixRef: "A.5",
    });
  }

  if (derived.endUserDevicesValue > 0) {
    const devicePct = pct(derived.endUserDevicesValue, derived.totalAnnualTco);
    if (devicePct >= 15) {
      findings.push({
        text: `End-user devices account for ${devicePct}% of spend. At ${fmtNumber(derived.endpoints)} endpoints, hardware lifecycle management is a significant cost lever.`,
        appendixRef: "A.3",
      });
    }
  }

  if (derived.licensingValue > 0) {
    const licensingPct = pct(derived.licensingValue, derived.totalAnnualTco);
    if (licensingPct >= 25) {
      findings.push({
        text: `Software licensing (${fmtMoney(derived.licensingValue)}) exceeds ${licensingPct}% of total spend, suggesting bundled enterprise agreements may offer consolidation opportunities.`,
        appendixRef: "A.3",
      });
    }
  }

  if (derived.mspSpend > 0) {
    const mspPct = pct(derived.mspSpend, derived.totalAnnualTco);
    findings.push({
      text: `${mspPct}% of your TCO (${fmtMoney(derived.mspSpend)}) is outsourced to managed services providers.`,
      appendixRef: "A.3",
    });
  }

  const thinClients = inputs.environment.thinClientCount;
  if (thinClients > 0 && derived.endpoints > 0) {
    const tcPct = pct(thinClients, derived.endpoints);
    if (tcPct >= 10) {
      findings.push({
        text: `${tcPct}% of endpoints are thin clients, typically indicating a VDI-forward strategy.`,
        appendixRef: "A.1",
      });
    }
  }

  const flags = collectScoringFlags(data.hexagridEntries);
  if (flags.length > 0) {
    findings.push({
      text: `${flags.length} platform${flags.length > 1 ? "s" : ""} carry aging or critical risk flags — see the Risk section for details.`,
      appendixRef: "A.8",
    });
  }

  const vendorCounts: Record<string, number> = {};
  data.hexagridEntries.forEach(e => {
    if (e.vendorName && e.vendorName.trim()) {
      vendorCounts[e.vendorName] = (vendorCounts[e.vendorName] || 0) + 1;
    }
  });
  const totalSubPillars = new Set(data.hexagridEntries.map(e => e.subPillar)).size;
  const topVendor = Object.entries(vendorCounts).sort((a, b) => b[1] - a[1])[0];
  if (topVendor && topVendor[1] >= 3 && totalSubPillars >= 3) {
    findings.push({
      text: `${topVendor[0]} appears in ${topVendor[1]} of ${totalSubPillars} sub-pillars, representing significant vendor concentration.`,
      appendixRef: "A.2",
    });
  }

  const subPillarsWithData = new Set(data.hexagridEntries.filter(e => e.vendorName?.trim()).map(e => e.subPillar)).size;
  const dataGaps = ALL_SUB_PILLARS.length - subPillarsWithData;
  if (dataGaps > 0) {
    findings.push({
      text: `${dataGaps} of ${ALL_SUB_PILLARS.length} sub-pillars have no vendor data — filling these in will improve baseline accuracy.`,
      appendixRef: "A.7",
    });
  }

  return findings;
}

export type NextStep = { text: string };

export function generateRecommendedNextSteps(data: ReportData): NextStep[] {
  const steps: NextStep[] = [];
  const confidence = calculateDataConfidence(data);
  const flags = collectScoringFlags(data.hexagridEntries);

  if (confidence.inputPct < 70) {
    const gaps = confidence.pillarCoverage.filter(p => p.status !== "complete").length;
    steps.push({ text: `Refine the baseline by providing actual spend data for the ${gaps} sub-pillars currently using assumptions.` });
  }

  if (flags.length > 0) {
    steps.push({ text: `Evaluate migration paths for ${flags.length} platform${flags.length > 1 ? "s" : ""} carrying risk flags before support timelines expire.` });
  }

  if (data.derived.vdiUserCount > 0) {
    steps.push({ text: "Consider a detailed VDI modernization analysis to evaluate platform alternatives and potential savings." });
  }

  if (data.derived.mspSpend > 0 && data.derived.totalAnnualTco > 0) {
    const mspPct = pct(data.derived.mspSpend, data.derived.totalAnnualTco);
    if (mspPct > 15) {
      steps.push({ text: "Review managed services scope and pricing against the baseline to assess cost efficiency." });
    }
  }

  steps.push({ text: "Use this baseline as the foundation for any future-state TCO comparison or ROI analysis." });
  return steps;
}

export const GLOSSARY: { term: string; definition: string }[] = [
  { term: "TCO", definition: "Total Cost of Ownership — the full annual cost of operating an IT environment" },
  { term: "EUC", definition: "End-User Computing — the technology stack that supports knowledge workers" },
  { term: "VDI", definition: "Virtual Desktop Infrastructure — centrally hosted desktops accessed over a network" },
  { term: "DaaS", definition: "Desktop as a Service — cloud-hosted virtual desktops" },
  { term: "UEM", definition: "Unified Endpoint Management — tools for managing devices, OS, and policies" },
  { term: "DEX", definition: "Digital Employee Experience — tools that measure and improve the end-user IT experience" },
  { term: "SASE", definition: "Secure Access Service Edge — cloud-delivered security + networking" },
  { term: "IAM", definition: "Identity & Access Management — authentication and authorization systems" },
  { term: "MSP", definition: "Managed Services Provider — third-party IT operations provider" },
  { term: "Endpoint", definition: "Any managed device (laptop, desktop, thin client)" },
  { term: "Sub-Pillar", definition: "A technology sub-category within the 7-pillar EUC framework" },
];

export function getEndpointMixAnnotation(laptops: number, desktops: number, thinClients: number, endpoints: number): string {
  if (endpoints === 0) return "";
  const maxType = laptops >= desktops && laptops >= thinClients ? "laptop"
    : desktops >= laptops && desktops >= thinClients ? "desktop"
    : "thin-client";

  const label = maxType === "laptop" ? "laptop-heavy"
    : maxType === "desktop" ? "desktop-heavy"
    : "thin-client-heavy";

  const maxCount = maxType === "laptop" ? laptops : maxType === "desktop" ? desktops : thinClients;
  const maxName = maxType === "laptop" ? "Laptops" : maxType === "desktop" ? "Desktops" : "Thin clients";
  const maxPct = pct(maxCount, endpoints);

  const balanced = Math.abs(pct(laptops, endpoints) - pct(desktops, endpoints)) < 15;

  return `Your endpoint fleet is ${balanced ? "balanced" : label}. ${maxName} represent${maxName === "Laptops" || maxName === "Desktops" || maxName === "Thin clients" ? "" : "s"} ${maxPct}% of all managed devices.`;
}

export function getCostBreakdownAnnotation(data: ReportData): string {
  const categories = [
    { name: "End-User Devices", value: data.derived.endUserDevicesValue },
    { name: "Support & Operations", value: data.derived.supportOpsValue },
    { name: "Licensing", value: data.derived.licensingValue },
    { name: "Management & Security", value: data.derived.mgmtSecurityValue },
    { name: "VDI / DaaS", value: data.derived.vdiDaasValue },
    { name: "Overhead", value: data.derived.overheadValue },
    { name: "Managed Services", value: data.derived.mspSpend },
  ].filter(c => c.value > 0).sort((a, b) => b.value - a.value);

  if (categories.length < 2) return "";
  const first = categories[0];
  const second = categories[1];
  const combinedPct = pct(first.value + second.value, data.derived.totalAnnualTco);
  return `${first.name} accounts for ${pct(first.value, data.derived.totalAnnualTco)}% of your total EUC spend. ${second.name} follows at ${pct(second.value, data.derived.totalAnnualTco)}%. Together, these two categories represent ${combinedPct}% of your baseline.`;
}

export function getCategorySource(line: CalcLine, _data: ReportData): string {
  if (line.basis.includes("(input override)")) return "Manual override";
  if (line.basis.includes("(input)")) return "Direct client input";
  if (line.basis.includes("from EUC Pillars")) return "EUC Pillar vendor costs";
  return "Calculated from assumptions";
}
