import * as XLSX from "xlsx-js-style";
import ExcelJS from "exceljs";
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
const VERSION_SUBPILLARS = ["VDI (On-Premises)"];
const USER_COUNT_SUBPILLARS = VDI_SUBPILLARS;
const PLATFORM_SUBPILLARS = new Set([
  "PC and Mobile Devices",
  "Endpoint OS",
  "Secure Enterprise Browser",
  "VPN",
  "DaaS (Cloud PC / Hosted Desktop)",
  "VDI (On-Premises)",
  "Unified Endpoint Mgmt (UEM)",
  "Unified Comms & Collab",
]);

const BRAND = {
  navy: "002D56",
  white: "FFFFFF",
  lightBlue: "00B5E2",
  gray: "75787B",
  black: "000000",
  responseYellow: "FFFFF0",
  altRowGray: "F8F9FA",
  instructionBg: "F5F5F5",
  gridBorder: "D0D0D0",
  slotHeaderBlue: "E8F4F8",
};

const NUM_SLOTS = 3;

function argb(hex: string): string {
  return `FF${hex}`;
}

const THIN_BORDER: ExcelJS.Border = { style: "thin", color: { argb: argb(BRAND.gridBorder) } };
const ALL_THIN: Partial<ExcelJS.Borders> = { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER };
const BLUE_SIDE: ExcelJS.Border = { style: "thin", color: { argb: argb(BRAND.lightBlue) } };

function applyHeaderRow(ws: ExcelJS.Worksheet) {
  const headerRow = ws.getRow(1);
  headerRow.values = ["Field Label", "Description", "Your Response", "Valid Options"];
  headerRow.height = 28;
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    if (colNumber > 4) return;
    cell.font = { bold: true, size: 10, color: { argb: argb(BRAND.white) } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(BRAND.lightBlue) } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = { ...ALL_THIN, bottom: { style: "medium", color: { argb: argb(BRAND.navy) } } };
  });
  ws.views = [{ state: "frozen", ySplit: 1, xSplit: 0 }];
}

function setStandardWidths(ws: ExcelJS.Worksheet) {
  ws.getColumn(1).width = 45;
  ws.getColumn(2).width = 40;
  ws.getColumn(3).width = 25;
  ws.getColumn(4).width = 40;
}

function styleDataRow(ws: ExcelJS.Worksheet, rowNum: number, dataIdx: number) {
  const isOdd = dataIdx % 2 === 1;
  const bgColor = isOdd ? BRAND.altRowGray : BRAND.white;
  const row = ws.getRow(rowNum);

  const cellA = row.getCell(1);
  cellA.font = { bold: true, size: 10, color: { argb: argb(BRAND.black) } };
  cellA.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(bgColor) } };
  cellA.border = ALL_THIN;

  const cellB = row.getCell(2);
  cellB.font = { italic: true, size: 9, color: { argb: argb(BRAND.gray) } };
  cellB.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(bgColor) } };
  cellB.alignment = { wrapText: true };
  cellB.border = ALL_THIN;

  const cellC = row.getCell(3);
  cellC.font = { size: 10, color: { argb: argb(BRAND.black) } };
  cellC.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(BRAND.responseYellow) } };
  cellC.border = { ...ALL_THIN, left: BLUE_SIDE, right: BLUE_SIDE };
  cellC.protection = { locked: false };

  const cellD = row.getCell(4);
  cellD.font = { size: 9, color: { argb: argb(BRAND.gray) } };
  cellD.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(bgColor) } };
  cellD.alignment = { wrapText: true };
  cellD.border = ALL_THIN;
}

function addSectionHeader(ws: ExcelJS.Worksheet, rowNum: number, text: string) {
  const row = ws.getRow(rowNum);
  row.getCell(1).value = text;
  row.height = 28;
  for (let c = 1; c <= 4; c++) {
    const cell = row.getCell(c);
    cell.font = { bold: true, size: 11, color: { argb: argb(BRAND.white) } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(BRAND.navy) } };
    cell.alignment = { vertical: "middle" };
  }
  ws.mergeCells(rowNum, 1, rowNum, 4);
}

function addSlotHeader(ws: ExcelJS.Worksheet, rowNum: number, slotNum: number) {
  const row = ws.getRow(rowNum);
  const suffix = slotNum > 1 ? "  (leave blank if not applicable)" : "";
  row.getCell(1).value = `▸ Entry ${slotNum}${suffix}`;
  row.height = 22;
  for (let c = 1; c <= 4; c++) {
    const cell = row.getCell(c);
    cell.font = { bold: true, size: 9, color: { argb: argb(BRAND.lightBlue) } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(BRAND.slotHeaderBlue) } };
    cell.alignment = { vertical: "middle" };
  }
  ws.mergeCells(rowNum, 1, rowNum, 4);
}

function addDataRow(
  ws: ExcelJS.Worksheet,
  rowNum: number,
  dataIdx: number,
  label: string,
  description: string,
  validOptions: string,
  dropdown?: string[],
) {
  const row = ws.getRow(rowNum);
  row.getCell(1).value = label;
  row.getCell(2).value = description;
  row.getCell(3).value = "";
  row.getCell(4).value = validOptions;
  styleDataRow(ws, rowNum, dataIdx);
  if (dropdown && dropdown.length >= 2) {
    const joined = dropdown.join(",");
    if (joined.length <= 255) {
      row.getCell(3).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`"${joined}"`],
        showErrorMessage: true,
        errorTitle: "Invalid Selection",
        error: "Please select from the dropdown list or choose Other.",
      };
    }
  }
}

