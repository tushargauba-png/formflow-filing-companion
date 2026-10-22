import { describe, expect, it } from "vitest";
import { buildCopy, type Form } from "@/lib/form-fields";

const src = {
  id: "abc", sr_no: "45", udin: "26569989XXXX", ack_no: "123", filing_date: "2026-04-01",
  billing_invoice_no: "TGK/1", status: "Invoiced", invoicing_status: "Invoiced", payment_status: "Paid",
  remitter_id: "r1", remittee_id: "e1", purpose_code: "S0902", currency: "USD",
} as unknown as Form;

describe("copy from previous form", () => {
  it("keeps parties and remittance details", () => {
    const c = buildCopy(src);
    expect(c.remitter_id).toBe("r1");
    expect(c.purpose_code).toBe("S0902");
    expect(c.currency).toBe("USD");
  });
  it("clears filing, UDIN and billing identifiers and resets to Draft", () => {
    const c = buildCopy(src);
    expect(c.udin).toBeUndefined();
    expect(c.ack_no).toBeUndefined();
    expect(c.billing_invoice_no).toBeUndefined();
    expect(c.status).toBe("Draft");
    expect(c.invoicing_status).toBe("Not invoiced");
    expect(c.copied_from).toBe("abc");
  });
});
