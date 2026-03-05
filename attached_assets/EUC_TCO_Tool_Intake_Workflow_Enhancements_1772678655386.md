# EUC Pillars – TCO Assessment Tool: Intake Workflow Enhancements

> **Owner:** Stuart
> **Purpose:** Add three enhancements to the intake form workflow on the Tools tab: a Google Form link option, a "Send via Email" button, and guidance text explaining when to use each intake path.

---

## OVERVIEW

The Tools tab currently has two intake actions: Export Intake Form (.xlsx) and Import Intake Responses. This update adds a Google Form link option and an email send button, and ties all three paths together with clear guidance so consultants know which to use when.

---

## CHANGE 1: Guidance Note — "Which Intake Method Should I Use?"

### Where

On the Tools tab, above the Customer Intake card (or as a collapsible "How This Works" info box at the top of the intake section).

### Content

Display a brief guidance note with this text (or similar):

> **Which intake method should I use?**
>
> **Google Form** — Best for most customers. They fill it out in their browser, works on mobile, no files to manage. You get responses as a .csv you can import directly.
>
> **Excel Template** — Best for enterprise IT teams who prefer spreadsheets, need to circulate the form internally, or work offline. You email the .xlsx, they fill it out and return it.
>
> **Skip Intake** — If you're running the assessment live in a meeting, enter data directly on the Inputs tab. No intake form needed.
>
> All paths feed the same import. Choose whichever fits your customer.

### Design

- Use the same "How This Works" info box style used elsewhere in the app (light background, subtle border, info icon).
- Collapsible — default expanded on first visit, remembers collapsed state in localStorage.

---

## CHANGE 2: Google Form Link Option

### Where

On the Tools tab, in the Customer Intake card. Add a new button alongside (or below) the existing "Export Intake Form" button.

### Button Label

**"Copy Google Form Link"**

### Behavior

1. Clicking the button opens a small dialog/modal with:
   - A text field pre-populated with a Google Form URL
   - A **"Copy Link"** button that copies to clipboard with a confirmation toast ("Link copied!")
   - A brief note: "This links to a Google Form with all TCO intake questions. Duplicate it in Google Drive for each new customer."

2. The Google Form URL should be **configurable** — stored in the app's settings or as a constant that the consultant can update. This is because each consultant may have their own copy of the master form.

### Settings

Add a field in the app's settings (or on the Tools tab itself) where the consultant can paste their Google Form URL:

- **Label:** "Google Form Template URL"
- **Placeholder:** "https://docs.google.com/forms/d/..."
- **Helper text:** "Paste the URL of your master Google Form template. This is the link that 'Copy Google Form Link' will share."
- Stored in localStorage as `tco-google-form-url`
- If no URL is configured, the "Copy Google Form Link" button should show a prompt: "Set up your Google Form URL in Settings first."

### Why Not Generate the Form from the App?

The Google Form is created once using the Apps Script (outside the app), then duplicated per customer. The app just needs to store and share the link — it doesn't need to create or modify the form.

---

## CHANGE 3: "Send Intake Form via Email" Button

### Where

On the Tools tab, in the Customer Intake card. Add a button below the export and Google Form options.

### Button Label

**"Send via Email"**

### Behavior

1. Clicking the button opens a dialog with:
   - **Recipient Email** — text field, required
   - **Client Name** — pre-populated from Project Information if available
   - **Intake Method** — radio buttons:
     - ○ Google Form link (uses the configured URL from Change 2)
     - ○ Excel attachment (generates and attaches the .xlsx)
   - **Preview** — shows the email body before sending

2. Clicking **"Open in Email Client"** opens the user's default email client (mailto: link) with:
   - **To:** the recipient email
   - **Subject:** `TCO Assessment — Intake Form for [Client Name]`
   - **Body:** (see template below)

3. If "Excel attachment" is selected, the .xlsx is also downloaded so the consultant can manually attach it. (mailto: links can't attach files — this is a known limitation. The body text instructs the consultant to attach it.)

### Email Body Template

```
Subject: TCO Assessment — Intake Form for [Client Name]

Hi,

We're preparing a Total Cost of Ownership baseline assessment for [Client Name]'s end-user computing environment. To make the most of our engagement, we'd like to gather some information about your current environment ahead of our first working session.

[IF GOOGLE FORM SELECTED:]
Please fill out this brief questionnaire at your convenience:
[Google Form URL]

All questions are optional — fill in what you know and leave the rest blank. We'll work through any gaps together.

[IF EXCEL SELECTED:]
Please find the attached intake form (Excel). Fill in what you know in the highlighted "Your Response" column and return it to me when complete. All fields are optional.

The form covers:
• Environment basics (user counts, device counts)
• Your current technology stack across 7 EUC pillars
• Managed services and support arrangements

There are no wrong answers — approximate numbers and "best guess" responses are perfectly fine. Anything left blank, we'll address together with explicit assumptions.

Please return your responses by [DATE] so we can come prepared for our first session.

Thank you,
[XenTegra Engineer Name]
XenTegra
```

### Pre-population

- `[Client Name]` → from `project.clientName` if available
- `[XenTegra Engineer Name]` → from `project.engineerName` if available
- `[DATE]` → 5 business days from today (auto-calculated, editable)
- `[Google Form URL]` → from the configured URL in Change 2

---

## LAYOUT

The Customer Intake card on the Tools tab should now have this structure:

```
┌─────────────────────────────────────────────────┐
│  Customer Intake                                │
│                                                 │
│  ℹ️ Which intake method should I use?           │
│  [collapsible guidance text from Change 1]      │
│                                                 │
│  ┌──────────────────┐  ┌──────────────────────┐ │
│  │ Export Intake     │  │ Copy Google Form     │ │
│  │ Form (.xlsx)      │  │ Link                 │ │
│  └──────────────────┘  └──────────────────────┘ │
│                                                 │
│  ┌──────────────────┐  ┌──────────────────────┐ │
│  │ Send via Email    │  │ Import Intake        │ │
│  │                   │  │ Responses            │ │
│  └──────────────────┘  └──────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## QA CHECKLIST

- [ ] Guidance note appears above the intake actions
- [ ] Guidance note is collapsible and remembers state
- [ ] "Copy Google Form Link" button appears alongside Excel export
- [ ] Clicking "Copy Google Form Link" copies URL to clipboard with toast confirmation
- [ ] If no Google Form URL configured, button prompts to set one up
- [ ] Google Form URL is configurable and persists in localStorage
- [ ] "Send via Email" button opens dialog with recipient, client name, and method selection
- [ ] Email body template pre-populates with client name, engineer name, and date
- [ ] Google Form option includes the configured URL in the email body
- [ ] Excel option downloads the .xlsx and notes to attach it manually
- [ ] "Open in Email Client" opens mailto: link with correct subject and body
- [ ] All three intake paths (Google Form, Excel, direct entry) still feed the same import
- [ ] Import continues to accept both .xlsx and .csv
