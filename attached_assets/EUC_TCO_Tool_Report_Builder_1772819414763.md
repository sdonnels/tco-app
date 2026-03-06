# EUC Pillars – TCO Assessment Tool: Report Builder — Configurable Client Deliverable

> **Owner:** Stuart
> **Purpose:** Transform the Summary tab output from a dashboard into a configurable, professional consulting deliverable. The consultant selects which sections to include, and the tool generates a polished report with executive narrative, annotated visuals, methodology appendix, and internal cross-references. Output as PDF and/or branded Excel — something worth framing, not just skimming.

---

## OVERVIEW

The Report Builder is a new workflow on the Summary tab. When the consultant clicks "Generate Report," a configuration dialog lets them check/uncheck which sections to include. The tool then produces a structured, multi-section report that reads like a professional consulting deliverable — with prose, charts, tables, and an appendix that explains every number.

The goal: **A VP of IT receives this and forwards it to their CFO without editing it.**

---

## ENTRY POINT

### Where

On the Summary tab, add a prominent **"Generate Client Report"** button in the Export Options area (alongside the existing CSV, PDF, Audit Trail buttons). This is the primary client-facing export — it should be visually emphasized (e.g., solid XenTegra navy button, larger than the other export buttons).

### Configuration Dialog

When clicked, a modal opens with:

**Report Settings (top)**
- Client Name (pre-filled from project info)
- Report Title (default: "EUC Total Cost of Ownership — Baseline Assessment")
- Report Date (default: today)
- Prepared By (default: engineer name from project info)
- Include Client Logo: toggle (uses uploaded logo if available)

**Section Selector (middle) — checkboxes, all checked by default**

Each section has a checkbox, a label, and a one-line description. The consultant unchecks anything that doesn't apply.

```
☑ Executive Summary         Auto-generated narrative overview
☑ Environment Overview       User counts, endpoint mix, device breakdown
☑ EUC Vendor Landscape       All vendors across 7 pillars in a structured table
☑ Cost Breakdown             Category totals with annotated bar chart
☑ Cost Waterfall             Visual build-up from $0 to total TCO
☑ Per-User Economics         Cost per user, per endpoint, VDI vs Non-VDI
☑ VDI Analysis               VDI user premium, stacked comparison chart
☑ 3-Year Projection          "If nothing changes" cost trajectory
☑ Data Confidence            % from real inputs vs. assumptions, pillar heatmap
☑ Scoring & Risk Flags       Critical Risk, Aging, Legacy badges by sub-pillar
☑ Key Findings               Auto-generated algorithmic insights
☑ Observations               Consultant-entered qualitative notes
☑ Methodology & Appendix     How every number was calculated, with source links
☑ Glossary                   EUC terminology explained for non-technical readers
```

**Output Format (bottom)**
- PDF (default, recommended for sharing)
- Excel (branded workbook with one tab per section)
- Both

**"Generate Report" button** — produces the selected output.

---

## REPORT SECTIONS — DETAILED SPECIFICATION

### 1. Cover Page

Always included (not toggleable).

```
[Client Logo — if uploaded]              [XenTegra Logo]

EUC Total Cost of Ownership
Baseline Assessment

Client:       [Client Name]
Date:         [Report Date]
Prepared By:  [Engineer Name], XenTegra

CONFIDENTIAL — Prepared exclusively for [Client Name]
```

- XenTegra branding (navy bar, light blue accents)
- Minimal, clean, executive-appropriate

---

### 2. Table of Contents

Auto-generated from selected sections. Each entry is a clickable internal link (in PDF) or hyperlinked cell (in Excel).

```
Table of Contents

  1. Executive Summary .......................... 2
  2. Environment Overview ....................... 3
  3. EUC Vendor Landscape ....................... 4
  ...
  A. Methodology & Appendix .................... 12
  B. Glossary .................................. 15
```

---

### 3. Executive Summary (auto-generated narrative)

A 4–6 sentence prose paragraph generated from the assessment data. This is the section the VP copies into their board deck. No charts — just clear, confident language.

**Generation rules:**

Sentence 1 — Scope:
> "[Client Name] supports [user count] end users across [endpoint count] managed endpoints ([laptop count] laptops, [desktop count] desktops, [thin client count] thin clients)."

