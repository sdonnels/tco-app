# EUC Pillars – TCO Assessment Tool: Inputs Page Updates

> **Owner:** Stuart
> **Purpose:** A collection of updates to the Inputs page covering license fields, layout changes, dropdown behavior, section-specific fixes, and MSP provider selection.

---

## CHANGE 1: LICENSE COUNT & LICENSE SKU — SCOPED AND RESTYLED

### Scope Update

License Count and License SKU fields should **only** appear on platforms that actually have licenses. Limit to these pillar sections:

- 1.2 Endpoint OS
- 1.3 Secure Enterprise Browser
- 2.1 DaaS
- 2.2 VDI
- 3.1 UEM
- 3.2 DEX
- 4.1 Endpoint Security
- 5.1 App Layering & Streaming
- 5.2 Application Readiness & Packaging
- 5.3 Apps Config & Asset Management
- 6.1 Workspace AI
- 6.2 Unified Communications & Collaboration

**Do NOT show** License Count / License SKU on:
- 1.1 PC / AI / Mobile Hardware (these are devices, not licensed software)

### Styling Update

The current layout is too cramped. Restyle the License Count and License SKU fields to be more uniform and visually clean:

- Place both fields on their **own row below** the platform/version dropdowns — do not inline them next to the dropdowns.
- Use consistent field widths: License Count (narrower, numeric) on the left, License SKU (wider, text) on the right.
- Add a subtle visual separator or light section label (e.g., "Licensing") above the two fields to clearly group them apart from the platform selection dropdowns.
- Match the input field styling (size, padding, border, placeholder text) to the rest of the form for a uniform look.

---

## CHANGE 2: REORDER INPUTS PAGE SECTIONS

Move **"Platform Cost Overrides"** so it sits **between** the EUC Pillars section and the Environment Facts section.

New section order on the Inputs page:
1. EUC Pillars & Platforms
2. **Platform Cost Overrides** ← moved here
3. Environment Facts
4. *(remaining sections as-is)*

---

## CHANGE 3: CLIENT LOGO PLACEMENT

The "Client Logo" upload option (for providing an image to display on outputs/summaries) is currently in the footer alongside the XenTegra logo. **Move it out of the footer.**

- Place the Client Logo upload in a more prominent location within the Inputs page — either as its own small card/section near the top of the page, or within a "Report Settings" or "Output Settings" section.
- The XenTegra logo should remain in the footer on its own. The client logo is a user-provided branding element and should not be co-located with the XenTegra branding.

---

## CHANGE 4: ADD "OTHER" OPTION TO ALL DROPDOWNS

Every vendor/platform dropdown across the entire Inputs page should include the **"Other"** option with the same free-text functionality already built into the Secure Enterprise Browser section.

### Implementation Approach

Build this as a **reusable dropdown component** that all pillar sub-sections share, rather than adding "Other" logic individually to each dropdown. The component should:

1. Accept the standard list of options for that dropdown.
2. Always append **"Other"** as the last item in the list.
3. When "Other" is selected, render the free-text input field(s) below the dropdown.
4. Expose the entered value the same way a normal selection would (so downstream logic, exports, and draft saves don't need special handling).

### Behavior When "Other" Is Selected

- **Vendor dropdown:** Show a free-text field labeled "Vendor Name."
- **Platform/Product dropdown:** Show a free-text field labeled "Product / Platform Name."
- Allow manual SWOT rating override where applicable.

### Refactor Existing

The Secure Enterprise Browser section (1.3) already has a bespoke "Other" implementation. Replace it with the shared component so behavior is identical everywhere.

Apply this consistently to all pillar sub-sections (1.1 through 6.2).

---

## CHANGE 5: MANAGED SERVICES & OUTSOURCING — SECTION UPDATES

### 5a: Rename Heading

Change the heading:
- **From:** "Helpdesk/Tier 1 Support"
- **To:** "Tier 1 Support / Helpdesk"

### 5b: Convert "Why This Matters" to "How This Works"

Replace the existing "Why this matters" content block with a **"How This Works"** box:
- The box should **span the full width** of the Managed Services & Outsourcing section.
- Use the same styling pattern as other "How This Works" boxes in the app (muted card, secondary styling).
- Update the copy inside to explain how the Managed Services section works rather than why it matters.

---

## CHANGE 6: EUC PILLARS & PLATFORMS — APPLE UPDATES

### 6a: PC and Mobile Devices — Rename MacBook Option

When the user selects **Apple** as the vendor in the PC / AI / Mobile Hardware section (1.1):
- Change the **"MacBook"** option to **"macOS"** in the Device Type dropdown.
- iPad and iPhone options remain unchanged.

Updated Apple device types: **macOS, iPad, iPhone**

### 6b: Endpoint OS — Add Apple as a Vendor

Add **Apple** to the Endpoint OS section (1.2) as a new vendor option.

| Vendor | OS Versions |
|--------|------------|
| Apple | iOS, iPadOS, macOS |

- Insert Apple alphabetically in the vendor dropdown (it should appear first).
- No scoring flags needed for Apple OS options.

---

## CHANGE 7: MSP SECTION — PROVIDER SELECTION

Add the ability to identify one or more Managed Services Providers in the MSP section.

### Layout

- Display a **checkbox list** of MSP providers. Multiple can be selected simultaneously.
- The first option is always: **☐ XenTegra**
- Below that: **☐ Other**

### "Other" Behavior

- When **"Other"** is checked, show a text input field labeled "MSP Provider Name" with an **"Add Another"** button beside or below it.
- Each click of "Add Another" adds an additional MSP Provider Name text input, allowing the user to list multiple non-XenTegra providers.
- Each added provider row should have a **remove/delete** (X) button to remove that entry.
- There is no limit on the number of "Other" providers, but keep the UI clean — stack them vertically.

### Valid Combinations

- XenTegra only
- Other only (one or more providers)
- XenTegra + Other (co-managed scenarios with one or more additional providers)

### Data

- All selected providers (XenTegra flag + any Other provider names) should be stored with the assessment and included in outputs/exports.

---

## QA CHECKLIST

- [ ] License Count and License SKU only appear on licensed-software pillars (not 1.1 Hardware)
- [ ] License fields are on their own row below platform dropdowns, with consistent styling
- [ ] Platform Cost Overrides section is positioned between EUC Pillars and Environment Facts
- [ ] Client Logo upload is removed from footer and placed in its own Inputs section
- [ ] XenTegra logo remains in footer, separate from client logo
- [ ] Every vendor/platform dropdown includes an "Other" option via a shared reusable component
- [ ] Existing bespoke "Other" in Secure Enterprise Browser is replaced with the shared component
- [ ] Heading reads "Tier 1 Support / Helpdesk" in Managed Services section
- [ ] "Why this matters" is replaced with a full-width "How This Works" box in Managed Services
- [ ] Apple vendor in PC/Mobile shows macOS, iPad, iPhone (not MacBook)
- [ ] Apple appears as a vendor in Endpoint OS with iOS, iPadOS, macOS options
- [ ] MSP section has checkboxes for XenTegra and Other (both can be selected)
- [ ] Selecting Other shows a text input with "Add Another" for multiple providers
- [ ] Each added Other provider row has a remove button
- [ ] XenTegra + multiple Other providers can coexist
- [ ] All new fields auto-save to draft state
