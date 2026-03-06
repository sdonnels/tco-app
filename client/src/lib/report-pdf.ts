import type {
  ReportConfig,
  ReportData,
  ProjectionRow,
  DataConfidenceResult,
  ScoringFlagEntry,
  VendorLandscapeRow,
  KeyFinding,
  NextStep,
} from "./report-data";
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

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function sectionAnchor(id: string): string {
  return `<a id="${id}"></a>`;
}

function appendixLink(ref: string, label: string): string {
  return `<p class="appendix-link"><a href="#appendix-${ref}">See Appendix ${ref} for ${label}.</a></p>`;
}

function backLink(id: string, label: string): string {
  return `<p class="back-link"><a href="#${id}">&#8617; Back to ${label}</a></p>`;
}

export async function generateReportPdf(
  data: ReportData,
  imgToBase64: (src: string) => Promise<string>,
  xentegraLogoSrc: string,
): Promise<void> {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to generate the report PDF");
    return;
  }

  const { config, inputs, derived, assumptions, hexagridEntries } = data;
  const xentegraB64 = await imgToBase64(xentegraLogoSrc);
  const clientLogoB64 = data.clientLogo && config.includeClientLogo ? data.clientLogo : "";

  const landscape = collectVendorLandscape(hexagridEntries);
  const flags = collectScoringFlags(hexagridEntries);
  const confidence = calculateDataConfidence(data);
  const projection = generate3YearProjection(data);
  const findings = generateKeyFindings(data);
  const nextSteps = generateRecommendedNextSteps(data);
  const execSummary = generateExecutiveSummary(data);
  const endpointAnnotation = getEndpointMixAnnotation(
    inputs.environment.laptopCount, inputs.environment.desktopCount,
    inputs.environment.thinClientCount, derived.endpoints,
  );
  const costAnnotation = getCostBreakdownAnnotation(data);

  const selectedSections: { id: string; title: string; num: number; isAppendix: boolean }[] = [];
  let sNum = 1;
  const sectionMap: Record<string, string> = {};

  function addSection(key: keyof ReportConfig["sections"], title: string, isAppendix = false) {
    if (config.sections[key]) {
      const id = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      const label = isAppendix ? String.fromCharCode(64 + sNum) : String(sNum);
      selectedSections.push({ id, title, num: sNum, isAppendix });
      sectionMap[key] = label;
      sNum++;
    }
  }

  addSection("executiveSummary", "Executive Summary");
  addSection("environmentOverview", "Environment Overview");
  addSection("vendorLandscape", "EUC Vendor Landscape");
  addSection("costBreakdown", "Cost Breakdown");
  addSection("costWaterfall", "Cost Waterfall");
  addSection("perUserEconomics", "Per-User Economics");
  if (derived.vdiUserCount > 0) addSection("vdiAnalysis", "VDI Analysis");
  addSection("threeYearProjection", "3-Year Projection");
  addSection("dataConfidence", "Data Confidence");
  if (flags.length > 0) addSection("scoringRiskFlags", "Scoring & Risk Flags");
  addSection("keyFindings", "Key Findings");
  if (inputs.observations.length > 0) addSection("observations", "Observations");
  if (nextSteps.length > 0) addSection("recommendedNextSteps", "Recommended Next Steps");
  addSection("methodologyAppendix", "Methodology & Appendix");
  addSection("glossary", "Glossary");

  const tocHtml = selectedSections.map(s =>
    `<a href="#section-${s.id}" class="toc-item"><span class="toc-label">${s.isAppendix ? "App." : ""} ${s.title}</span><span class="toc-dots"></span></a>`
  ).join("\n");

  const categories = [
    { name: "End-User Devices", value: derived.endUserDevicesValue },
    { name: "Support & Operations", value: derived.supportOpsValue },
    { name: "Licensing", value: derived.licensingValue },
    { name: "Management & Security", value: derived.mgmtSecurityValue },
    { name: "VDI / DaaS", value: derived.vdiDaasValue },
    { name: "Overhead", value: derived.overheadValue },
    { name: "Managed Services", value: derived.mspSpend },
  ];
  const maxCat = Math.max(...categories.map(c => c.value), 1);

  function buildSections(): string {
    const parts: string[] = [];

    if (config.sections.executiveSummary) {
      parts.push(`
        ${sectionAnchor("section-executive-summary")}
        <div class="section">
          <h2>Executive Summary</h2>
          <p class="exec-text">${esc(execSummary)}</p>
          <p class="methodology-stmt"><em>This baseline was produced using XenTegra's 7-pillar EUC assessment framework, incorporating direct client data, vendor cost analysis, and industry-benchmarked assumptions.</em></p>
          <p class="disclaimer"><em>This assessment represents a current-state baseline estimate based on available data and industry-standard assumptions. It is not a forecast, recommendation, or guarantee. All assumption-based values are explicitly identified. This report was prepared by XenTegra for ${esc(config.clientName)} and is intended for internal planning purposes only.</em></p>
        </div>
      `);
    }

    if (config.sections.environmentOverview) {
      parts.push(`
        ${sectionAnchor("section-environment-overview")}
        <div class="section">
          <h2>Environment Overview</h2>
          <div class="stat-grid">
            <div class="stat-card"><div class="stat-value">${fmtNumber(inputs.environment.userCount)}</div><div class="stat-label">Total Users</div></div>
            <div class="stat-card"><div class="stat-value">${fmtNumber(derived.endpoints)}</div><div class="stat-label">Total Endpoints</div></div>
            <div class="stat-card"><div class="stat-value">${fmtNumber(derived.vdiUserCount)}</div><div class="stat-label">VDI/DaaS Users</div></div>
            <div class="stat-card"><div class="stat-value">${fmtMoney(derived.costPerUser)}</div><div class="stat-label">Cost per User</div></div>
          </div>
          <table class="data-table">
            <thead><tr><th>Device Type</th><th>Count</th><th>% of Fleet</th></tr></thead>
            <tbody>
              <tr><td>Laptops</td><td>${fmtNumber(inputs.environment.laptopCount)}</td><td>${pct(inputs.environment.laptopCount, derived.endpoints)}%</td></tr>
              <tr><td>Desktops</td><td>${fmtNumber(inputs.environment.desktopCount)}</td><td>${pct(inputs.environment.desktopCount, derived.endpoints)}%</td></tr>
              <tr><td>Thin Clients</td><td>${fmtNumber(inputs.environment.thinClientCount)}</td><td>${pct(inputs.environment.thinClientCount, derived.endpoints)}%</td></tr>
              <tr class="total-row"><td><strong>Total</strong></td><td><strong>${fmtNumber(derived.endpoints)}</strong></td><td><strong>100%</strong></td></tr>
            </tbody>
          </table>
          <p class="annotation">${esc(endpointAnnotation)}</p>
          ${appendixLink("A.1", "how endpoint counts flow into the cost model")}
        </div>
      `);
    }

    if (config.sections.vendorLandscape) {
      const rows = landscape.map(v => {
        const flagBadge = v.scoringFlag ? `<span class="flag-badge flag-${v.scoringFlag.toLowerCase().replace(/[\s\/]/g, "-")}">${esc(v.scoringFlag)}</span>` : "";
        return `<tr>
          <td>${esc(v.pillar)}</td>
          <td>${esc(v.subPillar)}</td>
          <td>${esc(v.vendorName)} ${flagBadge}</td>
          <td>${esc(v.platform)}</td>
          <td>${v.licenseCount ? fmtNumber(v.licenseCount) : "—"}</td>
          <td>${v.licenseSku ? esc(v.licenseSku) : "—"}</td>
        </tr>`;
      }).join("\n");

      const uniqueSubPillars = new Set(landscape.map(v => v.subPillar)).size;
      parts.push(`
        ${sectionAnchor("section-vendor-landscape")}
        <div class="section">
          <h2>EUC Vendor Landscape</h2>
          <table class="data-table vendor-table">
            <thead><tr><th>Pillar</th><th>Sub-Pillar</th><th>Vendor</th><th>Platform / Product</th><th>License Count</th><th>License Type / SKU</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <p class="table-footer">${landscape.length} vendors across ${uniqueSubPillars} sub-pillars</p>
          <p class="annotation">This table reflects the platforms and vendors you reported. Scoring flags (if any) indicate products nearing or past end-of-life that may affect future costs and risk posture.</p>
          ${appendixLink("A.2", "how vendor costs feed into category calculations")}
        </div>
      `);
    }

    if (config.sections.costBreakdown) {
      const catRows = categories.map(c => {
        const line = derived.categoryLines.find(l => l.value === c.value && l.label.includes(c.name.split(" ")[0]));
        const source = line ? getCategorySource(line, data) : (c.name === "Managed Services" && derived.mspSpend > 0 ? "Direct client input" : "Calculated from assumptions");
        return `<tr>
          <td>${esc(c.name)}</td>
          <td class="money">${fmtMoney(c.value)}</td>
          <td>${derived.totalAnnualTco > 0 ? pct(c.value, derived.totalAnnualTco) + "%" : "—"}</td>
          <td class="source-cell">${esc(source)}</td>
        </tr>`;
      }).join("\n");

      const barChartHtml = categories.filter(c => c.value > 0).map(c => {
        const width = Math.max(2, (c.value / maxCat) * 100);
        return `<div class="bar-row"><span class="bar-label">${esc(c.name)}</span><div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div><span class="bar-value">${fmtMoney(c.value)}</span></div>`;
      }).join("\n");

      parts.push(`
        ${sectionAnchor("section-cost-breakdown")}
        <div class="section">
          <h2>Cost Breakdown</h2>
          <table class="data-table">
            <thead><tr><th>Cost Category</th><th>Annual Amount</th><th>% of Total</th><th>Source</th></tr></thead>
            <tbody>
              ${catRows}
              <tr class="total-row"><td><strong>Total Annual TCO</strong></td><td class="money"><strong>${fmtMoney(derived.totalAnnualTco)}</strong></td><td><strong>100%</strong></td><td></td></tr>
            </tbody>
          </table>
          <div class="bar-chart">${barChartHtml}</div>
          <p class="annotation">${esc(costAnnotation)}</p>
          ${appendixLink("A.3", "the priority chain that determines how each category is calculated")}
        </div>
      `);
    }

    if (config.sections.costWaterfall) {
      const waterfallCats = categories.filter(c => c.value > 0);
      let running = 0;
      const waterfallBars = waterfallCats.map(c => {
        const bottom = running;
        running += c.value;
        const bottomPct = (bottom / derived.totalAnnualTco) * 100;
        const heightPct = Math.max(2, (c.value / derived.totalAnnualTco) * 100);
        return `<div class="wf-col"><div class="wf-bar-container"><div class="wf-bar" style="bottom:${bottomPct}%;height:${heightPct}%"><span class="wf-amount">${fmtMoney(c.value)}</span></div></div><div class="wf-label">${esc(c.name)}</div></div>`;
      }).join("");

      const totalBar = `<div class="wf-col wf-total"><div class="wf-bar-container"><div class="wf-bar wf-bar-total" style="bottom:0;height:100%"><span class="wf-amount">${fmtMoney(derived.totalAnnualTco)}</span></div></div><div class="wf-label"><strong>Total</strong></div></div>`;

      parts.push(`
        ${sectionAnchor("section-cost-waterfall")}
        <div class="section">
          <h2>Cost Waterfall</h2>
          <div class="waterfall-chart">${waterfallBars}${totalBar}</div>
          <p class="annotation">This waterfall shows how your ${fmtMoney(derived.totalAnnualTco)} annual TCO accumulates across cost categories. Each bar represents the incremental cost added by that category.</p>
          ${appendixLink("A.3", "individual category formulas")}
        </div>
      `);
    }

    if (config.sections.perUserEconomics) {
      const monthlyPerUser = derived.costPerUser / 12;
      const monthlyPerEndpoint = derived.costPerEndpoint / 12;
      parts.push(`
        ${sectionAnchor("section-per-user-economics")}
        <div class="section">
          <h2>Per-User Economics</h2>
          <div class="stat-grid">
            <div class="stat-card"><div class="stat-value">${fmtMoney(derived.costPerUser)} / year</div><div class="stat-label">Cost per User</div></div>
            <div class="stat-card"><div class="stat-value">${fmtMoney(monthlyPerUser)} / month</div><div class="stat-label">Cost per User</div></div>
            <div class="stat-card"><div class="stat-value">${fmtMoney(derived.costPerEndpoint)} / year</div><div class="stat-label">Cost per Endpoint</div></div>
            <div class="stat-card"><div class="stat-value">${fmtMoney(monthlyPerEndpoint)} / month</div><div class="stat-label">Cost per Endpoint</div></div>
          </div>
          <p class="annotation">Your fully-loaded EUC cost is ${fmtMoney(monthlyPerUser)} per user per month. This includes hardware lifecycle, software licensing, support operations, security, management tooling, and overhead.</p>
          ${appendixLink("A.4", "per-unit metric formulas")}
        </div>
      `);
    }

    if (config.sections.vdiAnalysis && derived.vdiUserCount > 0) {
      const baseW = Math.max(5, (derived.baseCostPerUser / (derived.fullyLoadedVdiCostPerUser || 1)) * 100);
      const platW = 100 - baseW;
      parts.push(`
        ${sectionAnchor("section-vdi-analysis")}
        <div class="section">
          <h2>VDI Analysis</h2>
          <div class="stat-grid">
            <div class="stat-card"><div class="stat-value">${fmtNumber(derived.vdiUserCount)}</div><div class="stat-label">VDI Users</div></div>
            <div class="stat-card"><div class="stat-value">${fmtMoney(derived.fullyLoadedVdiCostPerUser)}</div><div class="stat-label">Fully Loaded VDI Cost / User</div></div>
            <div class="stat-card"><div class="stat-value">${fmtMoney(derived.nonVdiCostPerUser)}</div><div class="stat-label">Non-VDI Cost / User</div></div>
            <div class="stat-card"><div class="stat-value">${fmtMoney(derived.vdiUserPremium)}</div><div class="stat-label">VDI User Premium</div></div>
          </div>
          <div class="vdi-comparison">
            <div class="vdi-bar-group">
              <div class="vdi-bar-label">Non-VDI User</div>
              <div class="vdi-stacked-bar"><div class="vdi-base" style="width:100%">${fmtMoney(derived.baseCostPerUser)}</div></div>
            </div>
            <div class="vdi-bar-group">
              <div class="vdi-bar-label">VDI User</div>
              <div class="vdi-stacked-bar"><div class="vdi-base" style="width:${baseW}%">${fmtMoney(derived.baseCostPerUser)}</div><div class="vdi-platform" style="width:${platW}%">${fmtMoney(derived.vdiPlatformCostPerUser)}</div></div>
            </div>
            <div class="vdi-legend"><span class="vdi-legend-base"></span> Base Costs (shared) &nbsp; <span class="vdi-legend-platform"></span> VDI Platform (incremental)</div>
          </div>
          <p class="annotation">Each VDI user costs ${fmtMoney(derived.fullyLoadedVdiCostPerUser)} annually — ${fmtMoney(derived.baseCostPerUser)} in shared base costs (hardware, support, licensing) plus ${fmtMoney(derived.vdiPlatformCostPerUser)} in virtual desktop platform costs. The VDI premium of ${fmtMoney(derived.vdiUserPremium)} per user represents the incremental cost of delivering a virtual workspace.</p>
          ${appendixLink("A.5", "the corrected VDI allocation methodology")}
        </div>
      `);
    }

    if (config.sections.threeYearProjection) {
      const totalRow = projection[projection.length - 1];
      const projRows = projection.map(r => {
        const isTotal = r.category === "Total";
        const cls = isTotal ? ' class="total-row"' : "";
        const wrap = isTotal ? (s: string) => `<strong>${s}</strong>` : (s: string) => s;
        return `<tr${cls}><td>${wrap(esc(r.category))}</td><td class="money">${wrap(fmtMoney(r.year1))}</td><td class="money">${wrap(fmtMoney(r.year2))}</td><td class="money">${wrap(fmtMoney(r.year3))}</td><td class="money">${wrap(fmtMoney(r.total))}</td></tr>`;
      }).join("\n");

      parts.push(`
        ${sectionAnchor("section-three-year-projection")}
        <div class="section">
          <h2>3-Year Projection</h2>
          <table class="data-table">
            <thead><tr><th></th><th>Year 1 (Current)</th><th>Year 2</th><th>Year 3</th><th>3-Year Total</th></tr></thead>
            <tbody>${projRows}</tbody>
          </table>
          <p class="annotation">At a ${(assumptions.projection.annualEscalationRate * 100).toFixed(0)}% annual escalation rate, your EUC spend will reach ${fmtMoney(totalRow.year3)} by Year 3 — a cumulative ${fmtMoney(totalRow.total)} over three years. This projection assumes no changes to your environment, vendor mix, or operational model.</p>
          ${appendixLink("A.6", "projection assumptions and escalation methodology")}
        </div>
      `);
    }

    if (config.sections.dataConfidence) {
      const tierColor = confidence.tier === "HIGH" ? "#22c55e" : confidence.tier === "MODERATE" ? "#f59e0b" : "#ef4444";
      const coverageRows = confidence.pillarCoverage.map(p => {
        const statusIcon = p.status === "complete" ? "&#x1F7E2;" : p.status === "partial" ? "&#x1F7E1;" : "&#x26AA;";
        const statusLabel = p.status === "complete" ? "Complete" : p.status === "partial" ? "Partial" : "No data";
        return `<tr><td>${esc(p.pillar)}</td><td>${esc(p.subPillar)}</td><td>${p.hasVendor ? "&#10003;" : "—"}</td><td>${p.hasCost ? "&#10003;" : "—"}</td><td>${statusIcon} ${statusLabel}</td></tr>`;
      }).join("\n");

      parts.push(`
        ${sectionAnchor("section-data-confidence")}
        <div class="section">
          <h2>Data Confidence</h2>
          <div class="confidence-badge" style="background:${tierColor};color:white;display:inline-block;padding:8px 24px;border-radius:8px;font-weight:700;font-size:18px;margin-bottom:16px">${confidence.tier}</div>
          <div class="confidence-bar">
            <div class="confidence-fill" style="width:${confidence.inputPct}%">${confidence.inputPct}% from your data</div>
          </div>
          <p style="text-align:right;font-size:11px;color:#666;margin-top:4px">${confidence.assumptionPct}% from industry assumptions</p>
          <h3 style="margin-top:24px">Pillar Coverage</h3>
          <table class="data-table">
            <thead><tr><th>Pillar</th><th>Sub-Pillar</th><th>Vendor Data</th><th>Cost Data</th><th>Status</th></tr></thead>
            <tbody>${coverageRows}</tbody>
          </table>
          <p class="annotation">This assessment is rated <strong>${confidence.tier}</strong> confidence — ${confidence.inputPct}% of the baseline is derived from data you provided directly. The remaining ${confidence.assumptionPct}% uses industry-standard assumptions (detailed in the Assumptions section). Areas marked amber or gray represent opportunities to refine the baseline with actual spend data.</p>
          ${appendixLink("A.7", "how confidence is calculated and what each source type means")}
        </div>
      `);
    }

    if (config.sections.scoringRiskFlags && flags.length > 0) {
      const flagRows = flags.map(f => {
        const icon = f.flag === "Critical Risk" ? "&#x1F534;" : f.flag.includes("Aging") ? "&#x1F7E1;" : "&#x1F535;";
        const meaning = f.flag === "Critical Risk" ? "Product is end-of-life or imminently unsupported"
          : f.flag.includes("Aging") ? "Product is aging; support timeline is narrowing"
          : "Product is legacy; functional but no longer strategic";
        return `<tr><td>${esc(f.subPillar)}</td><td>${esc(f.vendorName)} / ${esc(f.platform)}</td><td>${icon} ${esc(f.flag)}</td><td>${meaning}</td></tr>`;
      }).join("\n");

      parts.push(`
        ${sectionAnchor("section-scoring-risk-flags")}
        <div class="section">
          <h2>Scoring & Risk Flags</h2>
          <table class="data-table">
            <thead><tr><th>Sub-Pillar</th><th>Vendor / Platform</th><th>Flag</th><th>What It Means</th></tr></thead>
            <tbody>${flagRows}</tbody>
          </table>
          <p class="annotation">${flags.length} platform${flags.length > 1 ? "s" : ""} in your environment carry risk or legacy flags. These do not directly affect today's TCO baseline but may signal upcoming costs for migration, extended support, or security exposure.</p>
          ${appendixLink("A.8", "scoring flag definitions and criteria")}
        </div>
      `);
    }

    if (config.sections.keyFindings && findings.length > 0) {
      const findingsList = findings.map((f, i) =>
        `<li><strong>Finding ${i + 1}:</strong> ${esc(f.text)} <a href="#appendix-${f.appendixRef}" class="ref-link">[${f.appendixRef}]</a></li>`
      ).join("\n");
      parts.push(`
        ${sectionAnchor("section-key-findings")}
        <div class="section">
          <h2>Key Findings</h2>
          <ol class="findings-list">${findingsList}</ol>
        </div>
      `);
    }

    if (config.sections.observations && inputs.observations.length > 0) {
      const obsList = inputs.observations.map(o =>
        `<div class="observation"><h4>${esc(o.observation)}</h4><p>${esc(o.details)}</p></div>`
      ).join("\n");
      parts.push(`
        ${sectionAnchor("section-observations")}
        <div class="section">
          <h2>Observations</h2>
          ${obsList}
        </div>
      `);
    }

    if (config.sections.recommendedNextSteps && nextSteps.length > 0) {
      const stepsList = nextSteps.map(s => `<li>${esc(s.text)}</li>`).join("\n");
      parts.push(`
        ${sectionAnchor("section-next-steps")}
        <div class="section">
          <h2>Recommended Next Steps</h2>
          <ol>${stepsList}</ol>
        </div>
      `);
    }

    if (config.sections.methodologyAppendix) {
      parts.push(buildAppendix(data, assumptions, derived, confidence, flags));
    }

    if (config.sections.glossary) {
      const glossaryRows = GLOSSARY.map(g => `<tr><td><strong>${esc(g.term)}</strong></td><td>${esc(g.definition)}</td></tr>`).join("\n");
      parts.push(`
        ${sectionAnchor("section-glossary")}
        <div class="section">
          <h2>Glossary</h2>
          <table class="data-table"><thead><tr><th>Term</th><th>Definition</th></tr></thead><tbody>${glossaryRows}</tbody></table>
        </div>
      `);
    }

    return parts.join("\n");
  }

  function buildAppendix(data: ReportData, assumptions: any, derived: any, confidence: DataConfidenceResult, flags: ScoringFlagEntry[]): string {
    const { inputs } = data;
    const laptops = inputs.environment.laptopCount;
    const desktops = inputs.environment.desktopCount;
    const thinClients = inputs.environment.thinClientCount;
    const endpoints = derived.endpoints;
    const userCount = inputs.environment.userCount;

    return `
      ${sectionAnchor("section-methodology-appendix")}
      <div class="section appendix">
        <h2>Methodology & Appendix</h2>

        ${sectionAnchor("appendix-A.1")}
        <h3>A.1 — Environment & Endpoint Methodology</h3>
        <p>Total Endpoints = Laptops (${fmtNumber(laptops)}) + Desktops (${fmtNumber(desktops)}) + Thin Clients (${fmtNumber(thinClients)}) = ${fmtNumber(endpoints)}</p>
        <p>User Count (${fmtNumber(userCount)}) is used for per-user cost calculations.</p>
        ${backLink("section-environment-overview", "Environment Overview")}

        ${sectionAnchor("appendix-A.2")}
        <h3>A.2 — EUC Pillar Cost Flow</h3>
        <p>Vendors reported in the EUC Hexagrid provide annual cost data that feeds into category calculations. The priority chain is: <strong>Override &gt; EUC Pillar Costs &gt; Assumption-based calculation</strong>.</p>
        ${backLink("section-vendor-landscape", "Vendor Landscape")}

        ${sectionAnchor("appendix-A.3")}
        <h3>A.3 — Category Calculation Formulas</h3>

        <div class="formula-block">
          <h4>End-User Devices (Annual)</h4>
          <p class="formula">Formula: (Laptops × Laptop Cost ÷ Laptop Refresh) + (Desktops × Desktop Cost ÷ Desktop Refresh) + (Thin Clients × TC Cost ÷ TC Refresh)</p>
          <p class="formula-values">Values: (${fmtNumber(laptops)} × $${fmtNumber(assumptions.deviceUnitCost.laptop)} ÷ ${assumptions.deviceRefreshYears.laptop}) + (${fmtNumber(desktops)} × $${fmtNumber(assumptions.deviceUnitCost.desktop)} ÷ ${assumptions.deviceRefreshYears.desktop}) + (${fmtNumber(thinClients)} × $${fmtNumber(assumptions.deviceUnitCost.thinClient)} ÷ ${assumptions.deviceRefreshYears.thinClient})</p>
          <p class="formula-result">Result: ${fmtMoney(derived.endUserDevicesValue)}</p>
        </div>

        <div class="formula-block">
          <h4>Support & Operations (Annual)</h4>
          <p class="formula">Formula: Ticket Labor + Deployment Labor</p>
          <p class="formula-values">Ticket Labor: ${fmtNumber(endpoints)} endpoints × ${assumptions.supportOps.ticketsPerEndpointPerYear} tickets × ${assumptions.supportOps.avgTicketHandlingHours}hr × $${assumptions.supportOps.blendedLaborRateHourly}/hr</p>
          <p class="formula-values">Deploy Labor: Per-device-type deployment using individual refresh cycles</p>
          <p class="formula-result">Result: ${fmtMoney(derived.supportOpsValue)}</p>
        </div>

        <div class="formula-block">
          <h4>Licensing (Annual)</h4>
          <p class="formula">Formula: Users × Cost/User × Coverage %</p>
          <p class="formula-values">Values: ${fmtNumber(userCount)} × $${fmtNumber(assumptions.licensing.avgCostPerUserPerYear)} × ${(assumptions.licensing.coveragePct * 100).toFixed(0)}%</p>
          <p class="formula-result">Result: ${fmtMoney(derived.licensingValue)}</p>
        </div>

        <div class="formula-block">
          <h4>Management & Security (Annual)</h4>
          <p class="formula">Formula: Endpoints × Cost/Endpoint (or EUC Pillar costs if available)</p>
          <p class="formula-values">Values: ${fmtNumber(endpoints)} × $${fmtNumber(assumptions.mgmtSecurity.costPerEndpointPerYear)}</p>
          <p class="formula-result">Result: ${fmtMoney(derived.mgmtSecurityValue)}</p>
        </div>

        <div class="formula-block">
          <h4>VDI / DaaS (Annual)</h4>
          <p class="formula">Formula: VDI Users × Platform Cost/User (or EUC Pillar costs if available)</p>
          <p class="formula-values">Values: ${fmtNumber(derived.vdiUserCount)} × $${fmtNumber(assumptions.vdi.platformCostPerVdiUserPerYear)}</p>
          <p class="formula-result">Result: ${fmtMoney(derived.vdiDaasValue)}</p>
        </div>

        <div class="formula-block">
          <h4>Overhead (Annual)</h4>
          <p class="formula">Formula: Subtotal × Overhead %</p>
          <p class="formula-values">Values: ${fmtMoney(derived.endUserDevicesValue + derived.supportOpsValue + derived.licensingValue + derived.mgmtSecurityValue + derived.vdiDaasValue)} × ${(assumptions.overhead.pctOfTotal * 100).toFixed(0)}%</p>
          <p class="formula-result">Result: ${fmtMoney(derived.overheadValue)}</p>
        </div>
        ${backLink("section-cost-breakdown", "Cost Breakdown")}

        ${sectionAnchor("appendix-A.4")}
        <h3>A.4 — Per-Unit Metric Formulas</h3>
        <table class="data-table">
          <thead><tr><th>Metric</th><th>Formula</th><th>Result</th></tr></thead>
          <tbody>
            <tr><td>Cost per Endpoint</td><td>Total TCO ÷ Endpoints</td><td>${fmtMoney(derived.costPerEndpoint)}</td></tr>
            <tr><td>Cost per User</td><td>Total TCO ÷ Users</td><td>${fmtMoney(derived.costPerUser)}</td></tr>
            <tr><td>Monthly Cost per User</td><td>Cost per User ÷ 12</td><td>${fmtMoney(derived.costPerUser / 12)}</td></tr>
          </tbody>
        </table>
        ${backLink("section-per-user-economics", "Per-User Economics")}

        ${sectionAnchor("appendix-A.5")}
        <h3>A.5 — VDI Allocation Methodology</h3>
        <table class="data-table">
          <thead><tr><th>Metric</th><th>Formula</th><th>Result</th></tr></thead>
          <tbody>
            <tr><td>Base Cost per User</td><td>(Total TCO − VDI Value) ÷ Users</td><td>${fmtMoney(derived.baseCostPerUser)}</td></tr>
            <tr><td>VDI Platform Cost per User</td><td>VDI Value ÷ VDI Users</td><td>${fmtMoney(derived.vdiPlatformCostPerUser)}</td></tr>
            <tr><td>Fully Loaded VDI Cost per User</td><td>Base + Platform</td><td>${fmtMoney(derived.fullyLoadedVdiCostPerUser)}</td></tr>
            <tr><td>VDI User Premium</td><td>Platform Cost (incremental)</td><td>${fmtMoney(derived.vdiUserPremium)}</td></tr>
          </tbody>
        </table>
        <p>Base costs (hardware, support, licensing, management, overhead) are shared equally across all users. The VDI platform cost represents the incremental cost of virtual desktop delivery, allocated only to VDI users.</p>
        ${backLink("section-vdi-analysis", "VDI Analysis")}

        ${sectionAnchor("appendix-A.6")}
        <h3>A.6 — Projection Methodology</h3>
        <p>Escalation Rate: ${(assumptions.projection.annualEscalationRate * 100).toFixed(0)}%</p>
        <p>Formula: Year N = Year 1 × (1 + rate)<sup>(N-1)</sup></p>
        <p><em>This is a steady-state projection, not a forecast. It assumes no changes to the environment, vendor mix, or operational model.</em></p>
        ${backLink("section-three-year-projection", "3-Year Projection")}

        ${sectionAnchor("appendix-A.7")}
        <h3>A.7 — Data Confidence Methodology</h3>
        <p>Confidence % = (Cost from direct inputs ÷ Total cost) × 100</p>
        <p>Tiers: HIGH (&gt;70%), MODERATE (40–70%), PRELIMINARY (&lt;40%)</p>
        <p>"Industry-standard assumption" means a default value sourced from published EUC research and benchmarks, used when actual client data is not available.</p>
        ${backLink("section-data-confidence", "Data Confidence")}

        ${sectionAnchor("appendix-A.8")}
        <h3>A.8 — Scoring Flag Definitions</h3>
        <table class="data-table">
          <thead><tr><th>Flag</th><th>Definition</th></tr></thead>
          <tbody>
            <tr><td>&#x1F534; Critical Risk</td><td>Product is end-of-life or imminently unsupported</td></tr>
            <tr><td>&#x1F7E1; Aging / Risk</td><td>Product is aging; support timeline is narrowing</td></tr>
            <tr><td>&#x1F535; Legacy</td><td>Product is legacy; functional but no longer strategic</td></tr>
          </tbody>
        </table>
        ${backLink("section-scoring-risk-flags", "Scoring & Risk Flags")}

        ${sectionAnchor("appendix-A.9")}
        <h3>A.9 — Assumptions Reference</h3>
        <table class="data-table">
          <thead><tr><th>Assumption</th><th>Default Value</th><th>Current Value</th></tr></thead>
          <tbody>
            <tr><td>Laptop Refresh (years)</td><td>3</td><td>${assumptions.deviceRefreshYears.laptop}</td></tr>
            <tr><td>Desktop Refresh (years)</td><td>3</td><td>${assumptions.deviceRefreshYears.desktop}</td></tr>
            <tr><td>Thin Client Refresh (years)</td><td>5</td><td>${assumptions.deviceRefreshYears.thinClient}</td></tr>
            <tr><td>Laptop Unit Cost</td><td>$1,200</td><td>${fmtMoney(assumptions.deviceUnitCost.laptop)}</td></tr>
            <tr><td>Desktop Unit Cost</td><td>$1,100</td><td>${fmtMoney(assumptions.deviceUnitCost.desktop)}</td></tr>
            <tr><td>Thin Client Unit Cost</td><td>$600</td><td>${fmtMoney(assumptions.deviceUnitCost.thinClient)}</td></tr>
            <tr><td>Avg Ticket Handling (hours)</td><td>0.5</td><td>${assumptions.supportOps.avgTicketHandlingHours}</td></tr>
            <tr><td>Deployment Hours/Device</td><td>1.5</td><td>${assumptions.supportOps.deploymentHoursPerDevice}</td></tr>
            <tr><td>Blended Labor Rate ($/hr)</td><td>$50</td><td>${fmtMoney(assumptions.supportOps.blendedLaborRateHourly)}</td></tr>
            <tr><td>Tickets/Endpoint/Year</td><td>2</td><td>${assumptions.supportOps.ticketsPerEndpointPerYear}</td></tr>
            <tr><td>Licensing Cost/User/Year</td><td>$400</td><td>${fmtMoney(assumptions.licensing.avgCostPerUserPerYear)}</td></tr>
            <tr><td>Licensing Coverage</td><td>100%</td><td>${(assumptions.licensing.coveragePct * 100).toFixed(0)}%</td></tr>
            <tr><td>Mgmt & Security Cost/Endpoint</td><td>$200</td><td>${fmtMoney(assumptions.mgmtSecurity.costPerEndpointPerYear)}</td></tr>
            <tr><td>VDI Platform Cost/User</td><td>$800</td><td>${fmtMoney(assumptions.vdi.platformCostPerVdiUserPerYear)}</td></tr>
            <tr><td>Overhead %</td><td>7%</td><td>${(assumptions.overhead.pctOfTotal * 100).toFixed(0)}%</td></tr>
            <tr><td>Annual Escalation Rate</td><td>4%</td><td>${(assumptions.projection.annualEscalationRate * 100).toFixed(0)}%</td></tr>
          </tbody>
        </table>
      </div>
    `;
  }

  const sectionsHtml = buildSections();

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${esc(config.reportTitle)} - ${esc(config.clientName)}</title>
  <style>
    @page {
      margin: 0.75in;
      @bottom-center { content: "XenTegra | Confidential | Prepared for ${esc(config.clientName)}"; font-size: 9px; color: #666; }
      @bottom-right { content: "Page " counter(page) " of " counter(pages); font-size: 9px; color: #666; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; font-size: 12px; }
    .cover-page { page-break-after: always; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 90vh; text-align: center; padding: 60px 40px; }
    .cover-logo-row { display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 500px; margin-bottom: 80px; }
    .cover-logo-row img { max-height: 60px; max-width: 180px; object-fit: contain; }
    .cover-title { font-size: 32px; font-weight: 700; color: #1e3a5f; margin-bottom: 8px; }
    .cover-subtitle { font-size: 18px; color: #4a5568; margin-bottom: 60px; }
    .cover-info { text-align: left; font-size: 14px; line-height: 2; }
    .cover-info span { color: #666; }
    .cover-confidential { margin-top: 60px; font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 1px; }
    .cover-bar { width: 100%; height: 6px; background: linear-gradient(90deg, #1e3a5f, #00B5E2); margin-bottom: 40px; border-radius: 3px; }
    .toc-page { page-break-after: always; padding: 40px; }
    .toc-page h2 { font-size: 24px; color: #1e3a5f; margin-bottom: 24px; border-bottom: 2px solid #1e3a5f; padding-bottom: 8px; }
    .toc-item { display: flex; align-items: baseline; text-decoration: none; color: #1a1a1a; padding: 6px 0; border-bottom: 1px dotted #ddd; }
    .toc-label { font-size: 14px; }
    .toc-dots { flex: 1; }
    .section { page-break-inside: avoid; margin-bottom: 32px; padding: 0 40px; }
    .section h2 { font-size: 20px; color: #1e3a5f; border-bottom: 2px solid #00B5E2; padding-bottom: 6px; margin-bottom: 16px; }
    .section h3 { font-size: 15px; color: #1e3a5f; margin: 20px 0 10px; }
    .section h4 { font-size: 13px; color: #333; margin: 12px 0 6px; }
    .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
    .stat-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; text-align: center; }
    .stat-value { font-size: 22px; font-weight: 700; color: #1e3a5f; }
    .stat-label { font-size: 11px; color: #666; margin-top: 4px; }
    .data-table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 11px; }
    .data-table th { background: #f1f5f9; padding: 8px 10px; text-align: left; font-weight: 600; border-bottom: 2px solid #1e3a5f; }
    .data-table td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; }
    .data-table .money { text-align: right; font-variant-numeric: tabular-nums; }
    .data-table .total-row { background: #f8fafc; font-weight: 600; }
    .source-cell { font-size: 10px; color: #666; }
    .annotation { font-size: 11px; color: #4a5568; font-style: italic; margin: 12px 0; padding: 10px; background: #f8fafc; border-left: 3px solid #00B5E2; border-radius: 0 6px 6px 0; }
    .appendix-link { font-size: 10px; color: #00B5E2; margin-top: 4px; }
    .appendix-link a { color: #00B5E2; text-decoration: none; }
    .back-link { font-size: 10px; margin-top: 8px; }
    .back-link a { color: #00B5E2; text-decoration: none; }
    .ref-link { font-size: 10px; color: #00B5E2; text-decoration: none; }
    .bar-chart { margin: 16px 0; }
    .bar-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .bar-label { width: 140px; font-size: 11px; text-align: right; flex-shrink: 0; }
    .bar-track { flex: 1; height: 20px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
    .bar-fill { height: 100%; background: #1e3a5f; border-radius: 4px; transition: width 0.3s; }
    .bar-value { width: 90px; font-size: 11px; text-align: right; font-variant-numeric: tabular-nums; }
    .waterfall-chart { display: flex; gap: 4px; align-items: flex-end; height: 200px; margin: 16px 0; padding-bottom: 24px; position: relative; }
    .wf-col { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; position: relative; }
    .wf-bar-container { flex: 1; width: 100%; position: relative; }
    .wf-bar { position: absolute; width: 80%; left: 10%; background: #1e3a5f; border-radius: 3px 3px 0 0; display: flex; align-items: center; justify-content: center; min-height: 16px; }
    .wf-bar-total { background: #00B5E2; }
    .wf-amount { font-size: 8px; color: white; font-weight: 600; text-align: center; white-space: nowrap; }
    .wf-label { font-size: 9px; text-align: center; margin-top: 4px; position: absolute; bottom: -20px; width: 100%; }
    .vdi-comparison { margin: 16px 0; }
    .vdi-bar-group { margin-bottom: 10px; }
    .vdi-bar-label { font-size: 11px; margin-bottom: 4px; }
    .vdi-stacked-bar { display: flex; height: 28px; border-radius: 4px; overflow: hidden; }
    .vdi-base { background: #6b7280; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: 600; }
    .vdi-platform { background: #00B5E2; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: 600; }
    .vdi-legend { font-size: 10px; color: #666; margin-top: 8px; }
    .vdi-legend-base { display: inline-block; width: 12px; height: 12px; background: #6b7280; border-radius: 2px; vertical-align: middle; }
    .vdi-legend-platform { display: inline-block; width: 12px; height: 12px; background: #00B5E2; border-radius: 2px; vertical-align: middle; }
    .confidence-bar { height: 24px; background: #f1f5f9; border-radius: 12px; overflow: hidden; margin: 8px 0; }
    .confidence-fill { height: 100%; background: linear-gradient(90deg, #22c55e, #00B5E2); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: 600; border-radius: 12px; min-width: 40px; }
    .flag-badge { font-size: 9px; padding: 1px 6px; border-radius: 4px; color: white; margin-left: 6px; }
    .flag-badge.flag-critical-risk { background: #ef4444; }
    .flag-badge.flag-aging---risk { background: #f59e0b; }
    .flag-badge.flag-legacy { background: #3b82f6; }
    .findings-list { padding-left: 20px; }
    .findings-list li { margin-bottom: 8px; font-size: 12px; }
    .observation { margin-bottom: 12px; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; }
    .observation h4 { font-size: 13px; color: #1e3a5f; }
    .observation p { font-size: 12px; color: #4a5568; margin-top: 4px; }
    .formula-block { margin: 12px 0; padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
    .formula-block h4 { margin-bottom: 6px; }
    .formula { font-family: monospace; font-size: 11px; color: #333; }
    .formula-values { font-family: monospace; font-size: 11px; color: #666; margin-top: 2px; }
    .formula-result { font-weight: 600; margin-top: 4px; }
    .table-footer { font-size: 11px; color: #666; margin-top: 4px; }
    .exec-text { font-size: 13px; line-height: 1.8; margin-bottom: 16px; }
    .methodology-stmt { font-size: 11px; color: #4a5568; margin-bottom: 12px; }
    .disclaimer { font-size: 10px; color: #888; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 12px; }
    .vendor-table td:first-child { max-width: 120px; }
    .page-footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 9px; color: #999; padding: 8px; }
    @media print {
      .section { page-break-inside: avoid; }
      .data-table { page-break-inside: auto; }
      .data-table tr { page-break-inside: avoid; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="cover-page">
    <div class="cover-bar"></div>
    <div class="cover-logo-row">
      ${clientLogoB64 ? `<img src="${clientLogoB64}" alt="Client Logo" />` : "<div></div>"}
      ${xentegraB64 ? `<img src="${xentegraB64}" alt="XenTegra" />` : "<div></div>"}
    </div>
    <div class="cover-title">${esc(config.reportTitle.split("—")[0].trim())}</div>
    <div class="cover-subtitle">${esc(config.reportTitle.includes("—") ? config.reportTitle.split("—").slice(1).join("—").trim() : "")}</div>
    <div class="cover-info">
      <div><span>Client:</span> ${esc(config.clientName)}</div>
      <div><span>Date:</span> ${esc(config.reportDate)}</div>
      <div><span>Prepared By:</span> ${esc(config.preparedBy)}, XenTegra</div>
    </div>
    <div class="cover-confidential">CONFIDENTIAL — Prepared exclusively for ${esc(config.clientName)}</div>
  </div>

  <div class="toc-page">
    <h2>Table of Contents</h2>
    ${tocHtml}
  </div>

  ${sectionsHtml}

  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
}
