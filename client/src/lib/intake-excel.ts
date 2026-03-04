import * as XLSX from "xlsx";
import vendorsData from "@/data/vendors.json";

type PillarDef = {
  pillar: string;
  description: string;
  sub_pillars: {
    name: string;
    description: string;
    vendors: {
      name: string;
      url?: string;
      scoringFlag?: string;
      platforms: {
        name: string;
        scoringFlag?: string;
        versions?: { name: string; scoringFlag?: string }[];
      }[];
    }[];
  }[];
};

const typedVendors = vendorsData as PillarDef[];

const LICENSE_EXCLUDED = new Set(["PC and Mobile Devices"]);
const VDI_SUBPILLARS = ["DaaS (Cloud PC / Hosted Desktop)", "VDI (On-Premises)"];

export interface IntakeSections {
  environmentFacts: boolean;
  eucPillars: boolean;
  platformCostOverrides: boolean;
  managedServices: boolean;
}

const ALL_SECTIONS: IntakeSections = {
  environmentFacts: true,
  eucPillars: true,
  platformCostOverrides: true,
  managedServices: true,
};

function applyHeaderStyle(ws: XLSX.WorkSheet, ref: string) {
  if (!ws["!cols"]) ws["!cols"] = [];
  const cell = ws[ref];
  if (cell) cell.s = { font: { bold: true }, fill: { fgColor: { rgb: "4472C4" } } };
}

function setColWidths(ws: XLSX.WorkSheet, widths: number[]) {
  ws["!cols"] = widths.map((w) => ({ wch: w }));
}

function addRow(
  data: (string | number | null)[][],
  label: string,
  description: string,
  validOptions?: string,
  response: string | number | null = null,
) {
  data.push([label, description, response, validOptions ?? ""]);
}

function buildCoverSheet(clientName: string, projectName: string): XLSX.WorkSheet {
  const rows: (string | null)[][] = [
    ["XenTegra"],
    [null],
    ["TCO Assessment — Intake Form"],
    [null],
    ["Client Name", clientName],
    ["Project Name", projectName || "(not specified)"],
    ["Date Generated", new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })],
    [null],
    ["Instructions"],
    [
      "Please fill in what you know in the highlighted 'Your Response' column on each tab. Leave anything you're unsure about blank — assumptions will be made explicit. Return this file to your consultant when complete.",
    ],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  setColWidths(ws, [25, 60]);
  return ws;
}

function buildHeaderRow(): [string, string, string, string][] {
  return [["Field Label", "Description", "Your Response", "Valid Options"]];
}

function buildEnvironmentSheet(): XLSX.WorkSheet {
  const data: (string | number | null)[][] = [...buildHeaderRow()];
  addRow(data, "Total Users", "Total number of end users in the environment", "Numeric");
  addRow(data, "Laptops", "Number of managed laptops", "Numeric");
  addRow(data, "Desktops", "Number of managed desktops", "Numeric");
  addRow(data, "Thin Clients", "Number of thin client devices", "Numeric");
  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [25, 55, 25, 30]);
  ws["!autofilter"] = { ref: "A1:D1" };
  return ws;
}

