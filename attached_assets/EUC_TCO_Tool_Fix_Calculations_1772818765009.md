# EUC Pillars – TCO Assessment Tool: Fix TCO Calculations (VDI Metrics, Deploy Labor, Documentation)

> **Owner:** Stuart
> **Purpose:** Fix three calculation issues identified during validation testing: (1) VDI vs Non-VDI per-user cost comparison produces misleading/negative results, (2) Non-VDI Cost per User uses the wrong denominator, (3) Deploy Labor formula is ambiguous about which refresh cycle to use. Also update the Summary tab chart and documentation.

---

## PROBLEM SUMMARY

### Problem 1: VDI Premium Is Always Negative (Critical)

The current "VDI Cost per VDI User" only includes VDI/DaaS **platform costs** (default $800/user). But VDI users also incur base costs — they still need hardware (thin clients), support, licensing, management tooling, and overhead. Meanwhile "Non-VDI Cost per User" includes ALL of those base costs. The comparison is apples to oranges:

```
CURRENT (BROKEN):
  VDI Cost per VDI User     = VDI Platform Cost / VDI Users        = $800
  Non-VDI Cost per User     = (Total TCO - VDI Cost) / Total Users = $1,058
  VDI Premium               = $800 - $1,058 = -$258  ← WRONG: VDI appears cheaper
```

This makes VDI users look cheaper than non-VDI users in every scenario, which is never true in practice. The VDI platform cost is an **additional** cost on top of the base costs that every user shares.

### Problem 2: Non-VDI Denominator Is Wrong

The current formula divides non-VDI costs by **total** user count instead of non-VDI user count. This dilutes the per-user figure and gets worse as VDI user count increases.

### Problem 3: Deploy Labor Refresh Cycle Ambiguity

The formula for deployment labor says `Endpoints × DeploymentHoursPerDevice × LaborRate / DeviceRefreshYears` — but there are three different refresh cycle values (laptop=3, desktop=3, thinClient=5). The calculation should use each device type's own refresh cycle.

---

## FIX 1: Corrected VDI vs Non-VDI Per-User Metrics

### New Calculation Model

The key insight: **base costs are shared by all users.** VDI users pay their share of base costs **plus** the VDI platform cost. Non-VDI users only pay their share of base costs.

```
DEFINITIONS:
  Base Costs      = Total Annual TCO − VDI/DaaS Category Value
                  = (End-User Devices + Support & Ops + Licensing
                     + Mgmt & Security + Overhead + MSP Spend)

  VDI Users       = DaaS User Count + VDI User Count
  Non-VDI Users   = Total Users − VDI Users

NEW FORMULAS:
  Base Cost per User          = Base Costs / Total Users

  VDI Platform Cost per User  = VDI/DaaS Value / VDI Users
                                (only when VDI Users > 0)

  Fully Loaded VDI Cost/User  = Base Cost per User + VDI Platform Cost per User
  Non-VDI Cost per User       = Base Cost per User
  VDI User Premium            = VDI Platform Cost per User
                                (the incremental cost of putting a user on VDI)
```

### Example With Corrected Math

Using the same inputs that produced the broken result above (3,000 users, 900 VDI users, $3.9M total TCO, $720K VDI platform costs):

```
CORRECTED:
  Base Costs                  = $3,895,847 - $720,000 = $3,175,847
  Base Cost per User          = $3,175,847 / 3,000    = $1,058.62

  VDI Platform Cost per User  = $720,000 / 900        = $800.00
  Fully Loaded VDI Cost/User  = $1,058.62 + $800.00   = $1,858.62
  Non-VDI Cost per User       = $1,058.62
  VDI User Premium            = $800.00  ← CORRECT: positive, meaningful, defensible
```

The premium is now always positive (when VDI users exist and have platform costs) and represents the real incremental cost of providing virtual desktops.

### Edge Cases

| Condition | Behavior |
|-----------|----------|
| VDI Users = 0 | VDI Platform Cost = 0, Fully Loaded VDI = N/A, Premium = N/A. Display "—" or "N/A" for VDI metrics. Non-VDI Cost = Base Cost per User = Cost per User. |
| All users are VDI (Non-VDI = 0) | Non-VDI Cost per User = N/A (display "—"). Fully Loaded VDI = Base Cost per User + VDI Platform Cost per User. |
| VDI/DaaS category value = 0 but VDI Users > 0 | VDI Platform Cost per User = $0. Premium = $0. This is valid (customer may not have reported VDI costs yet). |
| Total Users = 0 | All per-user metrics = 0 or N/A. No divide-by-zero. |

---

