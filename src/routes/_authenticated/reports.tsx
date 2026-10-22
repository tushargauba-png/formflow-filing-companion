import { pageMeta } from "@/lib/page-meta";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Download, Save, X } from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { formsQuery, remittersQuery, templatesQuery } from "@/lib/queries";
import { EXPORT_COLUMNS, INVOICING, STATUSES, getValue } from "@/lib/form-fields";
import { PageHeader } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => pageMeta("Reports & billing", "Export Form 146 records with saved custom billing formats."),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(formsQuery()),
      context.queryClient.ensureQueryData(remittersQuery()),
      context.queryClient.ensureQueryData(templatesQuery()),
    ]);
  },
  component: Reports,
});

interface Col { key: string; header: string }
const DEFAULT: Col[] = ["sr_no", "remitter.name", "remittee.name", "remittee_invoice_no", "filing_date", "ack_no", "udin", "certification_charges"]
  .map((k) => ({ key: k, header: EXPORT_COLUMNS.find((c) => c.key === k)?.label ?? k }));

function Reports() {
  const { data: forms } = useSuspenseQuery(formsQuery());
  const { data: remitters } = useSuspenseQuery(remittersQuery());
  const { data: templates } = useSuspenseQuery(templatesQuery());
  const qc = useQueryClient();
  const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const [client, setClient] = useState(""); const [status, setStatus] = useState(""); const [inv, setInv] = useState("");
  const [cols, setCols] = useState<Col[]>(DEFAULT);
  const [tplName, setTplName] = useState("");

  const rows = useMemo(() => forms.filter((f) => {
    const d = f.filing_date ?? f.start_date ?? "";
    if (from && d < from) return false;
    if (to && d > to) return false;
    if (client && f.remitter_id !== client) return false;
    if (status && f.status !== status) return false;
    if (inv && f.invoicing_status !== inv) return false;
    return true;
  }), [forms, from, to, client, status, inv]);

  function move(i: number, d: number) {
    const n = [...cols]; const j = i + d; if (j < 0 || j >= n.length) return;
    const t = n[i], other = n[j]; if (!t || !other) return; n[i] = other; n[j] = t; setCols(n);
  }

  function exportFile(type: "xlsx" | "csv") {
    const data = rows.map((r) => Object.fromEntries(cols.map((c) => [c.header, getValue(r, c.key)])));
    const ws = XLSX.utils.json_to_sheet(data, { header: cols.map((c) => c.header) });
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Billing");
    XLSX.writeFile(wb, `form146-billing-${new Date().toISOString().slice(0, 10)}.${type}`, { bookType: type });
  }

  async function saveTemplate() {
    if (!tplName) { toast.error("Name the format first"); return; }
    const { error } = await supabase.from("export_templates").insert({ name: tplName, columns: cols as never });
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["export_templates"] }); toast.success("Format saved"); setTplName("");
  }
  async function deleteTemplate(id: string) {
    await supabase.from("export_templates").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["export_templates"] });
  }

  const sel = "h-9 w-full rounded-md border bg-card px-3 text-sm";
  return (
    <div>
      <PageHeader eyebrow="Export" title="Reports & billing"
        actions={<>
          <Button variant="outline" onClick={() => exportFile("csv")}><Download className="mr-1 h-4 w-4" />CSV</Button>
          <Button onClick={() => exportFile("xlsx")}><Download className="mr-1 h-4 w-4" />Excel ({rows.length})</Button>
        </>} />

      <section className="mb-5 grid gap-4 rounded-lg border bg-card p-5 sm:grid-cols-5">
        <div><Label className="mb-1.5 block text-xs text-muted-foreground">From (filing date)</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><Label className="mb-1.5 block text-xs text-muted-foreground">To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <div><Label className="mb-1.5 block text-xs text-muted-foreground">Client</Label>
          <select className={sel} value={client} onChange={(e) => setClient(e.target.value)}><option value="">All</option>{remitters.map((r) => <option key={r.id} value={r.id}>{r.nickname}</option>)}</select></div>
        <div><Label className="mb-1.5 block text-xs text-muted-foreground">Status</Label>
          <select className={sel} value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
        <div><Label className="mb-1.5 block text-xs text-muted-foreground">Invoicing</Label>
          <select className={sel} value={inv} onChange={(e) => setInv(e.target.value)}><option value="">All</option>{INVOICING.map((s) => <option key={s}>{s}</option>)}</select></div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="rounded-lg border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg">Billing format</h2>
            <select className="h-9 rounded-md border bg-card px-3 text-sm" value="" onChange={(e) => {
              const t = templates.find((x) => x.id === e.target.value); if (t) { setCols(t.columns as unknown as Col[]); toast.success(`Loaded "${t.name}"`); }
            }}>
              <option value="">Load saved format…</option>{templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <ol className="space-y-1.5">
            {cols.map((c, i) => (
              <li key={c.key} className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5">
                <span className="w-6 font-mono text-xs text-muted-foreground">{i + 1}</span>
                <span className="w-44 truncate text-xs text-muted-foreground">{EXPORT_COLUMNS.find((x) => x.key === c.key)?.label}</span>
                <Input className="h-8 flex-1" value={c.header} onChange={(e) => setCols(cols.map((x, j) => (j === i ? { ...x, header: e.target.value } : x)))} />
                <Button size="icon" variant="ghost" onClick={() => move(i, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" onClick={() => move(i, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" onClick={() => setCols(cols.filter((_, j) => j !== i))}><X className="h-3.5 w-3.5" /></Button>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex gap-2">
            <Input placeholder="Format name, e.g. Tally billing" value={tplName} onChange={(e) => setTplName(e.target.value)} />
            <Button variant="outline" onClick={saveTemplate}><Save className="mr-1 h-4 w-4" />Save format</Button>
          </div>
          {templates.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {templates.map((t) => <span key={t.id} className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs">{t.name}<button onClick={() => deleteTemplate(t.id)}><X className="h-3 w-3" /></button></span>)}
            </div>
          )}
        </section>
        <section className="rounded-lg border bg-card p-5">
          <h2 className="mb-3 text-lg">Add column</h2>
          <ul className="max-h-[480px] space-y-0.5 overflow-y-auto text-sm">
            {EXPORT_COLUMNS.filter((c) => !cols.some((x) => x.key === c.key)).map((c) => (
              <li key={c.key}><button className="w-full rounded px-2 py-1 text-left hover:bg-muted" onClick={() => setCols([...cols, { key: c.key, header: c.label }])}>+ {c.label}</button></li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-5 overflow-x-auto rounded-lg border bg-card">
        <div className="border-b px-5 py-3 text-sm text-muted-foreground">Preview · first 20 of {rows.length} rows</div>
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs text-muted-foreground"><tr>{cols.map((c) => <th key={c.key} className="whitespace-nowrap px-3 py-2 font-medium">{c.header}</th>)}</tr></thead>
          <tbody>{rows.slice(0, 20).map((r) => <tr key={r.id} className="border-t">{cols.map((c) => <td key={c.key} className="whitespace-nowrap px-3 py-1.5">{String(getValue(r, c.key))}</td>)}</tr>)}</tbody>
        </table>
      </section>
    </div>
  );
}