function buildEucPillarsSheet(): XLSX.WorkSheet {
  const data: (string | number | null)[][] = [...buildHeaderRow()];

  for (const pillar of typedVendors) {
    addRow(data, `--- ${pillar.pillar} ---`, pillar.description, "");
    for (const sp of pillar.sub_pillars) {
      const allVendorNames = sp.vendors.map((v) => v.name);
      allVendorNames.push("Other");
      const vendorOptions = allVendorNames.join("\n");

      const allPlatforms: string[] = [];
      for (const v of sp.vendors) {
        for (const p of v.platforms) {
          allPlatforms.push(`${v.name} — ${p.name}`);
        }
      }
      allPlatforms.push("Other");
      const platformOptions = allPlatforms.join("\n");

      const allVersions: string[] = [];
      for (const v of sp.vendors) {
        for (const p of v.platforms) {
          if (p.versions) {
            for (const ver of p.versions) {
              allVersions.push(`${v.name} — ${p.name} — ${ver.name}`);
            }
          }
        }
      }
      if (allVersions.length > 0) allVersions.push("Other");

      addRow(data, `${sp.name} — Vendor`, sp.description, vendorOptions);
      addRow(data, `${sp.name} — Other Vendor Name`, "If you selected 'Other' above, specify the vendor name", "Text");
      addRow(data, `${sp.name} — Platform`, "Select the product/platform in use", platformOptions);
      addRow(data, `${sp.name} — Other Platform Name`, "If you selected 'Other' above, specify the platform name", "Text");
      if (allVersions.length > 0) {
        addRow(data, `${sp.name} — Version`, "Select the version in use", allVersions.join("\n"));
        addRow(data, `${sp.name} — Other Version`, "If you selected 'Other' above, specify the version", "Text");
      }
      addRow(data, `${sp.name} — Annual Cost`, "Approximate annual cost for this platform", "Numeric (dollars)");
      if (!LICENSE_EXCLUDED.has(sp.name)) {
        addRow(data, `${sp.name} — License Count`, "Number of licenses for this platform", "Numeric");
        addRow(data, `${sp.name} — License SKU`, "License SKU or plan name", "Text");
      }
      if (VDI_SUBPILLARS.includes(sp.name)) {
        addRow(data, `${sp.name} — User Count`, "Number of users on this VDI/DaaS platform", "Numeric");
      }
      addRow(data, "", "", "");
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [40, 60, 30, 50]);
  return ws;
}

function buildOverridesSheet(): XLSX.WorkSheet {
  const data: (string | number | null)[][] = [...buildHeaderRow()];
  addRow(data, "End-User Devices (Annual)", "Total annual spend on end-user device hardware refresh", "Numeric (dollars)");
  addRow(data, "Support & Ops (Annual)", "Total annual spend on support and operations", "Numeric (dollars)");
  addRow(data, "Licensing (Annual)", "Total annual spend on collaboration, AI & app licensing", "Numeric (dollars)");
  addRow(data, "Device, OS & User Mgmt + Security (Annual)", "Total annual spend on device management and security", "Numeric (dollars)");
  addRow(data, "Virtual Desktops & Applications (Annual)", "Total annual spend on VDI/DaaS platforms", "Numeric (dollars)");
  addRow(data, "Overhead (Annual)", "Total annual overhead costs", "Numeric (dollars)");
  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [45, 55, 25, 25]);
  return ws;
}

function buildManagedServicesSheet(): XLSX.WorkSheet {
  const data: (string | number | null)[][] = [...buildHeaderRow()];
  addRow(data, "Total MSP / Managed Services Spend", "Total annual spend on managed services or MSP providers", "Numeric (dollars)");
  addRow(data, "", "", "");
  addRow(data, "Outsourced: Endpoint Management", "Is endpoint management (UEM, imaging, lifecycle) outsourced?", "Yes\nNo");
  addRow(data, "Outsourced: Security / EDR / SOC", "Is security / EDR / SOC outsourced?", "Yes\nNo");
  addRow(data, "Outsourced: Patching & Updates", "Is patching and updates outsourced?", "Yes\nNo");
  addRow(data, "Outsourced: Helpdesk / Tier 1 Support", "Is helpdesk / Tier 1 support outsourced?", "Yes\nNo");
  addRow(data, "Outsourced: Tier 2+ Support / Engineering", "Is Tier 2+ support / engineering outsourced?", "Yes\nNo");
  addRow(data, "Outsourced: Other", "Are any other EUC functions outsourced?", "Yes\nNo");
  addRow(data, "Other Outsourced Description", "If 'Other' is Yes, describe what's outsourced", "Text");
  addRow(data, "", "", "");
  addRow(data, "MSP Provider: XenTegra", "Is XenTegra a managed services provider?", "Yes\nNo");
  addRow(data, "MSP Provider: Other", "Do you use another MSP provider?", "Yes\nNo");
  addRow(data, "Other MSP Provider Names", "If 'Other' is Yes, list provider names separated by commas", "Text");
  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [45, 55, 25, 15]);
  return ws;
}