function applyPrintSetup(ws: ExcelJS.Worksheet) {
  ws.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 1,
    margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 },
  };
  ws.headerFooter = {
    oddHeader: "&L&\"Calibri,Regular\"TCO Assessment \u2014 Intake Form&R&\"Calibri,Regular\"Page &P of &N",
    oddFooter: "&C&\"Calibri,Regular\"XenTegra | Confidential",
  };
}

function applySheetProtection(ws: ExcelJS.Worksheet) {
  ws.protect("", {
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatCells: false,
    formatColumns: false,
    formatRows: false,
    insertColumns: false,
    insertRows: false,
    deleteColumns: false,
    deleteRows: false,
    sort: true,
    autoFilter: true,
  });
}

function buildCoverSheet(wb: ExcelJS.Workbook, clientName: string, projectName: string) {
  const ws = wb.addWorksheet("Cover Sheet", {
    properties: { tabColor: { argb: argb(BRAND.navy) } },
  });
  ws.getColumn(1).width = 25;
  ws.getColumn(2).width = 55;

  const titleRow = ws.getRow(1);
  titleRow.height = 50;
  ws.mergeCells("A1:B1");
  const titleCell = titleRow.getCell(1);
  titleCell.value = "TCO Assessment \u2014 Intake Form";
  titleCell.font = { bold: true, size: 18, color: { argb: argb(BRAND.white) } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(BRAND.navy) } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleRow.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(BRAND.navy) } };

  ws.getRow(2).height = 10;

  const metaFields = [
    ["Client Name", clientName, true],
    ["Project Name", projectName || "(not specified)", true],
    ["Date", new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), false],
    ["Prepared By", "XenTegra", false],
  ] as const;
  for (let i = 0; i < metaFields.length; i++) {
    const r = i + 3;
    const row = ws.getRow(r);
    row.height = 22;
    const cellA = row.getCell(1);
    cellA.value = metaFields[i][0];
    cellA.font = { bold: true, size: 11, color: { argb: argb(BRAND.navy) } };
    cellA.alignment = { vertical: "middle" };
    const cellB = row.getCell(2);
    cellB.value = metaFields[i][1];
    cellB.font = { size: 11, color: { argb: argb(BRAND.black) } };
    cellB.alignment = { vertical: "middle" };
    if (metaFields[i][2]) {
      cellB.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(BRAND.responseYellow) } };
      cellB.protection = { locked: false };
    }
  }

  ws.getRow(7).height = 8;
  ws.getRow(8).height = 8;

  ws.mergeCells("A9:B12");
  const instrCell = ws.getRow(9).getCell(1);
  instrCell.value =
    "Please fill in what you know in the highlighted 'Your Response' column on each tab.\nLeave anything you're unsure about blank \u2014 assumptions will be made explicit.\nReturn this file to your XenTegra consultant when complete.";
  instrCell.font = { italic: true, size: 10, color: { argb: argb(BRAND.gray) } };
  instrCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(BRAND.instructionBg) } };
  instrCell.alignment = { wrapText: true, vertical: "top" };
  instrCell.border = { left: { style: "medium", color: { argb: argb(BRAND.lightBlue) } } };
  for (let r = 9; r <= 12; r++) {
    const cellB = ws.getRow(r).getCell(2);
    cellB.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(BRAND.instructionBg) } };
  }

  ws.getRow(13).height = 8;

  const guideRow = ws.getRow(14);
  guideRow.getCell(1).value = "QUICK GUIDE";
  guideRow.getCell(1).font = { bold: true, size: 10, color: { argb: argb(BRAND.navy) } };

  const guideItems: [string, string][] = [
    ["Yellow cells", "These are where you enter your responses"],
    ["Dropdowns", "Click a yellow cell to see a dropdown list of options"],
    ["Other", "If your vendor/product isn't listed, select 'Other'"],
    ["Numbers", "Enter whole numbers only (no commas or currency symbols)"],
    ["Multiple vendors?", "Each section has Entry 1, 2, and 3 \u2014 fill one per vendor"],
    ["License Type / SKU", 'Enter the license tier or entitlement (e.g., "M365 E3", "Citrix Platform License (CPL)")'],
    ["Notes", "Use the Notes field in each entry for questions, clarifications, or context"],
    ["Skip anything", "Leave blank if you're unsure \u2014 we'll discuss it together"],
  ];
  for (let i = 0; i < guideItems.length; i++) {
    const r = 15 + i;
    const row = ws.getRow(r);
    row.height = 22;
    const cellA = row.getCell(1);
    cellA.value = guideItems[i][0];
    cellA.font = { bold: true, size: 10, color: { argb: argb(BRAND.navy) } };
    cellA.alignment = { vertical: "middle" };
    const cellB = row.getCell(2);
    cellB.value = guideItems[i][1];
    cellB.font = { size: 10, color: { argb: argb(BRAND.gray) } };
    cellB.alignment = { vertical: "middle", wrapText: true };
  }

  for (let c = 1; c <= 2; c++) {
    for (let r = 1; r <= 22; r++) {
      const cell = ws.getRow(r).getCell(c);
      if (!cell.protection) cell.protection = { locked: true };
    }
  }

  applyPrintSetup(ws);
  applySheetProtection(ws);
}

