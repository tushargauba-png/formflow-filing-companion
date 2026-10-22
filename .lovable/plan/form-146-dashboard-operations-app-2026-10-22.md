# Form 146 Dashboard & Operations App

Form 146 (CA certificate for foreign remittances, successor of Form 15CB) and later Form 145 (successor of 15CA). Built around your historic sheet (128 entries, Indian Express Group).

## Phase 1 — Core (build now)

1. **Login** — single user (you) with email/password; staff roles can be added later without rework.
2. **Remitter (Client) master** — nickname (e.g. "TIEPL") + full legal data: name, PAN, address, AO/area details, bank, contact. Seeded from your "Helper" sheet.
3. **Remittee (Payee) master** — nickname (e.g. "Pixometry", "AP") + full data: name, country, address, TIN, DTAA article, nature of remittance, purpose code. Seeded from payee names in history.
4. **Form 146 register** — every form ever filed, with all your current columns: year, dates, remitter, remittee, invoice no/date, gross/net amount, status, filing date, Ack no, UDIN, certification charges, invoicing status, invoice no, payment status, remarks.
   - Import your 128 historic rows from the Excel.
   - **"Copy from previous form"** — pick any past form, duplicate it as a new draft, edit only what changed.
5. **Form 146 preview (copy-ready)** — shows every field in the same order as the Income Tax portal, each with a one-click Copy button, plus a printable/PDF view.
6. **Workflow tracker** — status per form: Draft → Ready → Filed on portal → UDIN generated → Invoiced → Paid. Fields to record Ack no and UDIN after filing; attach supporting files (invoice, TRC, Form 10F, etc.).
7. **Dashboard** — counts by status, pending UDINs, uninvoiced filings, unpaid charges, filings by month and client.
8. **Reports & billing export** — filter by date/client/status; export Excel/CSV. You define and save your own billing column layout (choose columns, order, headings) and reuse it on every export.

## Phase 2 — Portal autofill (later)

- Chrome browser extension: you log in to the Income Tax portal yourself (OTP/DSC), then click "Fill from app" to auto-fill Form 146 from the selected record. Same idea for the ICAI UDIN portal (UDIN form details pre-filled; you complete OTP).
- Full hands-off login is not planned: both portals need OTP/captcha/DSC, which can't be safely automated.

## Phase 3 — Form 145

- Reuses the same masters and register; adds Form 145 fields, preview, and linking a 145 to its 146.

## Open points (can confirm during build)

- Exact Form 146 field list: I'll mirror the 15CB structure from your "PURPOSE CODE CERTIFICATE" and data sheets, and adjust once you share a sample filed Form 146 PDF.
- Billing column layout: you set it inside the app.

## Technical details

- Lovable Cloud: auth, tables (remitters, remittees, forms_146, form_attachments, export_templates), private file storage for attachments.
- One-time import script maps the "Data" sheet; Excel serial dates converted; nicknames resolved to master records.
- Excel export via client-side xlsx generation from saved templates.
- TanStack routes: /dashboard, /forms, /forms/$id, /forms/$id/preview, /remitters, /remittees, /reports, /settings.
