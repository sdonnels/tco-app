# EUC Pillars – TCO Assessment Tool: Update Instructions

> **Owner:** Stuart
> **Purpose:** Apply these changes to the TCO Assessment Tool. Each section is a discrete task. Complete them in order, testing dropdown dependency logic after each pillar.

---

## GLOBAL RULES (Apply to Every Section)

Before touching any individual pillar, enforce these rules app-wide:

1. **Dropdown hierarchy is always:** Vendor → Platform/Product → Version (when applicable).
2. **Vendor and Product must never be combined** in a single dropdown.
3. **Alphabetize** every dropdown list.
4. **Remove** all legacy/strikethrough entries from the UI entirely — do not hide them.
5. **Delete** any duplicate sections (do not collapse or hide).
6. **Version is always its own dropdown** when it exists.

---

## PILLAR 1: ACCESS

### 1.1 — PC / AI / Mobile Hardware

**Vendor dropdown (alphabetized):** Apple, Dell, HP, Lenovo

**Device Type dropdown (filtered by Vendor selection):**

| Vendor | Device Types |
|--------|-------------|
| Apple | MacBook, iPad, iPhone |
| Dell | Latitude, Precision, OptiPlex |
| HP | EliteBook, ProBook, ZBook |
| Lenovo | ThinkPad, ThinkCentre |

**Implementation notes:**
- Device Type dropdown must dynamically filter based on selected Vendor.
- No scoring logic needed — this is informational/reporting only.

---

### 1.2 — Endpoint OS

**Vendor dropdown (alphabetized):** IGEL, Microsoft, Stratodesk (Legacy), Unicon

**OS Version dropdown (filtered by Vendor):**

| Vendor | OS Versions |
|--------|------------|
| IGEL | OS 12, OS 11 |
| Microsoft | Windows 11, Windows 10 IoT |
| Stratodesk (Legacy) | NoTouch OS |
| Unicon | eLux |

**Scoring flags (REQUIRED):**
- If `IGEL` + `OS 11` is selected → flag as **Critical Risk**
- If `Stratodesk (Legacy)` is selected (any product) → flag as **Critical Risk**

**Removals:**
- Delete "IGEL OS (Cosmos)" completely from all dropdowns/references.

**Notes:**
- Stratodesk was acquired by IGEL — keep it listed only as a legacy option.
- Vendor dropdown must NOT show OS versions directly.

---

### 1.3 — Secure Enterprise Browser

**Vendor dropdown (alphabetized):** Citrix, Dizzion, Island, Palo Alto Networks (Talon), Surf, Other

**Product dropdown (filtered by Vendor):**

| Vendor | Product |
|--------|---------|
| Citrix | Secure Private Access |
| Dizzion | Halo |
| Island | Island Enterprise Browser |
| Palo Alto Networks | Talon Enterprise Browser |
| Surf | Surf Security Browser |
| Other | *(see below)* |

**Special logic for "Other":**
- Show two free-text input fields: Vendor Name, Product Name.
- Allow manual SWOT rating override when "Other" is selected.

---

## PILLAR 2: VIRTUAL DESKTOPS & APPLICATIONS

### 2.1 — DaaS (Cloud PC / Hosted Desktop)

**Vendor dropdown (alphabetized):** Apporto, AWS, Citrix, Dizzion, Kasm Technologies, Microsoft, Omnissa, Parallels, Workspot

**Platform dropdown (filtered by Vendor):**

| Vendor | Platform(s) |
|--------|------------|
| Microsoft | Windows 365, Azure Virtual Desktop |
| Citrix | DaaS, DaaS Hybrid |
| Omnissa | Horizon Cloud |
| AWS | Amazon WorkSpaces, AppStream 2.0 |
| Parallels | Parallels RAS |
| Apporto | *(map product)* |
| Dizzion | *(map product)* |
| Kasm Technologies | *(map product)* |
| Workspot | *(map product)* |

**CRITICAL REMOVAL:**
- **Delete the entire "DaaS (Service Provider)" section.** Do not hide — remove it completely from the codebase/UI.

---

### 2.2 — VDI (On-Premises)

**Vendor dropdown (alphabetized):** Citrix, Omnissa, Parallels

**Platform dropdown (filtered by Vendor):**

| Vendor | Platform |
|--------|---------|
| Citrix | Citrix Virtual Apps and Desktops |
| Omnissa | Horizon |
| Parallels | Parallels RAS |

**Version dropdown (REQUIRED — filtered by Platform):**