function buildEnvironmentSheet(wb: ExcelJS.Workbook) {
  const ws = wb.addWorksheet("Environment Facts", {
    properties: { tabColor: { argb: argb(BRAND.lightBlue) } },
  });
  setStandardWidths(ws);
  applyHeaderRow(ws);

  const fields: [string, string, string][] = [
    ["Total Users", "How many total end users are in your environment?", "Number"],
    ["Laptops", "Total laptop count across your organization", "Number"],
    ["Desktops", "Total desktop / workstation count", "Number"],
    ["Thin Clients", "Total thin client / zero client count", "Number"],
  ];

  for (let i = 0; i < fields.length; i++) {
    const rowNum = i + 2;
    addDataRow(ws, rowNum, i, fields[i][0], fields[i][1], fields[i][2]);
  }

  applyPrintSetup(ws);
  applySheetProtection(ws);
}

function getSubPillarNumber(pillarDef: PillarDef, sp: PillarDef["sub_pillars"][0]): string {
  const pillarIdx = typedVendors.indexOf(pillarDef);
  const spIdx = pillarDef.sub_pillars.indexOf(sp);
  return `${pillarIdx + 1}.${spIdx + 1}`;
}

function buildEucPillarsSheet(wb: ExcelJS.Workbook) {
  const ws = wb.addWorksheet("EUC Pillars", {
    properties: { tabColor: { argb: argb(BRAND.lightBlue) } },
  });
  setStandardWidths(ws);
  applyHeaderRow(ws);

  let rowNum = 2;
  let dataIdx = 0;

  for (const pillar of typedVendors) {
    for (const sp of pillar.sub_pillars) {
      const spNum = getSubPillarNumber(pillar, sp);
      const sectionTitle = `Pillar ${typedVendors.indexOf(pillar) + 1}: ${pillar.pillar} \u2014 ${spNum} ${sp.name}`;
      addSectionHeader(ws, rowNum, sectionTitle);
      rowNum++;

      const vendorNames = sp.vendors.map((v) => v.name);
      vendorNames.push("Other");

      const hasPlatform = PLATFORM_SUBPILLARS.has(sp.name);
      const hasVersion = VERSION_SUBPILLARS.includes(sp.name);
      const hasUserCount = USER_COUNT_SUBPILLARS.includes(sp.name);
      const hasLicense = !LICENSE_EXCLUDED.has(sp.name);

      const platformNames: string[] = [];
      if (hasPlatform) {
        for (const v of sp.vendors) {
          for (const p of v.platforms) {
            platformNames.push(`${v.name} \u2014 ${p.name}`);
          }
        }
        platformNames.push("Other");
      }

      const versionNames: string[] = [];
      if (hasVersion) {
        for (const v of sp.vendors) {
          for (const p of v.platforms) {
            if (p.versions) {
              for (const ver of p.versions) {
                versionNames.push(`${v.name} \u2014 ${p.name} \u2014 ${ver.name}`);
              }
            }
          }
        }
        if (versionNames.length > 0) versionNames.push("Other");
      }

      for (let slot = 1; slot <= NUM_SLOTS; slot++) {
        addSlotHeader(ws, rowNum, slot);
        rowNum++;

        addDataRow(ws, rowNum, dataIdx++, `Vendor ${slot}`, "Primary vendor", vendorNames.join(", "), vendorNames);
        rowNum++;

        if (hasPlatform) {
          addDataRow(ws, rowNum, dataIdx++, `Platform ${slot}`, "Specific product or platform", platformNames.join(", "), platformNames);
          rowNum++;
        }

        if (hasVersion && versionNames.length > 0) {
          addDataRow(ws, rowNum, dataIdx++, `Version ${slot}`, "Currently deployed version", versionNames.join(", "), versionNames);
          rowNum++;
        }

        if (hasUserCount) {
          const ucLabel = sp.name.toLowerCase().includes("daas") ? "How many DaaS users on this platform?" : "How many VDI users on this platform?";
          addDataRow(ws, rowNum, dataIdx++, `User Count ${slot}`, ucLabel, "Whole number");
          rowNum++;
        }

        if (hasLicense) {
          addDataRow(ws, rowNum, dataIdx++, `License Count ${slot}`, "Total number of licenses held", "Whole number");
          rowNum++;
          addDataRow(
            ws,
            rowNum,
            dataIdx++,
            `License Type / SKU ${slot}`,
            'License tier, entitlement, or SKU \u2014 e.g., "Citrix Platform License (CPL)" or "M365 E3"',
            "Text",
          );
          rowNum++;
        }

        addDataRow(ws, rowNum, dataIdx++, `Notes ${slot}`, "Clarifications, questions, or anything else about this entry", "Free text");
        rowNum++;
      }
    }
  }

  applyPrintSetup(ws);
  applySheetProtection(ws);
}

