# EUC Pillars – TCO Assessment Tool: Customer Intake Form (Excel Export/Import)

> **Owner:** Stuart
> **Purpose:** Add the ability to export an Excel-based intake form template that can be sent to customers to gather Inputs page data ahead of a TCO engagement. Completed responses are imported back into the app, creating a new draft assessment pre-filled with the customer's answers.

---

## OVERVIEW

Before a TCO engagement, the consultant needs a way to gather environment data from the customer without giving them access to the full app. This feature provides an Excel-based workflow:

1. Consultant exports a structured intake form template (.xlsx) from the app.
2. Customer fills in what they know and returns the file.
3. Consultant imports the completed file, which creates a new draft assessment pre-filled with the responses.

---

## EXPORTING THE INTAKE TEMPLATE

### Trigger

- Add an **"Export Intake Form"** button on the TCO Platform landing page (near "Start New Assessment").
- Clicking it opens a setup dialog where the consultant provides:
  - **Client Name** (required)
  - **Project Name** (optional)
  - **Sections to include** — checkboxes for each Inputs page section, all checked by default. The consultant can uncheck sections that aren't relevant to slim down the form for the customer.
- On confirm, the app generates and downloads an **.xlsx file**.
- Filename format: `TCO_Intake_[ClientName]_[Date].xlsx` (e.g., `TCO_Intake_GlobexCorp_2026-03-03.xlsx`)

### Excel Structure

The generated workbook should contain:

**Cover Sheet (first tab)**
- XenTegra logo at top
- Title: "TCO Assessment — Intake Form"
- Client Name and Project Name (pre-filled from the setup dialog)
- Date generated
- Brief instructions: "Please fill in what you know in the highlighted 'Your Response' column. Leave anything you're unsure about blank — assumptions will be made explicit. Return this file to your consultant when complete."

**One tab per Inputs section** (only for sections the consultant selected):

Each section tab should have the following column structure:

| Column | Content |
|--------|---------|
| **A — Field Label** | The field name (e.g., "Total Users", "Endpoint OS Vendor") |
| **B — Description** | Helper text explaining what's being asked (e.g., "How many total end users are in your environment?") |
| **C — Your Response** | Blank, highlighted (light yellow fill) — this is where the customer enters their answer |
| **D — Valid Options** | For dropdown fields, list all valid choices separated by line breaks. For free-text or numeric fields, show the expected format (e.g., "Numeric", "Text — enter vendor name") |

### Dropdown Fields in Excel

For fields that are dropdowns in the app (Vendor, Platform, Version):
- Apply **Excel data validation** on the response cell (Column C) using the valid options from Column D, so the customer gets an in-cell dropdown.
- Always include "Other" as the last option in every validation list.
- If the customer selects "Other," the next row should be a free-text field labeled "Other — Specify [Vendor/Platform] Name."

### Cascading Fields

Since Excel can't easily replicate cascading dropdowns:
- List Vendor as one row with a dropdown.
- List Platform as the next row with **all** platform options across all vendors, prefixed with the vendor name (e.g., "Microsoft — Intune", "Microsoft — SCCM", "Citrix — WEM"). This avoids needing dynamic filtering in Excel while still being clear.
- List Version as a third row where applicable, with the same prefixed approach.

### Section-Specific Tabs

Include tabs for all Inputs page sections:

| Tab Name | Contents |
|----------|---------|
| Environment Facts | Total Users, Laptops, Desktops, Thin Clients |
| EUC Pillars | All sub-pillars (1.1–6.2): Vendor, Platform, Version, License Count, License SKU per sub-pillar |
| Platform Cost Overrides | Any cost override fields |
| Managed Services | All fields including Tier 1 Support / Helpdesk, MSP provider selection |
| *(Any other Inputs sections)* | Mirror all remaining fields |

### Formatting

- Column A and B should be **locked/protected** (customer shouldn't edit labels or descriptions).
- Column C should be **unlocked and highlighted** (light yellow fill) to clearly indicate where to type.
- Use consistent fonts and sizing. Bold the field labels in Column A.
- Freeze the header row on each tab.
- Auto-size column widths for readability.

---

## IMPORTING COMPLETED RESPONSES

### Trigger

- Add an **"Import Intake Responses"** button on the TCO Platform landing page (near "Start New Assessment" and "Export Intake Form").
- Accepts a filled-in **.xlsx or .csv** file uploaded by the consultant.

### Supported File Formats

| Format | Source | Notes |
|--------|--------|-------|
| .xlsx | Microsoft Forms responses, or the TCO Excel intake template | Primary format — parsed by matching Column A field labels |
| .csv | Google Forms responses (Responses > Download responses .csv) | Parsed by matching column headers to field labels |

**CSV-specific handling:**
- Google Forms exports column headers as the question text. Match these against the "Question Text" values (Column A from the Forms Builder Guide) to map to app fields.
- CSV encoding: accept UTF-8 and UTF-8 with BOM.
- If commas appear inside field values, they should be properly quoted (standard CSV). The parser must handle quoted fields correctly.

### Import Flow

1. Consultant clicks "Import Intake Responses" and selects the completed .xlsx file.
2. The app parses the file, matching field labels (Column A) to Inputs page fields.
3. Display a **summary/review screen** showing:
   - **Mapped fields** — field name, customer's response, and which Inputs field it maps to. Show a green checkmark.
   - **Unmapped values** — any responses that couldn't be matched to a known dropdown option (e.g., a vendor name that doesn't exist in the app). Show a yellow warning with the option to manually map it or leave it as "Other."
   - **Blank fields** — a count of how many fields were left empty (no action needed, just informational).
   - **Errors** — any rows that couldn't be parsed (e.g., text in a numeric field). Show a red flag with the problematic value.