| Platform | Versions | Scoring Flag |
|----------|----------|-------------|
| Citrix CVAD | 7 2402 LTSR, 7 2203 LTSR, 7 1912 LTSR | `7 1912 LTSR` → **Aging / Risk** |
| Omnissa Horizon | Horizon 8 ESB (2111–2503), Horizon 7 | `Horizon 7` → **Legacy** |
| Parallels RAS | 20 LTS, 19 LTS, 19.x CR, 20.x CR | *(none)* |

---

## PILLAR 3: DEVICE, OS, APPLICATION & USER MANAGEMENT

### 3.1 — Unified Endpoint Management (UEM)

**Vendor dropdown (alphabetized):** Citrix, Ivanti, JAMF, Kaseya, Microsoft, Omnissa, PDQ, Recast Software, Tanium

**Platform dropdown (filtered by Vendor):**

| Vendor | Platform(s) |
|--------|------------|
| Microsoft | Intune, SCCM, Co-Managed |
| Citrix | Workspace Environment Management (WEM) |
| Omnissa | Workspace ONE UEM |
| Ivanti | *(map product)* |
| JAMF | *(map product)* |
| Kaseya | *(map product)* |
| PDQ | *(map product)* |
| Recast Software | *(map product)* |
| Tanium | *(map product)* |

---

### 3.2 — Digital Employee Experience (DEX)

**Vendor dropdown (alphabetized):** ControlUp, Lakeside, Liquidware, Nexthink, Omnissa

- No secondary dropdown needed unless vendor has multiple products.
- No version logic required.

---

## PILLAR 4: SECURITY

### 4.1 — Endpoint Security

**Vendor dropdown (alphabetized):** CrowdStrike, Microsoft, SentinelOne

### 4.2 — Identity & Access Management (IAM)

**Vendor dropdown (alphabetized):** Microsoft, Okta, Ping Identity

### 4.3 — Secure Access Service Edge (SASE)

**Vendor dropdown (alphabetized):** Cato Networks, Netskope, Zscaler

**Notes for all of Pillar 4:**
- Map vendor-specific products into secondary dropdowns as needed.
- No version or scoring logic required unless specified later.

---

## PILLAR 5: APP MANAGEMENT

### 5.1 — App Layering & Streaming

**Vendor dropdown (alphabetized):** Citrix, Liquidware, Omnissa

### 5.2 — Application Readiness & Packaging

**Vendor dropdown (alphabetized):** Flexera, Recast Software, Rimo3

### 5.3 — Apps Config & Asset Management

**Vendor dropdown (alphabetized):** ManageEngine, Microsoft, Nexthink, Recast Software

**Notes for all of Pillar 5:**
- Map vendor-specific products into secondary dropdowns.
- No version or scoring logic required unless specified later.

---

## PILLAR 6: COLLABORATION, AI & APPLICATIONS

### 6.1 — Workspace AI

**Vendor dropdown (alphabetized):** Adobe, Amazon, Anthropic, Apple, Atlassian, Cisco, Google, IBM, Meta, Microsoft, Notion, OpenAI, Perplexity, Salesforce, ServiceNow, Slack, Zoom

- Map vendor-specific AI products into secondary dropdown.
- No scoring logic required.

---

### 6.2 — Unified Communications & Collaboration

**Vendor dropdown (alphabetized):** Cisco, Google, Microsoft, RingCentral, Slack, Zoom

**Product dropdown (filtered by Vendor):**

| Vendor | Product(s) |
|--------|-----------|
| Microsoft | Teams |
| Zoom | Zoom Workplace |
| Slack | Slack Enterprise |
| Cisco | Webex Suite |
| Google | Meet, Chat |
| RingCentral | MVP, RingCX |

---

## FINAL QA CHECKLIST

Run through each of these after all changes are applied:

- [ ] All dropdowns are alphabetized
- [ ] Vendor → Platform → Version hierarchy is enforced everywhere
- [ ] All legacy/strikethrough content has been removed (not hidden)
- [ ] "DaaS (Service Provider)" section is fully deleted
- [ ] Scoring flags are working:
  - [ ] IGEL OS 11 → Critical Risk
  - [ ] Stratodesk (Legacy) → Critical Risk
  - [ ] CVAD 7 1912 LTSR → Aging / Risk
  - [ ] Horizon 7 → Legacy
- [ ] Dropdown dependency/filtering works for every pillar
- [ ] "Other" in Secure Enterprise Browser shows free-text fields + allows SWOT override
- [ ] UI is visually consistent across all pillars
