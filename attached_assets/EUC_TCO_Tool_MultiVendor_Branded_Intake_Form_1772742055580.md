# EUC Pillars – TCO Assessment Tool: Multi-Vendor Branded Intake Form (Export & Import)

> **Owner:** Stuart
> **Purpose:** Replace the current plain, single-vendor-per-pillar Excel intake form with a branded, multi-vendor (3-slot) format. Each sub-pillar gets three entry slots so customers can report multiple vendors per category. The exported file must be XenTegra-branded and professional. The import parser must be updated to handle the new slot-numbered field labels.

---

## OVERVIEW

This spec replaces the existing intake form export **and** updates the import parser to handle the new format. It supersedes the original `EUC_TCO_Tool_Brand_Excel_Intake_Export.md` spec — that spec should be considered obsolete after this is implemented.

The two changes are:

1. **Export** — Rewrite `client/src/lib/intake-excel.ts` to produce a branded, 3-slot workbook
2. **Import** — Update the intake import parser to recognize slot-numbered labels (`Vendor 1`, `Vendor 2`, `License Type / SKU 3`, `Notes 1`, etc.)

---

## WHERE TO CHANGE

- **Export:** `client/src/lib/intake-excel.ts` (or wherever the workbook generation lives — check the codebase)
- **Import:** `client/src/lib/intake-parser.ts` (or wherever the import/field-mapping logic lives)
- **Setup dialog:** The export setup dialog that captures Client Name and Project Name before generating the file

---

## FILE NAMING

The exported file must use this naming scheme:

```
TCO_Intake_Form_[CustomerName]_[Project].xlsx
```

- **CustomerName** — Taken from the "Client Name" field in the export setup dialog. Strip spaces and special characters, use PascalCase or the raw input with spaces replaced by underscores. Example: `Touro University` → `TouroUniversity` or `Touro_University`
- **Project** — Taken from the "Project Name" field. Same formatting rules. If blank, omit the trailing underscore and project portion: `TCO_Intake_Form_[CustomerName].xlsx`

Examples:
- `TCO_Intake_Form_TouroUniversity_FY26_EUC_Assessment.xlsx`
- `TCO_Intake_Form_GlobexCorp_Modernization.xlsx`
- `TCO_Intake_Form_InitechLabs.xlsx` (no project name)

---

## XENTEGRA BRAND COLORS

| Name | Hex | RGB | Use |
|------|-----|-----|-----|
| **Navy** | `#002D56` | (0, 45, 86) | Cover title bar, pillar section headers |
| **White** | `#FFFFFF` | (255, 255, 255) | Text on navy/blue backgrounds |
| **Light Blue** | `#00B5E2` | (0, 181, 226) | Column header row, accent borders, slot sub-headers |
| **Gray** | `#75787B` | (117, 120, 123) | Helper text, descriptions |
| **Black** | `#000000` | (0, 0, 0) | Body text, field labels |
| **Light Yellow** | `#FFFFF0` | (255, 255, 240) | "Your Response" column background |
| **Light Gray** | `#F8F9FA` | (248, 249, 250) | Alternating row shading |
| **Slot Header Blue** | `#E8F4F8` | (232, 244, 248) | Entry 1/2/3 slot sub-header rows |

---

## WORKBOOK STRUCTURE

The generated workbook has 4 tabs:

| Tab | Tab Color | Contents |
|-----|-----------|----------|
| Cover Sheet | Navy (`#002D56`) | Title, metadata, instructions, quick guide |
| Environment Facts | Light Blue (`#00B5E2`) | 4 fields: Total Users, Laptops, Desktops, Thin Clients |
| EUC Pillars | Light Blue (`#00B5E2`) | All 16 sub-pillars × 3 entry slots each |
| Managed Services | Light Blue (`#00B5E2`) | MSP, Tier 1, Tier 2+, Notes |

---

## COVER SHEET — Layout