4. Consultant reviews the summary and clicks **"Create Draft Assessment"**.
5. A new draft assessment is created, pre-filled with all successfully mapped responses.

### Draft Creation

- The new draft appears in the **Recent Activity** table with:
  - Client/Project name pulled from the Cover Sheet
  - Status: **"intake received"** (new status badge, visually distinct from "draft")
  - Timestamp of when the import was completed
- When the consultant clicks **"Resume"**, they see the full Inputs page with customer responses pre-populated.
- Once the consultant makes any edit, the status changes from "intake received" to **"draft"**.

### Canonical Field ID Map — SINGLE SOURCE OF TRUTH

The export template, the import parser, the Google/Microsoft Forms question text, and the app state **must all reference this map**. Any new field added to the Inputs page must be added here first.

The import parser should match on **any** of: the `field_id`, the `export_label` (short label in Column A of the Excel template), or the `forms_label` (question text used in Google/Microsoft Forms). Matching is **case-insensitive, trimmed**.

#### Cover / Meta Fields

| field_id | export_label | forms_label | app_state_key | type |
|----------|-------------|-------------|---------------|------|
| `META_CLIENT_NAME` | Client Name | Client Name | clientName | text |
| `META_PROJECT_NAME` | Project Name | Project Name | projectName | text |

#### Environment Facts

| field_id | export_label | forms_label | app_state_key | type |
|----------|-------------|-------------|---------------|------|
| `ENV_TOTAL_USERS` | Total Users | How many total end users are in your environment? | environmentFacts.totalUsers | number |
| `ENV_LAPTOPS` | Laptops | How many laptops are in your environment? | environmentFacts.laptops | number |
| `ENV_DESKTOPS` | Desktops | How many desktops are in your environment? | environmentFacts.desktops | number |
| `ENV_THIN_CLIENTS` | Thin Clients | How many thin clients are in your environment? | environmentFacts.thinClients | number |

#### EUC Pillars (per sub-pillar: replace `{N.N}` with pillar number and `{pillarKey}` with the app state key)

| field_id pattern | export_label | forms_label | app_state_key pattern | type |
|-----------------|-------------|-------------|----------------------|------|
| `P{N.N}_VENDOR` | Vendor | Which vendor(s) do you use? / Which {pillar} vendor do you use? | pillars.{pillarKey}.vendor | dropdown |
| `P{N.N}_PLATFORM` | Platform | Which platform? / Which product? / What device types are in use? | pillars.{pillarKey}.platform | dropdown |
| `P{N.N}_VERSION` | Version | Which version? | pillars.{pillarKey}.version | dropdown |
| `P{N.N}_LICENSE_COUNT` | License Count | How many licenses do you hold? | pillars.{pillarKey}.licenseCount | number |
| `P{N.N}_LICENSE_SKU` | License SKU | What is the license SKU? | pillars.{pillarKey}.licenseSku | text |
| `P{N.N}_USER_COUNT` | User Count | How many {type} users do you have? | pillars.{pillarKey}.userCount | number |

**Sub-pillar key reference:**

| Pillar | pillarKey |
|--------|-----------|
| 1.1 PC / AI / Mobile Hardware | pcMobileHardware |
| 1.2 Endpoint OS | endpointOs |
| 1.3 Secure Enterprise Browser | secureEnterpriseBrowser |
| 2.1 DaaS (Cloud PC / Hosted Desktop) | daas |
| 2.2 VDI (On-Premises) | vdi |
| 3.1 Unified Endpoint Management (UEM) | uem |
| 3.2 Digital Employee Experience (DEX) | dex |
| 4.1 Endpoint Security | endpointSecurity |
| 4.2 Identity & Access Management (IAM) | iam |
| 4.3 Secure Access Service Edge (SASE) | sase |
| 5.1 App Layering & Streaming | appLayering |
| 5.2 Application Readiness & Packaging | appPackaging |
| 5.3 Apps Config & Asset Management | assetManagement |
| 6.1 Workspace AI | workspaceAi |
| 6.2 Unified Communications & Collaboration | ucc |

#### Managed Services

