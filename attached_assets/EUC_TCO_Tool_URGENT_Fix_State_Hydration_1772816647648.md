# EUC Pillars – TCO Assessment Tool: URGENT Fix — State Hydration Bugs (VDI Users, MSP Spend)

> **Owner:** Stuart
> **Priority:** URGENT — Blocks MVP. TCO total is $1M+ off due to these bugs.
> **Purpose:** Fix three fields that are persisted to localStorage but not loaded back into React state when resuming a draft or loading from `tco_tool_master`. This causes the Summary to show $0 for VDI/DaaS and Managed Services.

---

## PROBLEM

When the app saves state to localStorage (either via auto-save to `tco_tool_master` or via draft save), the following fields are written correctly. But when the app loads — either on page load from `tco_tool_master`, or when the user clicks "Resume" on a draft — these fields are NOT restored into React state:

### Bug 1: VDI/DaaS User Count — DaaS (Critical)

- **Field:** `vdiUserCounts.daas`
- **Input UI:** "VDI/DaaS users" text input under "DaaS (Cloud PC / Hosted Desktop)" in EUC Pillars section
- **localStorage value:** `300` (confirmed)
- **React form state on load:** empty (shows placeholder "e.g., 200")
- **Impact on Summary:** VDI users shows **0**, VDI/DaaS category shows **$0**, VDI Cost per VDI User shows **$0**

### Bug 2: VDI/DaaS User Count — VDI (Critical)

- **Field:** `vdiUserCounts.vdi`
- **Input UI:** "VDI/DaaS users" text input under "VDI (On-Premises)" in EUC Pillars section
- **localStorage value:** `600` (confirmed)
- **React form state on load:** empty (shows placeholder "e.g., 200")
- **Impact on Summary:** Same cascading effect as Bug 1 — zeroes out all VDI metrics

### Bug 3: Managed Services Total Annual Spend (Critical)

- **Field:** `managedServices.totalAnnualSpend`
- **Input UI:** "Total MSP / managed services" text input under "Outsourced Services & MSP" section
- **localStorage value:** `250000` (confirmed)
- **React form state on load:** empty (shows placeholder "e.g., 250000")
- **Impact on Summary:** Managed Services shows **$0** on Summary, missing from Total TCO

---

## HOW TO REPRODUCE

1. Open the app
2. Click "Start Assessment" or resume a draft
3. Enter values in the following fields:
   - DaaS user count: 300
   - VDI user count: 600
   - MSP total spend: 250000
4. Navigate to the Summary tab — values appear correctly
5. **Refresh the browser** (Ctrl+R / Cmd+R)
6. Navigate back to the Summary tab — VDI shows $0, Managed Services shows $0
7. Navigate to the Inputs tab — the VDI user count fields and MSP spend field show placeholder text (empty)
8. Open browser console: `JSON.parse(localStorage.getItem('tco_tool_master')).vdiUserCounts` → shows `{daas: 300, vdi: 600}` (data IS persisted, just not loaded)

---

## WHERE TO FIX

The bug is in the state initialization / hydration logic. This is likely in one of:

- **`client/src/pages/tco-baseline.tsx`** — the main component where `useState` hooks are initialized, probably in a `useEffect` that loads from localStorage on mount
- **`client/src/lib/drafts.ts`** — the draft loading utility that reads from localStorage and returns state to the component

### What to look for:

The component likely does something like:

```typescript
// On mount, load from localStorage
const savedState = JSON.parse(localStorage.getItem('tco_tool_master'));
setInputs(prev => ({
  ...prev,
  project: savedState.project,
  environment: savedState.environment,
  // ... other fields ...
}));
```

The `vdiUserCounts` and `managedServices.totalAnnualSpend` fields are either:

1. **Not included** in the state restoration — they're being written on save but not read on load
2. **Being overwritten** by a default value after the load (a race condition where `useState` default wins)
3. **Mapped to the wrong key** — the save uses one key name and the load expects a different one

### The fix should:

1. Ensure `vdiUserCounts.daas` is loaded into the DaaS user count form field state
2. Ensure `vdiUserCounts.vdi` is loaded into the VDI user count form field state
3. Ensure `managedServices.totalAnnualSpend` is loaded into the MSP spend form field state
4. This should apply to BOTH:
   - Initial page load (from `tco_tool_master`)
   - Draft resume (from `tco_draft_{uuid}`)

---

## COMPREHENSIVE HYDRATION AUDIT

While fixing the three specific fields above, do a full audit of ALL fields that get saved to localStorage to confirm they ALL load back correctly. The fields to check:

