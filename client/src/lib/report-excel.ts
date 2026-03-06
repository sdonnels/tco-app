import ExcelJS from "exceljs";
import type { ReportConfig, ReportData } from "./report-data";
import {
  generateExecutiveSummary,
  generate3YearProjection,
  calculateDataConfidence,
  collectScoringFlags,
  collectVendorLandscape,
  generateKeyFindings,
  generateRecommendedNextSteps,
  getEndpointMixAnnotation,
  getCostBreakdownAnnotation,
  getCategorySource,
  GLOSSARY,
} from "./report-data";

function fmtMoney(v: number): string {
  return v.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function fmtNumber(v: number): string {
  return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function pct(n: number, d: number): number {
  if (d <= 0) return 0;
  return Math.round((n / d) * 100);
}

const NAVY = "1e3a5f";
const LIGHT_BLUE = "00B5E2";
const LIGHT_BG = "f1f5f9";
const WHITE = "ffffff";

function styleHeader(row: ExcelJS.Row, colCount: number) {
  for (let i = 1; i <= colCount; i++) {
    const cell = row.getCell(i);
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    cell.font = { bold: true, color: { argb: WHITE }, size: 10 };
    cell.alignment = { horizontal: "left", vertical: "middle" };
    cell.border = { bottom: { style: "thin", color: { argb: LIGHT_BLUE } } };
  }
  row.height = 22;
}

function styleTotalRow(row: ExcelJS.Row, colCount: number) {
  for (let i = 1; i <= colCount; i++) {
    const cell = row.getCell(i);
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT_BG } };
    cell.font = { bold: true, size: 10 };
  }
}

function addSectionTitle(ws: ExcelJS.Worksheet, title: string, currentRow: number): number {
  const r = ws.getRow(currentRow);
  r.getCell(1).value = title;
  r.getCell(1).font = { bold: true, size: 14, color: { argb: NAVY } };
  r.height = 28;
  return currentRow + 1;
}