Sentence 2 — Total TCO:
> "The annual EUC Total Cost of Ownership is estimated at $[total TCO], or $[cost per user] per user per year."

Sentence 3 — Largest cost driver:
> "[Largest category name] is the single largest cost driver at [%] of total spend ($[amount])."

Sentence 4 — VDI (only if VDI users > 0):
> "[VDI user count] users ([VDI %] of the workforce) operate on virtual desktop platforms, adding a $[VDI premium] per-user premium over standard endpoint users."

Sentence 5 — Data confidence:
> "This baseline is built from [input %]% direct client data and [assumption %]% industry-standard assumptions, providing a [high/moderate/preliminary] confidence foundation."

Sentence 6 — MSP (only if MSP spend > 0):
> "Managed services account for $[MSP spend] annually ([MSP %]% of total TCO)."

**Tone:** Factual, neutral, consultant-grade. No recommendations, no sales language. Just validated findings.

---

### 4. Environment Overview

**Content:**
- Summary stats: Total Users, Total Endpoints, breakdown by device type
- Endpoint Mix pie chart (already exists — include with annotation)
- A 2×2 summary card layout:

```
┌─────────────────────┐  ┌─────────────────────┐
│   3,000              │  │   2,400              │
│   Total Users        │  │   Total Endpoints    │
└─────────────────────┘  └─────────────────────┘
┌─────────────────────┐  ┌─────────────────────┐
│   900                │  │   $1,298             │
│   VDI/DaaS Users     │  │   Cost per User      │
└─────────────────────┘  └─────────────────────┘
```

**Annotation below chart:**
> "Your endpoint fleet is [laptop-heavy / desktop-heavy / balanced / thin-client-heavy]. [Device type] represents [%] of all managed devices."

**Appendix link:** "See Appendix A.1 for how endpoint counts flow into the cost model."

---

### 5. EUC Vendor Landscape

A structured table showing every vendor the client reported across all 7 pillars. This is the "we heard you" validation — reflects their data back to them organized.

**Table format:**

| Pillar | Sub-Pillar | Vendor | Platform / Product | License Count | License Type / SKU |
|--------|-----------|--------|-------------------|---------------|-------------------|
| Endpoint Hardware & OS | 1.1 PC / AI / Mobile Hardware | Dell | Latitude, OptiPlex | — | — |
| Endpoint Hardware & OS | 1.2 Endpoint OS | Microsoft | Windows 11 | 2,470 | KW9-00632 |
| Access | 1.3 Secure Enterprise Browser | Island | Enterprise Browser | 1,200 | ISL-ENT-1200 |
| ... | ... | ... | ... | ... | ... |

- Only include sub-pillars where the client has at least one vendor entry
- Highlight any scoring flags (Critical Risk, Aging, Legacy) with colored badges inline
- Include a row count footer: "X vendors across Y sub-pillars"

**Annotation:**
> "This table reflects the platforms and vendors you reported. Scoring flags (if any) indicate products nearing or past end-of-life that may affect future costs and risk posture."

**Appendix link:** "See Appendix A.2 for how vendor costs feed into category calculations."

---

### 6. Cost Breakdown

**Content:**
- Category totals table with source indicators
- "Where Does the Money Go?" pie chart (already exists)
- Horizontal bar chart by category (already exists)

**Table format:**

| Cost Category | Annual Amount | % of Total | Source |
|--------------|--------------|-----------|--------|
| End-User Devices | $831,333 | 21.3% | Calculated from assumptions |
| Support & Operations | $176,000 | 4.5% | Calculated from assumptions |
| Licensing | $1,200,000 | 30.8% | Calculated from assumptions |
| Mgmt & Security | $480,000 | 12.3% | Calculated from assumptions |
| VDI / DaaS | $720,000 | 18.5% | Calculated from assumptions |
| Overhead (7%) | $238,513 | 6.1% | Calculated from subtotal |
| Managed Services | $250,000 | 6.4% | Direct client input |
| **Total Annual TCO** | **$3,895,847** | **100%** | |