export function exportIntakeForm(clientName: string, projectName: string, sections: IntakeSections = ALL_SECTIONS) {
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, buildCoverSheet(clientName, projectName), "Cover");

  if (sections.environmentFacts) {
    XLSX.utils.book_append_sheet(wb, buildEnvironmentSheet(), "Environment Facts");
  }
  if (sections.platformCostOverrides) {
    XLSX.utils.book_append_sheet(wb, buildOverridesSheet(), "Platform Cost Overrides");
  }
  if (sections.eucPillars) {
    XLSX.utils.book_append_sheet(wb, buildEucPillarsSheet(), "EUC Pillars");
  }
  if (sections.managedServices) {
    XLSX.utils.book_append_sheet(wb, buildManagedServicesSheet(), "Managed Services");
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const slug = clientName.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_") || "Client";
  const filename = `TCO_Intake_${slug}_${dateStr}.xlsx`;

  XLSX.writeFile(wb, filename);
}

export type MappedField = {
  field: string;
  value: string | number;
  target: string;
  status: "mapped" | "unmapped" | "error";
  errorMsg?: string;
};

export type ImportResult = {
  clientName: string;
  projectName: string;
  mapped: MappedField[];
  unmapped: MappedField[];
  errors: MappedField[];
  blankCount: number;
  inputs: Record<string, unknown>;
};

