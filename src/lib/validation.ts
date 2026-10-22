import { STATUSES, type Form, type Remitter, type Remittee } from "./form-fields";
import { fieldValue, partyDetails } from "./form-calculations";

/** "error" blocks saving; "warning" is shown but never blocks (historic records stay editable). */
export type Issue = { key: string; message: string; level: "error" | "warning" };
type Value = string | number | boolean | null | undefined;

const FORMATS: Record<string, { re: RegExp; message: string; level?: Issue["level"] }> = {
  pan: { re: /^[A-Z]{5}\d{4}[A-Z]$/, message: "PAN must look like ABCDE1234F" },
  tan: { re: /^[A-Z]{4}\d{5}[A-Z]$/, message: "TAN must look like ABCD12345E" },
  ifsc: { re: /^[A-Z]{4}0[A-Z0-9]{6}$/, message: "IFSC must be 11 characters, e.g. HDFC0001234" },
  bsr: { re: /^\d{7}$/, message: "BSR code must be exactly 7 digits" },
  pincode: { re: /^\d{6}$/, message: "PIN code must be 6 digits" },
  email: { re: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email address" },
  udin: { re: /^\d{8}[A-Z0-9]{10}$/, message: "UDIN must be 18 characters: YY + 6-digit membership no. + 10 characters" },
  purpose: { re: /^[A-Z]\d{4}$/, message: "RBI purpose code usually looks like S0902", level: "warning" },
  ack: { re: /^\d{15}$/, message: "Acknowledgement no. is usually 15 digits", level: "warning" },
};

/** Field keys whose values are codes: trimmed and upper-cased before validating and saving. */
const CODE_FIELDS = ["pan", "tan", "bank_ifsc", "bsr_code", "udin", "purpose_code", "ack_no"];
const isCodeKey = (key: string) => CODE_FIELDS.some((c) => key === c || key.endsWith(`_${c}`)) || key === "portal.bank_ifsc";

const text = (v: Value) => (v == null ? "" : String(v).trim());

function checkFormat(issues: Issue[], key: string, value: Value, format: keyof typeof FORMATS) {
  const v = text(value);
  if (!v) return;
  const f = FORMATS[format]!;
  if (!f.re.test(isCodeKey(key) ? v.toUpperCase() : v)) issues.push({ key, message: f.message, level: f.level ?? "error" });
}

function checkNumber(issues: Issue[], key: string, value: Value, label: string, max?: number) {
  if (value == null || value === "") return;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) issues.push({ key, message: `${label} cannot be negative`, level: "error" });
  else if (max != null && n > max) issues.push({ key, message: `${label} cannot exceed ${max}`, level: "error" });
}

/** Trims and upper-cases code fields (PAN, TAN, IFSC, UDIN…) on a master row or a form, including portal snapshots. */
export function normaliseCodes<T extends Record<string, unknown>>(row: T): T {
  const out: Record<string, unknown> = { ...row };
  for (const [k, v] of Object.entries(out)) if (typeof v === "string" && isCodeKey(k)) out[k] = v.trim().toUpperCase();
  if (out["portal_details"] && typeof out["portal_details"] === "object" && !Array.isArray(out["portal_details"])) {
    const d: Record<string, unknown> = { ...(out["portal_details"] as Record<string, unknown>) };
    for (const [k, v] of Object.entries(d)) if (typeof v === "string" && isCodeKey(k)) d[k] = v.trim().toUpperCase();
    out["portal_details"] = d;
  }
  return out as T;
}

export function validateRemitter(r: Partial<Remitter>, prefix = ""): Issue[] {
  const issues: Issue[] = [];
  checkFormat(issues, `${prefix}pan`, r.pan, "pan");
  checkFormat(issues, `${prefix}tan`, r.tan, "tan");
  checkFormat(issues, `${prefix}pincode`, r.pincode, "pincode");
  checkFormat(issues, `${prefix}email`, r.email, "email");
  if (!prefix) {
    checkFormat(issues, "bank_ifsc", r.bank_ifsc, "ifsc");
    checkFormat(issues, "bsr_code", r.bsr_code, "bsr");
  }
  return issues;
}

export function validateRemittee(r: Partial<Remittee>, prefix = ""): Issue[] {
  const issues: Issue[] = [];
  checkFormat(issues, `${prefix}pan`, r.pan, "pan");
  checkFormat(issues, `${prefix}email`, r.email, "email");
  if (!prefix) checkFormat(issues, "purpose_code", r.purpose_code, "purpose");
  return issues;
}

const statusRank = (s: string | null | undefined) => STATUSES.indexOf((s ?? "Draft") as (typeof STATUSES)[number]);