Source column values: "Direct client input", "Calculated from assumptions", "EUC Pillar vendor costs", "Manual override"

**Annotation below chart:**
> "[Largest category] accounts for [%] of your total EUC spend. [Second largest] follows at [%]. Together, these two categories represent [combined %] of your baseline."

**Appendix link:** "See Appendix A.3 for the priority chain that determines how each category is calculated."

---

### 7. Cost Waterfall Chart (NEW)

A waterfall / bridge chart showing how the total TCO builds up from $0:

```
$0 → +Devices → +Support → +Licensing → +Mgmt → +VDI → +Overhead → +MSP → Total TCO
```

Each step is a bar segment showing the incremental addition. The running total increases with each category. Final bar shows the full total.

- Use brand colors: navy for category bars, light blue for the total bar
- Y-axis: dollar amounts
- X-axis: category names (abbreviated for space)

**Annotation:**
> "This waterfall shows how your $[total] annual TCO accumulates across cost categories. Each bar represents the incremental cost added by that category."

**Appendix link:** "See Appendix A.3 for individual category formulas."

---

### 8. Per-User Economics

**Content:**
- Summary metric cards (Cost per User, Cost per Endpoint)
- Monthly equivalents ($X/user/month — since budgets are often monthly)
- Comparison context line

```
┌──────────────────────────────┐  ┌──────────────────────────────┐
│   $1,299 / year              │  │   $108 / month               │
│   Cost per User              │  │   Cost per User              │
└──────────────────────────────┘  └──────────────────────────────┘
┌──────────────────────────────┐  ┌──────────────────────────────┐
│   $1,623 / year              │  │   $135 / month               │
│   Cost per Endpoint          │  │   Cost per Endpoint          │
└──────────────────────────────┘  └──────────────────────────────┘
```

**Annotation:**
> "Your fully-loaded EUC cost is $[cost/user/month] per user per month. This includes hardware lifecycle, software licensing, support operations, security, management tooling, and overhead."

**Appendix link:** "See Appendix A.4 for per-unit metric formulas."

---

### 9. VDI Analysis (only shown if VDI users > 0)

**Content:**
- VDI metrics cards: VDI Users, Fully Loaded VDI Cost, Non-VDI Cost, VDI Premium
- Stacked bar chart (from the calculation fix spec — base + platform)

**Annotation:**
> "Each VDI user costs $[fully loaded] annually — $[base] in shared base costs (hardware, support, licensing) plus $[platform] in virtual desktop platform costs. The VDI premium of $[premium] per user represents the incremental cost of delivering a virtual workspace."

**Appendix link:** "See Appendix A.5 for the corrected VDI allocation methodology."

---

### 10. 3-Year Projection (NEW)

A simple "if nothing changes" projection table using a configurable annual escalation rate (default: 4%, shown on the Assumptions tab).

**Table format:**

| | Year 1 (Current) | Year 2 | Year 3 | 3-Year Total |
|---|---|---|---|---|
| End-User Devices | $831,333 | $864,587 | $899,170 | $2,595,090 |
| Support & Ops | $176,000 | $183,040 | $190,362 | $549,402 |
| ... | ... | ... | ... | ... |
| **Total** | **$3,895,847** | **$4,051,681** | **$4,213,748** | **$12,161,276** |

Include a small line chart showing the trajectory.

**Annotation:**
> "At a [4]% annual escalation rate, your EUC spend will reach $[year 3] by Year 3 — a cumulative $[3-year total] over three years. This projection assumes no changes to your environment, vendor mix, or operational model."

**Appendix link:** "See Appendix A.6 for projection assumptions and escalation methodology."

**Note:** Add an "Annual Escalation Rate" assumption (default 4%) to the Assumptions tab so the consultant can adjust it per engagement.

---

### 11. Data Confidence (NEW)

**Content:**
- A confidence badge: "HIGH / MODERATE / PRELIMINARY" based on % of data from client inputs
  - >70% from inputs = HIGH
  - 40–70% = MODERATE
  - <40% = PRELIMINARY
- Percentage bar: "62% from your data, 38% from industry assumptions"
- Pillar Coverage Heatmap — a grid showing which pillars have real vendor data (green), which are estimated from assumptions (amber), and which have no data (gray)

