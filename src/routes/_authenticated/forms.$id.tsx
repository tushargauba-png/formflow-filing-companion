import { pageMeta } from "@/lib/page-meta";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Calculator, Eye, Paperclip, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formQuery, formsQuery, remitteesQuery, remittersQuery } from "@/lib/queries";
import { FORM_SECTIONS, buildCopy, type Form, type FieldDef } from "@/lib/form-fields";
import { REMITTER_FIELDS, REMITTEE_FIELDS } from "@/lib/portal-fields";
import { applyMaster, applyCalculation, matchingForms, partyDetails, fieldValue, setField, detailsOf } from "@/lib/form-calculations";
import { issuesByKey, nextSrNo, normaliseCodes, validateForm, type Issue } from "@/lib/validation";
import { PageHeader } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/forms/$id")({
  head: () => pageMeta("Edit Form 146", "Prepare Form 146 with party details, remittance calculations and tax certification fields."),
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(remittersQuery()),
      context.queryClient.ensureQueryData(remitteesQuery()),
      context.queryClient.ensureQueryData(formsQuery()),
      params.id !== "new" ? context.queryClient.ensureQueryData(formQuery(params.id)) : null,
    ]);
  },
  component: FormEditor,
});

function currentFy() {
  const d = new Date(); const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${String(y + 1).slice(2)}`;
}

function FormEditor() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: remitters } = useSuspenseQuery(remittersQuery());
  const { data: remittees } = useSuspenseQuery(remitteesQuery());
  const { data: allForms } = useSuspenseQuery(formsQuery());
  const existing = useQuery({ ...formQuery(id), enabled: !isNew });
  const [f, setF] = useState<Partial<Form>>({});
  const [saving, setSaving] = useState(false);
  const [previousId, setPreviousId] = useState("");
  const [autoCalculate, setAutoCalculate] = useState(false);

  useEffect(() => {
    if (isNew) setF({ status: "Draft", fy: currentFy(), start_date: new Date().toISOString().slice(0, 10), invoicing_status: "Not invoiced", payment_status: "Not applicable", is_revised: false });
    else if (existing.data) { const { remitter: _a, remittee: _b, ...rest } = existing.data; setF(rest); }
  }, [isNew, existing.data]);

  const set = (k: string, v: string | number | boolean | null) => setF((p) => {
    const next = setField(p, k, v);
    if (autoCalculate && ["amount_fc", "exchange_rate", "tds_rate", "portal.gross_up"].includes(k)) {
      try { return applyCalculation(next); } catch { return next; }
    }
    return next;
  });
  const candidates = matchingForms(allForms, f.remitter_id, f.remittee_id).filter(x => x.id !== id);

  function copyFrom(srcId: string) {
    const src = candidates.find((x) => x.id === srcId); if (!src) return;
    const { remitter: _a, remittee: _b, ...plain } = src;
    const copied = buildCopy(plain);
    const snap = { ...detailsOf(copied), ...(plain.remittee_tin ? { remittee_tin: plain.remittee_tin } : {}) };
    const remitterMaster = remitters.find(r => r.id === src.remitter_id);
    const remitteeMaster = remittees.find(r => r.id === src.remittee_id);
    const masterFallback = applyMaster(applyMaster(copied, "remitter", remitterMaster), "remittee", remitteeMaster);
    setF((p) => ({ ...copied, fy: p.fy ?? null, start_date: p.start_date ?? null, portal_details: { ...detailsOf(masterFallback), ...snap } }));
    setPreviousId(srcId); setAutoCalculate(false);
    toast.success("Details copied — update what changed");
  }

  async function save() {
    if (!f.remitter_id || !f.remittee_id) { toast.error("Select a remitter and remittee first."); return; }
    setSaving(true);
    let payload = { ...f };
    if (autoCalculate) {
      try { payload = applyCalculation(payload); setF(payload); }
      catch (error) { setSaving(false); toast.error((error as Error).message); return; }
    }
    const errors = validateForm(payload, validationContext).filter(i => i.level === "error");
    if (errors.length) {
      setSaving(false);
      toast.error(`Fix ${errors.length} problem${errors.length > 1 ? "s" : ""} before saving: ${errors[0]!.message}`);
      return;
    }
    payload = normaliseCodes(payload);
    if (!payload.sr_no?.trim()) payload.sr_no = null; // assigned by the database on insert
    delete payload.id; delete payload.created_at; delete payload.updated_at;
    const res = isNew
      ? await supabase.from("forms").insert(payload as never).select("id").single()
      : await supabase.from("forms").update(payload as never).eq("id", id).select("id").single();
    setSaving(false);
    if (res.error) { toast.error(res.error.message); return; }
    await qc.invalidateQueries({ queryKey: ["forms"] });
    toast.success("Saved");
    if (isNew) navigate({ to: "/forms/$id", params: { id: res.data.id } });
  }

  async function remove() {
    if (!confirm("Delete this form permanently?")) return;
    const { error } = await supabase.from("forms").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    await qc.invalidateQueries({ queryKey: ["forms"] });
    navigate({ to: "/forms" });
  }

  const remittee = remittees.find((r) => r.id === f.remittee_id);
  const remitter = remitters.find(r => r.id === f.remitter_id);
  const otherForms = allForms.filter(x => x.id !== id);
  const validationContext = { remitter, remittee, savedStatus: isNew ? null : existing.data?.status, otherSrNos: otherForms.map(x => x.sr_no?.trim() ?? "") };
  const issues = validateForm(f, validationContext);
  const byKey = issuesByKey(issues);
  function chooseParty(party: "remitter" | "remittee", masterId: string) {
    setPreviousId("");
    setF(p => applyMaster({ ...p, copied_from: null }, party, party === "remitter" ? remitters.find(r => r.id === masterId) : remittees.find(r => r.id === masterId)));
  }
  function calculate() {
    try { setF(applyCalculation(f)); } catch (error) { toast.error((error as Error).message); }
  }

  function control(fd: FieldDef, value: string | number | boolean | null | undefined, update: (v: string | number | boolean | null) => void) {
    const fieldId = `field-${fd.key}`;
    if (fd.type === "select") return <select id={fieldId} aria-label={fd.label} className="h-9 w-full min-w-0 rounded-md border bg-card px-3 text-sm" value={String(value ?? "")} onChange={e => update(e.target.value || null)}><option value="">—</option>{value && !fd.options?.includes(String(value)) && <option value={String(value)}>{String(value)}</option>}{fd.options?.map(o => <option key={o}>{o}</option>)}</select>;
    if (fd.type === "bool") return <label className="flex min-h-9 items-center gap-2 text-sm"><input id={fieldId} aria-label={fd.label} type="checkbox" checked={value === true} onChange={e => update(e.target.checked)} /> Yes</label>;
    if (fd.type === "textarea") return <Textarea id={fieldId} aria-label={fd.label} value={String(value ?? "")} onChange={e => update(e.target.value)} />;
    const placeholder = fd.key === "sr_no" && isNew ? `Auto (${nextSrNo(otherForms.map(x => x.sr_no))})` : undefined;
    return <Input id={fieldId} aria-label={fd.label} aria-invalid={byKey.get(fd.key)?.some(i => i.level === "error") || undefined} placeholder={placeholder} type={fd.type === "number" ? "number" : fd.type === "date" ? "date" : "text"} step="any" className={fd.type === "number" ? "min-w-0 font-mono" : "min-w-0"} value={typeof value === "boolean" ? "" : value ?? ""} onChange={e => update(e.target.value === "" ? null : fd.type === "number" ? Number(e.target.value) : e.target.value)} />;
  }

  return (
    <div className="max-w-5xl">
      <PageHeader eyebrow={isNew ? "New record" : `Sr ${f.sr_no ?? "—"} · ${f.fy ?? ""}`} title={isNew ? "New Form 146" : "Edit Form 146"}
        actions={<>
          {!isNew && <Button variant="outline" asChild><Link to="/forms/$id/preview" params={{ id }}><Eye className="mr-1 h-4 w-4" />Copy-ready preview</Link></Button>}
          {!isNew && <Button variant="ghost" onClick={remove}><Trash2 className="h-4 w-4" /></Button>}
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </>} />

      <IssueSummary issues={issues} />

      <Section title="Parties">
        <Field label="Remitter (client)">
          <select aria-label="Remitter (client)" className="h-9 w-full min-w-0 rounded-md border bg-card px-3 text-sm" value={f.remitter_id ?? ""} onChange={(e) => chooseParty("remitter", e.target.value)}>
            <option value="">—</option>{remitters.map((r) => <option key={r.id} value={r.id}>{r.nickname} — {r.name}</option>)}
          </select>
        </Field>
        <Field label="Remittee (payee)">
          <select aria-label="Remittee (payee)" className="h-9 w-full min-w-0 rounded-md border bg-card px-3 text-sm" value={f.remittee_id ?? ""} onChange={(e) => chooseParty("remittee", e.target.value)}>
            <option value="">—</option>{remittees.map((r) => <option key={r.id} value={r.id}>{r.nickname}{r.nickname !== r.name ? ` — ${r.name}` : ""}</option>)}
          </select>
        </Field>
      </Section>

      {isNew && f.remitter_id && f.remittee_id && <div className="mb-6 border-y py-4">
        <Label htmlFor="previous-form">Previous form for {remitter?.nickname} → {remittee?.nickname}</Label>
        <select id="previous-form" className="mt-2 h-9 w-full rounded-md border bg-card px-3 text-sm" value={previousId} onChange={e => e.target.value ? copyFrom(e.target.value) : setPreviousId("")}>
          <option value="">{candidates.length ? "— Select previous form (optional) —" : "No previous forms for this combination"}</option>
          {candidates.map(x => <option key={x.id} value={x.id}>Sr {x.sr_no ?? "—"} · {x.remittee_invoice_no ?? "No invoice"} · {x.filing_date ?? x.fy}</option>)}
        </select>
      </div>}

      {([ ["remitter", remitter, REMITTER_FIELDS], ["remittee", remittee, REMITTEE_FIELDS] ] as const).map(([party, master, fields]) => master && <Section key={party} title={party === "remitter" ? "Particulars of the remitter (sender)" : "Particulars of the remittee (recipient)"}>
        <div className="sm:col-span-2 lg:col-span-3"><Button variant="outline" size="sm" onClick={() => setF(p => applyMaster(p, party, master))}>Refresh from {party} master</Button></div>
        {fields.map(fd => <Field key={fd.key} label={fd.label} wide={fd.type === "textarea"} issues={byKey.get(`portal.${party}_${fd.key}`)}>{control({ ...fd, key: `portal.${party}_${fd.key}` }, partyDetails(f, party, master, fd.key), v => {
          setF(p => { const next = setField(p, `portal.${party}_${fd.key}`, v); return party === "remittee" && fd.key === "tin" ? { ...next, remittee_tin: String(v ?? "") } : next; });
        })}</Field>)}
      </Section>)}

      <section className="mb-5 border-y py-5">
        <div className="flex flex-wrap items-center gap-4"><h2 className="text-lg">Remittance calculation</h2>
          <Button variant="outline" onClick={calculate}><Calculator className="mr-2 h-4 w-4" />Calculate amounts</Button>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={autoCalculate} onChange={e => { setAutoCalculate(e.target.checked); if (e.target.checked) calculate(); }} />Auto-calculate amounts</label>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label={detailsOf(f)["gross_up"] ? "Net payable (foreign currency)" : "Gross payable (foreign currency)"} issues={byKey.get("amount_fc")}>{control({ key: "amount_fc", label: "Amount (foreign currency)", type: "number" }, f.amount_fc, v => set("amount_fc", v))}</Field>
          <Field label="Exchange rate (INR per unit)" issues={byKey.get("exchange_rate")}>{control({ key: "exchange_rate", label: "Exchange rate", type: "number" }, f.exchange_rate, v => set("exchange_rate", v))}</Field>
          <Field label="Effective TDS rate (%)" issues={byKey.get("tds_rate")}>{control({ key: "tds_rate", label: "Effective TDS rate (%)", type: "number" }, f.tds_rate, v => set("tds_rate", v))}</Field>
          <Field label="Gross-up under section 393(10)">{control({ key: "portal.gross_up", label: "Gross-up under section 393(10)", type: "bool" }, detailsOf(f)["gross_up"], v => set("portal.gross_up", v))}</Field>
        </div>
      </section>

      {FORM_SECTIONS.map((s) => (
        <Section key={s.title} title={s.title}>
          {s.fields.map((fd) => {
            if (["amount_fc", "exchange_rate", "tds_rate", "portal.gross_up"].includes(fd.key)) return null;
            const v = fieldValue(f, fd.key);
            return (
              <Field key={fd.key as string} label={fd.label} wide={fd.type === "textarea"} issues={byKey.get(fd.key)}>
                {control(fd, v, value => set(fd.key, value))}
              </Field>
            );
          })}
        </Section>
      ))}

      {!isNew && <Attachments formId={id} />}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5 border-b py-5">
      <h2 className="mb-4 text-lg">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

function Field({ label, children, wide, issues }: { label: string; children: React.ReactNode; wide?: boolean; issues?: Issue[] | undefined }) {
  return <div className={wide ? "min-w-0 sm:col-span-2 lg:col-span-3" : "min-w-0"}><Label className="mb-1.5 block text-xs text-muted-foreground">{label}</Label>{children}
    {issues?.map(i => <p key={i.message} className={`mt-1 text-xs ${i.level === "error" ? "text-destructive" : "text-muted-foreground"}`}>{i.message}</p>)}
  </div>;
}

function IssueSummary({ issues }: { issues: Issue[] }) {
  if (!issues.length) return null;
  const errors = issues.filter(i => i.level === "error");
  return (
    <details className={`no-print mb-5 rounded-md border p-3 text-sm ${errors.length ? "border-destructive/40 bg-destructive/5" : "border-warning/40 bg-warning/10"}`} open={errors.length > 0}>
      <summary className="cursor-pointer font-medium">
        {errors.length ? `${errors.length} problem${errors.length > 1 ? "s" : ""} to fix before saving` : "No blocking problems"}
        {issues.length > errors.length && ` · ${issues.length - errors.length} warning${issues.length - errors.length > 1 ? "s" : ""}`}
      </summary>
      <ul className="mt-2 list-disc space-y-0.5 pl-5">
        {[...errors, ...issues.filter(i => i.level === "warning")].map(i => <li key={i.key + i.message} className={i.level === "error" ? "text-destructive" : ""}>{i.message}</li>)}
      </ul>
    </details>
  );
}

function Attachments({ formId }: { formId: string }) {
  const qc = useQueryClient();
  const key = ["attachments", formId];
  const { data = [] } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from("form_attachments").select("*").eq("form_id", formId).order("created_at");
      if (error) throw error; return data;
    },
  });
  const [docType, setDocType] = useState("Invoice");

  async function upload(file: File) {
    const path = `${formId}/${Date.now()}-${file.name}`;
    const up = await supabase.storage.from("form-files").upload(path, file);
    if (up.error) { toast.error(up.error.message); return; }
    const { error } = await supabase.from("form_attachments").insert({ form_id: formId, file_name: file.name, storage_path: path, doc_type: docType });
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: key });
  }
  async function open(path: string) {
    const { data, error } = await supabase.storage.from("form-files").createSignedUrl(path, 300);
    if (error) { toast.error(error.message); return; }
    window.open(data.signedUrl, "_blank");
  }
  async function del(id: string, path: string) {
    await supabase.storage.from("form-files").remove([path]);
    await supabase.from("form_attachments").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: key });
  }

  return (
    <section className="mb-5 rounded-lg border bg-card p-5">
      <h2 className="mb-4 text-lg">Supporting documents</h2>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select className="h-9 rounded-md border bg-card px-3 text-sm" value={docType} onChange={(e) => setDocType(e.target.value)}>
          {["Invoice", "Agreement", "TRC", "Form 10F", "No-PE declaration", "Filed Form 146 PDF", "Other"].map((d) => <option key={d}>{d}</option>)}
        </select>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted">
          <Paperclip className="h-4 w-4" /> Upload file
          <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </label>
      </div>
      <ul className="divide-y text-sm">
        {data.length === 0 && <li className="py-2 text-muted-foreground">No documents yet.</li>}
        {data.map((a) => (
          <li key={a.id} className="flex items-center justify-between py-2">
            <button className="text-left text-primary hover:underline" onClick={() => open(a.storage_path)}>{a.file_name}</button>
            <span className="flex items-center gap-3"><span className="text-xs text-muted-foreground">{a.doc_type}</span>
              <button onClick={() => del(a.id, a.storage_path)}><Trash2 className="h-4 w-4 text-muted-foreground" /></button></span>
          </li>
        ))}
      </ul>
    </section>
  );
}
