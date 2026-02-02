# TCO Baseline Micro-Assessment Tool

## Complete Documentation

**Version:** 2.0  
**Last Updated:** February 2026  
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
8. [Export Options](#export-options)
9. [Interactive Onboarding Tour](#interactive-onboarding-tour)
10. [Readiness Tracker](#readiness-tracker)
11. [Technical Details](#technical-details)

---

## Overview

The TCO Baseline Micro-Assessment Tool is a vendor-neutral, solution-agnostic calculator designed to establish a credible, defensible TCO baseline for enterprise End User Computing (EUC) environments. The tool produces a single source of truth for what a customer's environment actually costs today.

### Key Characteristics

- **Vendor-Neutral**: No product recommendations or sales narratives
- **Current-State Only**: Establishes baseline without future-state projections
- **Transparent**: Every number is traceable and explainable
- **Defensible**: All math is auditable with explicit assumptions
- **Client-Side**: No data leaves the browser; exports are JSON artifacts

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
- Environment Details
- VDI/DaaS Configuration
- Tool Presence Inventory
- Managed Services
- Observations & Notes

### 3. Assumptions Tab
View and customize all 15 default assumption values with:
- Industry-sourced default values
- Override capability for any value
- Export Justifications button

### 4. Summary Tab
Results dashboard showing:
- Category-by-category cost breakdown
- Total annual baseline
- Per-unit metrics (cost per endpoint, cost per user)
- VDI premium calculations
- Visual charts and breakdowns

### 5. Export Tab
All available export formats:
- JSON (machine-readable)
- Audit Trail (human-readable text)
- Assumption Justifications (detailed rationales)

---

## Input Sections

### Project Information

| Field | Description | Example |
|-------|-------------|---------|
| Client Name | Customer organization name | "Acme Corporation" |
| Assessment Date | Date of baseline assessment | "2026-02-02" |
| Customer Champion | Primary customer contact | "Jane Smith, IT Director" |
| XenTegra Engineer | Conducting engineer name | "John Doe" |

### Environment Details

| Field | Description | Default |
|-------|-------------|---------|
| User Count | Total number of end users | Required |
| Laptop Count | Number of managed laptops | 0 |
| Desktop Count | Number of managed desktops | 0 |
| Thin Client Count | Number of thin client devices | 0 |

**Derived Values:**
- Total Endpoints = Laptop Count + Desktop Count + Thin Client Count

### VDI/DaaS Configuration

| Field | Description | Options |
|-------|-------------|---------|
| VDI Present | Does the environment include VDI? | Yes/No/Unknown |
| VDI % of Users | Percentage of users on VDI | 0-100% |

**Platform Presence (Yes/No/Unknown for each):**
- Citrix Virtual Apps & Desktops
- Azure Virtual Desktop (AVD)
- Windows 365
- VMware Horizon
- Parallels RAS

**VDI Gate Logic:**
VDI costs are only calculated when:
- VDI Present = "Yes", OR
- VDI % of Users > 0

### Tool Presence Inventory

Track presence of endpoint management and monitoring tools:

| Tool | Description |
|------|-------------|
| Microsoft Intune | Cloud-based endpoint management |
| SCCM | System Center Configuration Manager |
| Workspace ONE | VMware UEM solution |
| Jamf | Apple device management |
| ControlUp | VDI/DaaS monitoring |
| Nerdio | AVD management platform |

### Category Rollup Overrides

Optional manual overrides for total annual spend per category:

| Category | Description |
|----------|-------------|
| End-User Devices | Hardware lifecycle costs |
| Support & Ops | Labor and support costs |
| Licensing | Software license costs |
| Management & Security | UEM and security tool costs |
| VDI/DaaS | Virtual desktop platform costs |
| Overhead | Administrative overhead costs |

When provided, overrides replace calculated values entirely.

### Managed Services

| Field | Description |
|-------|-------------|
| Total Annual MSP Spend | Total managed services budget |
| Outsourced Endpoint Management | Checkbox |
| Outsourced Security/EDR | Checkbox |
| Outsourced Patching | Checkbox |
| Outsourced Helpdesk/Tier 1 | Checkbox |
| Outsourced Tier 2+ Support | Checkbox |
| Other (with description) | Checkbox + text field |

### Observations & Notes

Free-form text area for capturing qualitative observations:
- Environmental complexity notes
- Customer pain points
- Special circumstances
- Follow-up items

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
= Total Endpoints × Cost per Endpoint per Year
```

#### 5. VDI/DaaS (Annual)
```
VDI Users = User Count × VDI %
= VDI Users × Platform Cost per VDI User
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

## Export Options

The tool provides three distinct export formats, each serving a different purpose.

### 1. JSON Export

**Purpose:** Machine-readable format for data interchange and archival

**Filename Pattern:** `tco-baseline-{client-name}-{date}.json`

**Contents:**
```json
{
  "exportType": "tco-baseline",
  "version": "2.0",
  "exportDate": "2026-02-02T...",
  "project": { ... },
  "inputs": { ... },
  "assumptions": { ... },
  "derived": {
    "endpoints": 500,
    "vdiUserCount": 100,
    "endUserDevicesValue": 250000,
    "supportOpsValue": 75000,
    "licensingValue": 200000,
    "mgmtSecurityValue": 100000,
    "vdiDaasValue": 80000,
    "overheadValue": 49350,
    "mspSpend": 50000,
    "totalAnnualTco": 804350,
    "costPerEndpoint": 1609,
    "costPerUser": 1609
  }
}
```

**Use Cases:**
- Import into other tools or dashboards
- Version control of assessments
- Integration with reporting systems

### 2. Audit Trail Export

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

4. **Category Rollup Overrides**
   - Shows which values are overridden vs. derived

5. **VDI/DaaS Platform Presence**
   - Status of each VDI platform

6. **Endpoint & Management Tool Presence**
   - Inventory of management tools

7. **Managed Services**
   - MSP spend and outsourced functions

8. **Assumptions Reference Table**
   - All 15 assumption values

9. **Calculation Wiring**
   - Step-by-step derivation of each category
   - Shows source (INPUT vs. DERIVED)
   - Shows basis/formula used

10. **Summary Totals**
    - Category breakdown
    - Total annual baseline

11. **Per-Unit Metrics**
    - Cost per endpoint, cost per user
    - VDI premium calculations

12. **Assumptions Used**
    - List of assumptions that were applied

13. **Observations & Notes**
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
...
```

### 3. Assumption Justifications Export

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

2. **VDI/DaaS**
   - Red: VDI presence unknown
   - Amber: VDI presence set but no platforms selected
   - Green: Full VDI configuration

3. **Tools**
   - Red: No tools marked
   - Amber: Some tools marked unknown
   - Green: All tools marked yes/no

4. **MSP (Managed Services)**
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
- **Data Persistence:** Client-side only (localStorage for tour state)
- **Export:** Browser Blob API for file downloads

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
- **Session-only**: Data cleared on browser close (except tour state)

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
| 2.0 | Feb 2026 | Added justification export, onboarding tour, readiness tracker |
| 1.0 | Jan 2026 | Initial release with full baseline functionality |

---

*This documentation is maintained as part of the TCO Baseline Micro-Assessment Tool project.*