**Heatmap format:**

| Pillar | Sub-Pillar | Vendor Data | Cost Data | Status |
|--------|-----------|-------------|-----------|--------|
| Endpoint HW & OS | 1.1 Hardware | ✓ Dell | — | 🟡 Partial |
| Endpoint HW & OS | 1.2 OS | ✓ Microsoft | — | 🟡 Partial |
| Access | 1.3 Browser | ✓ Island | $48,000 | 🟢 Complete |
| ... | ... | ... | ... | ... |
| Security | 4.1 Endpoint | — | — | ⚪ No data |

**Annotation:**
> "This assessment is rated **[MODERATE]** confidence — [62]% of the baseline is derived from data you provided directly. The remaining [38]% uses industry-standard assumptions (detailed in the Assumptions section). Areas marked amber or gray represent opportunities to refine the baseline with actual spend data."

This section is strategically valuable — it naturally sets up the follow-up engagement: "Let's fill in those amber cells."

**Appendix link:** "See Appendix A.7 for how confidence is calculated and what each source type means."

---

### 12. Scoring & Risk Flags (NEW)

**Content:**
- A table of any sub-pillars with scoring flags (Critical Risk, Aging/Risk, Legacy)
- Only shown if at least one flag exists

**Table format:**

| Sub-Pillar | Vendor / Platform | Flag | What It Means |
|-----------|------------------|------|---------------|
| 1.2 Endpoint OS | IGEL OS 11 | 🔴 Critical Risk | Product is end-of-life or imminently unsupported |
| 2.2 VDI | Citrix CVAD 7 1912 LTSR | 🟡 Aging/Risk | Product is aging; support timeline is narrowing |
| 2.2 VDI | Omnissa Horizon 7 | 🔵 Legacy | Product is legacy; functional but no longer strategic |

**Annotation:**
> "[X] platforms in your environment carry risk or legacy flags. These do not directly affect today's TCO baseline but may signal upcoming costs for migration, extended support, or security exposure."

**Appendix link:** "See Appendix A.8 for scoring flag definitions and criteria."

---

### 13. Key Findings (auto-generated algorithmic insights) (NEW)

A numbered list of 5–8 findings generated from rules applied to the data. Each finding is a single sentence with supporting context.

**Rules engine (examples):**

1. **Largest category:** "[Category] represents [%] of total TCO — the largest single cost driver."
2. **VDI premium:** "VDI users carry a $[premium]/year premium over standard users, driven by [vendor] platform costs."
3. **Device-heavy:** "End-user devices account for [%] of spend. At [endpoint count] endpoints on a [refresh]-year cycle, hardware lifecycle management is a significant cost lever."
4. **Licensing concentration:** "Software licensing ($[amount]) exceeds [%] of total spend, suggesting bundled enterprise agreements may offer consolidation opportunities."
5. **MSP dependency:** "[%] of your TCO ($[amount]) is outsourced to managed services providers."
6. **Thin client presence:** "[%] of endpoints are thin clients, typically indicating a VDI-forward strategy."
7. **Scoring flags:** "[X] platforms carry aging or critical risk flags — see the Risk section for details."
8. **Single-vendor concentration:** "[Vendor] appears in [X] of [Y] sub-pillars, representing significant vendor concentration."
9. **Data gaps:** "[X] of [Y] sub-pillars have no vendor data — filling these in will improve baseline accuracy."

Only include findings that are actually relevant (e.g., don't mention VDI if no VDI users, don't mention MSP if spend is $0).

**No annotation needed — the findings ARE the annotation.**

**Appendix link per finding:** Each finding links to the relevant appendix section.

---

### 14. Observations

The consultant-entered observations from the Observations tab. Displayed as-is with observation title and details.

If no observations exist, this section is hidden (not shown as empty).

---

### 15. Methodology & Appendix

The appendix is the credibility engine. It answers "where did that number come from?" for every metric in the report. Each appendix sub-section is linkable from the main report via internal hyperlinks.

**Structure:**

**A.1 — Environment & Endpoint Methodology**
- How endpoints are counted (laptops + desktops + thin clients)
- How user count is used in per-user calculations