function buildManagedServicesSheet(wb: ExcelJS.Workbook) {
  const ws = wb.addWorksheet("Managed Services", {
    properties: { tabColor: { argb: argb(BRAND.lightBlue) } },
  });
  setStandardWidths(ws);
  applyHeaderRow(ws);

  const mspOptions = ["XenTegra", "Other", "XenTegra + Other"];
  const tierOptions = ["Yes \u2014 Fully Outsourced", "Yes \u2014 Partially Outsourced", "No \u2014 In-House"];

  const fields: [string, string, string, string[]?][] = [
    ["MSP Provider", "Do you use a Managed Services Provider? Select all that apply.", mspOptions.join(", "), mspOptions],
    ["MSP Provider Name (Other)", "If Other, who is your MSP provider? Separate names with commas.", "Text"],
    ["Tier 1 Support / Helpdesk", "Do you outsource first-line / helpdesk support?", tierOptions.join(", "), tierOptions],
    ["Tier 1 FTEs", "How many Tier 1 / Helpdesk support staff (full-time equivalents)?", "Number"],
    ["Tier 2/3 Support", "Do you outsource escalation / engineering support?", tierOptions.join(", "), tierOptions],
    ["Additional Notes", "Anything else about your managed services arrangements?", "Free text"],
  ];

  for (let i = 0; i < fields.length; i++) {
    const rowNum = i + 2;
    addDataRow(ws, rowNum, i, fields[i][0], fields[i][1], fields[i][2], fields[i][3]);
  }

  applyPrintSetup(ws);
  applySheetProtection(ws);
}

export async function exportIntakeForm(clientName: string, projectName: string) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "XenTegra TCO Tool";
  wb.created = new Date();

  buildCoverSheet(wb, clientName, projectName);
  buildEnvironmentSheet(wb);
  buildEucPillarsSheet(wb);
  buildManagedServicesSheet(wb);

  const slug = clientName.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_") || "Client";
  const projSlug = projectName.trim() ? "_" + projectName.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_") : "";
  const filename = `TCO_Intake_Form_${slug}${projSlug}.xlsx`;

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
  return /yes/i.test(String(raw));
}

function findSheet(wb: XLSX.WorkBook, ...names: string[]): XLSX.WorkSheet | null {
  for (const name of names) {
    if (wb.Sheets[name]) return wb.Sheets[name];
  }
  const lowerNames = names.map((n) => n.toLowerCase());
  for (const sn of wb.SheetNames) {
    if (lowerNames.includes(sn.toLowerCase())) return wb.Sheets[sn];
  }
  for (const sn of wb.SheetNames) {
    const snl = sn.toLowerCase();
    for (const name of lowerNames) {
      if (snl.includes(name) || name.includes(snl)) return wb.Sheets[sn];
    }
  }
  return null;
}