### Project Info
- [ ] `project.clientName` — loads into Client Name field
- [ ] `project.assessmentDate` — loads into Assessment Date field
- [ ] `project.customerChampion` — loads into Customer Champion field
- [ ] `project.engineerName` — loads into Engineer Name field

### Environment
- [ ] `environment.userCount` — loads into User Count field ✅ (confirmed working)
- [ ] `environment.laptopCount` — loads into Laptops field ✅ (confirmed working)
- [ ] `environment.desktopCount` — loads into Desktops field ✅ (confirmed working)
- [ ] `environment.thinClientCount` — loads into Thin Clients field ✅ (confirmed working)

### VDI User Counts
- [ ] `vdiUserCounts.daas` — loads into DaaS user count field ❌ **BROKEN**
- [ ] `vdiUserCounts.vdi` — loads into VDI user count field ❌ **BROKEN**

### Category Rollups (Overrides)
- [ ] `categoryRollups.endUserDevicesAnnual` — loads into End-User Devices override
- [ ] `categoryRollups.supportOpsAnnual` — loads into Support & Ops override
- [ ] `categoryRollups.licensingAnnual` — loads into Licensing override
- [ ] `categoryRollups.mgmtSecurityAnnual` — loads into Mgmt & Security override
- [ ] `categoryRollups.vdiDaasAnnual` — loads into VDI/DaaS override
- [ ] `categoryRollups.overheadAnnual` — loads into Overhead override

### Managed Services
- [ ] `managedServices.totalAnnualSpend` — loads into Total MSP field ❌ **BROKEN**
- [ ] `managedServices.outsourcedEndpointMgmt` — loads into checkbox
- [ ] `managedServices.outsourcedSecurity` — loads into checkbox
- [ ] `managedServices.outsourcedPatching` — loads into checkbox
- [ ] `managedServices.outsourcedHelpdesk` — loads into checkbox
- [ ] `managedServices.outsourcedTier2Plus` — loads into checkbox
- [ ] `managedServices.outsourcedOther` — loads into checkbox
- [ ] `managedServices.mspXentegra` — loads into XenTegra checkbox
- [ ] `managedServices.mspOther` — loads into Other checkbox
- [ ] `managedServices.mspOtherProviders` — loads into provider names field

### EUC Pillar Entries
- [ ] `hexagridEntries` — all vendor entries load with correct vendor, platform, version, cost, license count, license SKU, user count, notes

### Observations
- [ ] `observations.notes` — all observation entries load

### Assumptions (if overridden)
- [ ] All 15 assumption values load when user has overridden them

---

## IMPACT CALCULATION

With Scenario 2 test data (3,000 users, 900 VDI, $250K MSP):

| Metric | Current (Broken) | Expected (Fixed) | Gap |
|--------|-----------------|-------------------|-----|
| VDI / DaaS | $0 | $720,000 | -$720,000 |
| Managed Services | $0 | $250,000 | -$250,000 |
| Overhead (7% of subtotal) | $187,973 | $238,513 | -$50,540 |
| **Total Annual TCO** | **$2,873,307** | **$3,895,847** | **-$1,022,540** |
| VDI Cost per VDI User | $0 | $800 | completely wrong |
| VDI Users shown | 0 | 900 | completely wrong |

The app is **underreporting TCO by over $1 million** on a $3.9M assessment.

---

## QA CHECKLIST

### Fix Verification
- [ ] Enter DaaS users = 300, VDI users = 600, MSP spend = 250000
- [ ] Navigate to Summary — all values appear
- [ ] Refresh browser (Ctrl+R)
- [ ] Navigate to Inputs tab — all three fields still show their values (not placeholders)
- [ ] Navigate to Summary tab — VDI/DaaS shows $720,000, MSP shows $250,000
- [ ] VDI Analytics section shows: VDI users = 900, VDI cost per VDI user > $0

### Draft Resume Verification
- [ ] Enter test data, navigate away from app
- [ ] Return to app Home tab — see draft in Recent Activity
- [ ] Click "Resume" — all fields load including VDI counts and MSP spend
- [ ] Summary shows correct totals

### Full Hydration Audit
- [ ] Every field in the checklist above loads correctly after browser refresh
- [ ] Every field loads correctly after draft resume
- [ ] No fields revert to defaults or empty on navigation between tabs

---

## DOCUMENTATION UPDATE

After fixing, update `DOCUMENTATION.md`:

**Known Issues section (if it exists):** Remove any mention of these hydration bugs.

**Data Model section:** Confirm the state shape documentation matches what's actually being persisted and restored, paying particular attention to `vdiUserCounts` and `managedServices`.
