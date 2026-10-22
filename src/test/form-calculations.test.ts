import { describe, expect, it } from "vitest";
import { calculateRemittance, matchingForms, applyMaster, partyDetails } from "@/lib/form-calculations";
import { buildCopy, type Form, type Remitter } from "@/lib/form-fields";

describe("Form 146 rules", () => {
  it("offers previous forms only for the selected remitter and remittee", () => {
    const rows = [{ remitter_id: "r1", remittee_id: "e1", form_type: "146" }, { remitter_id: "r1", remittee_id: "e2", form_type: "146" }, { remitter_id: "r2", remittee_id: "e1", form_type: "146" }];
    expect(matchingForms(rows, "r1", "e1")).toEqual([rows[0]]);
    expect(matchingForms(rows, "r1", null)).toEqual([]);
  });
  it("calculates INR as foreign currency amount times exchange rate", () => {
    expect(calculateRemittance(56, 96.9285714286, 20.8, false)).toEqual({ amount_inr: 5428, gross_amount: 5428, tds_amount: 1129.02, net_amount: 4298.98, gross_fc: 56, net_fc: 44.35 });
  });
  it("grosses up a net payable and preserves that net after TDS", () => {
    expect(calculateRemittance(100, 80, 20, true)).toEqual({ amount_inr: 10000, gross_amount: 10000, tds_amount: 2000, net_amount: 8000, gross_fc: 125, net_fc: 100 });
  });
  it("rejects an undefined gross-up at 100 percent", () => {
    expect(() => calculateRemittance(100, 80, 100, true)).toThrow();
  });
  it("copies addresses and portal details but not completion dates", () => {
    const copied = buildCopy({ id: "f1", portal_details: { remitter_address: "Mumbai", remittee_tin: "TJ708297B", dealer_name: "HDFC", verification_date: "2026-10-13", tds_date: "2026-10-13" } } as unknown as Form);
    expect(copied.portal_details).toEqual({ remitter_address: "Mumbai", remittee_tin: "TJ708297B", dealer_name: "HDFC" });
  });
  it("takes full party details from the master and retains form-specific overrides", () => {
    const master = { id: "r1", name: "Client", address: "Mumbai", pan: "ABC", bank_ifsc: "HDFC0000032" } as Remitter;
    const form = applyMaster({}, "remitter", master);
    expect(partyDetails(form, "remitter", master, "address")).toBe("Mumbai");
    expect(partyDetails({ portal_details: { remitter_address: "Delhi" } }, "remitter", master, "address")).toBe("Delhi");
  });
});