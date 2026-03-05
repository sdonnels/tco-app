import * as XLSX from "xlsx-js-style";
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
};

const THIN_BORDER = { style: "thin", color: { rgb: BRAND.gridBorder } } as const;
const ALL_THIN_BORDERS = { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER };
const BLUE_SIDE_BORDER = { style: "thin", color: { rgb: BRAND.lightBlue } } as const;

function setColWidths(ws: XLSX.WorkSheet, widths: number[]) {
  ws["!cols"] = widths.map((w) => ({ wch: w }));
}

function setRowHeight(ws: XLSX.WorkSheet, row: number, hpt: number) {
  if (!ws["!rows"]) ws["!rows"] = [];
  ws["!rows"][row] = { hpt };
}

function setCell(ws: XLSX.WorkSheet, ref: string, value: string | number | null, style: Record<string, unknown>) {
  const cell: Record<string, unknown> = { v: value ?? "", t: typeof value === "number" ? "n" : "s", s: style };
  ws[ref] = cell;
}

function getRange(ws: XLSX.WorkSheet): { s: { r: number; c: number }; e: { r: number; c: number } } {
  const ref = ws["!ref"];
  if (!ref) return { s: { r: 0, c: 0 }, e: { r: 0, c: 0 } };
  return XLSX.utils.decode_range(ref);
}

function colLetter(c: number): string {
  return XLSX.utils.encode_col(c);
}

type ValidationEntry = {
  row: number;
  options: string[];
};

function addRow(
  data: (string | number | null)[][],
  label: string,
  description: string,
  validOptions?: string,
  response: string | number | null = null,
) {
  data.push([label, description, response, validOptions ?? ""]);
}

function collectDropdownOptions(validOptions: string): string[] | null {
  if (!validOptions) return null;
  if (/^numeric|^text$/i.test(validOptions.trim())) return null;
  if (/^numeric\s*\(/i.test(validOptions.trim())) return null;
  const opts = validOptions.split("\n").map((s) => s.trim()).filter(Boolean);
  if (opts.length < 2 || opts.length > 250) return null;
  return opts;
}

function addRowWithValidation(
  data: (string | number | null)[][],
  validations: ValidationEntry[],
  label: string,
  description: string,
  validOptions?: string,
  response: string | number | null = null,
) {
  const rowIdx = data.length;
  data.push([label, description, response, validOptions ?? ""]);
  if (validOptions) {
    const opts = collectDropdownOptions(validOptions);
    if (opts) {
      validations.push({ row: rowIdx, options: opts });
    }
  }
}

function buildCoverSheet(clientName: string, projectName: string): XLSX.WorkSheet {
  const rows: (string | null)[][] = [
    ["TCO Assessment \u2014 Intake Form", null],
    [null, null],
    [null, null],
    ["Client Name", clientName],
    ["Project Name", projectName || "(not specified)"],
    ["Date", new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })],
    ["Prepared By", "XenTegra"],
    [null, null],
    [null, null],
    [
      "Please fill in what you know in the highlighted 'Your Response' column on each tab.\nLeave anything you're unsure about blank \u2014 assumptions will be made explicit.\nReturn this file to your consultant when complete.",
      null,
    ],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  setColWidths(ws, [25, 50]);

  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    { s: { r: 9, c: 0 }, e: { r: 9, c: 1 } },
  ];

  setCell(ws, "A1", rows[0][0], {
    font: { bold: true, sz: 18, color: { rgb: BRAND.white } },
    fill: { fgColor: { rgb: BRAND.navy } },
    alignment: { vertical: "center", horizontal: "center" },
  });
  setCell(ws, "B1", null, {
    fill: { fgColor: { rgb: BRAND.navy } },
  });
  setRowHeight(ws, 0, 40);

  for (let r = 3; r <= 6; r++) {
    const rowData = rows[r];
    setCell(ws, `A${r + 1}`, rowData[0], {
      font: { bold: true, sz: 11, color: { rgb: BRAND.navy } },
      alignment: { vertical: "center" },
    });
    setCell(ws, `B${r + 1}`, rowData[1], {
      font: { sz: 11, color: { rgb: BRAND.black } },
      alignment: { vertical: "center" },
    });
  }

  setCell(ws, "A10", rows[9][0], {
    font: { italic: true, sz: 10, color: { rgb: BRAND.gray } },
    fill: { fgColor: { rgb: BRAND.instructionBg } },
    alignment: { wrapText: true, vertical: "top" },
    border: { left: { style: "medium", color: { rgb: BRAND.lightBlue } } },
  });
  setCell(ws, "B10", null, {
    fill: { fgColor: { rgb: BRAND.instructionBg } },
    border: {},
  });
  setRowHeight(ws, 9, 60);

  return ws;
}