function matchEnvField(label: string): string | null {
  const l = label.toLowerCase().trim();
  if (l === "total users") return "userCount";
  if (l === "laptops") return "laptopCount";
  if (l === "desktops") return "desktopCount";
  if (l === "thin clients") return "thinClientCount";
  if (/total\s*users|end\s*users|how\s+many.*users.*environment/.test(l)) return "userCount";
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

const EUC_SECTION_PATTERN = /^(\d+\.\d+)\s+(.+)/;

const EUC_SECTION_RULES: [RegExp, string][] = [
  [/workspace\s*ai/i, "Workspace AI"],
  [/daas|cloud\s*pc|hosted\s*desktop/i, "DaaS (Cloud PC / Hosted Desktop)"],
  [/vdi|on.prem/i, "VDI (On-Premises)"],
  [/unified\s*endpoint\s*management|\buem\b/i, "Unified Endpoint Mgmt (UEM)"],
  [/digital\s*employee\s*experience|\bdex\b/i, "Digital Employee Experience (DEX)"],
  [/endpoint\s*security/i, "Endpoint Security"],
  [/identity.*access|access.*management|\biam\b/i, "Identity & Access Mgmt (IAM)"],
  [/secure\s*access\s*service\s*edge|\bsase\b/i, "Secure Access Service Edge (SASE)"],
  [/secure.*browser|enterprise\s*browser/i, "Secure Enterprise Browser"],
  [/endpoint\s*os/i, "Endpoint OS"],
  [/app\s*layering|streaming/i, "App Layering & Streaming"],
  [/app(?:lication)?\s*readiness|app.*packaging/i, "Application Readiness & Packaging"],
  [/apps?\s*config|asset\s*management/i, "Apps Config & Asset Management"],
  [/unified\s*comm|collaboration|communications/i, "Unified Comms & Collab"],
  [/\buc\b|\bucc\b|\buc&c\b/i, "Unified Comms & Collab"],
  [/\bvpn\b/i, "VPN"],
  [/pc.*mobile|mobile.*hardware|\bhardware\b/i, "PC and Mobile Devices"],
];

function resolveSubPillar(sectionText: string): string | null {
  const cleaned = sectionText.replace(EUC_SECTION_PATTERN, "$2").trim();
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

function stripSlotNumber(label: string): { base: string; slot: number } {
  const m = label.match(/^(.+?)\s+(\d)$/);
  if (m && parseInt(m[2]) >= 1 && parseInt(m[2]) <= 3) {
    return { base: m[1].trim(), slot: parseInt(m[2]) };
  }
  return { base: label, slot: 1 };
}

function classifyEucField(label: string): string | null {
  const l = label.toLowerCase().trim();
  if (l === "vendor") return "Vendor";
  if (l === "platform") return "Platform";
  if (l === "version") return "Version";
  if (l === "license count") return "License Count";
  if (l === "license sku") return "License SKU";
  if (l === "license type / sku") return "License SKU";
  if (l === "user count") return "User Count";
  if (l === "annual cost") return "Annual Cost";
  if (l === "notes") return "Notes";
  if (/user\s*count|how\s+many\s+.*users|number\s*of\s*users/.test(l)) return "User Count";
  if (/license\s*count|how\s+many\s+.*licen[sc]es|number\s*of\s*licen[sc]es/.test(l)) return "License Count";
  if (/licen[sc]e\s*type|licen[sc]e\s*sku|\bsku\b|part\s*number|entitlement/.test(l)) return "License SKU";
  if (/vendor|provider|which.*(?:vendor|company|manufacturer)|who\s/.test(l) && !/platform|product|version|licen|cost|sku|user/.test(l)) return "Vendor";
  if (/product|platform|device\s*type|what.*(?:device|product|platform|type)/.test(l) && !/vendor|version|licen|cost|sku/.test(l)) return "Platform";
  if (/version|release/.test(l) && !/vendor|platform|licen|cost|sku/.test(l)) return "Version";
  if (/annual\s*cost|cost|spend|price/.test(l) && !/licen|sku/.test(l)) return "Annual Cost";
  if (/\bnotes?\b|clarification|comment/.test(l)) return "Notes";
  return null;
}

function classifyMspField(label: string): string | null {
  const l = label.toLowerCase().trim();
  const exactMap: Record<string, string> = {
    "msp provider": "mspProviderType",
    "msp provider name (other)": "mspProviderName",
    "tier 1 support / helpdesk": "tier1Outsourced",
    "tier 1 ftes": "tier1Ftes",
    "tier 2/3 support": "tier23Outsourced",
    "additional notes": "notes",
    "total msp / managed services spend": "totalAnnualSpend",
    "msp provider: xentegra": "mspXentegra",
    "msp provider: other": "mspOther",
    "other msp provider names": "mspOtherProviders",
    "outsourced: endpoint management": "outsourcedEndpointMgmt",
    "outsourced: security / edr / soc": "outsourcedSecurity",
    "outsourced: patching & updates": "outsourcedPatching",
    "outsourced: helpdesk / tier 1 support": "outsourcedHelpdesk",
    "outsourced: tier 1 support / helpdesk": "outsourcedHelpdesk",
    "outsourced: tier 2+ support / engineering": "outsourcedTier2Plus",
    "outsourced: other": "outsourcedOther",
    "other outsourced description": "otherDescription",
  };
  if (exactMap[l]) return exactMap[l];
  if (/tier\s*1.*fte|support\s*staff|how\s+many.*tier\s*1/i.test(l)) return "tier1Ftes";
  if (/tier\s*1|helpdesk/i.test(l)) return "tier1Outsourced";
  if (/tier\s*[23]|tier\s*2\/3|escalation/i.test(l)) return "tier23Outsourced";
  if (/if\s*other.*provider|who.*msp|msp.*name/i.test(l)) return "mspProviderName";
  if (/msp|managed\s*services?\s*provider/i.test(l)) return "mspProviderType";
  if (/total.*msp|managed\s*services?\s*spend/i.test(l)) return "totalAnnualSpend";
  if (/additional|notes|details/i.test(l)) return "notes";
  if (/outsourc.*endpoint/i.test(l)) return "outsourcedEndpointMgmt";
  if (/outsourc.*security|outsourc.*edr/i.test(l)) return "outsourcedSecurity";
  if (/outsourc.*patch/i.test(l)) return "outsourcedPatching";
  if (/outsourc.*helpdesk|outsourc.*tier\s*1/i.test(l)) return "outsourcedHelpdesk";
  if (/outsourc.*tier\s*2/i.test(l)) return "outsourcedTier2Plus";
  if (/outsourc.*other/i.test(l)) return "outsourcedOther";
  return null;
}

function processMspField(
  fieldKey: string,
  response: unknown,
  label: string,
  managedServices: Record<string, unknown>,
  mapped: MappedField[],
  errors: MappedField[],
) {
  const val = String(response);
  switch (fieldKey) {
    case "mspProviderType": {
      if (/xentegra/i.test(val)) managedServices.mspXentegra = true;
      if (/other/i.test(val)) managedServices.mspOther = true;
      managedServices.mspProviderType = val;
      mapped.push({ field: label, value: val, target: "managedServices.mspProviderType", status: "mapped" });
      break;
    }
    case "mspProviderName": {
      const providers = val.split(",").map((s) => s.trim()).filter(Boolean);
      managedServices.mspOther = true;
      managedServices.mspOtherProviders = providers;
      mapped.push({ field: label, value: val, target: "managedServices.mspOtherProviders", status: "mapped" });
      break;
    }
    case "tier1Outsourced": {
      managedServices.outsourcedHelpdesk = /yes/i.test(val);
      managedServices.tier1Outsourced = val;
      mapped.push({ field: label, value: val, target: "managedServices.tier1Outsourced", status: "mapped" });
      break;
    }
    case "tier1Ftes": {
      const num = parseNumeric(response);
      if (num === null) {
        errors.push({ field: label, value: val, target: "managedServices.tier1Ftes", status: "error", errorMsg: "Expected a number" });
      } else {
        managedServices.tier1StaffCount = num;
        mapped.push({ field: label, value: num, target: "managedServices.tier1Ftes", status: "mapped" });
      }
      break;
    }
    case "tier23Outsourced": {
      managedServices.outsourcedTier2Plus = /yes/i.test(val);
      managedServices.tier23Outsourced = val;
      mapped.push({ field: label, value: val, target: "managedServices.tier23Outsourced", status: "mapped" });
      break;
    }
    case "notes": {
      managedServices.otherDescription = val;
      mapped.push({ field: label, value: val, target: "managedServices.notes", status: "mapped" });
      break;
    }
    case "totalAnnualSpend": {
      const num = parseNumeric(response);
      if (num === null) {
        errors.push({ field: label, value: val, target: "managedServices.totalAnnualSpend", status: "error", errorMsg: "Expected a number" });
      } else {
        managedServices.totalAnnualSpend = num;
        mapped.push({ field: label, value: num, target: "managedServices.totalAnnualSpend", status: "mapped" });
      }
      break;
    }
    case "mspXentegra": {
      managedServices.mspXentegra = parseBool(response);
      mapped.push({ field: label, value: val, target: "managedServices.mspXentegra", status: "mapped" });
      break;
    }
    case "mspOther": {
      managedServices.mspOther = parseBool(response);
      mapped.push({ field: label, value: val, target: "managedServices.mspOther", status: "mapped" });
      break;
    }
    case "mspOtherProviders": {
      const providers = val.split(",").map((s) => s.trim()).filter(Boolean);
      managedServices.mspOtherProviders = providers;
      mapped.push({ field: label, value: val, target: "managedServices.mspOtherProviders", status: "mapped" });
      break;
    }
    case "outsourcedEndpointMgmt":
    case "outsourcedSecurity":
    case "outsourcedPatching":
    case "outsourcedHelpdesk":
    case "outsourcedTier2Plus":
    case "outsourcedOther": {
      managedServices[fieldKey] = parseBool(response);
      mapped.push({ field: label, value: val, target: `managedServices.${fieldKey}`, status: "mapped" });
      break;
    }
    case "otherDescription": {
      managedServices.otherDescription = val;
      mapped.push({ field: label, value: val, target: "managedServices.otherDescription", status: "mapped" });
      break;
    }
  }
}

function processEucField(
  fieldType: string,
  response: unknown,
  label: string,
  currentSpName: string,
  entry: Record<string, unknown>,
  vdiUserCounts: Record<string, number>,
  mapped: MappedField[],
  errors: MappedField[],
) {
  const val = String(response).trim();
  switch (fieldType) {
    case "Vendor":
      entry.vendor = val;
      mapped.push({ field: label, value: val, target: `euc.${currentSpName}.vendor`, status: "mapped" });
      break;
    case "Platform": {
      const parts = val.split(" \u2014 ");
      entry.platform = parts.length > 1 ? parts[parts.length - 1] : val;
      mapped.push({ field: label, value: val, target: `euc.${currentSpName}.platform`, status: "mapped" });
      break;
    }
    case "Version": {
      const parts = val.split(" \u2014 ");
      entry.version = parts[parts.length - 1];
      mapped.push({ field: label, value: val, target: `euc.${currentSpName}.version`, status: "mapped" });
      break;
    }
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
        vdiUserCounts[key] = (vdiUserCounts[key] || 0) + num;
        mapped.push({ field: label, value: num, target: `vdiUserCounts.${key}`, status: "mapped" });
      }
      break;
    }
    case "Notes":
      entry.notes = val;
      mapped.push({ field: label, value: val, target: `euc.${currentSpName}.notes`, status: "mapped" });
      break;
  }
}

