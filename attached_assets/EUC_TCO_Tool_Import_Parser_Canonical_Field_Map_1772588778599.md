# EUC Pillars – TCO Assessment Tool: Import Parser — Canonical Field Map & Dual-Label Support

> **Owner:** Stuart
> **Purpose:** Refactor the intake import parser to use a single canonical field map as the source of truth for all field matching. The parser must handle both short export labels (from the app's own Excel export) and long question-text labels (from Google Forms / Microsoft Forms). Includes updated test data files to validate both paths.

---

## PROBLEM

The import parser was built to match exact field labels from the app's own export template (e.g., "Total Users", "Vendor", "License Count"). When intake files arrive from Google Forms or Microsoft Forms — where the column headers are full question text like "How many total end users are in your environment?" — the parser fails to map any fields.

Both label styles must work. They will come from different sources and there is no way to control which format the consultant uploads.

---

## SOLUTION: CANONICAL FIELD MAP

A canonical field map has been added to the intake form spec (`EUC_TCO_Tool_Customer_Intake_Form.md` → "Canonical Field ID Map" section). This is the **single source of truth** for all field matching.

### What the parser must do:

For every field label it encounters in an imported file, attempt matching in this order:

1. **Exact match** on `export_label` (case-insensitive, trimmed) — e.g., "Total Users", "Vendor", "License Count"
2. **Keyword match** on `forms_label` patterns — e.g., "how many.*users.*environment" → ENV_TOTAL_USERS
3. If no match → mark as **unmapped** (show in review screen with yellow warning)

### Matching rules by section:

**Environment Facts** — match on these keywords:
- "total users" OR "end users" OR "how many.*users.*environment" → `ENV_TOTAL_USERS`
- "laptops" → `ENV_LAPTOPS`
- "desktops" → `ENV_DESKTOPS`
- "thin client" → `ENV_THIN_CLIENTS`

**EUC Pillars** — detect the current sub-pillar first (from numbered section headers like "1.1 PC / AI / Mobile Hardware" or from a `[1.1 ...]` prefix in CSV column headers), then classify the field within that section:
- "vendor" → Vendor
- "platform" OR "product" OR "device type" → Platform
- "version" → Version
- "how many licenses" OR "license count" → License Count
- "license sku" OR "part number" → License SKU
- "how many.*users" (with anything between "many" and "users") → User Count

**Important regex note:** The pattern for User Count must allow words between "many" and "users" (e.g., "How many **DaaS** users do you have?", "How many **VDI** users do you have?"). Use `how\s+many\s+.*users` not `how\s+many\s+users`.

Similarly, "How many **OS** licenses do you hold?" must match License Count. Use `how\s+many\s+.*licenses` not `how\s+many\s+licenses`.

**EUC section detection** — the parser must resolve section names to sub-pillar keys. Use ordered rules (check specific terms before broad ones to avoid false matches):

| Priority | Pattern | Resolves to |
|----------|---------|-------------|
| 1 | "daas" OR "cloud pc" OR "hosted desktop" | daas |
| 2 | "vdi" OR "on-premises" OR "on-prem" | vdi |
| 3 | "uem" OR "unified endpoint management" | uem |
| 4 | "dex" OR "digital employee experience" | dex |
| 5 | "endpoint security" | endpointSecurity |
| 6 | "iam" OR "identity" | iam |
| 7 | "sase" OR "secure access" | sase |
| 8 | "app layering" OR "streaming" | appLayering |
| 9 | "app.*readiness" OR "app.*packaging" | appPackaging |
| 10 | "asset management" OR "apps config" | assetManagement |
| 11 | "workspace ai" | workspaceAi |
| 12 | "uc" OR "collaboration" OR "communications" | ucc |
| 13 | "endpoint os" | endpointOs |
| 14 | "secure.*browser" OR "enterprise browser" | secureEnterpriseBrowser |
| 15 | "hardware" OR "pc.*mobile" | pcMobileHardware |

**⚠️ "ai" and "pc" must NOT be standalone match terms** — they're too short and will false-match other sections. Always require them as part of a longer phrase ("workspace ai", "pc.*mobile").

**Managed Services** — match on these keywords:
- "msp" OR "managed services provider" → MSP_PROVIDER_TYPE
- "msp.*name" OR "who is your msp" → MSP_PROVIDER_NAME
- "tier 1" OR "helpdesk" (but NOT "fte") → MS_TIER1_OUTSOURCED
- "tier 1.*fte" OR "support staff" → MS_TIER1_FTES
- "tier 2" OR "tier 3" OR "escalation" → MS_TIER23_OUTSOURCED
- "additional" OR "notes" OR "details" → MS_NOTES

---

## CSV HANDLING

Google Forms exports have the question text as column headers in row 1, with response data in subsequent rows.

The CSV column headers may include a section prefix in brackets:
- `[1.1 PC / AI / Mobile Hardware] Which hardware vendor(s) do you use?`

The parser should:
1. Strip the bracket prefix to detect the pillar section
2. Use the remaining text for keyword matching
3. First three columns are always: Timestamp, Client Name, Project Name
4. Accept UTF-8 and UTF-8 with BOM encoding

---

## SHEET NAME MATCHING

The parser must be flexible about sheet/tab names in .xlsx files:
- "Cover Sheet" OR "Cover" → Cover data
- "Environment Facts" OR "Environment" → Environment Facts
- "EUC Pillars" OR "Pillars" → EUC Pillar data
- "Managed Services" OR "Services" → Managed Services data
- "Platform Cost Overrides" OR "Cost Overrides" OR "Overrides" → Cost overrides

Use case-insensitive partial matching (contains), not exact string equality.

---

## TEST DATA FILES

Four test files are provided. **All four must import successfully** with correct field mapping for the feature to pass QA.

| File | Format | Label Style | Scenario | Tests |
|------|--------|-------------|----------|-------|
| `TEST_Intake_GlobexCorp_ShortLabels.xlsx` | Excel | Short export labels | Happy path — all fields filled | Exact `export_label` matching |
| `TEST_Intake_GlobexCorp_LongLabels.csv` | CSV | Long question text | Happy path — all fields filled | Keyword matching, CSV parsing, bracket-prefixed headers |
| `TEST_Intake_InitechLabs_LongLabels.xlsx` | Excel | Long question text | Edge cases | Keyword matching + blanks, "Other" selections, invalid numeric ("not sure"), zero values |
| `TEST_Intake_InitechLabs_ShortLabels.csv` | CSV | Short export labels | Edge cases | Exact matching + edge cases in CSV format |

### Expected results per scenario:

**Globex Corporation (happy path):**
- All fields should map with green checkmarks
- 0 unmapped, 0 errors, 0 blanks
- Cover: Client Name = "Globex Corporation", Project Name = "FY26 EUC Modernization Assessment"

**Initech Labs (edge cases):**
- Most fields should map with green checkmarks
- Several blank fields (Thin Clients, all of 2.1 DaaS, all of 2.2 VDI except User Count, all of 5.1 and 5.2) — should show in blank count
- "Other" selected for Vendor in 1.3, 4.3, 5.3 — should map correctly
- "not sure" in Tier 1 FTEs — should flag as **error** (text in numeric field)
- VDI User Count = "0" — should parse as valid number (not blank, not error)
- License SKU for 1.2 is blank — should be in blank count
- Additional Notes is blank — should be in blank count

---

## QA CHECKLIST

- [ ] Globex .xlsx (short labels) imports with all fields mapped, 0 errors
- [ ] Globex .csv (long labels) imports with all fields mapped, 0 errors
- [ ] Initech .xlsx (long labels) imports with correct mapped/blank/error counts
- [ ] Initech .csv (short labels) imports with correct mapped/blank/error counts
- [ ] "not sure" in Tier 1 FTEs flagged as error in both Initech files
- [ ] VDI User Count = "0" parsed as valid number (not blank, not error)
- [ ] "Other" vendor selections correctly mapped
- [ ] Blank fields show correct count (not flagged as errors)
- [ ] Section names resolve correctly for all 15 sub-pillars
- [ ] "How many DaaS users" matches User Count (not License Count)
- [ ] "How many OS licenses" matches License Count (not filtered out by "OS" in the middle)
- [ ] CSV bracket prefixes `[1.1 ...]` correctly strip and resolve sections
- [ ] Sheet name matching works with variations ("Cover Sheet" vs "Cover")
- [ ] Both .xlsx and .csv accepted by the import button
- [ ] Review screen displays correct mapping summary before draft creation