```
Row 1:  Full-width Navy background, White text, Bold 18pt
        "TCO Assessment — Intake Form"
        Merge columns A–B, row height 50

Row 2:  Spacer (height 10)

Row 3:  "Client Name"    |  [value from setup dialog — yellow bg, unlocked]
Row 4:  "Project Name"   |  [value from setup dialog — yellow bg, unlocked]
Row 5:  "Date"           |  [auto: "March 05, 2026" format]
Row 6:  "Prepared By"    |  "XenTegra"

        Col A labels: Bold, Navy text, 11pt
        Col B values: Normal, Black, 10pt
        Row height 22 each

Row 7–8: Spacers (height 8)

Row 9–12: Instructions box — merged A–B
        Light Blue left border (medium weight)
        Light gray background (#F5F5F5)
        Text (italic, 10pt, Gray):
          "Please fill in what you know in the highlighted 'Your Response' column.
           Leave anything you're unsure about blank — assumptions will be made explicit.
           Return this file to your XenTegra consultant when complete."

Row 13: Spacer

Row 14: "QUICK GUIDE" — Bold, Navy, 10pt

Row 15–22: Quick guide items (two columns — Bold Navy term, Gray description):
```

### Quick Guide Items

| Term | Description |
|------|-------------|
| Yellow cells | These are where you enter your responses |
| Dropdowns | Click a yellow cell to see a dropdown list of options |
| Other | If your vendor/product isn't listed, select 'Other' |
| Numbers | Enter whole numbers only (no commas or currency symbols) |
| Multiple vendors? | Each section has Entry 1, 2, and 3 — fill one per vendor |
| License Type / SKU | Enter the license tier or entitlement (e.g., "M365 E3", "Citrix Platform License (CPL)") |
| Notes | Use the Notes field in each entry for questions, clarifications, or context |
| Skip anything | Leave blank if you're unsure — we'll discuss it together |

### Cover Sheet Column Widths
- Column A: 25
- Column B: 55

---

## SECTION TABS — Column Structure

All section tabs (Environment Facts, EUC Pillars, Managed Services) share this layout:

| Column | Header | Width | Styling |
|--------|--------|-------|---------|
| A | Field Label | 45 | Bold, 10pt, Black |
| B | Description | 40 | Italic, 9pt, Gray |
| C | Your Response | 25 | Light Yellow bg, unlocked, Blue left/right borders |
| D | Valid Options | 40 | 9pt, Gray, wrap text |

### Column Header Row (Row 1)
- Background: Light Blue (`#00B5E2`)
- Text: White, Bold, 10pt, center-aligned, wrap text
- Bottom border: Medium Navy
- **Freeze panes at A2** (header stays visible while scrolling)

### Data Rows
- Alternating shading: odd rows Light Gray (`#F8F9FA`), even rows White
- Thin gray (`#D0D0D0`) borders on all cells
- Column C: Yellow background (`#FFFFF0`) on every data row, unlocked

---

## EUC PILLARS TAB — 3-Slot Structure

Each sub-pillar follows this pattern:

```
[NAVY SECTION HEADER — merged A–D, white bold 11pt, height 28]
  Pillar X: Category — N.N Sub-Pillar Name

[SLOT HEADER — light blue bg #E8F4F8, bold 9pt, blue text, height 22]
  ▸ Entry 1

  Vendor 1          | Primary vendor                              | [dropdown]  | Option list
  Platform 1        | Specific product or platform                | [dropdown]  | Option list
  Version 1         | Currently deployed version                  | [dropdown]  | Option list      ← only VDI
  User Count 1      | How many [DaaS/VDI] users on this platform? | [number]    | Whole number     ← only DaaS/VDI
  License Count 1   | Total number of licenses held               | [number]    | Whole number     ← not on 1.1
  License Type / SKU 1 | License tier, entitlement, or SKU — e.g., "Citrix Platform License (CPL)" or "M365 E3" or "CrowdStrike Falcon Pro" | [text] | Text  ← not on 1.1
  Notes 1           | Clarifications, questions, or anything else about this entry | [text] | Free text

[SLOT HEADER]
  ▸ Entry 2  (leave blank if not applicable)

  Vendor 2 ...
  [same fields as Entry 1]

[SLOT HEADER]
  ▸ Entry 3  (leave blank if not applicable)

  Vendor 3 ...
  [same fields as Entry 1]
```

### Field Presence by Sub-Pillar