function buildHexEntries(rawEntries: Record<string, unknown>[]) {
  return rawEntries.map((e) => ({
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
    isCustomVendor: (e.vendor as string) === "Other" || !!e.customVendor,
  }));
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

function isBlank(val: unknown): boolean {
  return val === null || val === undefined || val === "" || (typeof val === "string" && val.trim() === "");
}

function isSlotSubHeader(label: string): boolean {
  return /^▸\s*Entry\s+\d/.test(label);
}

function isSectionHeader(label: string): boolean {
  return /^Pillar\s+\d+:/i.test(label);
}

function parseXlsxIntake(wb: XLSX.WorkBook): ImportResult {
  const knownTabs = ["Cover", "Cover Sheet", "Environment Facts", "Environment", "EUC Pillars", "Pillars", "Platform Cost Overrides", "Cost Overrides", "Overrides", "Managed Services", "Services"];
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

  const envSheet = findSheet(wb, "Environment Facts", "Environment");
  if (envSheet) {
    const envData = XLSX.utils.sheet_to_json<Record<string, unknown>>(envSheet);
    for (const row of envData) {
      const label = getFirstColumnLabel(row);
      const response = getResponseColumn(row);
      if (!label) continue;
      const target = matchEnvField(label);
      if (!target) {
        if (!isBlank(response)) {
          unmapped.push({ field: label, value: String(response), target: "", status: "unmapped" });
        }
        continue;
      }
      if (isBlank(response)) {
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

  const overrideSheet = findSheet(wb, "Platform Cost Overrides", "Cost Overrides", "Overrides");
  if (overrideSheet) {
    const overrideData = XLSX.utils.sheet_to_json<Record<string, unknown>>(overrideSheet);
    const categoryRollups: Record<string, number> = {};
    for (const row of overrideData) {
      const label = getFirstColumnLabel(row);
      const response = getResponseColumn(row);
      if (!label) continue;
      const target = matchOverrideField(label);
      if (!target) {
        if (!isBlank(response)) {
          unmapped.push({ field: label, value: String(response), target: "", status: "unmapped" });
        }
        continue;
      }
      if (isBlank(response)) {
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

  const mspSheet = findSheet(wb, "Managed Services", "Services");
  if (mspSheet) {
    const mspData = XLSX.utils.sheet_to_json<Record<string, unknown>>(mspSheet);
    const managedServices: Record<string, unknown> = {};
    for (const row of mspData) {
      const label = getFirstColumnLabel(row);
      const response = getResponseColumn(row);
      if (!label) continue;
      if (isBlank(response)) {
        const mspKey = classifyMspField(label);
        if (mspKey) blankCount++;
        continue;
      }
      const mspKey = classifyMspField(label);
      if (mspKey) {
        processMspField(mspKey, response, label, managedServices, mapped, errors);
      } else {
        unmapped.push({ field: label, value: String(response), target: "", status: "unmapped" });
      }
    }
    if (Object.keys(managedServices).length > 0) inputs.managedServices = managedServices;
  }

  const eucSheet = findSheet(wb, "EUC Pillars", "Pillars");
  if (eucSheet) {
    const eucData = XLSX.utils.sheet_to_json<Record<string, unknown>>(eucSheet);
    const hexEntries: Record<string, unknown>[] = [];
    let currentSpName = "";
    let currentPillarName = "";
    const slotEntries: Map<number, Record<string, unknown>> = new Map();
    const vdiUserCounts: Record<string, number> = {};

    function flushSlots() {
      for (const [, entry] of slotEntries) {
        if (entry.vendor) {
          hexEntries.push({ ...entry });
        }
      }
      slotEntries.clear();
    }

    for (const row of eucData) {
      const label = getFirstColumnLabel(row);
      const response = getResponseColumn(row);
      if (!label) continue;
      if (label.startsWith("---")) continue;
      if (isSlotSubHeader(label)) continue;

      if (isSectionHeader(label)) {
        flushSlots();
        const spMatch = label.match(/\u2014\s*(\d+\.\d+)\s+(.+)/);
        if (spMatch) {
          const resolved = resolveSubPillar(spMatch[2]);
          currentSpName = resolved || spMatch[2].trim();
        } else {
          const resolved = resolveSubPillar(label);
          if (resolved) currentSpName = resolved;
        }
        const pillarDef = typedVendors.find((p) => p.sub_pillars.some((s) => s.name === currentSpName));
        if (pillarDef) currentPillarName = pillarDef.pillar;
        continue;
      }

      const oldFormatMatch = label.match(/^(.+?)\s*\u2014\s*(Vendor|Platform|Version|Annual Cost|License Count|License SKU|User Count|Other Vendor Name|Other Platform Name|Other Version|Notes)$/);
      if (oldFormatMatch) {
        const sp = oldFormatMatch[1];
        const fieldType = oldFormatMatch[2];

        if (sp !== currentSpName) {
          flushSlots();
          currentSpName = sp;
          const pillarDef = typedVendors.find((p) => p.sub_pillars.some((s) => s.name === sp));
          if (pillarDef) currentPillarName = pillarDef.pillar;
        }

        if (!slotEntries.has(1)) {
          slotEntries.set(1, { subPillar: currentSpName, pillar: currentPillarName });
        }
        const entry = slotEntries.get(1)!;

        if (isBlank(response)) {
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
          case "Other Platform Name":
            entry.platform = val;
            mapped.push({ field: label, value: val, target: `euc.${sp}.customPlatform`, status: "mapped" });
            break;
          case "Other Version":
            entry.version = val;
            mapped.push({ field: label, value: val, target: `euc.${sp}.customVersion`, status: "mapped" });
            break;
          default:
            processEucField(fieldType, response, label, sp, entry, vdiUserCounts, mapped, errors);
            break;
        }
        continue;
      }

      const { base, slot } = stripSlotNumber(label);
      const fieldType = classifyEucField(base);

      if (fieldType && currentSpName) {
        if (!slotEntries.has(slot)) {
          slotEntries.set(slot, { subPillar: currentSpName, pillar: currentPillarName });
        }
        const entry = slotEntries.get(slot)!;

        if (isBlank(response)) {
          blankCount++;
          continue;
        }

        processEucField(fieldType, response, label, currentSpName, entry, vdiUserCounts, mapped, errors);
        continue;
      }

      const sectionMatch = label.match(EUC_SECTION_PATTERN);
      if (sectionMatch) {
        flushSlots();
        const resolved = resolveSubPillar(label);
        currentSpName = resolved || sectionMatch[2].trim();
        const pillarDef = typedVendors.find((p) => p.sub_pillars.some((s) => s.name === currentSpName));
        if (pillarDef) currentPillarName = pillarDef.pillar;
        continue;
      }

      if (!currentSpName) continue;

      if (isBlank(response)) {
        const ft = classifyEucField(label);
        if (ft) blankCount++;
        continue;
      }

      if (!fieldType) {
        unmapped.push({ field: label, value: String(response), target: "", status: "unmapped" });
      }
    }

    flushSlots();

    if (hexEntries.length > 0) inputs.hexagridEntries = buildHexEntries(hexEntries);
    if (Object.keys(vdiUserCounts).length > 0) inputs.vdiUserCounts = vdiUserCounts;
  }

  return { clientName, projectName, mapped, unmapped, errors, blankCount, inputs };
}

function parseCsvIntake(file: ArrayBuffer): ImportResult {
  const decoder = new TextDecoder("utf-8");
  let text = decoder.decode(new Uint8Array(file));
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

  const wb = XLSX.read(text, { type: "string" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: false }) as unknown[][];

  if (rows.length < 2) throw new Error("CSV file must have at least a header row and one data row.");

  const headers = (rows[0] as unknown[]).map((h) => String(h || ""));
  const dataRow = rows[1] as unknown[];

  let clientName = "";
  let projectName = "";
  const mapped: MappedField[] = [];
  const unmapped: MappedField[] = [];
  const errors: MappedField[] = [];
  let blankCount = 0;
  const inputs: Record<string, unknown> = {};
  const managedServices: Record<string, unknown> = {};
  const hexEntries: Record<string, unknown>[] = [];
  const vdiUserCounts: Record<string, number> = {};

  const eucColumns: { section: string; field: string; colIdx: number; fullHeader: string }[] = [];

  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].trim();
    if (!h) continue;
    const hl = h.toLowerCase();

    if (hl === "timestamp" || hl === "date") continue;
    if (hl === "client name" || hl === "client") {
      clientName = String(dataRow[i] || "");
      continue;
    }
    if (hl === "project name" || hl === "project") {
      projectName = String(dataRow[i] || "");
      continue;
    }

    const bracketMatch = h.match(/^\[(.+?)\]\s*(.+)/);
    if (bracketMatch) {
      eucColumns.push({ section: bracketMatch[1], field: bracketMatch[2], colIdx: i, fullHeader: h });
      continue;
    }

    const response = dataRow[i];

    const envTarget = matchEnvField(h);
    if (envTarget) {
      if (isBlank(response)) {
        blankCount++;
      } else {
        const num = parseNumeric(response);
        if (num === null) {
          errors.push({ field: h, value: String(response), target: envTarget, status: "error", errorMsg: "Expected a number" });
        } else {
          inputs[envTarget] = num;
          mapped.push({ field: h, value: num, target: envTarget, status: "mapped" });
        }
      }
      continue;
    }

    const mspKey = classifyMspField(h);
    if (mspKey) {
      if (isBlank(response)) {
        blankCount++;
      } else {
        processMspField(mspKey, response, h, managedServices, mapped, errors);
      }
      continue;
    }

    if (!isBlank(response)) {
      unmapped.push({ field: h, value: String(response), target: "", status: "unmapped" });
    }
  }

  const sectionGroups = new Map<string, { section: string; field: string; colIdx: number; fullHeader: string }[]>();
  for (const col of eucColumns) {
    if (!sectionGroups.has(col.section)) sectionGroups.set(col.section, []);
    sectionGroups.get(col.section)!.push(col);
  }

  for (const [sectionText, cols] of Array.from(sectionGroups.entries())) {
    const resolved = resolveSubPillar(sectionText);
    const spName = resolved || sectionText;
    const entry: Record<string, unknown> = { subPillar: spName };
    const pillarDef = typedVendors.find((p) => p.sub_pillars.some((s) => s.name === spName));
    if (pillarDef) entry.pillar = pillarDef.pillar;

    for (const col of cols) {
      const response = dataRow[col.colIdx];
      const { base } = stripSlotNumber(col.field);
      const fieldType = classifyEucField(base);

      if (!fieldType) {
        if (!isBlank(response)) {
          unmapped.push({ field: col.fullHeader, value: String(response), target: "", status: "unmapped" });
        } else {
          blankCount++;
        }
        continue;
      }

      if (isBlank(response)) {
        blankCount++;
        continue;
      }

      processEucField(fieldType, response, col.fullHeader, spName, entry, vdiUserCounts, mapped, errors);
    }

    if (entry.vendor) hexEntries.push(entry);
  }

  if (hexEntries.length > 0) inputs.hexagridEntries = buildHexEntries(hexEntries);
  if (Object.keys(vdiUserCounts).length > 0) inputs.vdiUserCounts = vdiUserCounts;
  if (Object.keys(managedServices).length > 0) inputs.managedServices = managedServices;

  return { clientName, projectName, mapped, unmapped, errors, blankCount, inputs };
}

export function parseIntakeImport(file: ArrayBuffer, filename: string): ImportResult {
  if (filename.toLowerCase().endsWith(".csv")) {
    return parseCsvIntake(file);
  }
  return parseXlsxIntake(XLSX.read(file, { type: "array" }));
}

export function parseIntakeFile(file: ArrayBuffer): ImportResult {
  return parseXlsxIntake(XLSX.read(file, { type: "array" }));
}