**A.2 — EUC Pillar Cost Flow**
- How vendor annual costs from the Hexagrid feed into category calculations
- The priority chain: Override > EUC Pillar > Assumption

**A.3 — Category Calculation Formulas**
For each of the 6 categories, show:
- The formula in plain English
- The formula with actual values substituted
- The source (Override / EUC Pillar / Assumption)
- The assumptions used (with their values)

Example:
```
End-User Devices (Annual)
  Formula:  (Laptops × Laptop Cost ÷ Laptop Refresh)
          + (Desktops × Desktop Cost ÷ Desktop Refresh)
          + (Thin Clients × TC Cost ÷ TC Refresh)

  Values:   (1,500 × $1,200 ÷ 3) + (500 × $1,100 ÷ 3) + (400 × $600 ÷ 5)

  Result:   $600,000 + $183,333 + $48,000 = $831,333

  Source:   Calculated from assumptions (no override provided)
```

**A.4 — Per-Unit Metric Formulas**
- Cost per Endpoint = Total TCO ÷ Total Endpoints
- Cost per User = Total TCO ÷ User Count
- Monthly Cost per User = Cost per User ÷ 12

**A.5 — VDI Allocation Methodology**
- Base Cost per User formula
- VDI Platform Cost per User formula
- Fully Loaded VDI Cost formula
- VDI Premium = Platform Cost only (incremental)
- Explanation of why base costs are shared by all users

**A.6 — Projection Methodology**
- Escalation rate used
- Formula: Year N = Year 1 × (1 + rate)^(N-1)
- Disclaimer: "This is a steady-state projection, not a forecast."

**A.7 — Data Confidence Methodology**
- How % from inputs is calculated (count of fields with user-provided data ÷ total fields)
- Confidence tier definitions (High/Moderate/Preliminary)
- What "industry-standard assumption" means

**A.8 — Scoring Flag Definitions**
- Critical Risk: Product is end-of-life or imminently unsupported
- Aging/Risk: Product is aging; support timeline is narrowing
- Legacy: Product is legacy; functional but no longer strategic

**A.9 — Assumptions Reference**
Full table of all 15 assumptions with:
- Name, default value, current value (if overridden), source/rationale

---

### 16. Glossary (NEW)

A reference table of EUC terminology for non-technical readers (CFOs, procurement).

| Term | Definition |
|------|-----------|
| TCO | Total Cost of Ownership — the full annual cost of operating an IT environment |
| EUC | End-User Computing — the technology stack that supports knowledge workers |
| VDI | Virtual Desktop Infrastructure — centrally hosted desktops accessed over a network |
| DaaS | Desktop as a Service — cloud-hosted virtual desktops |
| UEM | Unified Endpoint Management — tools for managing devices, OS, and policies |
| DEX | Digital Employee Experience — tools that measure and improve the end-user IT experience |
| SASE | Secure Access Service Edge — cloud-delivered security + networking |
| IAM | Identity & Access Management — authentication and authorization systems |
| MSP | Managed Services Provider — third-party IT operations provider |
| Endpoint | Any managed device (laptop, desktop, thin client) |
| Sub-Pillar | A technology sub-category within the 7-pillar EUC framework |

---

## INTERNAL HYPERLINKS

Throughout the report, cross-references link body content to appendix sections. In PDF, these are clickable internal links. In Excel, they're HYPERLINK() formulas pointing to named ranges on the Appendix tab.

**Format in body text:**
> "See Appendix A.3" — clickable, jumps to that section

**Format in appendix:**
> "↩ Back to Cost Breakdown" — clickable, returns to the referring section

Every chart, table, and metric card in the main report should have a small "How was this calculated?" link that jumps to the relevant appendix sub-section.

---

## WHAT ELSE TO ADD (CONSULTANT ENHANCEMENTS)

### Recommended Next Steps (auto-generated)

A short section at the end (before the appendix) with 3–4 suggested next steps based on the data:

- If Data Confidence < 70%: "Refine the baseline by providing actual spend data for the [X] sub-pillars currently using assumptions."
- If scoring flags exist: "Evaluate migration paths for [X] platforms carrying risk flags before support timelines expire."
- If VDI users > 0: "Consider a detailed VDI modernization analysis to evaluate platform alternatives and potential savings."
- If MSP spend > 15% of TCO: "Review managed services scope and pricing against the baseline to assess cost efficiency."
- Always: "Use this baseline as the foundation for any future-state TCO comparison or ROI analysis."

### Disclaimer / Caveats

Standard consulting disclaimer at the bottom of the executive summary:

> "This assessment represents a current-state baseline estimate based on available data and industry-standard assumptions. It is not a forecast, recommendation, or guarantee. All assumption-based values are explicitly identified. This report was prepared by XenTegra for [Client Name] and is intended for internal planning purposes only."

### Methodology Statement (brief, in Executive Summary)

One sentence establishing credibility:

> "This baseline was produced using XenTegra's 7-pillar EUC assessment framework, incorporating direct client data, vendor cost analysis, and industry-benchmarked assumptions."

---

## OUTPUT FORMATS

### PDF

- Generated via the browser print dialog or a PDF library
- Include XenTegra branding (navy headers, light blue accents)
- Page numbers in footer: "Page X of Y"
- Footer: "XenTegra | Confidential | Prepared for [Client Name]"
- Internal hyperlinks for TOC and appendix cross-references
- Charts rendered as images (Recharts → canvas → image)
- Filename: `TCO_Baseline_Report_[ClientName]_[Date].pdf`

### Excel

- One tab per report section
- Cover Sheet tab (branded, same as intake form style)
- Charts as embedded Excel charts where possible, or as images
- Appendix tab with named ranges for internal HYPERLINK() references
- Tab colors matching brand (navy, light blue)
- Filename: `TCO_Baseline_Report_[ClientName]_[Date].xlsx`

---

## DOCUMENTATION UPDATE

After implementation, update `DOCUMENTATION.md`:

- Add a "Report Builder" section under Export Options
- Document the section selector and all available sections
- Document the auto-generation rules for Executive Summary and Key Findings
- Document the 3-Year Projection assumption (escalation rate)
- Document the Data Confidence calculation
- Add a changelog entry

---

## QA CHECKLIST

### Configuration Dialog
- [ ] All sections toggleable via checkboxes
- [ ] Unchecked sections are excluded from generated report
- [ ] Client name, report title, date, engineer pre-filled from project info
- [ ] Logo toggle works (included when checked and logo exists)

### Executive Summary
- [ ] Auto-generates from data — no manual input needed
- [ ] Sentence logic handles edge cases (no VDI, no MSP, all assumptions)
- [ ] Tone is neutral and factual — no recommendations or sales language

### Vendor Landscape Table
- [ ] All vendors from hexagridEntries appear
- [ ] Only populated sub-pillars shown
- [ ] Scoring flags displayed inline

### Cost Waterfall
- [ ] Builds from $0 to total in correct category order
- [ ] Each step shows correct incremental amount
- [ ] Total bar matches Total Annual TCO

### 3-Year Projection
- [ ] Uses escalation rate from assumptions (default 4%)
- [ ] Year 1 matches current TCO
- [ ] 3-year total = sum of all three years
- [ ] Trajectory line chart renders correctly

### Data Confidence
- [ ] Percentage calculation is correct
- [ ] Confidence tier matches threshold (High/Moderate/Preliminary)
- [ ] Pillar heatmap shows correct green/amber/gray status per sub-pillar

### Scoring & Risk Flags
- [ ] Only shown when at least one flag exists
- [ ] All flagged platforms appear with correct badge color
- [ ] Hidden entirely when no flags exist

### Key Findings
- [ ] Only relevant findings are generated (no VDI finding if no VDI users)
- [ ] Each finding links to the correct appendix section

### Appendix
- [ ] Every category has its formula shown with substituted values
- [ ] Every cross-reference link in the body correctly jumps to the appendix
- [ ] "Back to" links return to the correct body section
- [ ] Assumptions table shows all 15 values with defaults and overrides

### Output Formats
- [ ] PDF renders cleanly with page numbers, headers, footers
- [ ] Excel has correct tab structure, branding, named ranges
- [ ] Internal hyperlinks work in both PDF and Excel
- [ ] Filename follows convention
