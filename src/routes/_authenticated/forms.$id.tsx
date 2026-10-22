import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, Paperclip, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formQuery, formsQuery, remitteesQuery, remittersQuery } from "@/lib/queries";
import { FORM_SECTIONS, buildCopy, type Form } from "@/lib/form-fields";
import { PageHeader } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/forms/$id")({
  head: () => ({ meta: [{ title: "Edit Form 146 — Form 146 Desk" }] }),
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

  useEffect(() => {
    if (isNew) setF({ status: "Draft", fy: currentFy(), start_date: new Date().toISOString().slice(0, 10), invoicing_status: "Not invoiced", payment_status: "Not applicable", is_revised: false });
    else if (existing.data) { const { remitter: _a, remittee: _b, ...rest } = existing.data; setF(rest); }
  }, [isNew, existing.data]);

  const set = (k: keyof Form, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  function copyFrom(srcId: string) {
    const src = allForms.find((x) => x.id === srcId); if (!src) return;
    const { remitter: _a, remittee: _b, ...plain } = src;
    setF((p) => ({ ...p, ...buildCopy(plain), fy: p.fy, start_date: p.start_date }));
    toast.success("Details copied — update what changed");
  }

  async function save() {
    setSaving(true);
    const payload = { ...f };
    delete payload.id; delete payload.created_at; delete payload.updated_at;
    const res = isNew
      ? await supabase.from("forms").insert(payload as never).select("id").single()
      : await supabase.from("forms").update(payload as never).eq("id", id).select("id").single();
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    await qc.invalidateQueries({ queryKey: ["forms"] });
    toast.success("Saved");
    if (isNew) navigate({ to: "/forms/$id", params: { id: res.data.id } });
  }

  async function remove() {
    if (!confirm("Delete this form permanently?")) return;
    const { error } = await supabase.from("forms").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await qc.invalidateQueries({ queryKey: ["forms"] });
    navigate({ to: "/forms" });
  }

  const remittee = remittees.find((r) => r.id === f.remittee_id);
  function pullFromRemittee() {
    if (!remittee) return;
    setF((p) => ({ ...p, nature_of_remittance: p.nature_of_remittance || remittee.nature_of_remittance, purpose_code: p.purpose_code || remittee.purpose_code, dtaa_article: p.dtaa_article || remittee.dtaa_article, remittee_tin: p.remittee_tin || remittee.tin }));
  }

  return (
    <div className="max-w-5xl">
      <PageHeader eyebrow={isNew ? "New record" : `Sr ${f.sr_no ?? "—"} · ${f.fy ?? ""}`} title={isNew ? "New Form 146" : "Edit Form 146"}
        actions={<>
          {!isNew && <Button variant="outline" asChild><Link to="/forms/$id/preview" params={{ id }}><Eye className="mr-1 h-4 w-4" />Copy-ready preview</Link></Button>}
          {!isNew && <Button variant="ghost" onClick={remove}><Trash2 className="h-4 w-4" /></Button>}
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </>} />

      {isNew && (
        <div className="mb-6 rounded-lg border border-accent bg-accent/15 p-4">
          <Label>Start from a previous form (optional)</Label>
          <select className="mt-2 h-9 w-full rounded-md border bg-card px-3 text-sm" defaultValue="" onChange={(e) => e.target.value && copyFrom(e.target.value)}>
            <option value="">— Pick a previous form to copy —</option>
            {allForms.map((x) => <option key={x.id} value={x.id}>{x.remitter?.nickname} → {x.remittee?.nickname} · {x.remittee_invoice_no ?? "no inv"} · {x.filing_date ?? x.fy}</option>)}
          </select>
        </div>
      )}

      <Section title="Parties">
        <Field label="Remitter (client)">
          <select className="h-9 w-full rounded-md border bg-card px-3 text-sm" value={f.remitter_id ?? ""} onChange={(e) => set("remitter_id", e.target.value || null)}>
            <option value="">—</option>{remitters.map((r) => <option key={r.id} value={r.id}>{r.nickname} — {r.name}</option>)}
          </select>
        </Field>
        <Field label="Remittee (payee)">
          <select className="h-9 w-full rounded-md border bg-card px-3 text-sm" value={f.remittee_id ?? ""} onChange={(e) => set("remittee_id", e.target.value || null)}>
            <option value="">—</option>{remittees.map((r) => <option key={r.id} value={r.id}>{r.nickname}{r.nickname !== r.name ? ` — ${r.name}` : ""}</option>)}
          </select>
          {remittee && <button type="button" onClick={pullFromRemittee} className="mt-1 text-xs text-primary hover:underline">Fill defaults from payee master</button>}
        </Field>
      </Section>

      {FORM_SECTIONS.map((s) => (
        <Section key={s.title} title={s.title}>
          {s.fields.map((fd) => {
            const v = f[fd.key];
            return (
              <Field key={fd.key as string} label={fd.label} wide={fd.type === "textarea"}>
                {fd.type === "select" ? (
                  <select className="h-9 w-full rounded-md border bg-card px-3 text-sm" value={(v as string) ?? ""} onChange={(e) => set(fd.key, e.target.value)}>
                    {fd.options!.map((o) => <option key={o}>{o}</option>)}
                  </select>
                ) : fd.type === "bool" ? (
                  <label className="flex h-9 items-center gap-2 text-sm"><input type="checkbox" checked={!!v} onChange={(e) => set(fd.key, e.target.checked)} /> Yes</label>
                ) : fd.type === "textarea" ? (
                  <Textarea value={(v as string) ?? ""} onChange={(e) => set(fd.key, e.target.value)} />
                ) : (
                  <Input type={fd.type === "number" ? "number" : fd.type === "date" ? "date" : "text"} step="any"
                    className={fd.type === "number" || fd.key === "udin" || fd.key === "ack_no" ? "font-mono" : ""}
                    value={(v as string | number) ?? ""}
                    onChange={(e) => set(fd.key, e.target.value === "" ? null : fd.type === "number" ? Number(e.target.value) : e.target.value)} />
                )}
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
    <section className="mb-5 rounded-lg border bg-card p-5">
      <h2 className="mb-4 text-lg">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <div className={wide ? "sm:col-span-2 lg:col-span-3" : ""}><Label className="mb-1.5 block text-xs text-muted-foreground">{label}</Label>{children}</div>;
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
    if (up.error) return toast.error(up.error.message);
    const { error } = await supabase.from("form_attachments").insert({ form_id: formId, file_name: file.name, storage_path: path, doc_type: docType });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: key });
  }
  async function open(path: string) {
    const { data, error } = await supabase.storage.from("form-files").createSignedUrl(path, 300);
    if (error) return toast.error(error.message);
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