function applyColumnHeaderStyle(ws: XLSX.WorkSheet) {
  const headers = ["A1", "B1", "C1", "D1"];
  const headerStyle = {
    font: { bold: true, sz: 10, color: { rgb: BRAND.white } },
    fill: { fgColor: { rgb: BRAND.lightBlue } },
    alignment: { horizontal: "center" as const, vertical: "center" as const, wrapText: true },
    border: {
      ...ALL_THIN_BORDERS,
      bottom: { style: "medium" as const, color: { rgb: BRAND.navy } },
    },
  };
  for (const ref of headers) {
    const cell = ws[ref];
    if (cell) cell.s = headerStyle;
  }
  setRowHeight(ws, 0, 28);
}

type RowType = "data" | "section-header" | "spacer";

function applySectionDataStyles(ws: XLSX.WorkSheet, rowTypes: RowType[]) {
  const range = getRange(ws);
  let dataRowIndex = 0;

  for (let r = 1; r <= range.e.r; r++) {
    const rt = rowTypes[r - 1] || "data";

    if (rt === "section-header") {
      for (let c = 0; c <= range.e.c; c++) {
        const ref = `${colLetter(c)}${r + 1}`;
        const cell = ws[ref];
        const style = {
          font: { bold: true, sz: 11, color: { rgb: BRAND.white } },
          fill: { fgColor: { rgb: BRAND.navy } },
          alignment: { vertical: "center" as const },
        };
        if (cell) {
          cell.s = style;
        } else {
          ws[ref] = { v: "", t: "s", s: style };
        }
      }
      ws["!merges"] = ws["!merges"] || [];
      ws["!merges"].push({ s: { r, c: 0 }, e: { r, c: range.e.c } });
      setRowHeight(ws, r, 26);
      continue;
    }

    if (rt === "spacer") {
      continue;
    }

    const isOdd = dataRowIndex % 2 === 1;
    const rowBg = isOdd ? BRAND.altRowGray : BRAND.white;
    dataRowIndex++;

    for (let c = 0; c <= range.e.c; c++) {
      const ref = `${colLetter(c)}${r + 1}`;
      const cell = ws[ref];
      let style: Record<string, unknown> = { border: ALL_THIN_BORDERS };

      if (c === 0) {
        style = {
          ...style,
          font: { bold: true, sz: 10, color: { rgb: BRAND.black } },
          fill: { fgColor: { rgb: rowBg } },
        };
      } else if (c === 1) {
        style = {
          ...style,
          font: { italic: true, sz: 9, color: { rgb: BRAND.gray } },
          fill: { fgColor: { rgb: rowBg } },
          alignment: { wrapText: true },
        };
      } else if (c === 2) {
        style = {
          ...style,
          font: { sz: 10, color: { rgb: BRAND.black } },
          fill: { fgColor: { rgb: BRAND.responseYellow } },
          border: {
            ...ALL_THIN_BORDERS,
            left: BLUE_SIDE_BORDER,
            right: BLUE_SIDE_BORDER,
          },
        };
      } else if (c === 3) {
        style = {
          ...style,
          font: { sz: 9, color: { rgb: BRAND.gray } },
          fill: { fgColor: { rgb: rowBg } },
          alignment: { wrapText: true },
        };
      }

      if (cell) {
        cell.s = style;
      } else {
        ws[ref] = { v: "", t: "s", s: style };
      }
    }
  }
}

