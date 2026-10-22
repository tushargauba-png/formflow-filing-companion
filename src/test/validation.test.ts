import { describe, expect, it } from "vitest";
import type { Form, Remitter } from "@/lib/form-fields";
import { nextSrNo, normaliseCodes, validateForm, validateRemitter } from "@/lib/validation";
import { duplicateGroups, normaliseName } from "@/lib/remittee-duplicates";

const errors = (issues: { level: string; key: string }[]) => issues.filter((i) => i.level === "error").map((i) => i.key);

describe("master validation", () => {
  it("accepts valid identifiers, including lower-case codes", () => {
    expect(validateRemitter({ pan: "aabcg2168f", tan: "DELA12345B", bank_ifsc: "HDFC0001234", bsr_code: "0510308", pincode: "110001", email: "a@b.in" })).toEqual([]);
  });
  it("rejects malformed PAN, IFSC and BSR", () => {
    expect(errors(validateRemitter({ pan: "AABCG2168", bank_ifsc: "HDFC1234", bsr_code: "12345" }))).toEqual(["pan", "bank_ifsc", "bsr_code"]);
  });
  it("upper-cases code fields, including portal snapshots", () => {
    const out = normaliseCodes({ pan: " aabcg2168f ", email: "A@B.in", portal_details: { remitter_pan: "abcde1234f", bank_ifsc: "hdfc0001234" } });
    expect(out.pan).toBe("AABCG2168F");
    expect(out.email).toBe("A@B.in");
    expect(out.portal_details).toEqual({ remitter_pan: "ABCDE1234F", bank_ifsc: "HDFC0001234" });
  });
});

describe("form validation", () => {
  const remitter = { pan: "AABCG2168F" } as Remitter;
  it("checks UDIN format and TDS rate range", () => {
    const issues = validateForm({ status: "Draft", udin: "2556998", tds_rate: 120 } as Partial<Form>, { remitter });
    expect(errors(issues)).toEqual(["udin", "tds_rate"]);
  });
  it("blocks moving to Filed without filing date and ack no", () => {
    const issues = validateForm({ status: "Filed" } as Partial<Form>, { remitter, savedStatus: "Draft" });
    expect(errors(issues)).toContain("filing_date");
    expect(errors(issues)).toContain("ack_no");
  });
  it("only warns about missing fields on records already at that status", () => {
    const issues = validateForm({ status: "UDIN generated" } as Partial<Form>, { remitter, savedStatus: "UDIN generated" });
    expect(errors(issues)).toEqual([]);
    expect(issues.some((i) => i.key === "udin")).toBe(true);
  });
  it("warns when gross minus TDS does not match net", () => {
    const issues = validateForm({ status: "Draft", gross_amount: 1000, tds_amount: 100, net_amount: 800 } as Partial<Form>);
    expect(issues).toContainEqual(expect.objectContaining({ key: "net_amount", level: "warning" }));
  });
});

describe("Sr No", () => {
  it("continues the running number and ignores non-numeric values", () => {
    expect(nextSrNo(["1", "126", "12A", null, " 9 "])).toBe("127");
    expect(nextSrNo([])).toBe("1");
  });
});

describe("duplicate remittees", () => {
  const rows = ["MngoDB", "Mongodb", "MONGO", "Associated Press", "The Associated Press-Revised", "McCarren", "Andrea A. McCarren",
    "EVOLOK-April", "Evolok Limited", "Oracle Corporation", "Linkedin"].map((name, i) => ({ id: String(i), name, nickname: name }));
  const groups = duplicateGroups(rows).map((g) => g.map((r) => r.name).sort());
  it("groups spelling variants, revisions and month suffixes", () => {
    expect(groups).toContainEqual(["MONGO", "MngoDB", "Mongodb"]);
    expect(groups).toContainEqual(["Associated Press", "The Associated Press-Revised"]);
    expect(groups).toContainEqual(["Andrea A. McCarren", "McCarren"]);
    expect(groups).toContainEqual(["EVOLOK-April", "Evolok Limited"]);
  });
  it("leaves unrelated payees alone", () => {
    expect(groups.flat()).not.toContain("Oracle Corporation");
    expect(normaliseName("Google Asia Pacific P Ltd")).toBe("google asia pacific");
  });
});
