import { pageMeta } from "@/lib/page-meta";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Copy, Eye, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formsQuery } from "@/lib/queries";
import { STATUSES, buildCopy } from "@/lib/form-fields";
import { PageHeader, StatusBadge, fmtDate, fmtNum } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/forms/")({
  head: () => pageMeta("Form 146 register", "Track certificates, filings, UDIN and billing for all Form 146 records."),
  loader: ({ context }) => context.queryClient.ensureQueryData(formsQuery()),
  component: Register,
});

function Register() {
  const { data: forms } = useSuspenseQuery(formsQuery());
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [fy, setFy] = useState("");
  const years = useMemo(() => [...new Set(forms.map((f) => f.fy).filter(Boolean))].sort(), [forms]);

  const rows = forms.filter((f) => {
    if (status && f.status !== status) return false;
    if (fy && f.fy !== fy) return false;
    if (!q) return true;
    const hay = [f.sr_no, f.remitter?.nickname, f.remitter?.name, f.remittee?.nickname, f.remittee?.name, f.ack_no, f.udin, f.remittee_invoice_no, f.billing_invoice_no].join(" ").toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  async function copyForm(id: string) {
    const src = forms.find((f) => f.id === id); if (!src) return;
    const { remitter: _r, remittee: _e, ...plain } = src;
    const { data, error } = await supabase.from("forms").insert(buildCopy(plain) as never).select("id").single();
    if (error) { toast.error(error.message); return; }
    await qc.invalidateQueries({ queryKey: ["forms"] });
    toast.success("Copied as new draft");
    navigate({ to: "/forms/$id", params: { id: data.id } });
  }

  return (
    <div>
      <PageHeader eyebrow="Records" title="Form 146 register"
        actions={<Button asChild><Link to="/forms/$id" params={{ id: "new" }}>New Form 146</Link></Button>} />
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search client, payee, ack, UDIN…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="h-9 rounded-md border bg-card px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="h-9 rounded-md border bg-card px-3 text-sm" value={fy} onChange={(e) => setFy(e.target.value)}>
          <option value="">All years</option>{years.map((y) => <option key={y ?? ""}>{y}</option>)}
        </select>
        <span className="self-center text-sm text-muted-foreground">{rows.length} of {forms.length}</span>
      </div>
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>{["Sr", "Year", "Client", "Payee", "Invoice", "Gross", "Filed", "Ack no.", "UDIN", "Status", "Billing", ""].map((h) => <th key={h} className="px-3 py-2.5 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((f) => (
              <tr key={f.id} className="border-t hover:bg-muted/40">
                <td className="px-3 py-2 font-mono text-xs">{f.sr_no ?? "—"}{f.is_revised && <span className="ml-1 text-warning">R</span>}</td>
                <td className="px-3 py-2 font-mono text-xs">{f.fy}</td>
                <td className="px-3 py-2">{f.remitter?.nickname ?? "—"}</td>
                <td className="max-w-48 truncate px-3 py-2">{f.remittee?.nickname ?? "—"}</td>
                <td className="max-w-32 truncate px-3 py-2 font-mono text-xs">{f.remittee_invoice_no ?? "—"}</td>
                <td className="px-3 py-2 text-right font-mono text-xs">{f.currency ? `${f.currency} ` : ""}{fmtNum(f.gross_amount)}</td>
                <td className="px-3 py-2 text-xs">{fmtDate(f.filing_date)}</td>
                <td className="px-3 py-2 font-mono text-xs">{f.ack_no ?? "—"}</td>
                <td className="px-3 py-2 font-mono text-xs">{f.udin ?? "—"}</td>
                <td className="px-3 py-2"><StatusBadge status={f.status} /></td>
                <td className="px-3 py-2 font-mono text-xs">{f.billing_invoice_no ?? "—"}</td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" asChild><Link to="/forms/$id" params={{ id: f.id }}>Edit</Link></Button>
                    <Button size="icon" variant="ghost" title="Preview" asChild><Link to="/forms/$id/preview" params={{ id: f.id }}><Eye className="h-4 w-4" /></Link></Button>
                    <Button size="icon" variant="ghost" title="Copy as new" onClick={() => copyForm(f.id)}><Copy className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
