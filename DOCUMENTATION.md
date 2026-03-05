# TCO Baseline Micro-Assessment Tool

## Complete Reference Documentation

**Version:** 2.4
**Last Updated:** March 2026
**Purpose:** Vendor-neutral, current-state Total Cost of Ownership baseline for enterprise End User Computing (EUC) environments

---

## Table of Contents

1. [Overview](#overview)
2. [Pages & Navigation](#pages--navigation)
3. [Input Sections](#input-sections)
4. [EUC Pillars & Platforms](#euc-pillars--platforms)
5. [Assumptions Reference](#assumptions-reference)
6. [Calculations & Derived Metrics](#calculations--derived-metrics)
7. [Visualizations](#visualizations)
8. [Export Options](#export-options)
9. [Import Functions](#import-functions)
10. [Tools Tab & Menu](#tools-tab--menu)
11. [Debug Mode & Audit Trace](#debug-mode--audit-trace)
12. [Draft Management](#draft-management)
13. [Data Model](#data-model)
14. [API Endpoints](#api-endpoints)
15. [Technical Details](#technical-details)

---

## Overview

The TCO Baseline Micro-Assessment Tool is a vendor-neutral, solution-agnostic calculator that establishes a credible, defensible TCO baseline for enterprise End User Computing (EUC) environments. It produces a single source of truth for what a customer's environment actually costs today.

### Key Characteristics

- **Vendor-Neutral**: No product recommendations or sales narratives
- **Current-State Only**: Establishes baseline without future-state projections
- **Transparent**: Every number is traceable and explainable
- **Defensible**: All math is auditable with explicit assumptions
- **Client-Side**: All data stays in the browser; no server storage

### What This Tool Does NOT Do

- Calculate ROI or savings projections
- Recommend solutions or products
- Model future-state scenarios
- Store customer data on servers

---

## Pages & Navigation

### Route Structure

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `TcoBaseline` | Main application (single-page with tabbed navigation) |
| `*` | `NotFound` | 404 error page |

### Tab Navigation

The application uses internal tabbed navigation within the `/` route:

| Tab Value | Display Name | Component | Description |
|-----------|-------------|-----------|-------------|
| `home` | Home | `TcoHome` | Landing screen, assessment options, recent activity / draft management |
| `inputs` | Inputs | Inline | Data entry: project info, environment, EUC pillars, overrides, managed services, observations |
| `assumptions` | Assumptions | Inline | View and override 15 default calculation values |
| `observations` | Observations | Inline | Qualitative findings and notes |
| `summary` | Summary | `TcoCharts` | Dashboard with metrics, visualizations, and export options |
| `readme` | Tools | Inline | Intake form export/import, documentation downloads, quick start guide |
| `audit` | Audit / Trace | `AuditTracePage` | Field-level traceability (only visible when Debug Mode is enabled) |

Forward/back navigation buttons appear at the bottom of all non-home tabs. Navigation scrolls to the top of the page.

---

## Input Sections

### Project Information

| Field | Type | Key | Description |
|-------|------|-----|-------------|
| Client Name | Text | `project.clientName` | Customer organization name |
| Assessment Date | Date | `project.assessmentDate` | Date of baseline assessment |
| Customer Champion | Text | `project.customerChampion` | Primary customer contact |
| XenTegra Engineer | Text | `project.engineerName` | Conducting engineer name |
| Client Logo | Image upload | localStorage `tco-client-logo` | Logo for reports/exports only (not displayed in app UI) |

### Environment Facts

| Field | Type | Key | Validation | Description |
|-------|------|-----|------------|-------------|
| User Count | Number | `environment.userCount` | Non-negative integer | Total end users in the environment |
| Laptop Count | Number | `environment.laptopCount` | Non-negative integer | Number of managed laptops |
| Desktop Count | Number | `environment.desktopCount` | Non-negative integer | Number of managed desktops |
| Thin Client Count | Number | `environment.thinClientCount` | Non-negative integer | Number of thin client devices |

**Derived:** Total Endpoints = Laptop Count + Desktop Count + Thin Client Count

### EUC Pillars - Platform Cost Rollups (Optional Overrides)

Manual overrides for total annual spend per category. When provided, these override both EUC Pillar vendor costs and calculated assumption values.

| Field | Type | Key | Description |
|-------|------|-----|-------------|
| End-User Devices (Annual) | Currency | `categoryRollups.endUserDevicesAnnual` | Hardware lifecycle costs |
| Support & Ops (Annual) | Currency | `categoryRollups.supportOpsAnnual` | Labor and support costs |
| Licensing (Annual) | Currency | `categoryRollups.licensingAnnual` | Software license costs |
| Device, OS & User Mgmt + Security (Annual) | Currency | `categoryRollups.mgmtSecurityAnnual` | UEM, DEX, and security tool costs |
| Virtual Desktops & Applications (Annual) | Currency | `categoryRollups.vdiDaasAnnual` | Virtual desktop platform costs |
| Overhead (Annual) | Currency | `categoryRollups.overheadAnnual` | Administrative overhead costs |

### Managed Services & Outsourcing

| Field | Type | Key | Description |
|-------|------|-----|-------------|
| Total Annual MSP Spend | Currency | `managedServices.totalAnnualSpend` | Total managed services budget |
| Outsourced Endpoint Management | Checkbox | `managedServices.outsourcedEndpointMgmt` | UEM, imaging, lifecycle |
| Outsourced Security/EDR/SOC | Checkbox | `managedServices.outsourcedSecurity` | Security operations |
| Outsourced Patching & Updates | Checkbox | `managedServices.outsourcedPatching` | Patch management |
| Tier 1 Support / Helpdesk | Checkbox | `managedServices.outsourcedHelpdesk` | Helpdesk support |
| Tier 2+ Support / Engineering | Checkbox | `managedServices.outsourcedTier2Plus` | Escalation engineering |
| Other (with description) | Checkbox + Text | `managedServices.outsourcedOther` + `managedServices.otherDescription` | Custom outsourced function |

**MSP Provider Selection:**

| Field | Type | Key |
|-------|------|-----|
| MSP Provider: XenTegra | Checkbox | `managedServices.mspXentegra` |
| MSP Provider: Other | Checkbox | `managedServices.mspOther` |
| Other MSP Provider Names | Text (comma-separated) | `managedServices.mspOtherProviders` |

### Observations & Notes

Array of structured observation entries:

| Field | Type | Description |
|-------|------|-------------|
| Observation | Text | Brief observation title |
| Details | Text | Extended description |

Stored as `observations.notes: { observation: string; details: string }[]`

---

## EUC Pillars & Platforms

The EUC Pillars section organizes vendor/platform data across 7 pillars and 17 sub-pillars. Each entry supports:

- **Vendor** (dropdown with "Other" option)
- **Platform** (cascading dropdown based on vendor)
- **Version** (cascading dropdown, where applicable)
- **Annual Cost** (currency, optional)
- **License Count** (number, optional)
- **License SKU** (text, optional)
- **User Count** (number, DaaS/VDI sub-pillars only)
- **Scoring Flag** (Critical Risk, Aging/Risk, Legacy)
- **SWOT Override** (Strength, Weakness, Opportunity, Threat; Secure Enterprise Browser only)

### Pillar 1: Endpoint Hardware & OS

#### 1.1 PC / AI / Mobile Hardware

| Vendor | Platforms |
|--------|-----------|
| Apple | macOS, iPad, iPhone |
| Dell | Latitude, OptiPlex, Precision |
| HP | EliteBook, ProBook, ZBook |
| Lenovo | ThinkCentre, ThinkPad |
| Other | (free text) |

#### 1.2 Endpoint OS

| Vendor | Platforms | Versions |
|--------|-----------|----------|
| Apple | iOS, iPadOS, macOS | - |
| IGEL | OS 12, OS 11 (Critical Risk) | - |
| Microsoft | Windows 10 IoT, Windows 11 | - |
| Stratodesk | NoTouch OS (Critical Risk) | - |
| Unicon | eLux | - |
| Other | (free text) | - |

### Pillar 2: Access

#### 1.3 Secure Enterprise Browser

| Vendor | Platforms |
|--------|-----------|
| Citrix | Secure Private Access |
| Dizzion | Halo |
| Island | Island Enterprise Browser |
| Palo Alto Networks (Talon) | Talon Enterprise Browser |
| Surf | Surf Security Browser |
| Other | (free text) |

**Note:** This sub-pillar includes a SWOT Override dropdown (Strength/Weakness/Opportunity/Threat).

#### VPN

| Vendor | Platforms |
|--------|-----------|
| Cisco | AnyConnect, Secure Client |
| Fortinet | FortiClient VPN |
| Palo Alto Networks | GlobalProtect |
| Zscaler | Zscaler Private Access (ZPA) |
| Other | (free text) |

### Pillar 3: Virtual Desktops & Applications

#### 2.1 DaaS (Cloud PC / Hosted Desktop)

| Vendor | Platforms |
|--------|-----------|
| Apporto | Apporto Cloud Desktops |
| AWS | Amazon WorkSpaces, AppStream 2.0 |
| Citrix | DaaS, DaaS Hybrid |
| Dizzion | Cloud PC, DaaS |
| Kasm Technologies | Kasm Workspaces |
| Microsoft | Azure Virtual Desktop, Windows 365 |
| Omnissa | Horizon Cloud |
| Parallels | Parallels RAS |
| Workspot | Enterprise Desktop Cloud |
| Other | (free text) |

**Extra field:** User Count (number of DaaS users)

#### 2.2 VDI (On-Premises)

| Vendor | Platforms | Versions |
|--------|-----------|----------|
| Citrix | Citrix Virtual Apps and Desktops | 7 2402 LTSR, 7 2203 LTSR, 7 1912 LTSR (Aging/Risk) |
| Omnissa | Horizon | Horizon 8 ESB (2111-2503), Horizon 7 (Legacy) |
| Parallels | Parallels RAS | 20 LTS, 19 LTS, 19.x CR, 20.x CR |
| Other | (free text) | (free text) |

**Extra field:** User Count (number of VDI users)

### Pillar 4: Device, OS & User Management

#### 3.1 Unified Endpoint Management (UEM)

| Vendor | Platforms |
|--------|-----------|
| Citrix | Workspace Environment Management (WEM) |
| Ivanti | Endpoint Manager, Neurons for UEM |
| JAMF | Jamf Pro |
| Kaseya | VSA |
| Microsoft | Co-Managed, Intune, SCCM |
| Omnissa | Workspace ONE UEM |
| PDQ | PDQ Connect, PDQ Deploy |
| Recast Software | Endpoint Insights, Right Click Tools |
| Tanium | Tanium Endpoint Management |
| Other | (free text) |

#### 3.2 Digital Employee Experience (DEX)

| Vendor | Platforms |
|--------|-----------|
| ControlUp | (no specific platforms listed) |
| Lakeside | (no specific platforms listed) |
| Liquidware | (no specific platforms listed) |
| Nexthink | (no specific platforms listed) |
| Omnissa | (no specific platforms listed) |
| Other | (free text) |

### Pillar 5: Security

#### 4.1 Endpoint Security

| Vendor | Platforms |
|--------|-----------|
| CrowdStrike | (no specific platforms listed) |
| Microsoft | (no specific platforms listed) |
| SentinelOne | (no specific platforms listed) |
| Other | (free text) |

#### 4.2 Identity & Access Management (IAM)

| Vendor | Platforms |
|--------|-----------|
| Microsoft | (no specific platforms listed) |
| Okta | (no specific platforms listed) |
| Ping Identity | (no specific platforms listed) |
| Other | (free text) |

#### 4.3 Secure Access Service Edge (SASE)

| Vendor | Platforms |
|--------|-----------|
| Cato Networks | (no specific platforms listed) |
| Netskope | (no specific platforms listed) |
| Zscaler | (no specific platforms listed) |
| Other | (free text) |

### Pillar 6: App Management

#### 5.1 App Layering & Streaming

| Vendor | Platforms |
|--------|-----------|
| Citrix | (no specific platforms listed) |
| Liquidware | (no specific platforms listed) |
| Omnissa | (no specific platforms listed) |
| Other | (free text) |

#### 5.2 Application Readiness & Packaging

| Vendor | Platforms |
|--------|-----------|
| Flexera | (no specific platforms listed) |
| Recast Software | (no specific platforms listed) |
| Rimo3 | (no specific platforms listed) |
| Other | (free text) |

#### 5.3 Apps Config & Asset Management

| Vendor | Platforms |
|--------|-----------|
| ManageEngine | (no specific platforms listed) |
| Microsoft | (no specific platforms listed) |
| Nexthink | (no specific platforms listed) |
| Recast Software | (no specific platforms listed) |
| Other | (free text) |

### Pillar 7: Collaboration, AI & Applications

#### 6.1 Workspace AI

| Vendor | Platforms |
|--------|-----------|
| Adobe | (no specific platforms listed) |
| Amazon | (no specific platforms listed) |
| Anthropic | (no specific platforms listed) |
| Apple | (no specific platforms listed) |
| Atlassian | (no specific platforms listed) |
| Cisco | (no specific platforms listed) |
| Google | (no specific platforms listed) |
| IBM | (no specific platforms listed) |
| Meta | (no specific platforms listed) |
| Microsoft | (no specific platforms listed) |
| Notion | (no specific platforms listed) |
| OpenAI | (no specific platforms listed) |
| Perplexity | (no specific platforms listed) |
| Salesforce | (no specific platforms listed) |
| ServiceNow | (no specific platforms listed) |
| Slack | (no specific platforms listed) |
| Zoom | (no specific platforms listed) |
| Other | (free text) |

#### 6.2 Unified Communications & Collaboration

| Vendor | Platforms |
|--------|-----------|
| Cisco | Webex Suite |
| Google | Chat, Meet |
| Microsoft | Teams |
| RingCentral | MVP, RingCX |
| Slack | Slack Enterprise |
| Zoom | Zoom Workplace |
| Other | (free text) |

---

## Assumptions Reference

15 values with industry-sourced defaults. All are overridable by the user on the Assumptions tab.

### Device Refresh Cycles (3 values)

| Assumption | Default | Key | Source |
|------------|---------|-----|--------|
| Laptop Refresh Years | 3 | `deviceRefreshYears.laptop` | EUC TCO Analysis, Hardware Section |
| Desktop Refresh Years | 3 | `deviceRefreshYears.desktop` | EUC TCO Analysis, Hardware Section |
| Thin Client Refresh Years | 5 | `deviceRefreshYears.thinClient` | EUC TCO Analysis, Hardware Section |

### Device Unit Costs (3 values)

| Assumption | Default | Key | Source |
|------------|---------|-----|--------|
| Laptop Unit Cost | $1,200 | `deviceUnitCost.laptop` | EUC TCO Analysis, Endpoint Acquisition Table |
| Desktop Unit Cost | $1,100 | `deviceUnitCost.desktop` | EUC TCO Analysis, Endpoint Acquisition Table |
| Thin Client Unit Cost | $600 | `deviceUnitCost.thinClient` | EUC TCO Analysis, Infrastructure Section |

### Support Operations (4 values)

| Assumption | Default | Key | Source |
|------------|---------|-----|--------|
| Avg Ticket Handling Hours | 0.5 | `supportOps.avgTicketHandlingHours` | EUC TCO Analysis, Labor Section |
| Deployment Hours/Device | 1.5 | `supportOps.deploymentHoursPerDevice` | EUC TCO Analysis, Labor Section |
| Blended Labor Rate ($/hr) | $50 | `supportOps.blendedLaborRateHourly` | EUC TCO Analysis, True Cost of Support Personnel |
| Tickets/Endpoint/Year | 2 | `supportOps.ticketsPerEndpointPerYear` | EUC TCO Analysis, Labor Section |

### Licensing (2 values)

| Assumption | Default | Key | Source |
|------------|---------|-----|--------|
| Avg Cost/User/Year | $400 | `licensing.avgCostPerUserPerYear` | M365 E3 licensing benchmarks |
| Coverage Percentage | 100% | `licensing.coveragePct` | Full coverage baseline |

### Management & Security (1 value)

| Assumption | Default | Key | Source |
|------------|---------|-----|--------|
| Cost/Endpoint/Year | $200 | `mgmtSecurity.costPerEndpointPerYear` | Industry benchmark |

### VDI/DaaS (1 value)

| Assumption | Default | Key | Source |
|------------|---------|-----|--------|
| Platform Cost/VDI User/Year | $800 | `vdi.platformCostPerVdiUserPerYear` | VDI platform licensing comparisons |

### Overhead (1 value)

| Assumption | Default | Key | Source |
|------------|---------|-----|--------|
| Percentage of Subtotal | 7% | `overhead.pctOfTotal` | IT overhead benchmark |

---

## Calculations & Derived Metrics

### Priority Chain

For each cost category, values are resolved in this order:
1. **Override** (manual input in Platform Cost Rollups) - highest priority
2. **EUC Pillar costs** (sum of vendor annual costs for that category)
3. **Assumption-based calculation** (using defaults or user-overridden assumptions) - lowest priority

### Category Calculations

#### 1. End-User Devices (Annual)

```
= (Laptops x LaptopUnitCost / LaptopRefreshYears)
+ (Desktops x DesktopUnitCost / DesktopRefreshYears)
+ (ThinClients x ThinClientUnitCost / ThinClientRefreshYears)
```

Override source: `categoryRollups.endUserDevicesAnnual`

#### 2. Support & Operations (Annual)

```
Ticket Labor = Endpoints x TicketsPerEndpoint x AvgTicketHandlingHours x LaborRate
Deploy Labor = Endpoints x DeploymentHoursPerDevice x LaborRate / DeviceRefreshYears
Total = Ticket Labor + Deploy Labor
```

Override source: `categoryRollups.supportOpsAnnual`

#### 3. Licensing (Annual)

```
= UserCount x AvgCostPerUserPerYear x CoveragePct
```

Override source: `categoryRollups.licensingAnnual`

#### 4. Management & Security (Annual)

```
From Assumptions: Endpoints x CostPerEndpointPerYear
From EUC Pillars: Sum of (Device, OS & User Management pillar costs + Security pillar costs)
```

Priority: Override > EUC Pillar sum > Assumption calculation
Override source: `categoryRollups.mgmtSecurityAnnual`

#### 5. VDI/DaaS (Annual)

```
From Assumptions: VDI Users x PlatformCostPerVdiUserPerYear
From EUC Pillars: Sum of Virtual Desktops & Applications pillar costs
```

VDI Users = `vdiUserCounts.daas + vdiUserCounts.vdi`
Priority: Override > EUC Pillar sum > Assumption calculation
Override source: `categoryRollups.vdiDaasAnnual`

#### 6. Overhead (Annual)

```
= Subtotal (categories 1-5) x OverheadPct
```

Override source: `categoryRollups.overheadAnnual`

### Summary Totals

```
Total Annual TCO = Sum of all 6 categories + MSP Spend
```

### Per-Unit Metrics

| Metric | Formula |
|--------|---------|
| Cost per Endpoint | Total Annual TCO / Total Endpoints |
| Cost per User | Total Annual TCO / User Count |
| VDI Cost per VDI User | VDI/DaaS Value / VDI User Count |
| Non-VDI Cost per User | (Total Annual TCO - VDI/DaaS Value) / User Count |
| VDI User Premium | VDI Cost per VDI User - Non-VDI Cost per User |

---

## Visualizations

Five interactive charts appear on the Summary tab, built with Recharts:

### 1. Endpoint Mix (Pie Chart)

Shows distribution of device types (Laptops, Desktops, Thin Clients) as percentage of total endpoints.

### 2. Where Money Goes (Pie Chart)

Shows percentage breakdown across the 6 cost categories plus MSP spend.

### 3. Cost by Category (Horizontal Bar Chart)

Displays absolute dollar amounts for each cost category with color coding for input vs. assumed sources.

### 4. VDI vs Non-VDI Comparison (Bar Chart)

Side-by-side comparison of VDI Cost per VDI User vs. Non-VDI Cost per User.

### 5. Cost Source (Bar Chart)

Shows what percentage of the total baseline comes from user-provided inputs vs. assumption-based calculations.

---

## Export Options

Five export formats plus a bundled download:

### 1. CSV Export

**Format:** `.csv`
**Filename:** `tco-baseline-{client-name}-{date}.csv`
**Trigger:** Summary tab "CSV (spreadsheet)" button
**Contents:** Project info, environment, cost categories with sources, summary metrics, all 15 assumptions, EUC Pillar vendor entries

### 2. PDF Export

**Format:** PDF (via browser print dialog)
**Trigger:** Summary tab "PDF (print-ready)" button
**Contents:** Professional formatted report with header, disclaimer, environment summary, cost breakdown table, HTML/CSS rendered charts, per-unit metric cards, observations. Client logo included if uploaded.

### 3. Audit Trail Export

**Format:** `.txt`
**Filename:** `tco-audit-trail-{client-name}-{date}.txt`
**Trigger:** Summary tab "Audit Trail" button
**Contents:** Box-drawing formatted text report with every input, calculation step, assumption value, source indicators (INPUT/DERIVED/EUC PILLAR), and per-unit metrics. Full traceability record.

### 4. Assumption Justifications Export

**Format:** `.txt`
**Filename:** `tco-assumption-justifications-{date}.txt`
**Trigger:** Assumptions tab "Export Justifications" button
**Contents:** Industry-sourced rationales for each of the 15 default assumption values, citing Gartner, IDC, and vendor benchmarks.

### 5. Audit Trace (Excel)

**Format:** `.xlsx`
**Filename:** `TCO_Audit_Trace_{ClientName}_{Date}.xlsx`
**Trigger:** Audit / Trace tab "Export Audit Trace" button (Debug Mode only)
**Contents:** Multi-sheet workbook with one sheet per section, showing field names, current values, sources, formulas, and dependency links.

### 6. Download All (.zip)

**Format:** `.zip`
**Trigger:** Summary tab "Download All (.zip)" button
**Contents:** Archive containing CSV, Audit Trail, and Justifications exports.

---

## Import Functions

### Excel Intake Import (.xlsx)

**Trigger:** Tools tab "Import Responses" button, or Tools menu "Import Intake Data"
**Accepts:** `.xlsx` files matching the intake form template structure

**Parser:** `parseIntakeImport()` in `client/src/lib/intake-excel.ts`

**Sheet matching** (case-insensitive, partial matching):
- "Cover Sheet" or "Cover" -> Client Name, Project Name
- "Environment Facts" or "Environment" -> Environment fields
- "EUC Pillars" or "Pillars" -> Vendor/platform data
- "Platform Cost Overrides" or "Overrides" -> Cost override fields
- "Managed Services" or "Services" -> MSP data

**Field matching** (dual-label support):
1. Exact match on short export labels (e.g., "Vendor", "License Count")
2. Keyword match on long Forms labels (e.g., "Which hardware vendor(s) do you use?")
3. If no match -> unmapped (shown with yellow warning)

### CSV Intake Import (.csv)

**Trigger:** Tools tab "Import Responses" button, or Tools menu "Import Intake Data"
**Accepts:** `.csv` files (Google Forms / Microsoft Forms export format)

**Structure:**
- Column headers contain field labels, optionally with bracket-prefixed sections
- Format: `[1.1 PC / AI / Mobile Hardware] Vendor`
- First 3 columns: Timestamp, Client Name, Project Name
- Handles UTF-8 and UTF-8 with BOM encoding

**Section resolution** (ordered regex rules to avoid false matches):

| Priority | Pattern | Resolves to |
|----------|---------|-------------|
| 1 | "workspace ai" | Workspace AI |
| 2 | "daas", "cloud pc", "hosted desktop" | DaaS |
| 3 | "vdi", "on-prem" | VDI |
| 4 | "uem", "unified endpoint management" | UEM |
| 5 | "dex", "digital employee experience" | DEX |
| 6 | "endpoint security" | Endpoint Security |
| 7 | "iam", "identity...access" | IAM |
| 8 | "sase", "secure access service edge" | SASE |
| 9 | "secure...browser", "enterprise browser" | Secure Enterprise Browser |
| 10 | "endpoint os" | Endpoint OS |
| 11 | "app layering", "streaming" | App Layering |
| 12 | "app...readiness", "app...packaging" | App Readiness |
| 13 | "apps config", "asset management" | Apps Config |
| 14 | "unified comm", "collaboration" | Unified Comms & Collab |
| 15 | "hardware", "pc...mobile" | PC and Mobile Devices |

**Important:** "ai" and "pc" are never standalone match terms to avoid false matches.

### Import Review Screen

After parsing, a review dialog shows:
- **Mapped fields** (green checkmarks) - field name, value, target
- **Blank fields** (count) - informational only
- **Errors** (red flags) - e.g., text in numeric field like "not sure"
- **Unmapped** (yellow warnings) - unrecognized fields

Clicking "Create Draft Assessment" creates a new draft with status "intake received" (blue badge).

---

## Tools Tab & Menu

### Tools Tab (tab value: "readme", displays as "Tools")

**Customer Intake card** (2x2 grid layout with collapsible guidance note):
- **"Which intake method should I use?"** - Collapsible guidance note (default expanded on first visit, remembers collapsed state in localStorage key `tco-intake-guidance-collapsed`). Explains Google Form vs Excel vs direct entry paths.
- **Export Intake Form** - Setup dialog collects Client Name (required), Project Name (optional), and section toggles. Generates `.xlsx` workbook with Cover Sheet + selected section tabs. Filename: `TCO_Intake_{ClientName}_{Date}.xlsx`
- **Copy Google Form Link** - Copies configurable Google Form URL to clipboard with toast confirmation. URL stored in localStorage as `tco-google-form-url`. Settings dialog accessible via gear icon. If no URL configured, prompts to set one up.
- **Send via Email** - Opens dialog to compose pre-written intake request email. Includes recipient email field, intake method radio (Google Form / Excel), due date auto-calculated to 5 business days, email preview panel pre-populated with client name, engineer name, and due date. "Open in Email Client" opens mailto: link. Excel option also downloads `.xlsx` to attach manually.
- **Import Intake Responses** - Accepts `.xlsx` or `.csv`, shows review dialog, creates pre-filled draft

**Documentation & Resources card:**
- **Download Documentation** - Downloads `TCO_BASELINE_TOOL_DOCUMENTATION.md`
- **Download FAQ** - Downloads `TCO_BASELINE_FAQ.md`

**Quick Start Guide** - 9-step walkthrough of the assessment workflow

### Tools Menu (dropdown in header toolbar)

- **Generate Intake Form** - Exports `.xlsx` intake form (same as Tools tab export)
- **Import Intake Data** - Accepts `.xlsx` or `.csv` intake files
- **Help** - Pre-filled support email with diagnostic info
- **About** - Version info (0.4.0), technical details, XenTegra copyright

---

## Debug Mode & Audit Trace

### Debug Mode

- Toggle in header toolbar (next to Dark Mode)
- Persisted in localStorage as `tco-debug-mode`
- When enabled: amber "DEBUG" badge appears, "Audit / Trace" tab becomes visible
- When disabled: audit tab and badge completely hidden

### Audit / Trace Page

Available only when Debug Mode is enabled. Located at `client/src/components/AuditTracePage.tsx`.

**Features:**
- Collapsible sections: Environment Facts, EUC Pillars & Platforms, Platform Cost Overrides, Managed Services & Outsourcing, Assumptions, Calculated Outputs / Results
- Every field displayed as a trace card with: Field Name, Current Value, Source, Source Detail, Formula, Formula with Values, Intermediate Steps, Default Value, Dependency Links
- Source types with color coding: User Entry (blue), Intake Import (purple), Default/Assumption (amber), Calculated (green), Override (red)
- Summary dashboard with field counts by source type
- Search across field names, values, formulas
- Filter by source type (toggle badges) and section (dropdown)
- "Show Defaults Only" quick filter
- Clickable dependency links that scroll to and highlight referenced trace cards
- Export to `.xlsx` with one sheet per section

---

## Draft Management

### Storage

- Drafts stored in localStorage
- Index: `tco_drafts_index` (array of `DraftMeta` objects)
- Data: `tco_draft_{uuid}` (JSON string with inputs, assumptions, activeTab)
- Legacy data from `tco_tool_master` auto-migrated to new format

### DraftMeta Structure

| Field | Type | Description |
|-------|------|-------------|
| id | string | UUID |
| clientName | string | From project info |
| projectName | string | From project info |
| status | string | "draft" or "intake received" |
| lastModified | number | Timestamp |

### Recent Activity Table (Home Tab)

- Shows all drafts sorted by last modified (descending)
- Columns: Client/Project, Pack, Last Modified, Status, Action
- "Resume" button loads draft data into the assessment
- "Delete" button removes individual drafts
- Table hidden when no drafts exist
- "intake received" status (blue badge) auto-transitions to "draft" on first edit

### Restart Assessment

- Button appears in toolbar when any data has been entered
- Confirmation modal with destructive action
- Clears all inputs, assumptions, vendor selections, scoring flags, and logo
- Scrolls to top after reset

---

## Data Model

### Assessment State Shape

```typescript
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
    notes: { observation: string; details: string }[];
  };
  hexagridEntries: HexagridEntry[];
};

type HexagridEntry = {
  id: string;
  pillar: string;
  subPillar: string;
  vendorName: string;
  platform?: string;
  version?: string;
  scoringFlag?: string;
  url?: string;
  yearlyCost?: number;
  notes?: string;
  isCustom: boolean;
  customProductName?: string;
  swotOverride?: string;
  licenseCount?: number;
  licenseSku?: string;
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
```

### Derived Values (computed, not stored)

```typescript
{
  laptops: number;
  desktops: number;
  thinClients: number;
  endpoints: number;
  userCount: number;
  vdiPresent: boolean;
  vdiUserCount: number;
  categoryLines: CalcLine[];
  managedServicesLines: CalcLine[];
  totalAnnualTco: number;
  costPerEndpoint: number;
  costPerUser: number;
  vdiCostPerVdiUser: number;
  nonVdiCostPerUser: number;
  readinessScore: number;
  costFromInputs: number;
  costFromAssumptions: number;
}
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/download-snapshot` | Downloads `tco-snapshot.tar.gz` (server admin backup) |

All other data flows are client-side (localStorage, file downloads via Blob API).

---

## Technical Details

### Architecture

- **Framework:** React 18 with TypeScript
- **Router:** Wouter (lightweight)
- **State:** Local React state (useState) + TanStack React Query
- **UI:** shadcn/ui components on Radix UI primitives
- **Styling:** Tailwind CSS with CSS variables
- **Animations:** Framer Motion
- **Charts:** Recharts
- **Data:** localStorage persistence, no server-side database for assessments
- **Build:** Vite with HMR, esbuild for production
- **Dark Mode:** System-aware theme toggle

### Key Files

| File | Purpose |
|------|---------|
| `client/src/pages/tco-baseline.tsx` | Main application logic, all tabs, calculations, exports |
| `client/src/pages/tco-home.tsx` | Home tab / landing page |
| `client/src/components/HexagridSection.tsx` | EUC Pillars vendor entry UI |
| `client/src/components/AuditTracePage.tsx` | Debug mode audit trace |
| `client/src/components/TcoCharts.tsx` | Summary tab visualizations |
| `client/src/components/OnboardingTour.tsx` | Interactive onboarding tour |
| `client/src/lib/intake-excel.ts` | Intake form export (.xlsx) and import (.xlsx/.csv) parser |
| `client/src/lib/drafts.ts` | Draft management utilities |
| `client/src/data/vendors.json` | Vendor/platform/version dropdown data |
| `docs/TCO_BASELINE_TOOL_DOCUMENTATION.md` | User-downloadable documentation |
| `docs/TCO_BASELINE_FAQ.md` | User-downloadable FAQ |

### Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile: Responsive design

### Data Privacy

- No server storage of assessment data
- No analytics or tracking
- Files download directly to user's device
- All data persists in browser localStorage only

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.4 | Mar 2026 | Removed JSON exports (consolidated to CSV/XLSX); normalized Managed Services labels to "Tier 1 Support / Helpdesk" and "Tier 2+ Support / Engineering"; added CSV import support for Google Forms responses; dual-label intake parser with canonical field map; comprehensive documentation refresh |
| 2.3 | Feb 2026 | Added Tools menu, intake form workflow (Excel export/import), Help and About dialogs, Tools tab with documentation downloads and Quick Start Guide, client logo upload, Download All (.zip), dark mode from system preference |
| 2.2 | Feb 2026 | EUC Pillars & Platforms (7 pillars, 17 sub-pillars, 60+ vendors), calculation priority chain, collapsible pillar cards, readiness tracker |
| 2.1 | Feb 2026 | 5 visualizations, conditional spend fields, custom platform/tool support, PDF/CSV exports, dark mode |
| 2.0 | Feb 2026 | Justification export, onboarding tour, readiness tracker |
| 1.0 | Jan 2026 | Initial release |

---

*This documentation is maintained as part of the TCO Baseline Micro-Assessment Tool project.*