| Sub-Pillar | Vendor | Platform | Version | User Count | License Count | License Type / SKU | Notes |
|------------|--------|----------|---------|------------|---------------|-------------------|-------|
| 1.1 PC / AI / Mobile Hardware | ✓ | ✓ | | | | | ✓ |
| 1.2 Endpoint OS | ✓ | ✓ | | | ✓ | ✓ | ✓ |
| 1.3 Secure Enterprise Browser | ✓ | ✓ | | | ✓ | ✓ | ✓ |
| VPN | ✓ | ✓ | | | ✓ | ✓ | ✓ |
| 2.1 DaaS | ✓ | ✓ | | ✓ | ✓ | ✓ | ✓ |
| 2.2 VDI | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 3.1 UEM | ✓ | ✓ | | | ✓ | ✓ | ✓ |
| 3.2 DEX | ✓ | | | | ✓ | ✓ | ✓ |
| 4.1 Endpoint Security | ✓ | | | | ✓ | ✓ | ✓ |
| 4.2 IAM | ✓ | | | | ✓ | ✓ | ✓ |
| 4.3 SASE | ✓ | | | | ✓ | ✓ | ✓ |
| 5.1 App Layering | ✓ | | | | ✓ | ✓ | ✓ |
| 5.2 App Packaging | ✓ | | | | ✓ | ✓ | ✓ |
| 5.3 Asset Management | ✓ | | | | ✓ | ✓ | ✓ |
| 6.1 Workspace AI | ✓ | | | | ✓ | ✓ | ✓ |
| 6.2 UC&C | ✓ | ✓ | | | ✓ | ✓ | ✓ |

---

## DROPDOWN OPTIONS BY SUB-PILLAR

### 1.1 PC / AI / Mobile Hardware
**Vendors:** Apple, Dell, HP, Lenovo, Other
**Platforms:** Apple — macOS, Apple — iPad, Apple — iPhone, Dell — Latitude, Dell — OptiPlex, Dell — Precision, HP — EliteBook, HP — ProBook, HP — ZBook, Lenovo — ThinkCentre, Lenovo — ThinkPad, Other

### 1.2 Endpoint OS
**Vendors:** Apple, IGEL, Microsoft, Stratodesk (Legacy), Unicon, Other
**Platforms:** Apple — iOS, Apple — iPadOS, Apple — macOS, IGEL — OS 12, IGEL — OS 11, Microsoft — Windows 10 IoT, Microsoft — Windows 11, Stratodesk (Legacy) — NoTouch OS, Unicon — eLux, Other

### 1.3 Secure Enterprise Browser
**Vendors:** Citrix, Dizzion, Island, Palo Alto Networks (Talon), Surf, Other
**Platforms:** Citrix — Secure Private Access, Dizzion — Halo, Island — Island Enterprise Browser, Palo Alto Networks (Talon) — Talon Enterprise Browser, Surf — Surf Security Browser, Other

### VPN
**Vendors:** Cisco, Fortinet, Palo Alto Networks, Zscaler, Other
**Platforms:** Cisco — AnyConnect, Cisco — Secure Client, Fortinet — FortiClient VPN, Palo Alto Networks — GlobalProtect, Zscaler — Zscaler Private Access (ZPA), Other

### 2.1 DaaS (Cloud PC / Hosted Desktop)
**Vendors:** Apporto, AWS, Citrix, Dizzion, Kasm Technologies, Microsoft, Omnissa, Parallels, Workspot, Other
**Platforms:** Apporto — Apporto Cloud Desktops, AWS — Amazon WorkSpaces, AWS — AppStream 2.0, Citrix — DaaS, Citrix — DaaS Hybrid, Dizzion — Cloud PC, Dizzion — DaaS, Kasm Technologies — Kasm Workspaces, Microsoft — Azure Virtual Desktop, Microsoft — Windows 365, Omnissa — Horizon Cloud, Parallels — Parallels RAS, Workspot — Enterprise Desktop Cloud, Other

