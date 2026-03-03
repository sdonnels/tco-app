# EUC Pillars – TCO Assessment Tool: Environment Facts Redesign

> **Owner:** Stuart
> **Purpose:** Redesign the "Environment Facts" section in the Inputs area. Remove VDI/DaaS user percentage from this section (relocate to pillars), simplify to endpoint device counts with auto-summing, add a contextual help sidebar, and add license count + license SKU fields to every platform across all pillars.

---

## CHANGE 1: REDESIGN THE ENVIRONMENT FACTS SECTION

### What to Remove

Delete the entire **"VDI / DaaS"** card/section from Environment Facts, including:
- "VDI % of users" input field
- "Derived VDI users" computed badge
- The "VDI / DaaS" heading and subtitle ("Percentage of users on virtual desktop infrastructure")

These fields are being relocated — see Change 2 below.

### New Layout

The Environment Facts section should have **two columns**: a narrow left sidebar and the main content area.

**Left Sidebar — "How This Works" Box**
- A fixed-width sidebar panel to the left of the main content.
- Heading: **"How This Works"**
- Contains a brief explanation of the Environment Facts section (contextual help text). Use something like: "Enter the device counts you know. Leave unknowns blank — assumptions will be explicit and challengeable. The endpoint total is calculated automatically from device counts below."
- Styled as a muted/secondary card — should not compete visually with the input fields.

**Main Content Area — End-User Devices**

Keep the existing section header and subtitle:
- **"Environment Facts"**
- Subtitle: "Enter what you know. Leave unknowns blank — assumptions will be explicit and challengeable."
- Tag/badge: "Inputs • Baseline only"

Input fields (all numeric, all optional):

| Field | Placeholder | Notes |
|-------|------------|-------|
| **Total Users** | e.g., 1500 | Total user count in the environment |
| **Laptops** | e.g., 1000 | Number of laptop endpoints |
| **Desktops** | e.g., 350 | Number of desktop endpoints |
| **Thin Clients** | e.g., 80 | Number of thin client endpoints |

### Auto-Sum Logic

- **Endpoint Total** = Laptops + Desktops + Thin Clients
- Display the computed total as a badge/pill (matching the current "1,000 endpoints" badge style) near the device count fields.
- The sum should update in real time as the user types.
- If all three device fields are blank, hide the endpoint total badge (don't show "0 endpoints").

### Field Layout

Arrange the fields in a grid:
- **Row 1:** Total Users (full width or left-aligned)
- **Row 2:** Laptops (left), Desktops (center or right)
- **Row 3:** Thin Clients (left), Endpoint Total badge (right, auto-calculated)

This matches the hand-drawn wireframe where device types feed into a summed total at the bottom.

---

## CHANGE 2: RELOCATE VDI USER CONTEXT TO PILLARS

The VDI/DaaS user percentage that was removed from Environment Facts should be **relocated into the relevant pillar sub-sections** where VDI and DaaS platforms are configured (Pillar 2: Virtual Desktops & Applications — specifically 2.1 DaaS and 2.2 VDI).

Add the following fields within the DaaS (2.1) and VDI (2.2) sub-pillar sections:
- **"Number of VDI/DaaS users"** — numeric input field
- This replaces the old percentage-based calculation with a direct user count entry at the pillar level where it's contextually relevant.

---

## CHANGE 3: ADD LICENSE COUNT & LICENSE SKU TO EVERY PLATFORM

### Scope

This applies to **every platform/product across all pillars** (anywhere a vendor + platform is selected in a dropdown).

### New Fields

After a user selects a Vendor and Platform (and Version, where applicable), display two additional fields:

| Field | Type | Placeholder | Notes |
|-------|------|------------|-------|
| **License Count** | Numeric input | e.g., 500 | Number of licenses held for this platform |
| **License SKU** | Text input | e.g., CCS-STA-C | The license SKU or part number |

### Behavior

- These fields should appear **inline with or directly below** the platform selection dropdowns for each sub-pillar.
- Both fields are optional — leave blank if unknown.
- Fields should only be visible/enabled **after** a platform has been selected (not when the vendor dropdown is still at its default/empty state).
- If a sub-pillar allows selecting multiple platforms (e.g., a user selects both Intune and SCCM under Microsoft UEM), each selected platform gets its **own** License Count and License SKU fields.

### Affected Sections

This applies to all sub-pillars that have platform selections:
- 1.1 PC / AI / Mobile Hardware
- 1.2 Endpoint OS
- 1.3 Secure Enterprise Browser
- 2.1 DaaS
- 2.2 VDI
- 3.1 UEM
- 3.2 DEX
- 4.1 Endpoint Security
- 4.2 IAM
- 4.3 SASE
- 5.1 App Layering & Streaming
- 5.2 Application Readiness & Packaging
- 5.3 Apps Config & Asset Management
- 6.1 Workspace AI
- 6.2 Unified Communications & Collaboration

---

## QA CHECKLIST

Run through each of these after changes are implemented:

- [ ] VDI / DaaS section is fully removed from Environment Facts
- [ ] No "VDI % of users" or "Derived VDI users" fields remain in Environment Facts
- [ ] "How This Works" sidebar appears to the left of the main content
- [ ] Total Users, Laptops, Desktops, and Thin Clients fields are present and accept numeric input
- [ ] Endpoint Total auto-calculates as Laptops + Desktops + Thin Clients in real time
- [ ] Endpoint Total badge is hidden when all three device fields are blank
- [ ] VDI/DaaS user count field is present in Pillar 2.1 (DaaS) and 2.2 (VDI)
- [ ] License Count and License SKU fields appear after a platform is selected in every sub-pillar
- [ ] License fields are hidden/disabled when no platform is selected
- [ ] Multiple platform selections each get their own License Count and License SKU
- [ ] All new fields auto-save to draft state (consistent with Recent Activity feature)