function applySheetProtection(ws: XLSX.WorkSheet) {
  const range = getRange(ws);
  for (let r = 0; r <= range.e.r; r++) {
    for (let c = 0; c <= range.e.c; c++) {
      const ref = `${colLetter(c)}${r + 1}`;
      let cell = ws[ref];
      if (!cell) {
        cell = { v: "", t: "s", s: {} };
        ws[ref] = cell;
      }
      if (!cell.s) cell.s = {};
      const style = cell.s as Record<string, unknown>;
      if (c === 2 && r > 0) {
        style.protection = { locked: false };
      } else {
        style.protection = { locked: true };
      }
    }
  }
  (ws as Record<string, unknown>)["!protect"] = {
    password: "",
    objects: true,
    scenarios: true,
    selectLockedCells: true,
    selectUnlockedCells: true,
    sort: true,
    autoFilter: true,
    formatCells: false,
    formatColumns: false,
    formatRows: false,
    insertColumns: false,
    insertRows: false,
    deleteColumns: false,
    deleteRows: false,
  };
}

function applyPrintSetup(ws: XLSX.WorkSheet) {
  (ws as Record<string, unknown>)["!pageSetup"] = {
    orientation: "landscape",
    fitToWidth: 1,
    fitToHeight: 0,
    scale: 100,
    paperSize: 1,
    showGridLines: true,
  };
  ws["!margins"] = {
    left: 0.5,
    right: 0.5,
    top: 0.5,
    bottom: 0.5,
    header: 0.3,
    footer: 0.3,
  };
}

function buildHeaderRow(): [string, string, string, string][] {
  return [["Field Label", "Description", "Your Response", "Valid Options"]];
}

type SheetResult = {
  ws: XLSX.WorkSheet;
  validations: ValidationEntry[];
};

function buildEnvironmentSheet(): SheetResult {
  const data: (string | number | null)[][] = [...buildHeaderRow()];
  const rowTypes: RowType[] = [];
  const validations: ValidationEntry[] = [];
  addRow(data, "Total Users", "Total number of end users in the environment", "Numeric");
  rowTypes.push("data");
  addRow(data, "Laptops", "Number of managed laptops", "Numeric");
  rowTypes.push("data");
  addRow(data, "Desktops", "Number of managed desktops", "Numeric");
  rowTypes.push("data");
  addRow(data, "Thin Clients", "Number of thin client devices", "Numeric");
  rowTypes.push("data");
  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [45, 40, 25, 35]);
  applyColumnHeaderStyle(ws);
  applySectionDataStyles(ws, rowTypes);
  applySheetProtection(ws);
  applyPrintSetup(ws);
  ws["!autofilter"] = { ref: "A1:D1" };
  return { ws, validations };
}

