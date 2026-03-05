# Three Changes Needed

## 1. Full Documentation Check / Refresh / Export

Go through every page, component, and feature in the app and produce a single markdown document (`DOCUMENTATION.md` in the project root) that catalogs:

- Every page/route and what it does
- Every input field across the Inputs page (name, type, validation, which pillar it belongs to)
- Every dropdown and its full list of options (Vendor → Platform → Version mappings)
- Every calculated field and its formula
- Every export/import function and what format it uses
- Every API endpoint or data flow
- The full data model / state shape for an assessment

This is a living reference doc. If one already exists, refresh it to reflect the current state of the app. Flag anything that looks incomplete, orphaned, or inconsistent.


## 2. Standardize All Exports to CSV or XLSX (Remove JSON)

Currently, the **Tools menu > "Generate Intake Form"** exports a `.json` file, while the **Tools tab** has a separate Excel intake form export. Consolidate:

- **Remove the JSON export entirely.** No feature in the app should export `.json` files to the user.
- The Tools menu "Generate Intake Form" should export an `.xlsx` file using the same structure and field labels as the Tools tab Excel export.
- If there are two separate export buttons/paths that now do the same thing, consolidate them into one. There should be a single, clear "Export Intake Form" action that produces `.xlsx`.
- The **import** side should continue to accept both `.xlsx` and `.csv` (for Google Forms responses). No `.json` import.
- Audit the entire app for any other place that exports or imports JSON for user-facing data. Convert those to `.xlsx` or `.csv` as appropriate. JSON should only be used internally (e.g., app state, API calls), never as a user-facing file format.


## 3. Normalize Support Tier Labels

In the Managed Services section, the two support tier checkboxes currently read:

```
☐ Helpdesk / Tier 1 support
☐ Tier 2+ support / engineering
```

The formatting is inconsistent — the first leads with the job title, the second leads with the tier number. Normalize both to use the same pattern: **Tier first, then title**:

```
☐ Tier 1 Support / Helpdesk
☐ Tier 2+ Support / Engineering
```

Update this label everywhere it appears: the Inputs page UI, any export templates, the intake form, import field mapping, and the documentation from item #1 above.
