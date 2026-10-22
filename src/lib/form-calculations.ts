import type { Form, Remitter, Remittee } from "./form-fields";
export type Details = Record<string, string | number | boolean | null>;
export function detailsOf(f: Partial<Form>): Details {
  const value = f.portal_details;
  return value && typeof value === "object" && !Array.isArray(value) ? value as Details : {};
}
export function fieldValue(f: Partial<Form>, key: string): string | number | boolean | null | undefined {
  return key.startsWith("portal.") ? detailsOf(f)[key.slice(7)] : f[key as keyof Form] as string | number | boolean | null | undefined;
}
export function setField(f: Partial<Form>, key: string, value: string | number | boolean | null): Partial<Form> {
  return key.startsWith("portal.") ? { ...f, portal_details: { ...detailsOf(f), [key.slice(7)]: value } } : { ...f, [key]: value };
}
export function matchingForms<T extends Pick<Form, "remitter_id" | "remittee_id" | "form_type">>(forms: T[], remitterId?: string | null, remitteeId?: string | null): T[] {
  if (!remitterId || !remitteeId) return [];
  return forms.filter(f => f.remitter_id === remitterId && f.remittee_id === remitteeId && f.form_type === "146");
}
export function partyDetails(f: Partial<Form>, party: "remitter" | "remittee", master: Remitter | Remittee | null | undefined, key: string) {
  const stored = detailsOf(f)[`${party}_${key}`];
  if (stored !== undefined) return stored;
  if (party === "remittee" && key === "tin" && f.remittee_tin) return f.remittee_tin;
  return master ? (master as unknown as Details)[key] : null;
}
export function applyMaster(f: Partial<Form>, party: "remitter" | "remittee", master: Remitter | Remittee | undefined): Partial<Form> {
  const details = { ...detailsOf(f) };
  for (const key of Object.keys(details)) if (key.startsWith(`${party}_`)) delete details[key];
  if (master) for (const [key, value] of Object.entries(master)) {
    if (!["id", "created_at", "updated_at"].includes(key)) details[`${party}_${key}`] = value;
  }
  if (party === "remitter") {
    const r = master as Remitter | undefined;
    return { ...f, remitter_id: r?.id ?? null, bank_name: r?.bank_name ?? null, portal_details: { ...details, bank_ifsc: r?.bank_ifsc ?? null, bank_branch: r?.bank_branch ?? null, bsr_code: r?.bsr_code ?? null } };
  }
  const e = master as Remittee | undefined;
  return { ...f, remittee_id: e?.id ?? null, remittee_tin: e?.tin ?? null, nature_of_remittance: e?.nature_of_remittance ?? null, purpose_code: e?.purpose_code ?? null, dtaa_article: e?.dtaa_article ?? null, portal_details: { ...details, destination_country: e?.country ?? null, trc_obtained: e?.trc_available ? "Yes" : "No", trc_number: e?.trc_number ?? null } };
}
const round = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
export function calculateRemittance(amountFc: number, exchangeRate: number, taxRate: number, grossUp: boolean) {
  if (![amountFc, exchangeRate, taxRate].every(Number.isFinite) || amountFc < 0 || exchangeRate <= 0 || taxRate < 0 || taxRate >= 100) throw new Error("Use a non-negative amount, a positive exchange rate and a TDS rate from 0 to below 100%.");
  const base = amountFc * exchangeRate;
  const gross = grossUp ? base / (1 - taxRate / 100) : base;
  const tax = gross * taxRate / 100;
  return { amount_inr: round(gross), gross_amount: round(gross), tds_amount: round(tax), net_amount: round(gross - tax), gross_fc: round(gross / exchangeRate), net_fc: round((gross - tax) / exchangeRate) };
}
export function applyCalculation(f: Partial<Form>): Partial<Form> {
  if (f.amount_fc == null || f.exchange_rate == null) throw new Error("Enter amount in foreign currency and exchange rate first.");
  const d = detailsOf(f);
  const result = calculateRemittance(f.amount_fc, f.exchange_rate, f.tds_rate ?? 0, d["gross_up"] === true);
  const { gross_fc, net_fc, ...scalars } = result;
  return { ...f, ...scalars, portal_details: { ...d, gross_fc, net_fc } };
}