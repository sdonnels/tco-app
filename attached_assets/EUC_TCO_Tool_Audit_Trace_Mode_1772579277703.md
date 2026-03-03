# EUC Pillars – TCO Assessment Tool: Audit / Trace Mode

> **Owner:** Stuart
> **Purpose:** Add a dedicated Audit / Trace page that exposes every input, calculation, and derived value in the assessment — showing exactly where each value came from, how it was calculated, and when it last changed. Accessible only when Debug Mode is enabled.

---

## OVERVIEW

When developing or troubleshooting the TCO tool, it's critical to be able to trace any value back to its source. If a number on an output looks wrong, the Audit / Trace page should make it possible to walk backwards through every step to find exactly where the issue is.

This is not a user-facing feature — it's a diagnostic tool gated behind a Debug Mode toggle.

---

## ENABLING DEBUG MODE

### Toggle Location

- Add a **"Debug Mode"** toggle in the app's **Settings** page.
- The toggle should be clearly labeled: **"Debug Mode — Enable Audit / Trace"**
- Include a subtitle: "Exposes a detailed audit page showing all inputs, calculations, and value sources. Intended for development and troubleshooting."
- Default state: **Off**

### When Debug Mode Is On

- A new **"Audit / Trace"** item appears in the main navigation.
- Optionally, show a small persistent badge or indicator somewhere in the UI (e.g., a subtle "DEBUG" pill in the nav bar or footer) so the user always knows Debug Mode is active.

### When Debug Mode Is Off

- The "Audit / Trace" nav item is completely hidden.
- The debug badge/indicator is hidden.
- No performance impact — trace data collection should only run when Debug Mode is enabled, or should be lightweight enough to always collect but only render when viewed.

---

## AUDIT / TRACE PAGE

### Page Layout

The Audit / Trace page is a dedicated, full-width page organized into collapsible sections that mirror the structure of the assessment.

**Top-level sections:**
1. Environment Facts
2. EUC Pillars & Platforms (with sub-sections for each pillar 1.1–6.2)
3. Platform Cost Overrides
4. Managed Services & Outsourcing
5. Calculated Outputs / Results

Each section expands to show every field and calculation within it.

### Value Trace Card

Every input, calculated value, and derived output should be displayed as a **trace card** containing all of the following:

| Element | Description |
|---------|------------|
| **Field Name** | Human-readable label (e.g., "Total Endpoint Count", "VDI Annual License Cost") |
| **Current Value** | The value as it currently exists in the assessment |
| **Source** | Where the value came from — one of: `User Entry`, `Intake Import`, `Default / Assumption`, `Calculated`, `Override` |
| **Source Detail** | Additional context: which Inputs page field, which intake form cell, which default rule, or which calculation produced it |
| **Formula** | For calculated values: the full formula with **named variables**, not just numbers. E.g., `VDI Annual License Cost = License Count × Per-User License Cost × 12` |
| **Formula with Values** | The same formula with actual values substituted in. E.g., `= 225 × $15.00 × 12 = $40,500.00` |
| **Intermediate Steps** | For multi-step calculations, show each step in order. E.g.: Step 1: `Derived VDI Users = Total Users × VDI % = 1500 × 0.15 = 225` → Step 2: `Monthly License Cost = 225 × $15.00 = $3,375.00` → Step 3: `Annual License Cost = $3,375.00 × 12 = $40,500.00` |
| **Last Changed** | Timestamp of when this value was last modified, formatted as `M/D/YYYY h:mm AM/PM` |
| **Changed By** | How it was last changed: `Manual Edit`, `Intake Import`, `Recalculation` (triggered by an upstream value changing) |

### Visual Indicators

Use color-coded badges or icons for the **Source** field to make scanning easier:

| Source | Color | Icon |
|--------|-------|------|
| User Entry | Blue | Pencil |
| Intake Import | Purple | Upload |
| Default / Assumption | Amber/Yellow | Warning triangle |
| Calculated | Green | Calculator |
| Override | Red | Override/swap arrows |

**Defaults/Assumptions** should be the most visually prominent since those are the values most likely to need scrutiny or challenge.

### Search and Filter

At the top of the Audit / Trace page, provide:

- **Search** — text search across field names and values (e.g., search "VDI" to find all VDI-related fields and calculations).
- **Filter by Source** — checkboxes to show/hide values by source type (User Entry, Intake Import, Default, Calculated, Override). All checked by default.
- **Filter by Section** — dropdown to jump to a specific pillar or section.

### Dependency Links

For calculated values, each variable in the formula should be a **clickable link** that scrolls to / highlights the trace card for that source value. This creates a navigable chain:

- Click on a final output → see its formula → click a variable in the formula → jump to that intermediate value → click again → arrive at the raw input.

This makes it possible to trace any output all the way back to the original input in a few clicks.

---

## HANDLING DEFAULTS AND ASSUMPTIONS

One of the most important uses of this page is identifying where the tool is using assumed/default values rather than real data.

- Every field that uses a default or assumed value should clearly display:
  - What the default value is
  - Where the default is defined (e.g., "Default: $15/user/month — defined in Platform Cost Overrides defaults")
  - Whether the user has overridden the default (and if so, what the default *would have been*)
- Add a **"Show Defaults Only"** quick filter button that filters the entire page to show only fields using default/assumed values. This gives a fast view of every assumption the tool is making.

---

## EXPORT

- Add an **"Export Audit Trace"** button at the top of the page.
- Exports the full trace as an **.xlsx file** with one sheet per section.
- Each row = one trace card, with columns for: Field Name, Current Value, Source, Formula, Formula with Values, Intermediate Steps, Last Changed, Changed By.
- Filename: `TCO_Audit_Trace_[ClientName]_[Date].xlsx`

This is useful for offline review or sharing with a colleague to debug a specific calculation.

---

## REGRESSION TEST SUMMARY

At the top of the Audit / Trace page, show a **summary dashboard**:

| Metric | Description |
|--------|------------|
| **Total Fields** | Count of all tracked inputs and outputs |
| **User-Entered Values** | Count of fields with direct user input |
| **Intake-Imported Values** | Count of fields populated from an intake import |
| **Default / Assumed Values** | Count of fields using defaults (highlight this prominently) |
| **Calculated Values** | Count of derived/computed fields |
| **Overridden Values** | Count of fields where a default was manually overridden |
| **Last Full Recalculation** | Timestamp of the most recent calculation pass |

This gives an at-a-glance health check of the assessment data.

---

## QA CHECKLIST

- [ ] Debug Mode toggle exists in Settings, default off
- [ ] Audit / Trace nav item only appears when Debug Mode is on
- [ ] Debug indicator (badge/pill) visible in UI when Debug Mode is on
- [ ] Audit / Trace page shows collapsible sections matching assessment structure
- [ ] Every input field has a trace card with Field Name, Current Value, Source, and Last Changed
- [ ] Every calculated value shows the full formula with named variables
- [ ] Every calculated value shows the formula with actual values substituted
- [ ] Multi-step calculations show all intermediate steps in order
- [ ] Source badges are color-coded (Blue/Purple/Amber/Green/Red)
- [ ] Default/Assumed values are visually prominent
- [ ] "Show Defaults Only" filter works correctly
- [ ] Search filters across field names and values
- [ ] Source type filter checkboxes work correctly
- [ ] Clicking a variable in a formula navigates to that value's trace card
- [ ] Full dependency chain is navigable from output back to raw input
- [ ] Summary dashboard shows correct counts for all source types
- [ ] Export produces a well-structured .xlsx with all trace data
- [ ] Audit / Trace page is fully hidden when Debug Mode is off
