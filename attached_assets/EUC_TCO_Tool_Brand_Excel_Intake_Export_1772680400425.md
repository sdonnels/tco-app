# EUC Pillars – TCO Assessment Tool: Brand the Excel Intake Form Export

> **Owner:** Stuart
> **Purpose:** Apply XenTegra brand styling to the Excel intake form that the app exports. Currently exports as plain text with no formatting. Should look professional and on-brand when the customer opens it.

---

## XENTEGRA BRAND COLORS (from xentegra.com/media-center)

| Name | Hex | RGB | Use In Excel |
|------|-----|-----|-------------|
| **Primary 1 — Navy** | `#002D56` | (1, 45, 86) | Cover sheet title bar, section headers, pillar header rows |
| **Primary 2 — White** | `#FFFFFF` | (255, 255, 255) | Header text on navy backgrounds, general background |
| **Secondary 1 — Light Blue** | `#00B5E2` | (0, 181, 226) | Column header row, accent borders, "Your Response" column header |
| **Secondary 2 — Gray** | `#75787B` | (116, 120, 123) | Helper text, secondary labels, subtle borders |
| **Secondary 3 — Black** | `#000000` | (0, 0, 0) | Body text, field labels |

---

## WHERE TO CHANGE

The Excel export is generated in `client/src/lib/intake-excel.ts`. The styling needs to be applied when building the workbook using the xlsx library (likely SheetJS/xlsx or ExcelJS — check which library the app uses).

---

## COVER SHEET STYLING

The Cover Sheet (first tab) should look like a branded document, not a raw data dump.

### Layout

```
Row 1:  [XenTegra logo if possible, or just the title bar]
        Full-width navy (#002D56) background, white text
        "TCO Assessment — Intake Form"
        Font: Bold, 18pt

Row 2:  (empty spacer row)

Row 3:  "Client Name"  |  [value from setup dialog]
Row 4:  "Project Name"  |  [value from setup dialog]
Row 5:  "Date"          |  [auto-generated]
Row 6:  "Prepared By"   |  "XenTegra"

        Labels in Column A: Bold, navy text (#002D56)
        Values in Column B: Normal, black text

Row 8:  (empty spacer row)

Row 9:  Instructions box — light blue (#00B5E2) left border, light gray background (#F5F5F5)
        "Please fill in what you know in the highlighted 'Your Response' column.
         Leave anything you're unsure about blank — assumptions will be made explicit.
         Return this file to your consultant when complete."
        Font: Italic, 10pt, gray (#75787B)
```

### Column Widths
- Column A: 25 characters
- Column B: 50 characters

---

## SECTION TAB STYLING (Environment Facts, EUC Pillars, Managed Services)

### Column Header Row (Row 1)

| Column | Header Text | Width |
|--------|------------|-------|
| A | Field Label | 45 |
| B | Description | 40 |
| C | Your Response | 25 |
| D | Valid Options | 35 |

**Styling:**
- Background: Light Blue (`#00B5E2`)
- Text: White, Bold, 10pt
- Alignment: Center, wrap text
- Bottom border: 2px Navy (`#002D56`)
- Freeze this row (freeze panes at row 2)

### Field Label Column (Column A)

- Font: Bold, 10pt, Black
- No background fill (white)

### Description Column (Column B)

- Font: Normal, 9pt, Gray (`#75787B`)
- Italic

### "Your Response" Column (Column C)

- Background: Light yellow (`#FFFFF0`) — this is the column the customer types in
- Font: Normal, 10pt, Black
- Left border: 1px Light Blue (`#00B5E2`)
- Right border: 1px Light Blue (`#00B5E2`)
- **This column should be unlocked** (if sheet protection is applied)

### Valid Options Column (Column D)

- Font: Normal, 9pt, Gray (`#75787B`)
- Wrap text enabled

### Pillar Section Headers (EUC Pillars tab only)

When a row is a pillar/sub-pillar section header (e.g., "1.1 PC / AI / Mobile Hardware"):

- Background: Navy (`#002D56`)
- Text: White, Bold, 11pt
- Merge cells A through D for the header row
- Add 4px top padding (extra row height)

### Alternating Row Shading

For data rows (not headers):
- Even rows: White (`#FFFFFF`)
- Odd rows: Very light gray (`#F8F9FA`)

### Grid Lines

- Use thin (1px) gray (`#D0D0D0`) borders on all data cells
- No borders on empty/spacer rows

---

## SHEET PROTECTION

- Protect all sheets with no password (so customers can unprotect if they need to, but won't accidentally edit labels)
- Lock all cells by default
- **Unlock only Column C** ("Your Response") — this is the only column customers should edit
- Allow: select locked cells, select unlocked cells, sort, autofilter

---

## TAB COLORS

Apply tab colors (the colored strip at the bottom of each sheet tab):

| Tab | Color |
|-----|-------|
| Cover Sheet | Navy (`#002D56`) |
| Environment Facts | Light Blue (`#00B5E2`) |
| EUC Pillars | Light Blue (`#00B5E2`) |
| Platform Cost Overrides | Gray (`#75787B`) |
| Managed Services | Light Blue (`#00B5E2`) |

---

## PRINT SETUP

Configure print settings so the form looks good if the customer prints it:

- Orientation: Landscape
- Fit to: 1 page wide (auto height)
- Header: "TCO Assessment — Intake Form" (left), Page &P of &N (right)
- Footer: "XenTegra | Confidential" (center)
- Margins: 0.5" all sides
- Print gridlines: Yes
- Repeat row 1 (column headers) on every printed page

---

## BEFORE / AFTER

**Before (current):**
- Plain white background everywhere
- No font styling
- No column width optimization
- No frozen headers
- No sheet protection
- No print setup
- Looks like raw data pasted into Excel

**After (branded):**
- Navy title bar on cover sheet
- Light blue column headers
- Yellow-highlighted response column
- Navy section headers for pillar groups
- Alternating row shading
- Frozen header row
- Protected labels with unlocked response column
- Professional print layout
- Looks like a branded XenTegra deliverable

---

## QA CHECKLIST

- [ ] Cover sheet has navy title bar with white text
- [ ] Cover sheet has client name, project name, date, "Prepared By: XenTegra"
- [ ] Cover sheet has instructions in italic gray text
- [ ] All section tabs have light blue column headers with white bold text
- [ ] Column C ("Your Response") has yellow background on all data rows
- [ ] Column C is the only unlocked column when sheet protection is on
- [ ] EUC Pillars tab has navy section headers for each pillar/sub-pillar
- [ ] Alternating row shading on data rows
- [ ] Header row is frozen on all section tabs
- [ ] Tab colors are applied (navy for cover, light blue for sections)
- [ ] Column widths are set for readability (no truncated text)
- [ ] Description text is gray and italic
- [ ] Print setup is configured (landscape, headers/footers, repeat headers)
- [ ] Thin gray grid lines on all data cells
- [ ] File still imports correctly after styling changes (styling is cosmetic only, should not affect data parsing)