/** Fields that must be filled before a form can move to (or past) each status. */
const REQUIRED_FOR: { from: (typeof STATUSES)[number]; fields: [string, string][] }[] = [
  { from: "Ready", fields: [
    ["remitter_id", "Remitter"], ["remittee_id", "Remittee"], ["portal.remitter_pan", "Remitter PAN"],
    ["portal.destination_country", "Country of remittance"], ["currency", "Currency"], ["amount_fc", "Amount (foreign currency)"],
    ["exchange_rate", "Exchange rate"], ["gross_amount", "Gross amount (INR)"], ["proposed_remittance_date", "Proposed date of remittance"],
    ["nature_of_remittance", "Nature of remittance"], ["purpose_code", "RBI purpose code"], ["bank_name", "Bank name"],
    ["portal.bank_ifsc", "IFSC code"], ["portal.bsr_code", "BSR code"], ["taxable_in_india", "Chargeable to tax in India?"],
    ["tds_rate", "TDS rate"], ["tds_amount", "TDS amount"], ["net_amount", "Remittance after TDS (INR)"],
  ]},
  { from: "Filed", fields: [["filing_date", "Filing date"], ["ack_no", "Acknowledgement no."]] },
  { from: "UDIN generated", fields: [["udin", "UDIN"]] },
  { from: "Invoiced", fields: [["billing_invoice_no", "Our invoice no."], ["certification_charges", "Certification charges"]] },
];

export type FormContext = {
  remitter?: Remitter | null | undefined;
  remittee?: Remittee | null | undefined;
  /** Status as last saved; status requirements block only when the status is being moved up. */
  savedStatus?: string | null | undefined;
  /** Sr Nos already used by other forms. */
  otherSrNos?: string[] | undefined;
};

export function validateForm(f: Partial<Form>, ctx: FormContext = {}): Issue[] {
  const issues: Issue[] = [];
  const val = (key: string): Value => {
    if (key.startsWith("portal.remitter_")) return partyDetails(f, "remitter", ctx.remitter, key.slice(16));
    if (key.startsWith("portal.remittee_")) return partyDetails(f, "remittee", ctx.remittee, key.slice(16));
    return fieldValue(f, key);
  };

  // Party snapshots shown on the form.
  const snap = (party: "remitter" | "remittee", keys: string[]) =>
    Object.fromEntries(keys.map((k) => [k, val(`portal.${party}_${k}`)]));
  issues.push(...validateRemitter(snap("remitter", ["pan", "tan", "pincode", "email"]), "portal.remitter_"));
  issues.push(...validateRemittee(snap("remittee", ["pan", "email"]), "portal.remittee_"));

  checkFormat(issues, "portal.bank_ifsc", val("portal.bank_ifsc"), "ifsc");
  checkFormat(issues, "portal.bsr_code", val("portal.bsr_code"), "bsr");
  checkFormat(issues, "purpose_code", f.purpose_code, "purpose");
  checkFormat(issues, "udin", f.udin, "udin");
  checkFormat(issues, "ack_no", f.ack_no, "ack");

  for (const [key, label] of [["amount_fc", "Amount"], ["amount_inr", "Amount (INR)"], ["gross_amount", "Gross amount"],
    ["net_amount", "Net amount"], ["tds_amount", "TDS amount"], ["certification_charges", "Certification charges"]] as const)
    checkNumber(issues, key, f[key], label);
  checkNumber(issues, "exchange_rate", f.exchange_rate, "Exchange rate");
  checkNumber(issues, "tds_rate", f.tds_rate, "TDS rate", 100);
  checkNumber(issues, "portal.act_tds_rate", val("portal.act_tds_rate"), "TDS rate under Act", 100);

  if (f.gross_amount != null && f.tds_amount != null && f.net_amount != null &&
    Math.abs(Number(f.gross_amount) - Number(f.tds_amount) - Number(f.net_amount)) > 1)
    issues.push({ key: "net_amount", message: "Gross − TDS does not equal the remittance after TDS", level: "warning" });

  const today = new Date().toISOString().slice(0, 10);
  if (f.filing_date && f.filing_date > today) issues.push({ key: "filing_date", message: "Filing date is in the future", level: "warning" });

  const sr = text(f.sr_no);
  if (sr && ctx.otherSrNos?.includes(sr)) issues.push({ key: "sr_no", message: `Sr No ${sr} is already used by another form`, level: "warning" });

  const rank = statusRank(f.status);
  const movingUp = rank > statusRank(ctx.savedStatus);
  for (const step of REQUIRED_FOR) {
    if (rank < statusRank(step.from)) continue;
    for (const [key, label] of step.fields) {
      if (text(val(key)) === "") issues.push({ key, message: `${label} is required for status "${f.status}"`, level: movingUp ? "error" : "warning" });
    }
  }
  return issues;
}

/** Next running Sr No (numeric Sr Nos only); mirrors the forms_assign_sr_no database trigger. */
export function nextSrNo(srNos: (string | null | undefined)[]): string {
  const max = srNos.reduce((m, s) => (s && /^\d+$/.test(s.trim()) ? Math.max(m, Number(s.trim())) : m), 0);
  return String(max + 1);
}

export function issuesByKey(issues: Issue[]): Map<string, Issue[]> {
  const map = new Map<string, Issue[]>();
  for (const i of issues) map.set(i.key, [...(map.get(i.key) ?? []), i]);
  return map;
}
