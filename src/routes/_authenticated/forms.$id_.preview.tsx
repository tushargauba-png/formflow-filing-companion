import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Check, Copy, Printer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formQuery } from "@/lib/queries";
import { PageHeader, fmtDate } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/forms/$id_/preview")({
  head: () => ({ meta: [{ title: "Form 146 preview — Form 146 Desk" }] }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(formQuery(params.id)),
  component: Preview,
});

type Row = [string, string | number | null | undefined];

function Preview() {
  const { id } = Route.useParams();
  const { data: f } = useSuspenseQuery(formQuery(id));
  const r = f.remitter, e = f.remittee;
  const yn = (b: boolean | null | undefined) => (b ? "Yes" : "No");
  const sections: { title: string; rows: Row[] }[] = [
    { title: "A. Remitter", rows: [
      ["Name of the remitter", r?.name], ["PAN / TAN of remitter", r?.pan ?? r?.tan],
      ["Address", [r?.address, r?.city, r?.state, r?.pincode].filter(Boolean).join(", ")],
      ["Area code / AO details", r?.ao_details], ["Email", r?.email], ["Phone", r?.phone],
    ]},
    { title: "B. Remittee", rows: [
      ["Name of the remittee", e?.name], ["Country of remittee", e?.country], ["Address", e?.address],
      ["Tax identification number (TIN)", f.remittee_tin ?? e?.tin], ["Email", e?.email],
    ]},
    { title: "C. Remittance details", rows: [
      ["Country to which remittance is made", e?.country], ["Currency", f.currency],
      ["Amount payable in foreign currency", f.amount_fc], ["Exchange rate", f.exchange_rate],
      ["Amount payable in INR", f.amount_inr], ["Gross amount", f.gross_amount], ["Net amount", f.net_amount],
      ["Name of bank", f.bank_name ?? r?.bank_name], ["Branch", r?.bank_branch], ["BSR code", r?.bsr_code],
      ["Proposed date of remittance", fmtDate(f.proposed_remittance_date)],
      ["Nature of remittance as per agreement / document", f.nature_of_remittance ?? e?.nature_of_remittance],
      ["Purpose code as per RBI", f.purpose_code ?? e?.purpose_code],
      ["Invoice no. / date", [f.remittee_invoice_no, f.remittee_invoice_date && fmtDate(f.remittee_invoice_date)].filter(Boolean).join(" dated ")],
    ]},
    { title: "D. Taxability", rows: [
      ["Is remittance chargeable to tax in India", f.taxable_in_india], ["Relevant section of the Act", f.relevant_section],
      ["Basis of determining taxable income and tax liability", f.tds_basis],
      ["Tax residency certificate obtained", yn(e?.trc_available)], ["Form 10F obtained", yn(e?.form_10f)],
      ["Relevant DTAA article", f.dtaa_article ?? e?.dtaa_article], ["Permanent establishment in India", yn(e?.pe_in_india)],
      ["Rate of TDS (%)", f.tds_rate], ["Amount of TDS", f.tds_amount],
    ]},
    { title: "E. Accountant / certification", rows: [["UDIN", f.udin], ["Acknowledgement no.", f.ack_no], ["Date of filing", fmtDate(f.filing_date)]] },
  ];

  const allText = sections.map((s) => `${s.title}\n` + s.rows.map(([k, v]) => `${k}: ${v ?? ""}`).join("\n")).join("\n\n");

  return (
    <div className="max-w-4xl">
      <PageHeader eyebrow={`${r?.nickname ?? "—"} → ${e?.nickname ?? "—"}`} title="Form 146 — copy-ready preview"
        actions={<>
          <Button variant="outline" asChild><Link to="/forms/$id" params={{ id }}>Edit</Link></Button>
          <Button variant="outline" onClick={() => { navigator.clipboard.writeText(allText); toast.success("All fields copied"); }}><Copy className="mr-1 h-4 w-4" />Copy all</Button>
          <Button onClick={() => window.print()}><Printer className="mr-1 h-4 w-4" />Print / PDF</Button>
        </>} />
      <p className="no-print mb-4 text-sm text-muted-foreground">Fields follow the portal order. Click any value to copy it, then paste into the Income Tax portal.</p>
      <div className="rounded-lg border bg-card">
        <div className="border-b px-6 py-4">
          <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Form No. 146 {f.is_revised && "· Revised"}</div>
          <div className="font-display text-xl">Certificate of an accountant for remittance to a non-resident</div>
        </div>
        {sections.map((s) => (
          <div key={s.title} className="border-b last:border-0">
            <div className="bg-muted/50 px-6 py-2 text-sm font-semibold">{s.title}</div>
            <dl>{s.rows.map(([k, v]) => <CopyRow key={k} label={k} value={v} />)}</dl>
          </div>
        ))}
      </div>
    </div>
  );
}

function CopyRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  const [done, setDone] = useState(false);
  const text = value == null || value === "" || value === "—" ? "" : String(value);
  return (
    <div className="grid grid-cols-[1fr_1.2fr] items-center gap-4 border-t px-6 py-2 text-sm first:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>
        {text ? (
          <button className="group flex w-full items-center justify-between gap-2 rounded px-2 py-1 text-left font-mono hover:bg-accent/20"
            onClick={() => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1200); }}>
            <span className="break-all">{text}</span>
            <span className="no-print shrink-0 text-muted-foreground">{done ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100" />}</span>
          </button>
        ) : <span className="px-2 text-warning">Missing</span>}
      </dd>
    </div>
  );
}