### 2.2 VDI (On-Premises)
**Vendors:** Citrix, Omnissa, Parallels, Other
**Platforms:** Citrix — Citrix Virtual Apps and Desktops, Omnissa — Horizon, Parallels — Parallels RAS, Other
**Versions:** Citrix — CVAD 2402 LTSR, Citrix — CVAD 2203 LTSR, Citrix — CVAD 1912 LTSR, Citrix — CVAD CR (latest), Omnissa — Horizon 2412, Omnissa — Horizon 2406, Omnissa — Horizon 2312, Omnissa — Horizon 8, Omnissa — Horizon 7, Parallels — RAS 20, Parallels — RAS 19, Other

### 3.1 UEM
**Vendors:** Citrix, Ivanti, JAMF, Kaseya, Microsoft, Omnissa, PDQ, Recast Software, Tanium, Other
**Platforms:** Citrix — Workspace Environment Management (WEM), Ivanti — Endpoint Manager, Ivanti — Neurons for UEM, JAMF — Jamf Pro, Kaseya — VSA, Microsoft — Co-Managed, Microsoft — Intune, Microsoft — SCCM, Omnissa — Workspace ONE UEM, PDQ — PDQ Connect, PDQ — PDQ Deploy, Recast Software — Endpoint Insights, Recast Software — Right Click Tools, Tanium — Tanium Endpoint Management, Other

### 3.2 DEX
**Vendors:** ControlUp, Lakeside, Liquidware, Nexthink, Omnissa, Other

### 4.1 Endpoint Security
**Vendors:** CrowdStrike, Microsoft, SentinelOne, Other

### 4.2 IAM
**Vendors:** Microsoft, Okta, Ping Identity, Other

### 4.3 SASE
**Vendors:** Cato Networks, Netskope, Zscaler, Other

### 5.1 App Layering & Streaming
**Vendors:** Citrix, Liquidware, Omnissa, Other

### 5.2 Application Readiness & Packaging
**Vendors:** Flexera, Recast Software, Rimo3, Other

### 5.3 Apps Config & Asset Management
**Vendors:** ManageEngine, Microsoft, Nexthink, Recast Software, Other

### 6.1 Workspace AI
**Vendors:** Adobe, Amazon, Anthropic, Apple, Atlassian, Cisco, Google, IBM, Meta, Microsoft, Notion, OpenAI, Perplexity, Salesforce, ServiceNow, Slack, Zoom, Other

### 6.2 UC&C
**Vendors:** Cisco, Google, Microsoft, RingCentral, Slack, Zoom, Other
**Platforms:** Cisco — Webex Suite, Google — Chat, Google — Meet, Microsoft — Teams, RingCentral — MVP, RingCentral — RingCX, Slack — Slack Enterprise, Zoom — Zoom Workplace, Other

---

## EXCEL DATA VALIDATION (DROPDOWNS)

For every Vendor, Platform, and Version cell in Column C:
- Apply Excel data validation (type: list) using the options from the sub-pillar
- Always include "Other" as the last option
- Allow blank (the customer may skip slots)
- Error message: "Please select from the dropdown list or choose Other."

**Note:** If the comma-joined option string exceeds Excel's 255-character data validation limit, skip the dropdown and let the Valid Options column (D) serve as a reference list instead. The customer types their answer manually.

---

## MANAGED SERVICES TAB

| Row | Field Label | Description | Valid Options / Type |
|-----|-------------|-------------|---------------------|
| 2 | MSP Provider | Do you use a Managed Services Provider? Select all that apply. | Dropdown: XenTegra, Other, XenTegra + Other |
| 3 | MSP Provider Name (Other) | If Other, who is your MSP provider? Separate names with commas. | Text |
| 4 | Tier 1 Support / Helpdesk | Do you outsource first-line / helpdesk support? | Dropdown: Yes — Fully Outsourced, Yes — Partially Outsourced, No — In-House |
| 5 | Tier 1 FTEs | How many Tier 1 / Helpdesk support staff (full-time equivalents)? | Number |
| 6 | Tier 2/3 Support | Do you outsource escalation / engineering support? | Dropdown: (same as Tier 1) |
| 7 | Additional Notes | Anything else about your managed services arrangements? | Free text |

---

## SHEET PROTECTION

