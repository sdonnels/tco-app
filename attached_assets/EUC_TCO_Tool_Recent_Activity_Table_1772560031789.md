# EUC Pillars – TCO Assessment Tool: Recent Activity Table

> **Owner:** Stuart
> **Purpose:** Add a Recent Activity table to the TCO Micro-Assessment Platform landing page, mirroring the pattern used in the Pulse app. This enables users to resume in-progress draft assessments.

---

## FEATURE: RECENT ACTIVITY TABLE (TCO Micro-Assessment Platform Landing Page)

### Overview

Add a "Recent Activity" table to the TCO Micro-Assessment Platform landing page that displays all in-progress (draft) assessments. This mirrors the existing Recent Activity pattern used in the Pulse app. Users can resume a draft assessment directly from this table.

### UI Placement

- The Recent Activity table goes on the **main TCO Platform landing page**, below any existing hero/header content and the "Start New Assessment" action.
- Use the heading **"Recent Activity"** above the table, matching the Pulse app's styling.

### Table Layout

Use the same column structure as the Pulse app:

| Column | Description |
|--------|------------|
| **CLIENT / PROJECT** | Client name (bold, primary) on the first line; project name (muted, secondary) on the second line |
| **PACK** | The assessment pack/type identifier (e.g., the TCO assessment template name) |
| **LAST MODIFIED** | Date of the most recent change, formatted as `M/D/YYYY` |
| **STATUS** | Badge/pill showing current state — display **"draft"** for in-progress assessments |
| **ACTION** | A **"Resume"** button |

### Table Styling

- Match the Pulse app's dark-themed table style: dark background rows, subtle row borders, uppercase column headers in muted text.
- The **Status** badge should use a pill/chip style (rounded, small, outlined or lightly filled) with the label "draft".
- The **Resume** button should be a neutral/outlined button style (not primary blue — keep it understated like Pulse).
- Rows should have a subtle hover state for interactivity.

### Resume Behavior

When the user clicks **"Resume"**:

- Navigate the user directly into the assessment, restoring all previously saved selections (dropdowns, scoring flags, cascading state) exactly where they left off.
- The assessment should open to the **last pillar/section the user was working on**, or to the beginning if no progress tracking exists yet.
- All auto-saved draft data must load before the form becomes interactive — show a brief loading state if needed.

### Empty State

- If there are no draft assessments, **hide the Recent Activity section entirely** — do not show an empty table or "no results" message.
- The section should appear automatically as soon as the user has at least one saved draft.

### Data Requirements

- Assessments must **auto-save as drafts** so they appear in this table. If auto-save does not currently exist, it must be implemented as part of this feature.
- Each draft must persist the following: client/project name, pack/template type, all dropdown selections and their cascading state, scoring flags, and a last-modified timestamp.
- Drafts should be associated with the logged-in user so each user sees only their own drafts.

### Sort Order

- Default sort: **Last Modified, descending** (most recent first), matching Pulse behavior.
- No user-facing sort controls needed for now.

### Edge Cases

- If a draft references a vendor/platform/version that has since been removed from the dropdowns, surface a warning on resume so the user can update that selection.
- If a user starts a new assessment for the same client/project, it should create a **new** draft row, not overwrite the existing one.

---

## QA CHECKLIST

Run through each of these after the Recent Activity feature is implemented:

- [ ] Recent Activity table appears on TCO landing page when at least one draft exists
- [ ] Recent Activity section is hidden when no drafts exist
- [ ] Table columns match Pulse layout: Client/Project, Pack, Last Modified, Status, Action
- [ ] Client name displays bold with project name muted beneath it
- [ ] Status badge shows "draft" in pill/chip style
- [ ] Resume button loads the assessment with all saved selections intact
- [ ] Assessments auto-save as drafts during progress
- [ ] Drafts are scoped to the logged-in user
- [ ] Table is sorted by Last Modified descending by default
- [ ] Resuming an assessment with a removed vendor/platform shows a warning