function buildEucPillarsSheet(): SheetResult {
  const data: (string | number | null)[][] = [...buildHeaderRow()];
  const rowTypes: RowType[] = [];
  const validations: ValidationEntry[] = [];

  for (const pillar of typedVendors) {
    data.push([pillar.pillar, pillar.description, null, ""]);
    rowTypes.push("section-header");
    for (const sp of pillar.sub_pillars) {
      const allVendorNames = sp.vendors.map((v) => v.name);
      allVendorNames.push("Other");
      const vendorOptions = allVendorNames.join("\n");

      const allPlatforms: string[] = [];
      for (const v of sp.vendors) {
        for (const p of v.platforms) {
          allPlatforms.push(`${v.name} \u2014 ${p.name}`);
        }
      }
      allPlatforms.push("Other");
      const platformOptions = allPlatforms.join("\n");

      const allVersions: string[] = [];
      for (const v of sp.vendors) {
        for (const p of v.platforms) {
          if (p.versions) {
            for (const ver of p.versions) {
              allVersions.push(`${v.name} \u2014 ${p.name} \u2014 ${ver.name}`);
            }
          }
        }
      }
      if (allVersions.length > 0) allVersions.push("Other");

      addRowWithValidation(data, validations, `${sp.name} \u2014 Vendor`, sp.description, vendorOptions);
      rowTypes.push("data");
      addRow(data, `${sp.name} \u2014 Other Vendor Name`, "If you selected 'Other' above, specify the vendor name", "Text");
      rowTypes.push("data");
      addRowWithValidation(data, validations, `${sp.name} \u2014 Platform`, "Select the product/platform in use", platformOptions);
      rowTypes.push("data");
      addRow(data, `${sp.name} \u2014 Other Platform Name`, "If you selected 'Other' above, specify the platform name", "Text");
      rowTypes.push("data");
      if (allVersions.length > 0) {
        addRowWithValidation(data, validations, `${sp.name} \u2014 Version`, "Select the version in use", allVersions.join("\n"));
        rowTypes.push("data");
        addRow(data, `${sp.name} \u2014 Other Version`, "If you selected 'Other' above, specify the version", "Text");
        rowTypes.push("data");
      }
      addRow(data, `${sp.name} \u2014 Annual Cost`, "Approximate annual cost for this platform", "Numeric (dollars)");
      rowTypes.push("data");
      if (!LICENSE_EXCLUDED.has(sp.name)) {
        addRow(data, `${sp.name} \u2014 License Count`, "Number of licenses for this platform", "Numeric");
        rowTypes.push("data");
        addRow(data, `${sp.name} \u2014 License SKU`, "License SKU or plan name", "Text");
        rowTypes.push("data");
      }
      if (VDI_SUBPILLARS.includes(sp.name)) {
        addRow(data, `${sp.name} \u2014 User Count`, "Number of users on this VDI/DaaS platform", "Numeric");
        rowTypes.push("data");
      }
      addRow(data, "", "", "");
      rowTypes.push("spacer");
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [45, 40, 25, 35]);
  applyColumnHeaderStyle(ws);
  applySectionDataStyles(ws, rowTypes);
  applySheetProtection(ws);
  applyPrintSetup(ws);
  return { ws, validations };
}

function buildOverridesSheet(): SheetResult {
  const data: (string | number | null)[][] = [...buildHeaderRow()];
  const rowTypes: RowType[] = [];
  const validations: ValidationEntry[] = [];
  addRow(data, "End-User Devices (Annual)", "Total annual spend on end-user device hardware refresh", "Numeric (dollars)");
  rowTypes.push("data");
  addRow(data, "Support & Ops (Annual)", "Total annual spend on support and operations", "Numeric (dollars)");
  rowTypes.push("data");
  addRow(data, "Licensing (Annual)", "Total annual spend on collaboration, AI & app licensing", "Numeric (dollars)");
  rowTypes.push("data");
  addRow(data, "Device, OS & User Mgmt + Security (Annual)", "Total annual spend on device management and security", "Numeric (dollars)");
  rowTypes.push("data");
  addRow(data, "Virtual Desktops & Applications (Annual)", "Total annual spend on VDI/DaaS platforms", "Numeric (dollars)");
  rowTypes.push("data");
  addRow(data, "Overhead (Annual)", "Total annual overhead costs", "Numeric (dollars)");
  rowTypes.push("data");
  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [45, 40, 25, 35]);
  applyColumnHeaderStyle(ws);
  applySectionDataStyles(ws, rowTypes);
  applySheetProtection(ws);
  applyPrintSetup(ws);
  return { ws, validations };
}

function buildManagedServicesSheet(): SheetResult {
  const data: (string | number | null)[][] = [...buildHeaderRow()];
  const rowTypes: RowType[] = [];
  const validations: ValidationEntry[] = [];
  addRowWithValidation(data, validations, "Total MSP / Managed Services Spend", "Total annual spend on managed services or MSP providers", "Numeric (dollars)");
  rowTypes.push("data");
  addRow(data, "", "", "");
  rowTypes.push("spacer");
  addRowWithValidation(data, validations, "Outsourced: Endpoint Management", "Is endpoint management (UEM, imaging, lifecycle) outsourced?", "Yes\nNo");
  rowTypes.push("data");
  addRowWithValidation(data, validations, "Outsourced: Security / EDR / SOC", "Is security / EDR / SOC outsourced?", "Yes\nNo");
  rowTypes.push("data");
  addRowWithValidation(data, validations, "Outsourced: Patching & Updates", "Is patching and updates outsourced?", "Yes\nNo");
  rowTypes.push("data");
  addRowWithValidation(data, validations, "Outsourced: Tier 1 Support / Helpdesk", "Is Tier 1 support / helpdesk outsourced?", "Yes\nNo");
  rowTypes.push("data");
  addRowWithValidation(data, validations, "Outsourced: Tier 2+ Support / Engineering", "Is Tier 2+ support / engineering outsourced?", "Yes\nNo");
  rowTypes.push("data");
  addRowWithValidation(data, validations, "Outsourced: Other", "Are any other EUC functions outsourced?", "Yes\nNo");
  rowTypes.push("data");
  addRow(data, "Other Outsourced Description", "If 'Other' is Yes, describe what's outsourced", "Text");
  rowTypes.push("data");
  addRow(data, "", "", "");
  rowTypes.push("spacer");
  addRowWithValidation(data, validations, "MSP Provider: XenTegra", "Is XenTegra a managed services provider?", "Yes\nNo");
  rowTypes.push("data");
  addRowWithValidation(data, validations, "MSP Provider: Other", "Do you use another MSP provider?", "Yes\nNo");
  rowTypes.push("data");
  addRow(data, "Other MSP Provider Names", "If 'Other' is Yes, list provider names separated by commas", "Text");
  rowTypes.push("data");
  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [45, 40, 25, 35]);
  applyColumnHeaderStyle(ws);
  applySectionDataStyles(ws, rowTypes);
  applySheetProtection(ws);
  applyPrintSetup(ws);
  return { ws, validations };
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

