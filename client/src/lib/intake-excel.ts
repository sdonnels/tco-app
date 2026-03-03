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

export function parseIntakeFile(file: ArrayBuffer): ImportResult {
  const wb = XLSX.read(file, { type: "array" });

  const knownTabs = ["Cover", "Environment Facts", "EUC Pillars", "Platform Cost Overrides", "Managed Services"];
  const hasKnownTab = wb.SheetNames.some((name) => knownTabs.includes(name));
  if (!hasKnownTab) {
    throw new Error("This file doesn't match the expected intake form template.");
  }

  const checkHeader = (sheetName: string) => {
    const ws = wb.Sheets[sheetName];
    if (!ws) return;
    const firstRow = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 })?.[0];
    if (!firstRow || !Array.isArray(firstRow)) return;
    const hasFieldLabel = firstRow.some((c) => String(c || "").toLowerCase().includes("field label"));
    if (!hasFieldLabel) {
      throw new Error(`Sheet "${sheetName}" is missing the expected column headers.`);
    }
  };
  for (const tab of ["Environment Facts", "EUC Pillars", "Platform Cost Overrides", "Managed Services"]) {
    if (wb.Sheets[tab]) checkHeader(tab);
  }

  let clientName = "";
  let projectName = "";
  const mapped: MappedField[] = [];
  const unmapped: MappedField[] = [];
  const errors: MappedField[] = [];
  let blankCount = 0;

  const inputs: Record<string, unknown> = {};

  const coverSheet = wb.Sheets["Cover"];
  if (coverSheet) {
    const coverData = XLSX.utils.sheet_to_json<string[]>(coverSheet, { header: 1 }) as unknown[][];
    for (const row of coverData) {
      if (row[0] === "Client Name" && row[1]) clientName = String(row[1]);
      if (row[0] === "Project Name" && row[1]) projectName = String(row[1]).replace("(not specified)", "").trim();
    }
  }

  const envSheet = wb.Sheets["Environment Facts"];
  if (envSheet) {
    const envData = XLSX.utils.sheet_to_json<Record<string, unknown>>(envSheet);
    const envMap: Record<string, string> = {
      "Total Users": "userCount",
      "Laptops": "laptopCount",
      "Desktops": "desktopCount",
      "Thin Clients": "thinClientCount",
    };
    for (const row of envData) {
      const label = String(row["Field Label"] || "").trim();
      const response = row["Your Response"];
      if (!label || !(label in envMap)) continue;
      if (response === null || response === undefined || response === "") {
        blankCount++;
        continue;
      }
      const num = parseNumeric(response);
      if (num === null) {
        errors.push({ field: label, value: String(response), target: envMap[label], status: "error", errorMsg: "Expected a number" });
      } else {
        inputs[envMap[label]] = num;
        mapped.push({ field: label, value: num, target: envMap[label], status: "mapped" });
      }
    }
  }

  const overrideSheet = wb.Sheets["Platform Cost Overrides"];
  if (overrideSheet) {
    const overrideData = XLSX.utils.sheet_to_json<Record<string, unknown>>(overrideSheet);
    const overrideMap: Record<string, string> = {
      "End-User Devices (Annual)": "endUserDevicesAnnual",
      "Support & Ops (Annual)": "supportOpsAnnual",
      "Licensing (Annual)": "licensingAnnual",
      "Device, OS & User Mgmt + Security (Annual)": "mgmtSecurityAnnual",
      "Virtual Desktops & Applications (Annual)": "vdiDaasAnnual",
      "Overhead (Annual)": "overheadAnnual",
    };
    const categoryRollups: Record<string, number> = {};
    for (const row of overrideData) {
      const label = String(row["Field Label"] || "").trim();
      const response = row["Your Response"];
      if (!label || !(label in overrideMap)) continue;
      if (response === null || response === undefined || response === "") {
        blankCount++;
        continue;
      }
      const num = parseNumeric(response);
      if (num === null) {
        errors.push({ field: label, value: String(response), target: overrideMap[label], status: "error", errorMsg: "Expected a number" });
      } else {
        categoryRollups[overrideMap[label]] = num;
        mapped.push({ field: label, value: num, target: `categoryRollups.${overrideMap[label]}`, status: "mapped" });
      }
    }
    if (Object.keys(categoryRollups).length > 0) inputs.categoryRollups = categoryRollups;
  }

  const mspSheet = wb.Sheets["Managed Services"];
  if (mspSheet) {
    const mspData = XLSX.utils.sheet_to_json<Record<string, unknown>>(mspSheet);
    const managedServices: Record<string, unknown> = {};
    for (const row of mspData) {
      const label = String(row["Field Label"] || "").trim();
      const response = row["Your Response"];
      if (!label) continue;
      if (response === null || response === undefined || response === "") {
        blankCount++;
        continue;
      }

      if (label === "Total MSP / Managed Services Spend") {
        const num = parseNumeric(response);
        if (num === null) {
          errors.push({ field: label, value: String(response), target: "managedServices.totalAnnualSpend", status: "error", errorMsg: "Expected a number" });
        } else {
          managedServices.totalAnnualSpend = num;
          mapped.push({ field: label, value: num, target: "managedServices.totalAnnualSpend", status: "mapped" });
        }
      } else if (label.startsWith("Outsourced:")) {
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
          mapped.push({ field: label, value: String(response), target: `managedServices.${key}`, status: "mapped" });
        }
      } else if (label === "Other Outsourced Description") {
        managedServices.otherDescription = String(response);
        mapped.push({ field: label, value: String(response), target: "managedServices.otherDescription", status: "mapped" });
      } else if (label === "MSP Provider: XenTegra") {
        managedServices.mspXentegra = parseBool(response);
        mapped.push({ field: label, value: String(response), target: "managedServices.mspXentegra", status: "mapped" });
      } else if (label === "MSP Provider: Other") {
        managedServices.mspOther = parseBool(response);
        mapped.push({ field: label, value: String(response), target: "managedServices.mspOther", status: "mapped" });
      } else if (label === "Other MSP Provider Names") {
        const providers = String(response).split(",").map((s) => s.trim()).filter(Boolean);
        managedServices.mspOtherProviders = providers;
        mapped.push({ field: label, value: String(response), target: "managedServices.mspOtherProviders", status: "mapped" });
      }
    }
    if (Object.keys(managedServices).length > 0) inputs.managedServices = managedServices;
  }

  const eucSheet = wb.Sheets["EUC Pillars"];
  if (eucSheet) {
    const eucData = XLSX.utils.sheet_to_json<Record<string, unknown>>(eucSheet);
    const hexEntries: Record<string, unknown>[] = [];
    let currentSp = "";
    let entry: Record<string, unknown> = {};
    const vdiUserCounts: Record<string, number> = {};

    for (const row of eucData) {
      const label = String(row["Field Label"] || "").trim();
      const response = row["Your Response"];
      if (!label) continue;
      if (label.startsWith("---")) continue;

      const spMatch = label.match(/^(.+?)\s*—\s*(Vendor|Platform|Version|Annual Cost|License Count|License SKU|User Count|Other Vendor Name|Other Platform Name|Other Version)$/);
      if (!spMatch) continue;

      const sp = spMatch[1];
      const fieldType = spMatch[2];

      if (sp !== currentSp) {
        if (currentSp && entry.vendor) {
          hexEntries.push({ ...entry });
        }
        currentSp = sp;
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
    }

    if (currentSp && entry.vendor) {
      hexEntries.push({ ...entry });
    }

    if (hexEntries.length > 0) {
      inputs.hexagridEntries = hexEntries.map((e) => ({
        id: crypto.randomUUID(),
        pillar: e.pillar || "",
        subPillar: e.subPillar || "",
        vendor: e.vendor || "",
        platform: e.platform || undefined,
        version: e.version || undefined,
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