## FIX 2: Deploy Labor — Per-Device-Type Refresh Cycles

### Current (Ambiguous)

```
Deploy Labor = Endpoints × DeploymentHoursPerDevice × LaborRate / DeviceRefreshYears
```

### Corrected

Each device type uses its own refresh cycle:

```
Deploy Labor =
    (Laptops × DeployHoursPerDevice × LaborRate / LaptopRefreshYears)
  + (Desktops × DeployHoursPerDevice × LaborRate / DesktopRefreshYears)
  + (ThinClients × DeployHoursPerDevice × LaborRate / ThinClientRefreshYears)
```

This matters because thin clients have a 5-year refresh (vs 3 for laptops/desktops), so their deployment labor per year is lower.

### Support & Operations Full Formula (Updated)

```
Ticket Labor  = Endpoints × TicketsPerEndpointPerYear × AvgTicketHandlingHours × LaborRate

Deploy Labor  = (Laptops × DeployHoursPerDevice × LaborRate / LaptopRefreshYears)
              + (Desktops × DeployHoursPerDevice × LaborRate / DesktopRefreshYears)
              + (ThinClients × DeployHoursPerDevice × LaborRate / ThinClientRefreshYears)

Support & Ops = Ticket Labor + Deploy Labor
```

---

## WHERE TO CHANGE

The calculations live in `client/src/pages/tco-baseline.tsx` (or wherever the `useMemo` / calculation block is). Search for:

- `costPerEndpoint` — keep as-is
- `costPerUser` — keep as-is
- `vdiCostPerVdiUser` — **rename to `fullyLoadedVdiCostPerUser`**, change formula
- `nonVdiCostPerUser` — change formula and denominator
- `vdiUserPremium` — change formula
- Deploy labor calculation — split by device type

Also update:
- `client/src/components/TcoCharts.tsx` — the VDI vs Non-VDI bar chart
- Audit trace (`AuditTracePage.tsx`) — formulas and labels for the changed metrics
- CSV export — column headers and values
- PDF export — metric card labels and values

---

## SUMMARY TAB METRIC CARDS — Updated Labels

| Metric | Old Label | New Label | Formula |
|--------|-----------|-----------|---------|
| Total TCO | Total Annual TCO | (no change) | Sum of all categories |
| Per Endpoint | Cost per Endpoint | (no change) | Total TCO / Endpoints |
| Per User | Cost per User | (no change) | Total TCO / Users |
| VDI Per User | VDI Cost per VDI User | Fully Loaded VDI Cost per User | Base Cost/User + VDI Platform Cost/User |
| Non-VDI Per User | Non-VDI Cost per User | Non-VDI Cost per User | Base Costs / Total Users |
| Premium | VDI User Premium | VDI User Premium | VDI Platform Cost / VDI Users |

---

## VDI vs NON-VDI BAR CHART — Updated

The "VDI vs Non-VDI Comparison" bar chart on the Summary tab should be updated:

### Current (Broken)
- Left bar: "VDI Cost per VDI User" — shows only platform cost
- Right bar: "Non-VDI Cost per User" — shows fully loaded base cost

### Corrected — Stacked Bar Chart
Convert to a **stacked bar chart** that visually separates base costs from VDI platform costs:

**Left bar: "VDI User"**
- Bottom segment (same color as right bar): Base Cost per User
- Top segment (accent color — use Light Blue `#00B5E2`): VDI Platform Cost per User
- Total bar height = Fully Loaded VDI Cost per User

**Right bar: "Non-VDI User"**
- Single segment: Base Cost per User (= Non-VDI Cost per User)

This makes the comparison instantly clear — VDI users share the same base costs as everyone else, plus the blue segment on top for the VDI platform.

Add a legend:
- Gray/default: "Base Costs (shared)"
- Light Blue: "VDI Platform (incremental)"

If VDI Users = 0, hide this chart entirely or show a note: "No VDI/DaaS users reported."

---

## AUDIT TRACE — Updated Formulas

Update the Audit / Trace page to show the corrected formulas:

### For "Base Cost per User"
```
Source: Calculated
Formula: (Total Annual TCO − VDI/DaaS Value) / Total Users
Formula with Values: ($X − $Y) / Z = $result
Dependencies: Total Annual TCO, VDI/DaaS category, User Count
```

### For "Fully Loaded VDI Cost per User"
```
Source: Calculated
Formula: Base Cost per User + (VDI/DaaS Value / VDI Users)
Formula with Values: $A + ($B / C) = $result
Dependencies: Base Cost per User, VDI/DaaS category, DaaS User Count, VDI User Count
```