type ListColumn = {
  colIndex: number;
  options: string[];
};

function buildListsSheet(allValidations: Map<number, ValidationEntry[]>): { ws: XLSX.WorkSheet; columns: ListColumn[] } {
  const columns: ListColumn[] = [];
  const uniqueLists = new Map<string, string[]>();

  for (const validations of allValidations.values()) {
    for (const v of validations) {
      const key = v.options.join("\x00");
      if (!uniqueLists.has(key)) {
        uniqueLists.set(key, v.options);
      }
    }
  }

  let colIdx = 0;
  for (const [, opts] of uniqueLists) {
    columns.push({ colIndex: colIdx, options: opts });
    colIdx++;
  }

  const maxRows = Math.max(...columns.map((c) => c.options.length), 0);
  const data: (string | null)[][] = [];
  for (let r = 0; r < maxRows; r++) {
    const row: (string | null)[] = [];
    for (const col of columns) {
      row.push(r < col.options.length ? col.options[r] : null);
    }
    data.push(row);
  }

  const ws = data.length > 0 ? XLSX.utils.aoa_to_sheet(data) : XLSX.utils.aoa_to_sheet([[""]]);
  return { ws, columns };
}

function findListColIndex(columns: ListColumn[], options: string[]): number {
  const key = options.join("\x00");
  for (const col of columns) {
    if (col.options.join("\x00") === key) return col.colIndex;
  }
  return -1;
}

function buildDataValidationXml(
  validations: ValidationEntry[],
  listColumns: ListColumn[],
  listsSheetName: string,
): string {
  if (validations.length === 0) return "";
  const items: string[] = [];
  for (const v of validations) {
    const cellRef = `C${v.row + 1}`;
    const inlineFormula = v.options.join(",");

    if (inlineFormula.length <= 250) {
      const formula = `"${v.options.map(escapeXml).join(",")}"`;
      items.push(
        `<dataValidation type="list" allowBlank="1" showInputMessage="1" showDropDown="0" sqref="${cellRef}">` +
          `<formula1>${formula}</formula1>` +
          `</dataValidation>`,
      );
    } else {
      const colIdx = findListColIndex(listColumns, v.options);
      if (colIdx >= 0) {
        const col = listColumns[colIdx];
        const colLtr = XLSX.utils.encode_col(colIdx);
        const formula = `'${escapeXml(listsSheetName)}'!$${colLtr}$1:$${colLtr}$${col.options.length}`;
        items.push(
          `<dataValidation type="list" allowBlank="1" showInputMessage="1" showDropDown="0" sqref="${cellRef}">` +
            `<formula1>${formula}</formula1>` +
            `</dataValidation>`,
        );
      }
    }
  }
  if (items.length === 0) return "";
  return `<dataValidations count="${items.length}">${items.join("")}</dataValidations>`;
}

