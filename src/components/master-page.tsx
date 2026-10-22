import { useQueryClient, useSuspenseQuery, type UseSuspenseQueryOptions } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { issuesByKey, normaliseCodes, type Issue } from "@/lib/validation";

export interface MasterField { key: string; label: string; type?: "text" | "bool" | "textarea"; required?: boolean }
type Row = Record<string, unknown> & { id: string };

export function MasterPage({ title, eyebrow, table, query, fields, listCols, validate, extraActions }: {
  title: string; eyebrow: string; table: "remitters" | "remittees";
  query: UseSuspenseQueryOptions<Row[]>; fields: MasterField[]; listCols: string[];
  validate?: (row: Partial<Row>) => Issue[]; extraActions?: ReactNode;
}) {
  const { data } = useSuspenseQuery(query);
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Partial<Row> | null>(null);

  const rows = data.filter((r) => !q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase()));

  async function save() {
    if (!edit) return;
    if (!edit["nickname"] || !edit["name"]) { toast.error("Nickname and name are required"); return; }
    const errors = (validate?.(edit) ?? []).filter((i) => i.level === "error");
    if (errors.length) { toast.error(`Fix before saving: ${errors[0]!.message}`); return; }
    const { id, created_at: _c, updated_at: _u, ...payload } = normaliseCodes(edit as Row);
    const res = id
      ? await supabase.from(table).update(payload as never).eq("id", id)
      : await supabase.from(table).insert(payload as never);
    if (res.error) { toast.error(res.error.message); return; }
    await qc.invalidateQueries({ queryKey: [table] });
    await qc.invalidateQueries({ queryKey: ["forms"] });
    setEdit(null);
    toast.success("Saved");
  }

  const label = (k: string) => fields.find((f) => f.key === k)?.label ?? k;
  const byKey = issuesByKey(edit && validate ? validate(edit) : []);

  return (
    <div>
      <PageHeader eyebrow={eyebrow} title={title} actions={<>{extraActions}<Button onClick={() => setEdit({})}><Plus className="mr-1 h-4 w-4" />Add</Button></>} />
      <div className="relative mb-4 w-72">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-8" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>{listCols.map((c) => <th key={c} className="px-4 py-2.5 font-medium">{label(c)}</th>)}<th /></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t hover:bg-muted/40">
                {listCols.map((c, i) => <td key={c} className={`px-4 py-2 ${i === 0 ? "font-medium" : ""}`}>{r[c] == null || r[c] === "" ? <span className="text-muted-foreground">—</span> : typeof r[c] === "boolean" ? (r[c] ? "Yes" : "No") : String(r[c])}</td>)}
                <td className="px-4 py-2 text-right"><Button size="icon" variant="ghost" onClick={() => setEdit(r)}><Pencil className="h-4 w-4" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{edit?.id ? "Edit" : "Add"} {title.toLowerCase().replace(/s$/, "")}</DialogTitle></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                <Label className="mb-1.5 block text-xs text-muted-foreground">{f.label}{f.required && " *"}</Label>
                {f.type === "bool" ? (
                  <label className="flex h-9 items-center gap-2 text-sm"><input type="checkbox" checked={!!edit?.[f.key]} onChange={(e) => setEdit({ ...edit, [f.key]: e.target.checked })} /> Yes</label>
                ) : (
                  <Input value={(edit?.[f.key] as string) ?? ""} aria-invalid={byKey.has(f.key) || undefined} onChange={(e) => setEdit({ ...edit, [f.key]: e.target.value || null })} />
                )}
                {byKey.get(f.key)?.map((i) => <p key={i.message} className={`mt-1 text-xs ${i.level === "error" ? "text-destructive" : "text-muted-foreground"}`}>{i.message}</p>)}
              </div>
            ))}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
