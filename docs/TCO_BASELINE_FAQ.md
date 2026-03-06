# TCO Baseline Micro-Assessment Tool — Frequently Asked Questions

**Version:** 1.0  
**Last Updated:** February 2026

---

## General Questions

### What is the TCO Baseline Micro-Assessment Tool?
A vendor-neutral calculator that establishes a credible, defensible Total Cost of Ownership (TCO) baseline for enterprise End User Computing (EUC) environments. It tells you what your current environment actually costs today.

### Who is this tool for?
IT decision-makers, EUC architects, and XenTegra engineers who need a transparent, auditable snapshot of current EUC costs before evaluating any changes or vendor solutions.

### Does this tool recommend products or vendors?
No. The tool is completely vendor-neutral and solution-agnostic. It only establishes your current-state baseline — it does not calculate ROI, project savings, or recommend solutions.

### Is my data stored anywhere?
No. All data stays entirely in your browser. Nothing is sent to a server. Exports are generated client-side and downloaded directly to your device.

---

## Getting Started

### How long does an assessment take?
The Free Baseline Assessment is designed to be completed in 10–15 minutes.

### What information do I need before starting?
At minimum you'll want:
- Total user count
- Device counts (laptops, desktops, thin clients)
- Whether VDI/DaaS is in use
- Awareness of which EUC vendors/platforms are deployed
- Annual costs for major platforms (if known)

### What if I don't have exact cost figures?
The tool includes industry-sourced default assumptions for every calculation. If you leave a field blank, the assumption value is used automatically. You can see and adjust all assumptions in the Assumptions tab.

---

## Inputs & Data Entry

### What are the EUC Pillars?
The tool organizes EUC costs into 6 pillars:
1. **Access** — Workspace portals, identity/SSO, MFA/Zero Trust
2. **Virtual Desktops & Applications** — VDI platforms, DaaS, app virtualization
3. **Device, OS & User Management** — UEM/MDM, OS deployment, patch management
4. **Security** — Endpoint protection, EDR/XDR, DLP
5. **App Management** — App packaging, app lifecycle, app compatibility
6. **Collaboration, AI & Applications** — Productivity suites, UCaaS, AI copilots

### How do I add vendor costs?
In the Inputs tab, expand each EUC Pillar section. Select the vendors your organization uses, then enter the annual cost for each. If you don't know the exact cost, leave it blank and the tool will use default assumptions.

### What are Platform Cost Rollup Overrides?
If you know your total annual spend for an entire cost category (e.g., total Security spend), you can enter it as an override. Overrides take priority over the sum of individual vendor costs, which in turn take priority over assumption-based calculations.

### What does the Readiness Tracker show?
The readiness bar (visible in the tab header) shows how complete your assessment is based on the inputs you've provided. 100% means all key fields are populated.

---

## Assumptions

### What are assumptions?
Assumptions are industry-sourced default values used when you haven't provided a specific input. There are 16 assumptions covering device refresh cycles, unit costs, support operations, licensing, overhead, and annual escalation rate.

### Can I change the assumptions?
Yes. Every assumption is fully editable in the Assumptions tab. Changed values are highlighted so you can track what's been modified.

### Where do the default assumption values come from?
Each assumption includes a justification citing its industry source (e.g., Gartner, industry benchmarks). You can download a full Justification Report from the Assumptions tab.

---

## Results & Exports

### What metrics does the Summary show?
- **Total Annual Baseline** — Your complete EUC cost per year
- **Cost per Endpoint** — Total divided by all devices
- **Cost per User** — Total divided by all users
- **Base Cost per User** — Shared costs (everything except VDI platform) per user
- **Fully Loaded VDI Cost per User** — Base cost plus VDI platform cost per VDI user
- **Non-VDI Cost per User** — Same as Base Cost per User
- **VDI User Premium** — Incremental VDI platform cost per VDI user

### What export formats are available?
- **JSON** — Machine-readable data interchange format
- **CSV** — Spreadsheet-compatible format
- **PDF** — Print-ready report with charts and branding
- **Audit Trail** — Full traceability log showing every input, assumption, and calculation
- **Justification Report** — Downloadable from the Assumptions tab; lists every assumption with its source
- **Download All (.zip)** — All exports bundled into a single zip file

### Can I include my company logo in exports?
Yes. Upload your logo in the Project Information section (Inputs tab). It will appear in the footer alongside the XenTegra logo, and in the PDF export header and footer.

---

## Troubleshooting

### My data disappeared after refreshing the page.
The tool stores your inputs in the browser's local storage. If you've cleared your browser data or are using a private/incognito window, your data will not persist across sessions. Export your work frequently using the Download All option.

### The PDF export doesn't include charts.
Make sure you allow the print dialog to complete. Charts are rendered in the print-ready view. If charts are missing, try using a different browser (Chrome is recommended).

### I changed an assumption but the summary didn't update.
All calculations update in real time. Check that you've entered a valid number in the assumption field. If the field is highlighted, it means it has been modified from the default.

---

## Contact & Support

For questions about the tool or your assessment, contact your XenTegra engineer or reach out to the XenTegra team.