async function injectDataValidations(
  xlsxBuffer: ArrayBuffer,
  sheetValidations: Map<number, ValidationEntry[]>,
  listColumns: ListColumn[],
  listsSheetName: string,
  listsSheetIdx: number,
): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(xlsxBuffer);

  for (const [sheetIdx, validations] of sheetValidations) {
    if (validations.length === 0) continue;
    const sheetPath = `xl/worksheets/sheet${sheetIdx + 1}.xml`;
    const xml = await zip.file(sheetPath)?.async("string");
    if (!xml) continue;

    const dvXml = buildDataValidationXml(validations, listColumns, listsSheetName);
    if (!dvXml) continue;

    let modified: string;
    if (xml.includes("</worksheet>")) {
      modified = xml.replace("</worksheet>", `${dvXml}</worksheet>`);
    } else {
      modified = xml + dvXml;
    }

    zip.file(sheetPath, modified);
  }

  const listsSheetPath = `xl/worksheets/sheet${listsSheetIdx + 1}.xml`;
  const listsXml = await zip.file(listsSheetPath)?.async("string");
  if (listsXml) {
    const hiddenAttr = listsXml.includes("<sheetViews>")
      ? listsXml
      : listsXml;
    zip.file(listsSheetPath, hiddenAttr);
  }

  const wbXmlPath = "xl/workbook.xml";
  const wbXml = await zip.file(wbXmlPath)?.async("string");
  if (wbXml) {
    const listsSheetTag = `name="${escapeXml(listsSheetName)}"`;
    if (wbXml.includes(listsSheetTag)) {
      const modified = wbXml.replace(
        new RegExp(`(<sheet[^>]*name="${escapeXml(listsSheetName)}")`),
        `$1 state="veryHidden"`,
      );
      zip.file(wbXmlPath, modified);
    }
  }

  return await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export async function exportIntakeForm(clientName: string, projectName: string, sections: IntakeSections = ALL_SECTIONS) {
  const wb = XLSX.utils.book_new();
  const sheetValidations = new Map<number, ValidationEntry[]>();
  let sheetIdx = 0;

  XLSX.utils.book_append_sheet(wb, buildCoverSheet(clientName, projectName), "Cover");
  sheetIdx++;

  if (sections.environmentFacts) {
    const result = buildEnvironmentSheet();
    XLSX.utils.book_append_sheet(wb, result.ws, "Environment Facts");
    sheetValidations.set(sheetIdx, result.validations);
    sheetIdx++;
  }
  if (sections.platformCostOverrides) {
    const result = buildOverridesSheet();
    XLSX.utils.book_append_sheet(wb, result.ws, "Platform Cost Overrides");
    sheetValidations.set(sheetIdx, result.validations);
    sheetIdx++;
  }
  if (sections.eucPillars) {
    const result = buildEucPillarsSheet();
    XLSX.utils.book_append_sheet(wb, result.ws, "EUC Pillars");
    sheetValidations.set(sheetIdx, result.validations);
    sheetIdx++;
  }
  if (sections.managedServices) {
    const result = buildManagedServicesSheet();
    XLSX.utils.book_append_sheet(wb, result.ws, "Managed Services");
    sheetValidations.set(sheetIdx, result.validations);
    sheetIdx++;
  }

  const sheetTabColors: Record<string, string> = {
    Cover: BRAND.navy,
    "Environment Facts": BRAND.lightBlue,
    "EUC Pillars": BRAND.lightBlue,
    "Platform Cost Overrides": BRAND.gray,
    "Managed Services": BRAND.lightBlue,
  };
  for (const name of wb.SheetNames) {
    const color = sheetTabColors[name];
    if (color) {
      const ws = wb.Sheets[name];
      if (ws) (ws as Record<string, unknown>)["!tabColor"] = { rgb: color };
    }
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const slug = clientName.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_") || "Client";
  const filename = `TCO_Intake_${slug}_${dateStr}.xlsx`;

  const hasValidations = Array.from(sheetValidations.values()).some((v) => v.length > 0);

  if (hasValidations) {
    const listsSheetName = "_Lists";
    const { ws: listsWs, columns: listColumns } = buildListsSheet(sheetValidations);
    XLSX.utils.book_append_sheet(wb, listsWs, listsSheetName);
    const listsSheetIdx = wb.SheetNames.indexOf(listsSheetName);

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = await injectDataValidations(buffer, sheetValidations, listColumns, listsSheetName, listsSheetIdx);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } else {
    XLSX.writeFile(wb, filename);
  }
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
  [/unified\s*endpoint\s*management|\buem\b/i, "UEM"],
  [/digital\s*employee\s*experience|\bdex\b/i, "DEX"],
  [/endpoint\s*security/i, "Endpoint Security"],
  [/identity.*access|access.*management|\biam\b/i, "IAM"],
  [/secure\s*access\s*service\s*edge|\bsase\b/i, "SASE"],
  [/secure.*browser|enterprise\s*browser/i, "Secure Enterprise Browser"],
  [/endpoint\s*os/i, "Endpoint OS"],
  [/app\s*layering|streaming/i, "App Layering"],
  [/app(?:lication)?\s*readiness|app.*packaging/i, "App Readiness"],
  [/apps?\s*config|asset\s*management/i, "Apps Config"],
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

function classifyEucField(label: string): string | null {
  const l = label.toLowerCase().trim();
  if (l === "vendor") return "Vendor";
  if (l === "platform") return "Platform";
  if (l === "version") return "Version";
  if (l === "license count") return "License Count";
  if (l === "license sku") return "License SKU";
  if (l === "user count") return "User Count";
  if (l === "annual cost") return "Annual Cost";
  if (/user\s*count|how\s+many\s+.*users|number\s*of\s*users/.test(l)) return "User Count";
  if (/license\s*count|how\s+many\s+.*licen[sc]es|number\s*of\s*licen[sc]es/.test(l)) return "License Count";
  if (/licen[sc]e\s*sku|\bsku\b|part\s*number/.test(l)) return "License SKU";
  if (/vendor|provider|which.*(?:vendor|company|manufacturer)|who\s/.test(l) && !/platform|product|version|licen|cost|sku|user/.test(l)) return "Vendor";
  if (/product|platform|device\s*type|what.*(?:device|product|platform|type)/.test(l) && !/vendor|version|licen|cost|sku/.test(l)) return "Platform";
  if (/version|release/.test(l) && !/vendor|platform|licen|cost|sku/.test(l)) return "Version";
  if (/annual\s*cost|cost|spend|price/.test(l) && !/licen|sku/.test(l)) return "Annual Cost";
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
      const parts = val.split(" — ");
      entry.platform = parts.length > 1 ? parts[parts.length - 1] : val;
      mapped.push({ field: label, value: val, target: `euc.${currentSpName}.platform`, status: "mapped" });
      break;
    }
    case "Version": {
      const parts = val.split(" — ");
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
        vdiUserCounts[key] = num;
        mapped.push({ field: label, value: num, target: `vdiUserCounts.${key}`, status: "mapped" });
      }
      break;
    }
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
    let currentSp = "";
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
          if (currentSp && entry.vendor) hexEntries.push({ ...entry });
          currentSp = sp;
          currentSpName = sp;
          entry = { subPillar: sp };
          const pillarDef = typedVendors.find((p) => p.sub_pillars.some((s) => s.name === sp));
          if (pillarDef) entry.pillar = pillarDef.pillar;
        }

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
          default:
            processEucField(fieldType, response, label, sp, entry, vdiUserCounts, mapped, errors);
            break;
        }
        continue;
      }

      const sectionMatch = label.match(EUC_SECTION_PATTERN);
      if (sectionMatch) {
        if (currentSpName && entry.vendor) hexEntries.push({ ...entry });
        const resolved = resolveSubPillar(label);
        currentSpName = resolved || sectionMatch[2].trim();
        currentSp = currentSpName;
        entry = { subPillar: currentSpName };
        const pillarDef = typedVendors.find((p) => p.sub_pillars.some((s) => s.name === currentSpName));
        if (pillarDef) entry.pillar = pillarDef.pillar;
        continue;
      }

      if (!currentSpName) continue;

      if (isBlank(response)) {
        const ft = classifyEucField(label);
        if (ft) blankCount++;
        continue;
      }

      const fieldType = classifyEucField(label);
      if (!fieldType) {
        unmapped.push({ field: label, value: String(response), target: "", status: "unmapped" });
        continue;
      }

      processEucField(fieldType, response, label, currentSpName, entry, vdiUserCounts, mapped, errors);
    }

    if (currentSpName && entry.vendor) hexEntries.push({ ...entry });

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
      const fieldType = classifyEucField(col.field);

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
