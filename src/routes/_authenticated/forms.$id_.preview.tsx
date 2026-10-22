import { pageMeta } from "@/lib/page-meta";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Check, Copy, Printer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FORM_SECTIONS } from "@/lib/form-fields";
import { REMITTER_FIELDS, REMITTEE_FIELDS } from "@/lib/portal-fields";
import { fieldValue, partyDetails } from "@/lib/form-calculations";
import { formQuery } from "@/lib/queries";
import { PageHeader, fmtDate } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/forms/$id_/preview")({
  head: () => pageMeta("Form 146 preview", "Review and copy Form 146 particulars for portal filing."),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(formQuery(params.id)),
  component: Preview,
});

type Row = [string, string | number | null | undefined];

function Preview() {
  const { id } = Route.useParams();
  const { data: f } = useSuspenseQuery(formQuery(id));
  const r = f.remitter, e = f.remittee;
  const display = (value: unknown): string | number | null => typeof value === "boolean" ? (value ? "Yes" : "No") : typeof value === "string" || typeof value === "number" ? value : null;
  const sections: { title: string; rows: Row[] }[] = [
    { title: "Particulars of the remitter (sender)", rows: [["Tax year", f.fy], ...REMITTER_FIELDS.map(fd => [fd.label, display(partyDetails(f, "remitter", r, fd.key))] as Row)] },
    { title: "Particulars of the remittee (recipient)", rows: REMITTEE_FIELDS.map(fd => [fd.label, display(partyDetails(f, "remittee", e, fd.key))] as Row) },
    ...FORM_SECTIONS.filter(s => !["Engagement", "Remittee invoice", "Billing"].includes(s.title)).map(s => ({ title: s.title, rows: s.fields.map(fd => [fd.label, display(fieldValue(f, fd.key))] as Row) })),
    { title: "Invoice reference", rows: [["Invoice no.", f.remittee_invoice_no], ["Invoice date", fmtDate(f.remittee_invoice_date)]] },
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
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.2fr] items-center gap-4 border-t px-6 py-2 text-sm first:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>
        {text ? (
          <Button variant="ghost" className="group flex h-auto w-full items-center justify-between gap-2 rounded px-2 py-1 text-left font-mono hover:bg-accent/20"
            onClick={() => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1200); }}>
            <span className="break-all">{text}</span>
            <span className="no-print shrink-0 text-muted-foreground">{done ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100" />}</span>
          </Button>
        ) : <span className="px-2 text-warning">Missing</span>}
      </dd>
    </div>
  );
}