| field_id | export_label | forms_label | app_state_key | type |
|----------|-------------|-------------|---------------|------|
| `MSP_PROVIDER_TYPE` | MSP Provider | Do you use a Managed Services Provider (MSP)? | managedServices.mspProviderType | checkboxes |
| `MSP_PROVIDER_NAME` | MSP Provider Name (Other) | If Other, who is your MSP provider? | managedServices.mspProviderName | text |
| `MS_TIER1_OUTSOURCED` | Tier 1 Support / Helpdesk | Do you outsource Tier 1 Support / Helpdesk? | managedServices.tier1Outsourced | dropdown |
| `MS_TIER1_FTES` | Tier 1 FTEs | How many Tier 1 support staff (FTEs)? | managedServices.tier1Ftes | number |
| `MS_TIER23_OUTSOURCED` | Tier 2/3 Support | Do you outsource Tier 2 / Tier 3 support? | managedServices.tier23Outsourced | dropdown |
| `MS_NOTES` | Additional Notes | Any additional managed services details? | managedServices.notes | text |

#### Import Matching Priority

When the parser encounters a field label, it should attempt to match in this order:
1. **Exact match** on `field_id` (if the file includes field IDs — future-proofing)
2. **Exact match** on `export_label` (case-insensitive, trimmed)
3. **Fuzzy match** on `forms_label` keywords (case-insensitive, using the keyword patterns below)
4. If no match → mark as **unmapped**

**Keyword patterns for fuzzy matching** (used when forms_label doesn't match exactly):
- "total users" / "end users" / "how many.*users.*environment" → `ENV_TOTAL_USERS`
- "laptops" → `ENV_LAPTOPS`
- "desktops" → `ENV_DESKTOPS`
- "thin client" → `ENV_THIN_CLIENTS`
- "vendor" → `P{N.N}_VENDOR` (scoped to current section)
- "platform" / "product" / "device type" → `P{N.N}_PLATFORM`
- "version" → `P{N.N}_VERSION`
- "how many licenses" / "license count" → `P{N.N}_LICENSE_COUNT`
- "license sku" / "part number" → `P{N.N}_LICENSE_SKU`
- "how many.*users" (within a pillar section) → `P{N.N}_USER_COUNT`
- "msp" / "managed services provider" → `MSP_PROVIDER_TYPE`
- "tier 1" / "helpdesk" → `MS_TIER1_OUTSOURCED`
- "tier 1.*fte" / "support staff" → `MS_TIER1_FTES`
- "tier 2" / "tier 3" / "escalation" → `MS_TIER23_OUTSOURCED`

### Additional Import Mapping Rules

- For dropdown values: match against known options (case-insensitive). If no match, treat as "Other" and populate the corresponding free-text field with the customer's entry.
- Numeric fields: strip formatting (commas, dollar signs, spaces) and parse as numbers. If parsing fails, flag as an error.
- Blank cells = leave the field empty in the draft (do not default).
- If the Cover Sheet is missing Client Name, prompt the consultant to enter one before creating the draft.

### Error Handling

- If the uploaded file doesn't match the expected template structure (missing tabs, wrong columns), show a clear error: "This file doesn't match the expected intake form template. Please ensure you're uploading a completed TCO Intake Form."
- If the file is not .xlsx or .csv, reject with: "Please upload an Excel file (.xlsx) or CSV file (.csv)."

---

## QA CHECKLIST

- [ ] "Export Intake Form" button appears on landing page
- [ ] Setup dialog collects Client Name, Project Name, and section toggles
- [ ] Generated .xlsx has a Cover Sheet with branding, client name, and instructions
- [ ] Each selected section has its own tab with correct fields
- [ ] Column A (labels) and B (descriptions) are locked/protected
- [ ] Column C (responses) is unlocked with yellow highlight
- [ ] Dropdown fields have Excel data validation applied
- [ ] "Other" is included as the last option in all validation lists
- [ ] Cascading fields use vendor-prefixed options for clarity
- [ ] "Import Intake Responses" button appears on landing page
- [ ] Import accepts .xlsx files (short export labels)
- [ ] Import accepts .xlsx files (long Forms-style question labels)
- [ ] Import accepts .csv files (Google Forms export format with question-text headers)
- [ ] CSV import correctly matches column headers to app fields via canonical field map
- [ ] Parser matches on exact export_label (case-insensitive)
- [ ] Parser matches on keyword patterns when export_label doesn't match
- [ ] All field_ids in the canonical map resolve to valid app_state_keys
- [ ] Summary screen shows mapped fields, unmapped values, blanks, and errors
- [ ] Unmapped dropdown values are treated as "Other" with free-text populated
- [ ] New draft is created with "intake received" status
- [ ] Draft appears in Recent Activity with correct client name and timestamp
- [ ] Status changes from "intake received" to "draft" after consultant edits
- [ ] Blank cells result in empty fields (not defaults)
- [ ] Non-template files are rejected with a clear error message
- [ ] Files that are not .xlsx or .csv are rejected