- Protect all sheets (no password — customer can unprotect if they need to)
- Lock all cells by default
- **Unlock only Column C** ("Your Response") on all section tabs
- **Unlock Client Name and Project Name** on the Cover Sheet
- Allow: select locked cells, select unlocked cells

---

## PRINT SETUP (all tabs)

- Orientation: Landscape
- Fit to: 1 page wide, auto height
- Header left: "TCO Assessment — Intake Form"
- Header right: "Page &P of &N"
- Footer center: "XenTegra | Confidential"
- Margins: 0.5" all sides
- Repeat row 1 (column headers) on every printed page

---

## IMPORT PARSER CHANGES

The import parser must be updated to handle the new slot-numbered labels. The core change: field labels now have a trailing slot number.

### New Label Format

Old format (single vendor): `Vendor`, `Platform`, `License Count`, `License SKU`
New format (3 slots): `Vendor 1`, `Vendor 2`, `Vendor 3`, `Platform 1`, `Platform 2`, `Platform 3`, etc.

### Parsing Rules

1. **Detect slot number** — When the parser encounters a field label, check if it ends with a space and a digit (1, 2, or 3). If so, strip the number to get the base field name, and record the slot index.

2. **Base field mapping** — After stripping the slot number, match the base field name using the existing canonical field map rules:
   - `Vendor` → Vendor
   - `Platform` → Platform
   - `Version` → Version
   - `User Count` → User Count
   - `License Count` → License Count
   - `License Type / SKU` → License SKU (map to existing app field)
   - `Notes` → Notes (new field — store per-slot, display in review)

3. **Section detection** — Unchanged. The navy section header rows (e.g., "Pillar 1: Endpoint Hardware & OS — 1.2 Endpoint OS") still determine which sub-pillar the subsequent fields belong to.

4. **Slot sub-headers** — The "▸ Entry 1" / "▸ Entry 2" / "▸ Entry 3" rows are visual only. The parser should skip them (they have no data in Column C).

5. **Empty slots** — If Vendor N is blank, treat the entire slot as empty and skip it. Do not create an entry for slots where the Vendor is blank.

6. **Multiple entries per sub-pillar** — The app data model may need to support multiple vendor entries per sub-pillar. If the current model only stores one vendor per sub-pillar, this needs to be extended. At minimum, the import review screen should show all populated slots and let the consultant confirm which entries to import.

### Backward Compatibility

The parser must ALSO still accept the old single-vendor format (labels without slot numbers: "Vendor", "Platform", "License Count", "License SKU"). This ensures previously exported files and Google Forms CSVs still import correctly. The matching logic should be:

1. Try to match with slot number stripped → if match, record slot
2. If no slot number found, match as slot 1 (legacy behavior)
3. Long-label Google Forms matching (keyword patterns) → continues to work as-is, treated as slot 1

### New Field: License Type / SKU

The old field was labeled "License SKU". The new label is "License Type / SKU". The parser should match BOTH:
- `License SKU` → maps to License SKU field (legacy)
- `License Type / SKU` → maps to same License SKU field
- Keyword match: `license.*type` OR `license.*sku` OR `entitlement` → License SKU

### New Field: Notes

A new free-text field per slot. The parser should:
- Match `Notes` (with or without slot number)
- Store per sub-pillar per slot
- Display in import review screen
- Not flag as unmapped or error

---

## ENVIRONMENT FACTS TAB

No changes to field structure. Same 4 rows:

| Field Label | Description | Type |
|-------------|-------------|------|
| Total Users | How many total end users are in your environment? | Number |
| Laptops | Total laptop count across your organization | Number |
| Desktops | Total desktop / workstation count | Number |
| Thin Clients | Total thin client / zero client count | Number |

---

## QA CHECKLIST

### Export