### For "Non-VDI Cost per User"
```
Source: Calculated
Formula: Base Cost per User
Formula with Values: (Total TCO − VDI/DaaS) / Total Users = $result
Note: Same as Base Cost per User — non-VDI users share all base costs equally
Dependencies: Base Cost per User
```

### For "VDI User Premium"
```
Source: Calculated
Formula: VDI/DaaS Value / VDI Users
Formula with Values: $X / Y = $result
Note: Incremental cost of providing virtual desktop to a user
Dependencies: VDI/DaaS category, DaaS User Count, VDI User Count
```

### For "Support & Ops (Deploy Labor)"
```
Source: Calculated
Formula: (Laptops × DeployHrs × Rate / LaptopRefresh) + (Desktops × DeployHrs × Rate / DesktopRefresh) + (ThinClients × DeployHrs × Rate / ThinClientRefresh)
```

---

## CSV / PDF EXPORTS — Updated Headers

Update all export formats to use the new labels:

| Old Header | New Header |
|------------|------------|
| VDI Cost per VDI User | Fully Loaded VDI Cost per User |
| (new) | Base Cost per User |
| (new) | VDI Platform Cost per VDI User |

Add "Base Cost per User" and "VDI Platform Cost per VDI User" as new rows in the Per-Unit Metrics section of CSV and PDF exports so the full breakdown is visible.

---

## DOCUMENTATION UPDATE

After implementation, update `DOCUMENTATION.md`:

**Calculations & Derived Metrics section:**
- Update the "Summary Totals" sub-section with the corrected per-unit metric formulas
- Add the "Base Cost per User" metric
- Rename "VDI Cost per VDI User" to "Fully Loaded VDI Cost per User"
- Update the "VDI User Premium" definition
- Clarify the Deploy Labor formula to show per-device-type refresh cycles

**Visualizations section:**
- Update the VDI vs Non-VDI chart description to reflect the stacked bar format

**Version History:**
- Add a changelog entry for these fixes

---

## QA CHECKLIST

### Calculation Fixes
- [ ] VDI User Premium is **positive** when VDI users exist and VDI costs > 0
- [ ] Fully Loaded VDI Cost per User = Base Cost per User + (VDI/DaaS Value / VDI Users)
- [ ] Non-VDI Cost per User = (Total TCO − VDI/DaaS) / Total Users
- [ ] VDI User Premium = VDI/DaaS Value / VDI Users
- [ ] Deploy Labor uses per-device-type refresh cycles (not a single blended value)
- [ ] All per-user metrics show "—" or "N/A" when denominator is 0 (no divide-by-zero)
- [ ] Zero VDI users: VDI chart is hidden or shows "No VDI users" message
- [ ] All users are VDI: Non-VDI cost shows "N/A", VDI metrics are correct
- [ ] Total Annual TCO is unchanged (only per-unit metrics change, not category totals)

### Validation Against Test Scenarios
Run these scenarios and confirm the Summary tab matches expected values:

**Scenario A: Mixed Environment (3,000 users, 900 VDI)**
- Users: 3,000 | Laptops: 1,500 | Desktops: 500 | Thin Clients: 400
- DaaS Users: 300 | VDI Users: 600 | MSP Spend: $250,000
- Expected: VDI Premium ≈ $800, Fully Loaded VDI ≈ $1,859, Non-VDI ≈ $1,059

**Scenario B: VDI-Heavy (2,000 users, 1,400 VDI)**
- Users: 2,000 | Laptops: 400 | Desktops: 100 | Thin Clients: 800
- DaaS Users: 200 | VDI Users: 1,200 | MSP Spend: $100,000
- Expected: VDI Premium ≈ $800, Fully Loaded VDI ≈ $1,661, Non-VDI ≈ $861

**Scenario C: No VDI (1,000 users)**
- Users: 1,000 | Laptops: 800 | Desktops: 150 | Thin Clients: 0
- Expected: VDI chart hidden, Non-VDI = Cost per User ≈ $1,109

**Scenario D: All zeros**
- All inputs = 0
- Expected: All metrics = $0 or N/A, no console errors, no crashes

### UI Updates
- [ ] Summary metric cards show updated labels
- [ ] VDI vs Non-VDI bar chart is stacked (base + platform)
- [ ] Chart legend shows "Base Costs (shared)" and "VDI Platform (incremental)"
- [ ] Audit trace shows corrected formulas for all changed metrics
- [ ] CSV export has updated headers and new metrics
- [ ] PDF export has updated metric cards

### Documentation
- [ ] DOCUMENTATION.md updated with corrected formulas
- [ ] Version history entry added
