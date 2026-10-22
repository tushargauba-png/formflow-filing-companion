import type { Database } from "@/integrations/supabase/types";
import { PORTAL_SECTIONS, CURRENCIES, type PortalField, REMITTER_FIELDS, REMITTEE_FIELDS } from "./portal-fields";
import { detailsOf, fieldValue, partyDetails } from "./form-calculations";

export type Form = Database["public"]["Tables"]["forms"]["Row"];
export type Remitter = Database["public"]["Tables"]["remitters"]["Row"];
export type Remittee = Database["public"]["Tables"]["remittees"]["Row"];
export type FormWithParties = Form & { remitter: Remitter | null; remittee: Remittee | null };

export const STATUSES = ["Draft", "Pending with client", "Ready", "Filed", "UDIN generated", "Invoiced", "Paid"] as const;
export const INVOICING = ["Not invoiced", "Invoiced"] as const;
export const PAYMENT = ["Not applicable", "Pending", "Paid"] as const;

export type FieldType = "text" | "number" | "date" | "bool" | "select" | "textarea";
export type FieldDef = PortalField;

export const FORM_SECTIONS: { title: string; fields: FieldDef[] }[] = [
  { title: "Engagement", fields: [
    { key: "sr_no", label: "Sr No" }, { key: "fy", label: "Tax year" },
    { key: "start_date", label: "Start date", type: "date" }, { key: "is_revised", label: "Revised form", type: "bool" },
    { key: "status", label: "Status", type: "select", options: STATUSES },
  ]},
  { title: "Remittee invoice", fields: [
    { key: "remittee_invoice_no", label: "Invoice no." }, { key: "remittee_invoice_date", label: "Invoice date", type: "date" },
    { key: "remittee_tin", label: "Remittee TIN" },
  ]},
  { title: "Remittance", fields: [
    { key: "portal.destination_country", label: "17. Country / region to which remittance is made" },
    { key: "currency", label: "18. Currency", type: "select", options: CURRENCIES }, { key: "amount_fc", label: "Amount (foreign currency)", type: "number" },
    { key: "exchange_rate", label: "Exchange rate", type: "number" }, { key: "amount_inr", label: "Amount (INR)", type: "number" },
    { key: "gross_amount", label: "19. Gross amount before TDS (INR)", type: "number" }, { key: "portal.gross_fc", label: "19. Gross amount before TDS (FC)", type: "number" },
    { key: "proposed_remittance_date", label: "22. Proposed date of remittance", type: "date" },
    { key: "nature_of_remittance", label: "23. Nature of remittance" }, { key: "portal.rbi_purpose_category", label: "24. RBI purpose category" }, { key: "purpose_code", label: "25. RBI sub-code" },
    { key: "portal.gross_up", label: "26. Gross-up under section 393(10)", type: "bool" },
  ]},
  ...PORTAL_SECTIONS.filter(s => !s.title.startsWith("Verification")),
  { title: "30–34. Details of tax deducted at source", fields: [
    { key: "tds_amount", label: "30. Tax deducted at source (INR)", type: "number" },
    { key: "tds_basis", label: "31. TDS deducted as per", type: "select", options: ["as per the Act", "as per DTAA"] },
    { key: "tds_rate", label: "32. Effective TDS rate (%)", type: "number" },
    { key: "portal.net_fc", label: "33. Actual remittance after TDS (FC)", type: "number" }, { key: "net_amount", label: "33. Actual remittance after TDS (INR)", type: "number" },
    { key: "portal.tds_date", label: "34. Date of deduction of tax", type: "date" },
  ]},
  ...PORTAL_SECTIONS.filter(s => s.title.startsWith("Verification")),
  { title: "Filing & certification", fields: [
    { key: "filing_date", label: "Filing date", type: "date" }, { key: "ack_no", label: "Acknowledgement no." },
    { key: "udin", label: "UDIN" }, { key: "certificate_required", label: "Certificate required" },
  ]},
  { title: "Billing", fields: [
    { key: "certification_charges", label: "Certification charges", type: "number" },
    { key: "invoicing_status", label: "Invoicing status", type: "select", options: INVOICING },
    { key: "billing_invoice_no", label: "Our invoice no." },
    { key: "payment_status", label: "Payment status", type: "select", options: PAYMENT },
    { key: "remarks", label: "Remarks", type: "textarea" },
  ]},
];

/** Fields available to billing export templates. Party fields resolved via `remitter.*` / `remittee.*`. */
export const EXPORT_COLUMNS: { key: string; label: string }[] = [
  { key: "sr_no", label: "Sr No" }, { key: "fy", label: "Year" },
  { key: "remitter.nickname", label: "Client nickname" }, { key: "remitter.name", label: "Client name" },
  { key: "remitter.pan", label: "Client PAN" }, { key: "remittee.nickname", label: "Payee nickname" },
  { key: "remittee.name", label: "Payee name" }, { key: "remittee.country", label: "Payee country" },
  ...REMITTER_FIELDS.filter(f => f.key !== "name" && f.key !== "pan").map(f => ({ key: `remitter.${f.key}`, label: `Remitter · ${f.label}` })),
  ...REMITTEE_FIELDS.filter(f => f.key !== "name" && f.key !== "country").map(f => ({ key: `remittee.${f.key}`, label: `Remittee · ${f.label}` })),
  ...FORM_SECTIONS.flatMap((s) => s.fields).filter((f) => !["sr_no", "fy"].includes(f.key as string))
    .map((f) => ({ key: f.key as string, label: f.label })),
];

export function getValue(row: FormWithParties, key: string): unknown {
  if (key.startsWith("remitter.")) return partyDetails(row, "remitter", row.remitter, key.slice(9)) ?? "";
  if (key.startsWith("remittee.")) return partyDetails(row, "remittee", row.remittee, key.slice(9)) ?? "";
  const v = fieldValue(row, key);
  return typeof v === "boolean" ? (v ? "Yes" : "No") : v ?? "";
}

/** Fields that must NOT be carried over when copying a previous form into a new draft. */
export const NON_COPY_FIELDS: (keyof Form)[] = [
  "id", "created_at", "updated_at", "sr_no", "filing_date", "ack_no", "udin",
  "billing_invoice_no", "copied_from", "status", "invoicing_status", "payment_status", "start_date",
];

export function buildCopy(src: Form): Partial<Form> {
  const out: Partial<Form> = { ...src };
  for (const k of NON_COPY_FIELDS) delete out[k];
  const details = { ...detailsOf(src) };
  delete details.tds_date; delete details.verification_date;
  out.portal_details = details;
  return { ...out, status: "Draft", invoicing_status: "Not invoiced", payment_status: "Not applicable", copied_from: src.id };
}

export function statusTone(s: string): string {
  switch (s) {
    case "Draft": case "Pending with client": return "bg-warning/15 text-foreground border-warning/40";
    case "Ready": return "bg-info/15 text-foreground border-info/40";
    case "Filed": case "UDIN generated": return "bg-primary/10 text-primary border-primary/30";
    case "Invoiced": case "Paid": return "bg-success/15 text-foreground border-success/40";
    default: return "bg-muted text-muted-foreground border-border";
  }
}