- [ ] Exported filename follows `TCO_Intake_Form_[CustomerName]_[Project].xlsx` pattern
- [ ] Filename works with no Project Name (just `TCO_Intake_Form_[CustomerName].xlsx`)
- [ ] Cover Sheet has navy title bar, metadata rows, instructions, and quick guide
- [ ] Quick guide includes "License Type / SKU" with Citrix Platform License (CPL) example
- [ ] Quick guide includes "Notes" and "Multiple vendors?" entries
- [ ] Client Name and Project Name cells are yellow and unlocked
- [ ] All 16 sub-pillars present with navy section headers
- [ ] Each sub-pillar has 3 entry slots with light blue slot sub-headers
- [ ] Entry 2 and 3 slot headers say "(leave blank if not applicable)"
- [ ] 1.1 Hardware: Vendor + Platform + Notes only (no License Count/Type)
- [ ] 2.1 DaaS: has User Count per slot
- [ ] 2.2 VDI: has Version + User Count per slot
- [ ] All Vendor fields have working dropdowns
- [ ] Platform fields have dropdowns where option list fits 255-char limit
- [ ] Column C is yellow background on all data rows
- [ ] Column C is the only unlocked column (plus Cover Sheet metadata)
- [ ] Header row frozen on all section tabs
- [ ] Tab colors applied (Navy for Cover, Light Blue for sections)
- [ ] Sheet protection enabled on all tabs (no password)
- [ ] Print layout configured (landscape, headers/footers)
- [ ] Managed Services has correct 6 fields with dropdowns

### Import

- [ ] Slot-numbered labels (`Vendor 1`, `Platform 2`, etc.) parse correctly
- [ ] Old single-vendor labels (`Vendor`, `Platform`) still parse correctly (backward compat)
- [ ] `License Type / SKU` maps to same field as old `License SKU`
- [ ] `Notes` fields are recognized and stored (not flagged as unmapped)
- [ ] Empty slots (blank Vendor) are skipped — no phantom entries created
- [ ] Slot sub-header rows ("▸ Entry 1") are skipped by parser
- [ ] Multiple populated slots per sub-pillar create separate entries
- [ ] Google Forms CSV long-label imports still work (treated as slot 1)
- [ ] Import review screen shows all populated slots with correct mapping
- [ ] Previously exported test files (Globex, Initech) still import correctly

---

## DOCUMENTATION UPDATE

After implementation, update `DOCUMENTATION.md` in the repo root to reflect all changes introduced by this spec. The documentation is the app's single source of truth and must stay current.

### Sections to Update or Add

**Intake Form Export** — Update the existing section that describes the Excel export feature. Replace any references to the old single-vendor format with the new 3-slot structure. Document:
- The new filename scheme: `TCO_Intake_Form_[CustomerName]_[Project].xlsx`
- The 4-tab workbook structure (Cover Sheet, Environment Facts, EUC Pillars, Managed Services)
- The 3-slot entry pattern per sub-pillar (Vendor 1/2/3, Platform 1/2/3, etc.)
- Which sub-pillars have which fields (reference the Field Presence table in this spec)
- The "License Type / SKU" field name and what it means (license tier / entitlement, not just a part number)
- The "Notes" field per entry slot
- XenTegra branding (colors, sheet protection, print layout)
- Cover Sheet quick guide content

**Intake Form Import** — Update the existing section that describes the import/parser. Document:
- Slot-numbered label parsing (`Vendor 1` → base field "Vendor", slot 1)
- Backward compatibility with old single-vendor labels and Google Forms CSV long labels
- `License Type / SKU` → `License SKU` field mapping (both old and new labels accepted)
- `Notes` as a recognized field (not flagged as unmapped)
- Empty slot skip logic (blank Vendor = skip entire slot)
- Slot sub-header rows ("▸ Entry N") are visual-only and skipped by parser

**Canonical Field Map** — If the documentation includes a canonical field map or field reference, add:
- `License Type / SKU` as an alias for `License SKU`
- `Notes` as a new field (per sub-pillar, per slot, free text)
- Slot number suffix convention (1, 2, 3)

**Changelog / Version History** — If `DOCUMENTATION.md` has a changelog or version section, add an entry summarizing this update (multi-vendor intake form, 3-slot structure, branding, License Type / SKU rename, Notes field, filename scheme).

### What NOT to Change

- Do not alter documentation for features unrelated to intake export/import
- Do not remove references to the Google Forms CSV workflow — it still works and is still a valid intake path
- Do not change the 7-pillar / 16-sub-pillar structure documentation — the pillars themselves haven't changed, only how they're represented in the intake form
