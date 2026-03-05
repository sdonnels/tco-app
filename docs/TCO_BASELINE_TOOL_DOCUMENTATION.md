# TCO Baseline Micro-Assessment Tool

## Complete Documentation

**Version:** 2.4  
**Last Updated:** March 2026  
**Purpose:** Vendor-neutral, current-state Total Cost of Ownership baseline for enterprise End User Computing (EUC) environments

---

## Table of Contents

1. [Overview](#overview)
2. [Core Philosophy](#core-philosophy)
3. [Assessment Paths](#assessment-paths)
4. [Tool Interface](#tool-interface)
5. [Input Sections](#input-sections)
6. [Assumptions Reference](#assumptions-reference)
7. [Calculations & Derived Metrics](#calculations--derived-metrics)
8. [Visualizations](#visualizations)
9. [Export Options](#export-options)
10. [Tools Menu](#tools-menu)
11. [ReadMe Tab](#readme-tab)
12. [Interactive Onboarding Tour](#interactive-onboarding-tour)
13. [Readiness Tracker](#readiness-tracker)
14. [Technical Details](#technical-details)

---

## Overview

The TCO Baseline Micro-Assessment Tool is a vendor-neutral, solution-agnostic calculator designed to establish a credible, defensible TCO baseline for enterprise End User Computing (EUC) environments. The tool produces a single source of truth for what a customer's environment actually costs today.

### Key Characteristics

- **Vendor-Neutral**: No product recommendations or sales narratives
- **Current-State Only**: Establishes baseline without future-state projections
- **Transparent**: Every number is traceable and explainable
- **Defensible**: All math is auditable with explicit assumptions
- **Client-Side**: No data leaves the browser; all exports download directly

### What This Tool Does NOT Do

- Calculate ROI or savings projections
- Recommend solutions or products
- Model future-state scenarios
- Store customer data on servers

---

## Core Philosophy

### Neutral Authority

The tool embodies a "Neutral Authority" design philosophy:

- **Calm, credible aesthetic** without promotional language
- **Audit-friendly** with full traceability
- **No optimization language** that implies sales intent
- **Explicit labeling** of all assumptions and sources

### Governing Principles

1. **Mirror Reality**: Reflect actual costs, don't prescribe solutions
2. **Traceable Math**: Every calculation can be followed step-by-step
3. **Explicit Assumptions**: All default values are labeled and overrideable
4. **Inputs Override Assumptions**: Customer-provided data always takes precedence

---

## Assessment Paths

### Free Baseline Assessment (Currently Available)

A rapid 10-15 minute assessment requiring no extensive data gathering.

**Characteristics:**
- Instant baseline artifact export
- No ROI or future-state modeling
- All math traceable, assumptions explicit
- Mirror reality, don't prescribe solutions

**Best For:**
- Initial customer conversations
- Quick cost awareness exercises
- Establishing baseline before deeper analysis

### Pro Assessment (Coming Soon)

A comprehensive 30-60 day deep analysis using Liquidware Stratosphere data.

**Planned Features:**
- Integration with Liquidware Stratosphere
- Detailed workload analysis
- Application dependency mapping
- Full optimization recommendations

---

## Tool Interface

The tool is organized into five main tabs:

### 1. Home Tab
- Overview of assessment options
- Start assessment buttons
- Tour trigger for new users

### 2. Inputs Tab
The primary data collection interface with sections for:
- Project Information
- Environment Facts
- EUC Pillars & Platforms
- EUC Pillars - Platform Cost Rollups (Optional Overrides)
- Managed Services & Outsourcing
- Observations & Notes

### 3. Assumptions Tab
View and customize all 15 default assumption values with:
- Industry-sourced default values
- Override capability for any value
- Export Justifications button

### 4. Summary Tab
Results dashboard showing:
- Category-by-category cost breakdown with basis annotations
- Total annual baseline
- Per-unit metrics (cost per endpoint, cost per user)
- VDI premium calculations (VDI Cost per VDI User, Non-VDI Cost per User, VDI User Premium)
- Five interactive data visualizations (see [Visualizations](#visualizations) section)
- Export buttons for all formats

### 5. Export Tab
All available export formats:
- CSV (spreadsheet-compatible tabular data)
- PDF (professional print-ready report with visualizations)
- Audit Trail (human-readable comprehensive traceability report)
- Assumption Justifications (detailed rationales for each assumption)

---

## Input Sections

All section headings use Title Case consistently throughout the tool. Each major section includes a "How This Works" info box explaining its purpose.

### Project Information

| Field | Description | Example |
|-------|-------------|---------|
| Client Name | Customer organization name | "Acme Corporation" |
| Assessment Date | Date of baseline assessment | "2026-02-02" |
| Customer Champion | Primary customer contact | "Jane Smith, IT Director" |
| XenTegra Engineer | Conducting engineer name | "John Doe" |

### Environment Facts

| Field | Description | Default |
|-------|-------------|---------|
| User Count | Total number of end users | Required |
| Laptop Count | Number of managed laptops | 0 |
| Desktop Count | Number of managed desktops | 0 |
| Thin Client Count | Number of thin client devices | 0 |

**Derived Values:**
- Total Endpoints = Laptop Count + Desktop Count + Thin Client Count

### EUC Pillars & Platforms

The EUC Pillars & Platforms section organizes vendor costs across 6 pillars of the End User Computing ecosystem. It replaces the previous VDI/DaaS Configuration and Tool Presence Inventory sections, providing a comprehensive, unified view of all EUC-related vendor spend.

**Layout:** 2-column grid of compact pillar cards, each collapsible via ChevronDown/ChevronRight icons.

**Vendor Entry Fields:**
Each vendor entry supports:
- Annual Cost (Optional)
- Assumptions/License details notes field

Users can add custom vendors to any sub-pillar via the "Other..." option. Pillar subtotals are displayed when costs are entered.

#### Pillar 1: Access

The ability to access applications and information from anywhere, using any device. Focuses on workplace independence and mobility.

| Sub-Pillar | Vendors |
|------------|---------|
| PC, AI, Mobile Hardware | Apple (MacBook/iPad/iPhone), Dell (Latitude/Precision/OptiPlex), HP (EliteBook/ZBook/ProBook), Lenovo (ThinkPad/ThinkCentre) |
| Endpoint OS | IGEL (IGEL OS/Cosmos), Stratodesk (NoTouch OS), Unicon (eLux/Scout), Microsoft (Windows 11/Windows 10 IoT) |
| Secure Enterprise Browser | Dizzion (Halo), Island (Enterprise Browser), Talon/Palo Alto Networks (Talon Enterprise Browser), Surf (Surf Security Browser) |

#### Pillar 2: Virtual Desktops & Applications

Solutions that deliver virtualized desktops and applications to simplify management and provide secure access to workloads.

| Sub-Pillar | Vendors |
|------------|---------|
| DaaS (Cloud PC) | Microsoft (Windows 365), Dizzion (Cloud PC), Kasm Technologies (Kasm Workspaces) |
| DaaS (Service Provider) | Dizzion (Frame/Managed DaaS), AWS (WorkSpaces/AppStream 2.0), Workspot (Managed Services) |
| VDI | Omnissa (Horizon 8), Citrix (Virtual Apps and Desktops), Microsoft (Azure Virtual Desktop), Dizzion (Frame), Apporto (VDI), Parallels (RAS) |

#### Pillar 3: Device, OS & User Management

Modernizing physical endpoint management with a focus on Digital Employee Experience (DEX).

| Sub-Pillar | Vendors |
|------------|---------|
| Unified Endpoint Mgmt (UEM) | Microsoft (Intune), Omnissa (Workspace ONE UEM), Ivanti (Neurons for UEM), Recast Software (Application Workspace), Tanium (XEM), PDQ (Connect), JAMF (Jamf Pro), Kaseya (VSA/Datto RMM) |
| Digital Employee Experience (DEX) | ControlUp (Edge DX/ControlUp One), Nexthink (Infinity), Omnissa (Workspace ONE Experience Management), Lakeside Software (SysTrack), Citrix (Workspace Environment Management), Liquidware (Stratosphere UX) |

#### Pillar 4: Security

The foundation for safe access to apps and data, focusing on zero-trust principles.

| Sub-Pillar | Vendors |
|------------|---------|
| Endpoint Security | Microsoft (Defender), CrowdStrike (Falcon Platform), SentinelOne (Singularity) |
| Identity & Access Mgmt (IAM) | Microsoft (Entra ID), Okta (Workforce Identity Cloud), Ping Identity (PingOne) |
| Secure Access Service Edge (SASE) | Cato Networks (Cato SASE Cloud), Zscaler (Zero Trust Exchange), Netskope (Intelligent SSE) |

#### Pillar 5: App Management

Ensuring application readiness, delivery, and lifecycle management across the EUC estate.

| Sub-Pillar | Vendors |
|------------|---------|
| App Layering & Streaming | Omnissa (App Volumes), Liquidware (FlexApp), Citrix (App Layering) |
| Application Readiness & Packaging | Flexera (AdminStudio), Rimo3 (Cloud), Recast Software (Application Workspace) |
| Apps Config & Asset Management | Microsoft (SCCM/Intune), ManageEngine (Endpoint Central), Nexthink (Infinity) |

#### Pillar 6: Collaboration, AI & Applications

Modern productivity, AI, and communication platforms that define the digital employee experience.

| Sub-Pillar | Vendors |
|------------|---------|
| Workspace AI | Microsoft (Copilot), Google (Gemini for Workspace), OpenAI (ChatGPT Enterprise), Anthropic (Claude for Business), Perplexity (Perplexity Enterprise) |
| Unified Comms & Collab | Microsoft (Teams), Zoom (Workplace), Slack (Enterprise Grid) |

### EUC Pillars - Platform Cost Rollups (Optional Overrides)

Optional manual overrides for total annual spend per category. When provided, overrides replace both EUC Pillar vendor costs and calculated assumption values entirely. The rollup labels align with the EUC Pillar names.

**Access & Infrastructure Group:**

| Category | Description |
|----------|-------------|
| End-User Devices (Access) | Hardware lifecycle costs |
| Support & Ops | Labor and support costs |
| Licensing (Collaboration, AI & Apps) | Software license costs |

**Management, Security & VDI Group:**

| Category | Description |
|----------|-------------|
| Device, OS & User Mgmt + Security | UEM, DEX, and security tool costs |
| Virtual Desktops & Applications | Virtual desktop platform costs |
| Overhead | Administrative overhead costs |

### Managed Services & Outsourcing

| Field | Description |
|-------|-------------|
| Total Annual MSP Spend | Total managed services budget |
| Outsourced Endpoint Management | Checkbox |
| Outsourced Security/EDR | Checkbox |
| Outsourced Patching | Checkbox |
| Tier 1 Support / Helpdesk | Checkbox |
| Tier 2+ Support / Engineering | Checkbox |
| Other (with description) | Checkbox + text field |

### Observations & Notes

Free-form text area for capturing qualitative observations:
- Environmental complexity notes
- Customer pain points
- Special circumstances
- Follow-up items

### "How This Works" Info Boxes

Each major section in the tool includes a "How This Works" info box that explains the section's purpose and how data is used in the calculations. On the Human Commentary and Trace tab, a single consolidated "How This Works" box replaces the previous separate "Mirror, not microscope" and "No hidden logic" guidance boxes.

---

## Assumptions Reference

The tool uses 15 explicit, labeled, overrideable assumptions. All values can be customized; inputs always override assumptions.

### Device Refresh Cycles (3 values)

| Assumption | Default | Justification |
|------------|---------|---------------|
| Laptop Refresh | 3 years | Industry standards suggest a 3-4 year refresh cycle where maintenance costs begin to exceed replacement costs. Maintenance costs escalate by 148% by year 5. |
| Desktop Refresh | 3 years | Business desktops have a standard lifecycle of 4-5 years. A 3-year refresh aligns with optimal TCO before support costs escalate significantly. |
| Thin Client Refresh | 5 years | Thin clients have longer lifecycles (5+ years) due to simpler architecture and lower failure rates than full PCs. |

### Device Unit Costs (3 values)

| Assumption | Default | Justification |
|------------|---------|---------------|
| Laptop Unit Cost | $1,200 | Mid-range business laptop costs range $900-$1,700. $1,200 represents a reasonable mid-point for standard knowledge worker provisioning. |
| Desktop Unit Cost | $1,100 | Business desktop costs range $600-$1,800. $1,100 represents mid-tier provisioning suitable for most business users. |
| Thin Client Unit Cost | $600 | Thin clients cost significantly less than full PCs, typically $400-$800. $600 represents a capable modern thin client. |

### Support Operations (4 values)

| Assumption | Default | Justification |
|------------|---------|---------------|
| Tickets per Endpoint/Year | 2 | Industry benchmark of 2 tickets per endpoint per year based on standard service desk metrics for well-managed environments. |
| Avg Ticket Handling Time | 0.5 hours | Average Level 1/2 ticket resolution time of 30 minutes based on typical IT service desk benchmarks. |
| Deployment Hours/Device | 1.5 hours | Standard device imaging, configuration, and deployment takes 1.5 hours with modern provisioning tools. |
| Blended Labor Rate | $50/hour | Blended rate accounts for mix of Level 1-3 support staff. Base salaries range $70K-$150K plus 25% payroll burden. |

### Licensing (2 values)

| Assumption | Default | Justification |
|------------|---------|---------------|
| Cost per User per Year | $400 | M365 E3 at $36/month = $432/year. $400/user/year is conservative baseline for core productivity licensing. |
| Coverage Percentage | 100% | 100% coverage assumes all users require productivity suite licensing as baseline. |

### Management & Security (1 value)

| Assumption | Default | Justification |
|------------|---------|---------------|
| Cost per Endpoint per Year | $200 | Combined UEM (Intune ~$96/yr) plus security/DEX tools. $200/endpoint covers endpoint management and security baseline. |

### VDI/DaaS (1 value)

| Assumption | Default | Justification |
|------------|---------|---------------|
| Platform Cost per VDI User per Year | $800 | Citrix DaaS ranges $156-$276/user/year. AVD $120/user/year. $800 accounts for platform licensing plus infrastructure costs. |

### Overhead (1 value)

| Assumption | Default | Justification |
|------------|---------|---------------|
| Overhead % of Subtotal | 7% | 7% overhead covers administrative costs, facilities allocation, and indirect IT costs not captured in direct categories. |

---

## Calculations & Derived Metrics

### Priority Chain

All cost categories follow a consistent priority chain for determining values:

```
1. Category Rollup Overrides (highest priority) — user-entered override replaces everything
2. EUC Pillar vendor costs — summed from vendor entries in the relevant pillars
3. Calculated assumptions (lowest priority) — derived from assumptions when no other data exists
```

### Category Calculations

#### 1. End-User Devices (Annual)
```
= (Laptop Count × Laptop Cost ÷ Laptop Refresh Years)
+ (Desktop Count × Desktop Cost ÷ Desktop Refresh Years)
+ (Thin Client Count × Thin Client Cost ÷ Thin Client Refresh Years)
```

#### 2. Support & Operations (Annual)
```
Ticket Labor = Endpoints × Tickets/Endpoint × Hours/Ticket × Labor Rate
Deployment Labor = Endpoints × Hours/Device × Labor Rate ÷ Avg Device Life
= Ticket Labor + Deployment Labor
```

#### 3. Licensing (Annual)
```
= User Count × Cost per User × Coverage %
```

#### 4. Management & Security (Annual)
```
Priority chain:
  1. If Category Rollup Override provided:
       = Override value
  2. If EUC Pillar costs exist (Device, OS & User Management + Security pillars):
       = Sum of vendor costs from Pillar 3 (Device, OS & User Management) 
         + Sum of vendor costs from Pillar 4 (Security)
  3. Otherwise (assumption fallback):
       = Total Endpoints × $200/endpoint/year
```

#### 5. VDI/DaaS (Annual)
```
VDI Users = User Count × VDI %
Priority chain:
  1. If Category Rollup Override provided:
       = Override value
  2. If EUC Pillar costs exist (Virtual Desktops & Applications pillar):
       = Sum of vendor costs from Pillar 2 (Virtual Desktops & Applications)
  3. Otherwise (assumption fallback):
       = VDI Users × $800/VDI user/year
(Only calculated if VDI is present or VDI% > 0)
```

#### 6. Overhead (Annual)
```
Subtotal = End-User Devices + Support & Ops + Licensing + Mgmt & Security + VDI/DaaS
= Subtotal × Overhead %
```

### Summary Totals

```
Total Annual Baseline = End-User Devices + Support & Ops + Licensing 
                      + Mgmt & Security + VDI/DaaS + Overhead 
                      + Managed Services Spend
```

### Per-Unit Metrics

| Metric | Calculation |
|--------|-------------|
| Cost per Endpoint | Total Annual Baseline ÷ Total Endpoints |
| Cost per User | Total Annual Baseline ÷ User Count |
| VDI Cost per VDI User | VDI/DaaS Annual ÷ VDI User Count |
| Non-VDI Cost per User | (Total - VDI Costs) ÷ (Users - VDI Users) |
| VDI User Premium | VDI Cost per VDI User - Non-VDI Cost per User |

---

## Visualizations

The Summary tab includes five current-state data visualizations built with Recharts. All charts are grounded in actual input data and assumption-derived values -- no future projections, ROI, or optimization assumptions are displayed.

### 1. Endpoint Mix (Pie Chart)

Displays the distribution of device types across the environment:
- Laptops (blue)
- Desktops (purple)
- Thin Clients (green)

Shows percentage breakdown of each device type. Only displays segments with non-zero values.

### 2. Where Money Goes (Pie Chart)

Visualizes the proportional allocation of annual spend across all cost categories:
- End-User Devices
- Licensing
- Support & Ops
- VDI/DaaS
- Management & Security
- Overhead

Each category displays its percentage of total spend. Zero-value categories are filtered out.

### 3. Cost by Category (Horizontal Bar Chart)

Shows the absolute dollar amount for each cost category as horizontal bars:
- Devices, Support, Licensing, Mgmt/Sec, VDI/DaaS, Overhead

Provides a clear visual comparison of which categories drive the most cost.

### 4. VDI vs Non-VDI Comparison (Bar Chart)

Compares the annual cost per user between VDI and Non-VDI users:
- Non-VDI User cost per user (blue)
- VDI User cost per user (purple)

Only renders when user count and VDI percentage data are available.

### 5. Cost Source (Bar Chart)

Shows how much of the total baseline is derived from actual customer-provided inputs versus assumption-based calculations:
- "From Inputs" (blue) -- costs based on user-entered spend values, EUC Pillar vendor costs, or overrides
- "From Assumptions" (amber) -- costs calculated from default assumption values

Helps stakeholders understand data confidence and identify areas where actual spend data would improve accuracy.

### Chart Design Principles

- **Current-state only**: No future projections or optimization suggestions
- **Interactive tooltips**: Hover for detailed values
- **Responsive**: Charts adapt to container width
- **PDF-compatible**: HTML/CSS equivalents render in PDF export for reliable print output
- **Dark mode aware**: Charts adapt to light/dark theme

---

## Export Options

The tool provides six distinct export formats plus a bundled download option, each serving a different purpose. Most exports are available with a single click from the Summary tab, with some also accessible from other relevant tabs.

### 1. Audit Trail Export

**Purpose:** Human-readable comprehensive report for stakeholder review

**Filename Pattern:** `tco-audit-trail-{client-name}-{date}.txt`

**Report Sections:**

1. **Header & Metadata**
   - Report title, generation timestamp
   - Disclaimer about baseline-only nature

2. **Project Information**
   - Client name, date, stakeholders

3. **Environment Inputs**
   - All user-provided values
   - Derived endpoint counts

4. **EUC Pillars - Platform Cost Rollups (Optional Overrides)**
   - Shows which values are overridden vs. derived

5. **EUC Pillars & Platforms Vendor Costs**
   - All vendor entries organized by pillar and sub-pillar
   - Annual costs and notes for each vendor

6. **Managed Services**
   - MSP spend and outsourced functions

7. **Assumptions Reference Table**
   - All 15 assumption values

8. **Calculation Wiring**
   - Step-by-step derivation of each category
   - Shows source (INPUT vs. DERIVED vs. EUC PILLAR)
   - Shows basis/formula used
   - Reflects priority chain (Override > EUC Pillar > Assumption)

9. **Summary Totals**
   - Category breakdown
   - Total annual baseline

10. **Per-Unit Metrics**
    - Cost per endpoint, cost per user
    - VDI premium calculations

11. **Assumptions Used**
    - List of assumptions that were applied

12. **Observations & Notes**
    - Free-form observations

**Sample Output:**
```
════════════════════════════════════════════════════════════════════════════════
TCO BASELINE AUDIT TRAIL REPORT
Generated: 2/2/2026
════════════════════════════════════════════════════════════════════════════════

DISCLAIMER: This report represents a current-state TCO baseline only.
It does not include ROI projections, savings estimates, or solution recommendations.

┌────────────────────────────────────────────────────────────────────┐
│ PROJECT INFORMATION                                                │
└────────────────────────────────────────────────────────────────────┘
  Client Name:        Acme Corporation
  Assessment Date:    2/2/2026
  Customer Champion:  Jane Smith
  XenTegra Engineer:  John Doe

┌────────────────────────────────────────────────────────────────────┐
│ EUC PILLARS & PLATFORMS VENDOR COSTS                               │
└────────────────────────────────────────────────────────────────────┘
  Pillar: Access
    Sub-Pillar: PC, AI, Mobile Hardware
      Dell - Latitude / Precision / OptiPlex    $120,000/yr
    Sub-Pillar: Endpoint OS
      IGEL - IGEL OS (Cosmos)                   $45,000/yr
  Pillar: Virtual Desktops & Applications
    Sub-Pillar: VDI
      Citrix - Virtual Apps and Desktops        $200,000/yr
...
```

### 3. CSV Export

**Purpose:** Spreadsheet-compatible format for data analysis and reporting

**Filename Pattern:** `tco-baseline-{client-name}-{date}.csv`

**Contents:**
The CSV export includes all key data in a tabular format that can be opened in Excel, Google Sheets, or any spreadsheet application:

- Project Information (Client, Date, Contacts)
- Environment Details (User counts, endpoint counts)
- Cost Categories with annual amounts and source indicators
- Summary Metrics (Total baseline, per-unit costs)
- All 15 Assumption Values

**Sample Structure:**
```csv
TCO Baseline Micro-Assessment - CSV Export
Generated,2/2/2026 10:30:00 AM

PROJECT INFORMATION
Client Name,Acme Corporation
Assessment Date,2026-02-02
Customer Champion,Jane Smith
XenTegra Engineer,John Doe

ENVIRONMENT
User Count,500
Laptop Count,300
Desktop Count,150
Thin Client Count,50
Total Endpoints,500

COST CATEGORIES,Annual Amount,Source
End-User Devices,250000,Calculated
Support & Operations,75000,Calculated
Licensing,200000,Calculated
...
```

**Use Cases:**
- Import into Excel for custom analysis
- Integration with financial reporting tools
- Data comparison across multiple assessments
- Pivot table analysis

### 4. PDF Export

**Purpose:** Professional, print-ready report for stakeholder presentations

**Access:** Opens a print-friendly version in a new browser window with automatic print dialog

**Report Features:**
- Clean, professional typography
- Company branding-ready layout
- Color-coded sections
- Metric cards with visual hierarchy
- Disclaimer banner included

**Report Sections:**
1. **Header** - Client name, date, assessment contacts
2. **Disclaimer** - Baseline-only notice
3. **Environment Summary** - Users, endpoints, device breakdown
4. **Annual Cost Breakdown** - Category table with percentages and source indicators
5. **Visualizations** - HTML/CSS rendered charts (Endpoint Mix, Where Money Goes, Cost by Category, VDI Comparison) for reliable print output
6. **Per-Unit Metrics** - Visual metric cards
7. **Observations** - If captured during assessment

**Print/Save Options:**
- Print directly to paper
- Save as PDF using browser's "Save as PDF" print option
- Works with all modern browsers (Chrome, Firefox, Safari, Edge)

**Use Cases:**
- Executive presentations
- Customer deliverables
- Physical documentation
- Archived records

### 5. Assumption Justifications Export

**Purpose:** Detailed rationales for each assumption based on industry research

**Filename Pattern:** `tco-assumption-justifications-{date}.txt`

**Report Sections:**

1. **Header & Purpose**
   - Report title and description
   - Reference to source documentation

2. **Device Refresh & Cost Assumptions**
   - Current value for each assumption
   - Source documentation reference
   - Industry rationale

3. **Support & Operations Assumptions**
   - Ticket and labor assumptions
   - Industry benchmarks

4. **Licensing & Management Assumptions**
   - License cost and coverage assumptions
   - Tool cost benchmarks

5. **VDI/DaaS & Overhead Assumptions**
   - Platform cost assumptions
   - Overhead percentage rationale

6. **Reference Documentation**
   - Citation of EUC TCO Analysis document

**Sample Output:**
```
════════════════════════════════════════════════════════════════════════════
TCO ASSUMPTION JUSTIFICATION REPORT
Generated: 2/2/2026
════════════════════════════════════════════════════════════════════════════

This report provides industry-sourced justifications for each assumption
used in the TCO baseline calculation.

┌────────────────────────────────────────────────────────────────────────┐
│ DEVICE REFRESH & COST ASSUMPTIONS                                      │
└────────────────────────────────────────────────────────────────────────┘

  Laptop Refresh Cycle: 3 years
    Source: EUC TCO Analysis, Hardware Section
    Rationale: Industry standards suggest a 3-4 year refresh cycle where 
    maintenance costs begin to exceed replacement costs. Maintenance costs 
    escalate by 148% by year 5 and can reach 300% by year 7.
...
```

---

## Export Quick Reference

| Format | Extension | Best For | Access Location |
|--------|-----------|----------|-----------------|
| CSV | .csv | Spreadsheet analysis, Excel | Summary tab |
| PDF | .pdf | Presentations, print | Summary tab |
| Audit Trail | .txt | Full traceability, compliance | Summary tab, Inputs tab |
| Justifications | .txt | Assumption defense | Assumptions tab |
| Download All | .zip | Complete archive of all exports | Summary tab |

**Note:** The Audit Trail export is available on both the Inputs and Summary tabs. Assumption Justifications can only be exported from the Assumptions tab where the values are displayed. Download All generates a .zip archive containing CSV, Audit Trail, and Justifications exports in a single download.

---

## Tools Menu

The **Tools** dropdown button appears in the header alongside "Clear All" when navigating any tab beyond Home. It provides quick access to utility features and serves as a central location for future tool additions.

### 1. Generate Intake Form

**Purpose:** Create a structured Excel (.xlsx) questionnaire to collect customer environment information before an assessment meeting.

**How It Works:**
- Click **Tools > Generate Intake Form** to open the export setup dialog
- Enter Client Name (required) and Project Name (optional), toggle which sections to include
- Generates a multi-sheet .xlsx workbook with Cover Sheet + selected section tabs
- Sections: Environment Facts, Platform Cost Overrides, EUC Pillars, Managed Services
- Send the form to the customer ahead of the meeting so they can pre-fill known values

**Filename Pattern:** `TCO_Intake_{ClientName}_{Date}.xlsx`

### 2. Import Intake Data

**Purpose:** Load a completed intake form directly into the tool to pre-populate fields.

**How It Works:**
- Click **Tools > Import Intake Data** and select a completed Excel (.xlsx) or CSV (.csv) file
- The tool parses the file using dual-label matching (exact short labels first, then keyword regex)
- A review screen shows mapped fields (green), blank fields (count), and errors (red)
- Clicking "Create Draft Assessment" creates a pre-filled draft with "intake received" status
- CSV files from Google Forms or Microsoft Forms are supported with bracket-prefixed headers

**Supported Fields:**
- Project information (client name, project name)
- Environment facts (user count, device counts)
- EUC Pillars vendor/platform data across all sub-pillars
- Cost category overrides
- Managed services and outsourcing details

### 3. Help

**Purpose:** Generate a pre-filled support email with issue details and diagnostic information.

**How It Works:**
- Click **Tools > Help** to open the Help dialog
- Enter a description of the issue
- Click "Open Email" to launch your email client with a pre-filled support request
- The email automatically includes tool version, browser info, client name, and engineer name
- Support email address: `support@xentegra.com` (placeholder)

### 4. About

**Purpose:** Display version information, technical details, and legal notices.

**Contents:**
- XenTegra logo and product name
- Version number and build date
- EUC Workbook alignment version
- Product description
- Technical details (framework, UI library, charts, data storage, export formats)
- Copyright notice and legal disclaimer
- Trademark attribution

---

## ReadMe Tab

The **ReadMe** tab provides in-app documentation and guidance, accessible from the tab bar alongside Inputs, Assumptions, Observations, and Summary.

### Documentation & Resources

Two download cards provide offline access to reference materials:

1. **Full Documentation** — Downloads `TCO_Baseline_Tool_Documentation.md`, the complete reference covering all features, calculations, EUC Pillars framework, export formats, and technical details.

2. **Frequently Asked Questions** — Downloads `TCO_Baseline_FAQ.md` with common questions about general usage, inputs, EUC Pillars, assumptions, results, export formats, and troubleshooting.

### Quick Start Guide

A 9-step walkthrough covers the entire assessment workflow:

1. **Start on the Home Tab** — Launch the assessment or take the interactive tour
2. **Fill in Project Information** — Client name, date, champion, engineer, and optional logo upload
3. **Enter Environment Facts** — User count and device counts
4. **Map Your EUC Pillars & Platforms** — Select vendors across 6 pillars and enter annual costs
5. **Override Cost Categories** — Optionally enter known total spend per category
6. **Review Assumptions** — View and adjust 15 industry-sourced default values
7. **Add Notes & Observations** — Document context, caveats, and review calculation traces
8. **Review the Summary** — View metrics, charts, and use export options
9. **Track Your Progress** — Monitor assessment completeness via the Readiness bar

---

## Interactive Onboarding Tour

### Overview

The tool includes a guided onboarding tour to help new users understand the interface. The tour automatically triggers for first-time users and can be restarted at any time.

### Tour Steps (7 total)

1. **Welcome**
   - Introduction to the tool's purpose
   - Overview of vendor-neutral approach

2. **Navigation Tabs**
   - Explanation of the five main tabs
   - How to navigate the assessment

3. **Readiness Tracker**
   - Understanding the color-coded status indicators
   - What makes an assessment complete

4. **Inputs Section**
   - How to enter customer data
   - Explanation of required vs. optional fields

5. **Assumptions Tab**
   - How defaults work
   - How to override assumptions

6. **Summary Dashboard**
   - Understanding the results
   - Per-unit metrics explained

7. **Export Options**
   - Available export formats
   - When to use each format

### Tour Features

- **Auto-trigger**: Starts automatically for first-time users
- **Skip option**: Can be dismissed at any time
- **Progress indicators**: Shows current step and total
- **Restart capability**: Can be restarted from settings
- **Persistent state**: Completion stored in localStorage

### Technical Implementation

The tour uses:
- Radial gradient overlay to highlight target elements
- Smooth scrolling to bring targets into view
- Dynamic tooltip positioning (top/bottom/left/right)
- Framer Motion for smooth animations

---

## Readiness Tracker

### Overview

The readiness tracker provides at-a-glance visibility into assessment completeness. It appears inline with the navigation tabs and uses color-coded indicators.

### Status Indicators

| Color | Status | Meaning |
|-------|--------|---------|
| Red | Not Started | Section has no data entered |
| Amber | Partial | Some data entered, not complete |
| Green | Complete | All required fields populated |

### Tracked Sections

1. **Environment**
   - Red: No user count or endpoint counts
   - Amber: User count provided but no endpoints
   - Green: User count + at least one endpoint type

2. **EUC Pillars**
   - Red: No vendor entries added across any pillar
   - Amber: Some pillars have vendor entries but not all relevant pillars
   - Green: Vendor entries present with costs in key pillars

3. **MSP (Managed Services)**
   - Red: No MSP information
   - Amber: Partial outsourcing info
   - Green: MSP spend or full outsourcing details

---

## Technical Details

### Architecture

- **Framework:** React 18 with TypeScript
- **State Management:** Local React state (useState)
- **Styling:** Tailwind CSS with shadcn/ui components
- **Animations:** Framer Motion
- **Charts:** Recharts (responsive, interactive data visualizations)
- **Data Persistence:** All data (inputs, assumptions, EUC Pillar entries) persists via localStorage
- **Export:** Browser Blob API for file downloads
- **Dark Mode:** System-aware theme toggle with light/dark support across all UI elements and charts

### Excel Workbook Alignment

The tool precisely mirrors the structure and calculations of `TCO_Baseline_Workbook_v2_0_FROZEN.xlsx`:

- Same 15 assumptions with identical default values
- Same calculation formulas for all categories
- Same summary metrics and per-unit calculations
- Same input structure and category organization

### Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile: Responsive design, full functionality

### Data Privacy

- **No server storage**: All data remains in the browser
- **No tracking**: No analytics or user tracking
- **Local exports**: Files download directly to user's device
- **Persistent locally**: All inputs, assumptions, and EUC Pillar entries persist in localStorage across sessions

---

## Appendix: Source Documentation

### EUC TCO Analysis and Discovery Roadmap

The assumption justifications are derived from:

**"Strategic Financial Architecture of End User Computing: A Comprehensive Total Cost of Ownership Analysis"**

This document synthesizes research and benchmarks from:
- Gartner
- IDC
- Microsoft
- Citrix
- VMware
- Industry surveys and case studies

### Key Research Citations

- Hardware maintenance cost escalation (148% by year 5)
- M365 E3 licensing benchmarks ($36/month)
- Service desk ticket resolution time benchmarks
- Blended IT labor rate calculations
- VDI platform licensing comparisons

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.4 | Mar 2026 | Removed JSON exports (consolidated to CSV/XLSX); normalized tier labels to "Tier 1 Support / Helpdesk" and "Tier 2+ Support / Engineering" across UI, exports, and imports; Tools menu Generate Intake Form now opens Excel export dialog; Import accepts .xlsx and .csv only; backward-compatible intake label matching; comprehensive documentation refresh |
| 2.3 | Feb 2026 | Added Tools dropdown menu with Generate Intake Form, Import Intake Data, Help (support email generator), and About dialog (version info, legal); added ReadMe tab with Documentation/FAQ download links and 9-step Quick Start Guide; client logo upload with MIME type validation and logo references in all export formats (CSV, Audit Trail); Download All (.zip) export; pie chart labels moved inside slices with legends below; vendor row layout refactored (cost/notes fields on separate line); dark mode initializes from system preference |
| 2.2 | Feb 2026 | Replaced VDI/DaaS Configuration and Tool Presence Inventory with unified EUC Pillars & Platforms section (6 pillars, 17 sub-pillars, 60+ vendors); 2-column grid layout with collapsible pillar cards; calculation priority chain (Override > EUC Pillar costs > Assumptions); Category Rollups renamed to "EUC Pillars - Platform Cost Rollups (Optional Overrides)" with pillar-aligned labels; "How This Works" info boxes on all major sections; audit trail shows "EUC PILLARS & PLATFORMS VENDOR COSTS"; JSON export uses `eucPillars` key; all data persists via localStorage; Title Case headings throughout; readiness tracker updated for EUC Pillars |
| 2.1 | Feb 2026 | Added 5 current-state visualizations (Endpoint Mix, Where Money Goes, Cost by Category, VDI Comparison, Cost Source); conditional spend fields for VDI platforms and tools; custom platform/tool support with +Add buttons; spend override logic (actual spend replaces assumption-based calculations); PDF export with HTML/CSS chart rendering; CSV export format; dark mode toggle; enhanced audit trail with spend values and custom entries |
| 2.0 | Feb 2026 | Added justification export, onboarding tour, readiness tracker |
| 1.0 | Jan 2026 | Initial release with full baseline functionality |

---

*This documentation is maintained as part of the TCO Baseline Micro-Assessment Tool project.*