export async function generateReportExcel(data: ReportData): Promise<void> {
  const { config, inputs, derived, assumptions, hexagridEntries } = data;
  const wb = new ExcelJS.Workbook();
  wb.creator = "XenTegra TCO Tool";
  wb.created = new Date();

  const coverWs = wb.addWorksheet("Cover Sheet", { properties: { tabColor: { argb: NAVY } } });
  coverWs.columns = [{ width: 40 }, { width: 40 }];
  let row = 2;
  coverWs.getRow(row).getCell(1).value = config.reportTitle.split("—")[0].trim();
  coverWs.getRow(row).getCell(1).font = { bold: true, size: 20, color: { argb: NAVY } };
  row++;
  if (config.reportTitle.includes("—")) {
    coverWs.getRow(row).getCell(1).value = config.reportTitle.split("—").slice(1).join("—").trim();
    coverWs.getRow(row).getCell(1).font = { size: 14, color: { argb: "4a5568" } };
  }
  row += 2;
  const info = [
    ["Client:", config.clientName],
    ["Date:", config.reportDate],
    ["Prepared By:", `${config.preparedBy}, XenTegra`],
  ];
  info.forEach(([label, value]) => {
    coverWs.getRow(row).getCell(1).value = label;
    coverWs.getRow(row).getCell(1).font = { color: { argb: "666666" } };
    coverWs.getRow(row).getCell(2).value = value;
    coverWs.getRow(row).getCell(2).font = { bold: true };
    row++;
  });
  row += 2;
  coverWs.getRow(row).getCell(1).value = `CONFIDENTIAL — Prepared exclusively for ${config.clientName}`;
  coverWs.getRow(row).getCell(1).font = { size: 9, color: { argb: "999999" } };

  if (config.sections.executiveSummary) {
    const ws = wb.addWorksheet("Executive Summary", { properties: { tabColor: { argb: LIGHT_BLUE } } });
    ws.columns = [{ width: 80 }];
    let r = 1;
    r = addSectionTitle(ws, "Executive Summary", r);
    r++;
    const summary = generateExecutiveSummary(data);
    ws.getRow(r).getCell(1).value = summary;
    ws.getRow(r).getCell(1).alignment = { wrapText: true };
    ws.getRow(r).height = 80;
    r += 2;
    ws.getRow(r).getCell(1).value = "This baseline was produced using XenTegra's 7-pillar EUC assessment framework, incorporating direct client data, vendor cost analysis, and industry-benchmarked assumptions.";
    ws.getRow(r).getCell(1).font = { italic: true, size: 10, color: { argb: "4a5568" } };
    ws.getRow(r).getCell(1).alignment = { wrapText: true };
  }

  if (config.sections.environmentOverview) {
    const ws = wb.addWorksheet("Environment", { properties: { tabColor: { argb: LIGHT_BLUE } } });
    ws.columns = [{ width: 25 }, { width: 15 }, { width: 15 }];
    let r = 1;
    r = addSectionTitle(ws, "Environment Overview", r);
    r++;
    const stats = [
      ["Total Users", fmtNumber(inputs.environment.userCount)],
      ["Total Endpoints", fmtNumber(derived.endpoints)],
      ["VDI/DaaS Users", fmtNumber(derived.vdiUserCount)],
      ["Cost per User", fmtMoney(derived.costPerUser)],
    ];
    stats.forEach(([label, value]) => {
      ws.getRow(r).getCell(1).value = label;
      ws.getRow(r).getCell(1).font = { color: { argb: "666666" } };
      ws.getRow(r).getCell(2).value = value;
      ws.getRow(r).getCell(2).font = { bold: true };
      r++;
    });
    r++;
    const hdr = ws.getRow(r);
    hdr.values = ["Device Type", "Count", "% of Fleet"];
    styleHeader(hdr, 3);
    r++;
    [
      ["Laptops", inputs.environment.laptopCount, pct(inputs.environment.laptopCount, derived.endpoints)],
      ["Desktops", inputs.environment.desktopCount, pct(inputs.environment.desktopCount, derived.endpoints)],
      ["Thin Clients", inputs.environment.thinClientCount, pct(inputs.environment.thinClientCount, derived.endpoints)],
    ].forEach(([type, count, p]) => {
      ws.getRow(r).values = [type, fmtNumber(count as number), `${p}%`];
      r++;
    });
    const totalR = ws.getRow(r);
    totalR.values = ["Total", fmtNumber(derived.endpoints), "100%"];
    styleTotalRow(totalR, 3);
    r += 2;
    ws.getRow(r).getCell(1).value = getEndpointMixAnnotation(
      inputs.environment.laptopCount, inputs.environment.desktopCount,
      inputs.environment.thinClientCount, derived.endpoints,
    );
    ws.getRow(r).getCell(1).font = { italic: true, size: 10 };
    ws.getRow(r).getCell(1).alignment = { wrapText: true };
  }

  if (config.sections.vendorLandscape) {
    const landscape = collectVendorLandscape(hexagridEntries);
    const ws = wb.addWorksheet("Vendor Landscape", { properties: { tabColor: { argb: LIGHT_BLUE } } });
    ws.columns = [{ width: 22 }, { width: 28 }, { width: 18 }, { width: 22 }, { width: 14 }, { width: 18 }];
    let r = 1;
    r = addSectionTitle(ws, "EUC Vendor Landscape", r);
    r++;
    const hdr = ws.getRow(r);
    hdr.values = ["Pillar", "Sub-Pillar", "Vendor", "Platform / Product", "License Count", "License Type / SKU"];
    styleHeader(hdr, 6);
    r++;
    landscape.forEach(v => {
      const rowData = ws.getRow(r);
      rowData.values = [v.pillar, v.subPillar, v.vendorName + (v.scoringFlag ? ` [${v.scoringFlag}]` : ""), v.platform, v.licenseCount ? fmtNumber(v.licenseCount) : "—", v.licenseSku || "—"];
      if (v.scoringFlag) {
        const flagColor = v.scoringFlag === "Critical Risk" ? "ef4444" : v.scoringFlag.includes("Aging") ? "f59e0b" : "3b82f6";
        rowData.getCell(3).font = { color: { argb: flagColor }, bold: true };
      }
      r++;
    });
    r++;
    ws.getRow(r).getCell(1).value = `${landscape.length} vendors across ${new Set(landscape.map(v => v.subPillar)).size} sub-pillars`;
    ws.getRow(r).getCell(1).font = { italic: true, size: 10, color: { argb: "666666" } };
  }

  if (config.sections.costBreakdown) {
    const ws = wb.addWorksheet("Cost Breakdown", { properties: { tabColor: { argb: NAVY } } });
    ws.columns = [{ width: 25 }, { width: 18 }, { width: 12 }, { width: 28 }];
    let r = 1;
    r = addSectionTitle(ws, "Cost Breakdown", r);
    r++;
    const hdr = ws.getRow(r);
    hdr.values = ["Cost Category", "Annual Amount", "% of Total", "Source"];
    styleHeader(hdr, 4);
    r++;
    const categories = [
      { name: "End-User Devices", value: derived.endUserDevicesValue },
      { name: "Support & Operations", value: derived.supportOpsValue },
      { name: "Licensing", value: derived.licensingValue },
      { name: "Management & Security", value: derived.mgmtSecurityValue },
      { name: "VDI / DaaS", value: derived.vdiDaasValue },
      { name: "Overhead", value: derived.overheadValue },
      { name: "Managed Services", value: derived.mspSpend },
    ];
    categories.forEach(c => {
      const line = derived.categoryLines.find(l => l.value === c.value && l.label.includes(c.name.split(" ")[0]));
      const source = line ? getCategorySource(line, data) : (c.name === "Managed Services" && derived.mspSpend > 0 ? "Direct client input" : "Calculated from assumptions");
      ws.getRow(r).values = [c.name, fmtMoney(c.value), derived.totalAnnualTco > 0 ? `${pct(c.value, derived.totalAnnualTco)}%` : "—", source];
      r++;
    });
    const totalRow = ws.getRow(r);
    totalRow.values = ["Total Annual TCO", fmtMoney(derived.totalAnnualTco), "100%", ""];
    styleTotalRow(totalRow, 4);
    r += 2;
    ws.getRow(r).getCell(1).value = getCostBreakdownAnnotation(data);
    ws.getRow(r).getCell(1).font = { italic: true, size: 10 };
    ws.getRow(r).getCell(1).alignment = { wrapText: true };
  }

  if (config.sections.perUserEconomics) {
    const ws = wb.addWorksheet("Per-User Economics", { properties: { tabColor: { argb: LIGHT_BLUE } } });
    ws.columns = [{ width: 30 }, { width: 20 }, { width: 20 }];
    let r = 1;
    r = addSectionTitle(ws, "Per-User Economics", r);
    r++;
    const metrics = [
      ["Cost per User (Annual)", fmtMoney(derived.costPerUser), fmtMoney(derived.costPerUser / 12) + " /month"],
      ["Cost per Endpoint (Annual)", fmtMoney(derived.costPerEndpoint), fmtMoney(derived.costPerEndpoint / 12) + " /month"],
    ];
    const hdr = ws.getRow(r);
    hdr.values = ["Metric", "Annual", "Monthly"];
    styleHeader(hdr, 3);
    r++;
    metrics.forEach(([label, annual, monthly]) => {
      ws.getRow(r).values = [label, annual, monthly];
      r++;
    });
  }

  if (config.sections.vdiAnalysis && derived.vdiUserCount > 0) {
    const ws = wb.addWorksheet("VDI Analysis", { properties: { tabColor: { argb: NAVY } } });
    ws.columns = [{ width: 30 }, { width: 20 }];
    let r = 1;
    r = addSectionTitle(ws, "VDI Analysis", r);
    r++;
    const metrics = [
      ["VDI Users", fmtNumber(derived.vdiUserCount)],
      ["Fully Loaded VDI Cost / User", fmtMoney(derived.fullyLoadedVdiCostPerUser)],
      ["Non-VDI Cost / User", fmtMoney(derived.nonVdiCostPerUser)],
      ["VDI User Premium", fmtMoney(derived.vdiUserPremium)],
      ["Base Cost per User", fmtMoney(derived.baseCostPerUser)],
      ["VDI Platform Cost per User", fmtMoney(derived.vdiPlatformCostPerUser)],
    ];
    metrics.forEach(([label, value]) => {
      ws.getRow(r).getCell(1).value = label;
      ws.getRow(r).getCell(1).font = { color: { argb: "666666" } };
      ws.getRow(r).getCell(2).value = value;
      ws.getRow(r).getCell(2).font = { bold: true };
      r++;
    });
  }

  if (config.sections.threeYearProjection) {
    const projection = generate3YearProjection(data);
    const ws = wb.addWorksheet("3-Year Projection", { properties: { tabColor: { argb: LIGHT_BLUE } } });
    ws.columns = [{ width: 25 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }];
    let r = 1;
    r = addSectionTitle(ws, "3-Year Projection", r);
    r++;
    const hdr = ws.getRow(r);
    hdr.values = ["", "Year 1 (Current)", "Year 2", "Year 3", "3-Year Total"];
    styleHeader(hdr, 5);
    r++;
    projection.forEach(p => {
      const rowRef = ws.getRow(r);
      rowRef.values = [p.category, fmtMoney(p.year1), fmtMoney(p.year2), fmtMoney(p.year3), fmtMoney(p.total)];
      if (p.category === "Total") styleTotalRow(rowRef, 5);
      r++;
    });
    r++;
    const totalRow = projection[projection.length - 1];
    ws.getRow(r).getCell(1).value = `At a ${(assumptions.projection.annualEscalationRate * 100).toFixed(0)}% annual escalation rate, 3-year cumulative spend is ${fmtMoney(totalRow.total)}.`;
    ws.getRow(r).getCell(1).font = { italic: true, size: 10 };
    ws.getRow(r).getCell(1).alignment = { wrapText: true };
  }

  if (config.sections.dataConfidence) {
    const confidence = calculateDataConfidence(data);
    const ws = wb.addWorksheet("Data Confidence", { properties: { tabColor: { argb: LIGHT_BLUE } } });
    ws.columns = [{ width: 22 }, { width: 28 }, { width: 14 }, { width: 14 }, { width: 14 }];
    let r = 1;
    r = addSectionTitle(ws, "Data Confidence", r);
    r++;
    ws.getRow(r).getCell(1).value = `Confidence: ${confidence.tier}`;
    ws.getRow(r).getCell(1).font = { bold: true, size: 14, color: { argb: confidence.tier === "HIGH" ? "22c55e" : confidence.tier === "MODERATE" ? "f59e0b" : "ef4444" } };
    r++;
    ws.getRow(r).getCell(1).value = `${confidence.inputPct}% from your data, ${confidence.assumptionPct}% from industry assumptions`;
    r += 2;
    const hdr = ws.getRow(r);
    hdr.values = ["Pillar", "Sub-Pillar", "Vendor Data", "Cost Data", "Status"];
    styleHeader(hdr, 5);
    r++;
    confidence.pillarCoverage.forEach(p => {
      const rowRef = ws.getRow(r);
      rowRef.values = [p.pillar, p.subPillar, p.hasVendor ? "Yes" : "—", p.hasCost ? "Yes" : "—", p.status === "complete" ? "Complete" : p.status === "partial" ? "Partial" : "No data"];
      const statusColor = p.status === "complete" ? "22c55e" : p.status === "partial" ? "f59e0b" : "999999";
      rowRef.getCell(5).font = { color: { argb: statusColor } };
      r++;
    });
  }

  if (config.sections.scoringRiskFlags) {
    const flags = collectScoringFlags(hexagridEntries);
    if (flags.length > 0) {
      const ws = wb.addWorksheet("Risk Flags", { properties: { tabColor: { argb: "ef4444" } } });
      ws.columns = [{ width: 28 }, { width: 22 }, { width: 16 }, { width: 40 }];
      let r = 1;
      r = addSectionTitle(ws, "Scoring & Risk Flags", r);
      r++;
      const hdr = ws.getRow(r);
      hdr.values = ["Sub-Pillar", "Vendor / Platform", "Flag", "What It Means"];
      styleHeader(hdr, 4);
      r++;
      flags.forEach(f => {
        const meaning = f.flag === "Critical Risk" ? "Product is end-of-life or imminently unsupported"
          : f.flag.includes("Aging") ? "Product is aging; support timeline is narrowing"
          : "Product is legacy; functional but no longer strategic";
        const rowRef = ws.getRow(r);
        rowRef.values = [f.subPillar, `${f.vendorName} / ${f.platform}`, f.flag, meaning];
        const flagColor = f.flag === "Critical Risk" ? "ef4444" : f.flag.includes("Aging") ? "f59e0b" : "3b82f6";
        rowRef.getCell(3).font = { bold: true, color: { argb: flagColor } };
        r++;
      });
    }
  }

  if (config.sections.keyFindings) {
    const findings = generateKeyFindings(data);
    if (findings.length > 0) {
      const ws = wb.addWorksheet("Key Findings", { properties: { tabColor: { argb: LIGHT_BLUE } } });
      ws.columns = [{ width: 8 }, { width: 70 }, { width: 12 }];
      let r = 1;
      r = addSectionTitle(ws, "Key Findings", r);
      r++;
      findings.forEach((f, i) => {
        ws.getRow(r).values = [i + 1, f.text, `[${f.appendixRef}]`];
        ws.getRow(r).getCell(3).font = { color: { argb: LIGHT_BLUE }, size: 10 };
        r++;
      });
    }
  }

  if (config.sections.observations && inputs.observations.length > 0) {
    const ws = wb.addWorksheet("Observations", { properties: { tabColor: { argb: LIGHT_BLUE } } });
    ws.columns = [{ width: 30 }, { width: 50 }];
    let r = 1;
    r = addSectionTitle(ws, "Observations", r);
    r++;
    const hdr = ws.getRow(r);
    hdr.values = ["Observation", "Details"];
    styleHeader(hdr, 2);
    r++;
    inputs.observations.forEach(o => {
      ws.getRow(r).values = [o.observation, o.details];
      ws.getRow(r).getCell(2).alignment = { wrapText: true };
      r++;
    });
  }

  if (config.sections.recommendedNextSteps) {
    const nextSteps = generateRecommendedNextSteps(data);
    if (nextSteps.length > 0) {
      const ws = wb.addWorksheet("Next Steps", { properties: { tabColor: { argb: LIGHT_BLUE } } });
      ws.columns = [{ width: 8 }, { width: 70 }];
      let r = 1;
      r = addSectionTitle(ws, "Recommended Next Steps", r);
      r++;
      nextSteps.forEach((s, i) => {
        ws.getRow(r).values = [i + 1, s.text];
        ws.getRow(r).getCell(2).alignment = { wrapText: true };
        r++;
      });
    }
  }

  if (config.sections.methodologyAppendix) {
    const ws = wb.addWorksheet("Appendix", { properties: { tabColor: { argb: NAVY } } });
    ws.columns = [{ width: 30 }, { width: 18 }, { width: 18 }];
    let r = 1;
    r = addSectionTitle(ws, "Assumptions Reference", r);
    r++;
    const hdr = ws.getRow(r);
    hdr.values = ["Assumption", "Default Value", "Current Value"];
    styleHeader(hdr, 3);
    r++;
    const assumptionRows = [
      ["Laptop Refresh (years)", "3", String(assumptions.deviceRefreshYears.laptop)],
      ["Desktop Refresh (years)", "3", String(assumptions.deviceRefreshYears.desktop)],
      ["Thin Client Refresh (years)", "5", String(assumptions.deviceRefreshYears.thinClient)],
      ["Laptop Unit Cost", "$1,200", fmtMoney(assumptions.deviceUnitCost.laptop)],
      ["Desktop Unit Cost", "$1,100", fmtMoney(assumptions.deviceUnitCost.desktop)],
      ["Thin Client Unit Cost", "$600", fmtMoney(assumptions.deviceUnitCost.thinClient)],
      ["Avg Ticket Handling (hours)", "0.5", String(assumptions.supportOps.avgTicketHandlingHours)],
      ["Deployment Hours/Device", "1.5", String(assumptions.supportOps.deploymentHoursPerDevice)],
      ["Blended Labor Rate ($/hr)", "$50", fmtMoney(assumptions.supportOps.blendedLaborRateHourly)],
      ["Tickets/Endpoint/Year", "2", String(assumptions.supportOps.ticketsPerEndpointPerYear)],
      ["Licensing Cost/User/Year", "$400", fmtMoney(assumptions.licensing.avgCostPerUserPerYear)],
      ["Licensing Coverage", "100%", `${(assumptions.licensing.coveragePct * 100).toFixed(0)}%`],
      ["Mgmt & Security Cost/Endpoint", "$200", fmtMoney(assumptions.mgmtSecurity.costPerEndpointPerYear)],
      ["VDI Platform Cost/User", "$800", fmtMoney(assumptions.vdi.platformCostPerVdiUserPerYear)],
      ["Overhead %", "7%", `${(assumptions.overhead.pctOfTotal * 100).toFixed(0)}%`],
      ["Annual Escalation Rate", "4%", `${(assumptions.projection.annualEscalationRate * 100).toFixed(0)}%`],
    ];
    assumptionRows.forEach(([name, def, cur]) => {
      ws.getRow(r).values = [name, def, cur];
      r++;
    });
  }

  if (config.sections.glossary) {
    const ws = wb.addWorksheet("Glossary", { properties: { tabColor: { argb: LIGHT_BLUE } } });
    ws.columns = [{ width: 15 }, { width: 65 }];
    let r = 1;
    r = addSectionTitle(ws, "Glossary", r);
    r++;
    const hdr = ws.getRow(r);
    hdr.values = ["Term", "Definition"];
    styleHeader(hdr, 2);
    r++;
    GLOSSARY.forEach(g => {
      ws.getRow(r).values = [g.term, g.definition];
      r++;
    });
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const dateStr = new Date().toISOString().split("T")[0];
  const safeName = config.clientName.replace(/[^a-zA-Z0-9]/g, "_") || "Client";
  a.href = url;
  a.download = `TCO_Baseline_Report_${safeName}_${dateStr}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
