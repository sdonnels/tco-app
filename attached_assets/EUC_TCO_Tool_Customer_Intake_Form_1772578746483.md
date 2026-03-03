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
- Accepts a filled-in .xlsx file uploaded by the consultant.

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

### Import Mapping Rules

- Match field labels from Column A to Inputs page fields (case-insensitive, trimmed).
- For dropdown values: match against known options (case-insensitive). If no match, treat as "Other" and populate the corresponding free-text field with the customer's entry.
- Numeric fields: strip formatting (commas, dollar signs, spaces) and parse as numbers. If parsing fails, flag as an error.
- Blank cells = leave the field empty in the draft (do not default).
- If the Cover Sheet is missing Client Name, prompt the consultant to enter one before creating the draft.

### Error Handling

- If the uploaded file doesn't match the expected template structure (missing tabs, wrong columns), show a clear error: "This file doesn't match the expected intake form template. Please ensure you're uploading a completed TCO Intake Form."
- If the file is not .xlsx, reject with: "Please upload an Excel file (.xlsx)."

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
- [ ] Import accepts .xlsx files only
- [ ] Summary screen shows mapped fields, unmapped values, blanks, and errors
- [ ] Unmapped dropdown values are treated as "Other" with free-text populated
- [ ] New draft is created with "intake received" status
- [ ] Draft appears in Recent Activity with correct client name and timestamp
- [ ] Status changes from "intake received" to "draft" after consultant edits
- [ ] Blank cells result in empty fields (not defaults)
- [ ] Non-template files are rejected with a clear error message
