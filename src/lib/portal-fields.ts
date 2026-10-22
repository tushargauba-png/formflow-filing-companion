export type PortalField = { key: string; label: string; type?: "text" | "number" | "date" | "bool" | "select" | "textarea"; options?: readonly string[] };
const yesNo = ["Yes", "No"];
export const CURRENCIES = ["AED", "AUD", "BDT", "BRL", "CAD", "CHF", "CNY", "CZK", "DKK", "EGP", "EUR", "GBP", "HKD", "IDR", "ILS", "INR", "JPY", "KES", "KRW", "KWD", "LKR", "MXN", "MYR", "NOK", "NPR", "NZD", "OMR", "PHP", "PKR", "PLN", "QAR", "RON", "RUB", "SAR", "SEK", "SGD", "THB", "TRY", "TWD", "USD", "VND", "ZAR"];
export const REMITTER_FIELDS: PortalField[] = [
  { key: "name", label: "1. Name" }, { key: "address", label: "2. Address", type: "textarea" },
  { key: "city", label: "City" }, { key: "state", label: "State" }, { key: "pincode", label: "PIN code" }, { key: "country", label: "Country" },
  { key: "pan", label: "3. PAN" }, { key: "entity_status", label: "4. Status" }, { key: "residential_status", label: "5. Residential status" },
  { key: "tan", label: "6. TAN (if available)" }, { key: "email", label: "7. Email ID" }, { key: "phone", label: "8. Contact number" },
  { key: "ao_details", label: "AO details" },
];
export const REMITTEE_FIELDS: PortalField[] = [
  { key: "name", label: "9. Name" }, { key: "pan", label: "10. PAN (if available)" }, { key: "tin", label: "11. TIN in country of residence" },
  { key: "country", label: "12. Country / region of residence" }, { key: "address", label: "13. Complete address", type: "textarea" },
  { key: "principal_place", label: "14. Principal place of business" }, { key: "email", label: "15. Email ID" }, { key: "phone", label: "16. Contact number" },
  { key: "trc_available", label: "TRC obtained", type: "bool" }, { key: "trc_number", label: "TRC number" },
  { key: "form_10f", label: "Form 10F on file", type: "bool" }, { key: "pe_in_india", label: "PE in India", type: "bool" },
];
const p = (key: string, label: string, type?: PortalField["type"], options?: readonly string[]): PortalField => ({ key: `portal.${key}`, label, ...(type ? { type } : {}), ...(options ? { options } : {}) });
export const PORTAL_SECTIONS: { title: string; fields: PortalField[] }[] = [
  { title: "20–21. Bank & authorised dealer", fields: [
    p("bank_ifsc", "20(a). IFSC code"), { key: "bank_name", label: "20(b). Bank name" }, p("bank_branch", "20(c). Branch"), p("bsr_code", "20(d). BSR code (7 digits)"),
    p("dealer_same", "21(a). Bank and authorised dealer are the same?", "select", yesNo), p("dealer_name", "21(b). Authorised dealer name"), p("dealer_itdrein", "21(c). ITDREIN"),
  ]},
  { title: "27. Taxability under the Income-tax Act (without DTAA)", fields: [
    { key: "taxable_in_india", label: "27(a). Chargeable to tax in India?", type: "select", options: yesNo },
    p("act_exemption_reason", "27(b). If no, reasons", "textarea"), { key: "relevant_section", label: "27(c)(i). Relevant section of the Act" },
    p("act_taxable_income", "27(c)(ii). Income chargeable to tax (INR)", "number"), p("act_tax_liability", "27(c)(iii). Tax liability (INR)", "number"),
    p("act_basis", "27(c)(iv). Basis of taxable income and tax liability", "textarea"), p("act_tds_rate", "27(c)(v). Rate of TDS under Act (%)", "number"),
  ]},
  { title: "28. Relief claimed under DTAA", fields: [
    p("dtaa_relief", "28. Relief claimed under DTAA?", "select", yesNo), p("trc_obtained", "28(a). TRC obtained?", "select", yesNo),
    p("trc_number", "28(b). TRC number"), p("dtaa_name", "28(c). Relevant DTAA"), { key: "dtaa_article", label: "28(d). DTAA article" },
    p("dtaa_payment_nature", "28(e). Nature of payment as per DTAA"), p("dtaa_taxable_income", "28(f). Taxable income as per DTAA (INR)", "number"), p("dtaa_tax_liability", "28(g). Tax liability as per DTAA (INR)", "number"),
  ]},
  ...([ ["a", "A. Royalties / technical services / interest / dividend"], ["b", "B. Business income"], ["c", "C. Capital gains"], ["d", "D. Other remittances"] ] as const).map(([key, title]) => ({
    title: `29${title}`, fields: [
      ...(key === "d" ? [p("dtaa_d_nature", "Nature of remittance")] : []),
      p(`dtaa_${key}_taxable`, "Taxable in India as per DTAA?", "select", yesNo), p(`dtaa_${key}_article`, "Article of DTAA"),
      ...(key === "c" ? [p("dtaa_c_ltcg", "Long-term capital gains (INR)", "number"), p("dtaa_c_stcg", "Short-term capital gains (INR)", "number")] : [p(`dtaa_${key}_income`, "Amount taxable in India as per DTAA (INR)", "number")]),
      p(`dtaa_${key}_rate`, "Rate of deduction as per DTAA (%)", "number"), p(`dtaa_${key}_reason`, "If no, reasons specifying DTAA article", "textarea"),
    ],
  })),
  { title: "Verification & accountant details", fields: [
    p("accountant_name", "Accountant name"), p("accountant_pan", "Accountant PAN"), p("membership_no", "Member registration number"),
    p("firm_name", "Proprietorship / firm name"), p("firm_registration", "Firm registration number"), p("accountant_address", "Accountant address", "textarea"), p("verification_place", "Place"), p("verification_date", "Verification date", "date"),
  ]},
];