function parseNumeric(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number") return raw;
  const cleaned = String(raw).replace(/[$,\s]/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function parseBool(raw: unknown): boolean {
  if (!raw) return false;
  return String(raw).toLowerCase().trim() === "yes";
}

function findSheet(wb: XLSX.WorkBook, ...names: string[]): XLSX.WorkSheet | null {
  for (const name of names) {
    if (wb.Sheets[name]) return wb.Sheets[name];
  }
  const lowerNames = names.map((n) => n.toLowerCase());
  for (const sn of wb.SheetNames) {
    if (lowerNames.includes(sn.toLowerCase())) return wb.Sheets[sn];
  }
  return null;
}

function matchEnvField(label: string): string | null {
  const l = label.toLowerCase();
  if (/total\s*users|end\s*users|user\s*count/.test(l)) return "userCount";
  if (/laptop/.test(l)) return "laptopCount";
  if (/desktop/.test(l) && !/virtual|vdi|daas/.test(l)) return "desktopCount";
  if (/thin\s*client/.test(l)) return "thinClientCount";
  return null;
}

function matchOverrideField(label: string): string | null {
  const l = label.toLowerCase();
  if (/end.?user\s*device|hardware\s*refresh/.test(l)) return "endUserDevicesAnnual";
  if (/support.*ops|operations/.test(l)) return "supportOpsAnnual";
  if (/licensing|license.*annual/.test(l)) return "licensingAnnual";
  if (/mgmt|management.*security|device.*security/.test(l)) return "mgmtSecurityAnnual";
  if (/vdi|daas|virtual\s*desktop/.test(l)) return "vdiDaasAnnual";
  if (/overhead/.test(l)) return "overheadAnnual";
  return null;
}

function getResponseColumn(row: Record<string, unknown>): unknown {
  if (row["Your Response"] !== undefined) return row["Your Response"];
  for (const key of Object.keys(row)) {
    const lk = key.toLowerCase();
    if (lk.includes("response") || lk.includes("answer") || lk.includes("value")) return row[key];
  }
  return undefined;
}

function getFirstColumnLabel(row: Record<string, unknown>): string {
  if (row["Field Label"] !== undefined) return String(row["Field Label"] || "").trim();
  const firstKey = Object.keys(row)[0];
  return firstKey ? String(row[firstKey] || "").trim() : "";
}

const EUC_SECTION_PATTERN = /^(\d+\.\d+)\s+(.+)/;

const EUC_SECTION_RULES: [RegExp, string][] = [
  [/workspace\s*ai/i, "Workspace AI"],
  [/daas|cloud\s*pc|hosted\s*desktop/i, "DaaS (Cloud PC / Hosted Desktop)"],
  [/vdi|on.premises/i, "VDI (On-Premises)"],
  [/unified\s*endpoint\s*management|uem/i, "UEM"],
  [/digital\s*employee\s*experience|dex/i, "DEX"],
  [/endpoint\s*security/i, "Endpoint Security"],
  [/identity.*access|access.*management|iam/i, "IAM"],
  [/secure\s*access\s*service\s*edge|sase/i, "SASE"],
  [/secure\s*enterprise\s*browser|secure\s*browser/i, "Secure Enterprise Browser"],
  [/endpoint\s*os/i, "Endpoint OS"],
  [/app\s*layering|streaming/i, "App Layering"],
  [/app(?:lication)?\s*readiness|packaging/i, "App Readiness"],
  [/apps?\s*config|asset\s*management/i, "Apps Config"],
  [/unified\s*comm|collaboration/i, "Unified Comms & Collab"],
  [/vpn/i, "VPN"],
  [/pc.*mobile|mobile.*hardware|hardware/i, "PC and Mobile Devices"],
];

function resolveSubPillar(sectionHeader: string): string | null {
  const cleaned = sectionHeader.replace(EUC_SECTION_PATTERN, "$2").trim();
  for (const [pattern, sp] of EUC_SECTION_RULES) {
    if (pattern.test(cleaned)) return sp;
  }
  const lc = cleaned.toLowerCase();
  for (const pillar of typedVendors) {
    for (const sp of pillar.sub_pillars) {
      if (sp.name.toLowerCase() === lc) return sp.name;
      if (lc.includes(sp.name.toLowerCase())) return sp.name;
    }
  }
  return null;
}

function classifyEucQuestion(label: string): string | null {
  const l = label.toLowerCase();
  if (/vendor|provider|which.*(?:vendor|company|manufacturer)|who\s/.test(l) && !/platform|product|version|license|cost|sku|user\s*count/.test(l)) return "Vendor";
  if (/product|platform|device\s*type|what.*(?:device|product|platform|type)/.test(l) && !/vendor|version|license|cost|sku/.test(l)) return "Platform";
  if (/version|which\s*(?:os\s*)?version|release/.test(l) && !/vendor|platform|license|cost|sku/.test(l)) return "Version";
  if (/annual\s*cost|cost|spend|price/.test(l) && !/license|sku/.test(l)) return "Annual Cost";
  if (/license\s*count|how\s*many\s.*licenses|number\s*of\s*licenses/.test(l)) return "License Count";
  if (/license\s*sku|sku|plan\s*name/.test(l)) return "License SKU";
  if (/user\s*count|how\s*many\s.*users|number\s*of\s*users/.test(l)) return "User Count";
  return null;
}

export function parseIntakeFile(file: ArrayBuffer): ImportResult {
  const wb = XLSX.read(file, { type: "array" });

  const knownTabs = ["Cover", "Cover Sheet", "Environment Facts", "EUC Pillars", "Platform Cost Overrides", "Managed Services"];
  const hasKnownTab = wb.SheetNames.some((name) => knownTabs.some((k) => k.toLowerCase() === name.toLowerCase()));
  if (!hasKnownTab) {
    throw new Error("This file doesn't match the expected intake form template.");
  }

  let clientName = "";
  let projectName = "";
  const mapped: MappedField[] = [];
  const unmapped: MappedField[] = [];
  const errors: MappedField[] = [];
  let blankCount = 0;

  const inputs: Record<string, unknown> = {};

  const coverSheet = findSheet(wb, "Cover", "Cover Sheet");
  if (coverSheet) {
    const coverData = XLSX.utils.sheet_to_json<string[]>(coverSheet, { header: 1 }) as unknown[][];
    for (const row of coverData) {
      const cellLabel = String(row[0] || "").toLowerCase();
      if (cellLabel.includes("client") && row[1]) clientName = String(row[1]);
      if (cellLabel.includes("project") && row[1]) projectName = String(row[1]).replace("(not specified)", "").trim();
    }
  }

  const envSheet = findSheet(wb, "Environment Facts");
  if (envSheet) {
    const envData = XLSX.utils.sheet_to_json<Record<string, unknown>>(envSheet);
    for (const row of envData) {
      const label = getFirstColumnLabel(row);
      const response = getResponseColumn(row);
      if (!label) continue;
      const target = matchEnvField(label);
      if (!target) {
        if (response !== null && response !== undefined && response !== "") {
          unmapped.push({ field: label, value: String(response), target: "", status: "unmapped" });
        }
        continue;
      }
      if (response === null || response === undefined || response === "") {
        blankCount++;
        continue;
      }
      const num = parseNumeric(response);
      if (num === null) {
        errors.push({ field: label, value: String(response), target, status: "error", errorMsg: "Expected a number" });
      } else {
        inputs[target] = num;
        mapped.push({ field: label, value: num, target, status: "mapped" });
      }
    }
  }

  const overrideSheet = findSheet(wb, "Platform Cost Overrides");
  if (overrideSheet) {
    const overrideData = XLSX.utils.sheet_to_json<Record<string, unknown>>(overrideSheet);
    const categoryRollups: Record<string, number> = {};
    for (const row of overrideData) {
      const label = getFirstColumnLabel(row);
      const response = getResponseColumn(row);
      if (!label) continue;
      const target = matchOverrideField(label);
      if (!target) {
        if (response !== null && response !== undefined && response !== "") {
          unmapped.push({ field: label, value: String(response), target: "", status: "unmapped" });
        }
        continue;
      }
      if (response === null || response === undefined || response === "") {
        blankCount++;
        continue;
      }
      const num = parseNumeric(response);
      if (num === null) {
        errors.push({ field: label, value: String(response), target, status: "error", errorMsg: "Expected a number" });
      } else {
        categoryRollups[target] = num;
        mapped.push({ field: label, value: num, target: `categoryRollups.${target}`, status: "mapped" });
      }
    }
    if (Object.keys(categoryRollups).length > 0) inputs.categoryRollups = categoryRollups;
  }

  const mspSheet = findSheet(wb, "Managed Services");
  if (mspSheet) {
    const mspData = XLSX.utils.sheet_to_json<Record<string, unknown>>(mspSheet);
    const managedServices: Record<string, unknown> = {};
    for (const row of mspData) {
      const label = getFirstColumnLabel(row);
      const response = getResponseColumn(row);
      if (!label) continue;
      if (response === null || response === undefined || response === "") {
        blankCount++;
        continue;
      }

      const l = label.toLowerCase();
      const val = String(response);

      if (label === "Total MSP / Managed Services Spend" || /total.*msp|managed\s*services?\s*spend/i.test(label)) {
        const num = parseNumeric(response);
        if (num === null) {
          errors.push({ field: label, value: val, target: "managedServices.totalAnnualSpend", status: "error", errorMsg: "Expected a number" });
        } else {
          managedServices.totalAnnualSpend = num;
          mapped.push({ field: label, value: num, target: "managedServices.totalAnnualSpend", status: "mapped" });
        }
      } else if (label.startsWith("Outsourced:") || /outsourc.*endpoint/i.test(label)) {
        const keyMap: Record<string, string> = {
          "Outsourced: Endpoint Management": "outsourcedEndpointMgmt",
          "Outsourced: Security / EDR / SOC": "outsourcedSecurity",
          "Outsourced: Patching & Updates": "outsourcedPatching",
          "Outsourced: Helpdesk / Tier 1 Support": "outsourcedHelpdesk",
          "Outsourced: Tier 2+ Support / Engineering": "outsourcedTier2Plus",
          "Outsourced: Other": "outsourcedOther",
        };
        const key = keyMap[label];
        if (key) {
          managedServices[key] = parseBool(response);
          mapped.push({ field: label, value: val, target: `managedServices.${key}`, status: "mapped" });
        }
      } else if (label === "Other Outsourced Description" || /additional.*managed|managed.*details/i.test(label)) {
        managedServices.otherDescription = val;
        mapped.push({ field: label, value: val, target: "managedServices.otherDescription", status: "mapped" });
      } else if (label === "MSP Provider: XenTegra" || /do\s*you\s*use.*msp|managed\s*services?\s*provider/i.test(label)) {
        if (/xentegra/i.test(val)) {
          managedServices.mspXentegra = true;
          mapped.push({ field: label, value: val, target: "managedServices.mspXentegra", status: "mapped" });
        }
        if (/other/i.test(val)) {
          managedServices.mspOther = true;
          mapped.push({ field: label, value: val, target: "managedServices.mspOther", status: "mapped" });
        }
        if (!(/xentegra/i.test(val) || /other/i.test(val))) {
          mapped.push({ field: label, value: val, target: "managedServices.mspProvider", status: "mapped" });
        }
      } else if (label === "MSP Provider: Other" || /other.*msp|who.*msp|if\s*other.*provider/i.test(label)) {
        const providers = val.split(",").map((s) => s.trim()).filter(Boolean);
        managedServices.mspOther = true;
        managedServices.mspOtherProviders = providers;
        mapped.push({ field: label, value: val, target: "managedServices.mspOtherProviders", status: "mapped" });
      } else if (label === "Other MSP Provider Names") {
        const providers = val.split(",").map((s) => s.trim()).filter(Boolean);
        managedServices.mspOtherProviders = providers;
        mapped.push({ field: label, value: val, target: "managedServices.mspOtherProviders", status: "mapped" });
      } else if (/tier\s*1|helpdesk/i.test(l) && /outsourc/i.test(l)) {
        managedServices.outsourcedHelpdesk = parseBool(response);
        mapped.push({ field: label, value: val, target: "managedServices.outsourcedHelpdesk", status: "mapped" });
      } else if (/tier\s*[23]|tier\s*2\+/i.test(l) && /outsourc/i.test(l)) {
        managedServices.outsourcedTier2Plus = parseBool(response);
        mapped.push({ field: label, value: val, target: "managedServices.outsourcedTier2Plus", status: "mapped" });
      } else if (/support\s*staff|fte|how\s*many.*tier\s*1/i.test(l)) {
        const num = parseNumeric(response);
        if (num !== null) {
          managedServices.tier1StaffCount = num;
          mapped.push({ field: label, value: num, target: "managedServices.tier1StaffCount", status: "mapped" });
        }
      } else {
        unmapped.push({ field: label, value: val, target: "", status: "unmapped" });
      }
    }
    if (Object.keys(managedServices).length > 0) inputs.managedServices = managedServices;
  }

  const eucSheet = findSheet(wb, "EUC Pillars");
  if (eucSheet) {
    const eucData = XLSX.utils.sheet_to_json<Record<string, unknown>>(eucSheet);
    const hexEntries: Record<string, unknown>[] = [];
    let currentSp = "";
    let currentSpName = "";
    let entry: Record<string, unknown> = {};
    const vdiUserCounts: Record<string, number> = {};

    for (const row of eucData) {
      const label = getFirstColumnLabel(row);
      const response = getResponseColumn(row);
      if (!label) continue;
      if (label.startsWith("---")) continue;

      const spMatch = label.match(/^(.+?)\s*—\s*(Vendor|Platform|Version|Annual Cost|License Count|License SKU|User Count|Other Vendor Name|Other Platform Name|Other Version)$/);

      if (spMatch) {
        const sp = spMatch[1];
        const fieldType = spMatch[2];

        if (sp !== currentSp) {
          if (currentSp && entry.vendor) {
            hexEntries.push({ ...entry });
          }
          currentSp = sp;
          currentSpName = sp;
          entry = { subPillar: sp };
          const pillarDef = typedVendors.find((p) => p.sub_pillars.some((s) => s.name === sp));
          if (pillarDef) entry.pillar = pillarDef.pillar;
        }

        if (response === null || response === undefined || response === "") {
          blankCount++;
          continue;
        }

        const val = String(response).trim();

        switch (fieldType) {
          case "Vendor": {
            const vendorName = val === "Other" ? (entry.customVendor as string) || val : val;
            entry.vendor = vendorName;
            mapped.push({ field: label, value: val, target: `euc.${sp}.vendor`, status: "mapped" });
            break;
          }
          case "Other Vendor Name":
            entry.customVendor = val;
            entry.vendor = val;
            mapped.push({ field: label, value: val, target: `euc.${sp}.customVendor`, status: "mapped" });
            break;
          case "Platform": {
            const parts = val.split(" — ");
            entry.platform = parts.length > 1 ? parts[parts.length - 1] : val;
            mapped.push({ field: label, value: val, target: `euc.${sp}.platform`, status: "mapped" });
            break;
          }
          case "Other Platform Name":
            entry.platform = val;
            mapped.push({ field: label, value: val, target: `euc.${sp}.customPlatform`, status: "mapped" });
            break;
          case "Version": {
            const parts = val.split(" — ");
            entry.version = parts[parts.length - 1];
            mapped.push({ field: label, value: val, target: `euc.${sp}.version`, status: "mapped" });
            break;
          }
          case "Other Version":
            entry.version = val;
            mapped.push({ field: label, value: val, target: `euc.${sp}.customVersion`, status: "mapped" });
            break;
          case "Annual Cost": {
            const num = parseNumeric(response);
            if (num === null) {
              errors.push({ field: label, value: val, target: `euc.${sp}.annualCost`, status: "error", errorMsg: "Expected a number" });
            } else {
              entry.annualCost = num;
              mapped.push({ field: label, value: num, target: `euc.${sp}.annualCost`, status: "mapped" });
            }
            break;
          }
          case "License Count": {
            const num = parseNumeric(response);
            if (num === null) {
              errors.push({ field: label, value: val, target: `euc.${sp}.licenseCount`, status: "error", errorMsg: "Expected a number" });
            } else {
              entry.licenseCount = num;
              mapped.push({ field: label, value: num, target: `euc.${sp}.licenseCount`, status: "mapped" });
            }
            break;
          }
          case "License SKU":
            entry.licenseSku = val;
            mapped.push({ field: label, value: val, target: `euc.${sp}.licenseSku`, status: "mapped" });
            break;
          case "User Count": {
            const num = parseNumeric(response);
            if (num === null) {
              errors.push({ field: label, value: val, target: `euc.${sp}.userCount`, status: "error", errorMsg: "Expected a number" });
            } else {
              const key = sp.toLowerCase().includes("daas") ? "daas" : "vdi";
              vdiUserCounts[key] = num;
              mapped.push({ field: label, value: num, target: `vdiUserCounts.${key}`, status: "mapped" });
            }
            break;
          }
        }
        continue;
      }

      const sectionMatch = label.match(EUC_SECTION_PATTERN);
      if (sectionMatch) {
        if (currentSpName && entry.vendor) {
          hexEntries.push({ ...entry });
        }
        const resolved = resolveSubPillar(label);
        currentSpName = resolved || sectionMatch[2].trim();
        currentSp = currentSpName;
        entry = { subPillar: currentSpName };
        const pillarDef = typedVendors.find((p) => p.sub_pillars.some((s) => s.name === currentSpName));
        if (pillarDef) entry.pillar = pillarDef.pillar;
        continue;
      }

      if (!currentSpName) continue;

      if (response === null || response === undefined || response === "") {
        blankCount++;
        continue;
      }

      const val = String(response).trim();
      const fieldType = classifyEucQuestion(label);

      if (!fieldType) {
        unmapped.push({ field: label, value: val, target: "", status: "unmapped" });
        continue;
      }

      switch (fieldType) {
        case "Vendor":
          entry.vendor = val;
          mapped.push({ field: label, value: val, target: `euc.${currentSpName}.vendor`, status: "mapped" });
          break;
        case "Platform":
          entry.platform = val;
          mapped.push({ field: label, value: val, target: `euc.${currentSpName}.platform`, status: "mapped" });
          break;
        case "Version":
          entry.version = val;
          mapped.push({ field: label, value: val, target: `euc.${currentSpName}.version`, status: "mapped" });
          break;
        case "Annual Cost": {
          const num = parseNumeric(response);
          if (num === null) {
            errors.push({ field: label, value: val, target: `euc.${currentSpName}.annualCost`, status: "error", errorMsg: "Expected a number" });
          } else {
            entry.annualCost = num;
            mapped.push({ field: label, value: num, target: `euc.${currentSpName}.annualCost`, status: "mapped" });
          }
          break;
        }
        case "License Count": {
          const num = parseNumeric(response);
          if (num === null) {
            errors.push({ field: label, value: val, target: `euc.${currentSpName}.licenseCount`, status: "error", errorMsg: "Expected a number" });
          } else {
            entry.licenseCount = num;
            mapped.push({ field: label, value: num, target: `euc.${currentSpName}.licenseCount`, status: "mapped" });
          }
          break;
        }
        case "License SKU":
          entry.licenseSku = val;
          mapped.push({ field: label, value: val, target: `euc.${currentSpName}.licenseSku`, status: "mapped" });
          break;
        case "User Count": {
          const num = parseNumeric(response);
          if (num === null) {
            errors.push({ field: label, value: val, target: `euc.${currentSpName}.userCount`, status: "error", errorMsg: "Expected a number" });
          } else {
            const key = currentSpName.toLowerCase().includes("daas") ? "daas" : "vdi";
            vdiUserCounts[key] = num;
            mapped.push({ field: label, value: num, target: `vdiUserCounts.${key}`, status: "mapped" });
          }
          break;
        }
      }
    }

    if (currentSpName && entry.vendor) {
      hexEntries.push({ ...entry });
    }

    if (hexEntries.length > 0) {
      inputs.hexagridEntries = hexEntries.map((e) => ({
        id: crypto.randomUUID(),
        pillar: (e.pillar as string) || "",
        subPillar: (e.subPillar as string) || "",
        vendor: (e.vendor as string) || "",
        platform: (e.platform as string) || undefined,
        version: (e.version as string) || undefined,
        annualCost: (e.annualCost as number) || undefined,
        licenseCount: (e.licenseCount as number) || undefined,
        licenseSku: (e.licenseSku as string) || undefined,
        scoringFlag: undefined,
        vendorUrl: undefined,
        isCustomVendor: !!e.customVendor,
      }));
    }

    if (Object.keys(vdiUserCounts).length > 0) {
      inputs.vdiUserCounts = vdiUserCounts;
    }
  }

  return {
    clientName,
    projectName,
    mapped,
    unmapped,
    errors,
    blankCount,
    inputs,
  };
}
