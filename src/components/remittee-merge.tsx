import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Merge } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formsQuery, remitteesQuery } from "@/lib/queries";
import { duplicateGroups, looksRevised } from "@/lib/remittee-duplicates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Merges duplicate payees: their forms move to the remittee being kept, then the duplicates are deleted. */
export function RemitteeMerge() {
  const { data: remittees } = useSuspenseQuery(remitteesQuery());
  const { data: forms } = useSuspenseQuery(formsQuery());
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [keepId, setKeepId] = useState("");
  const [mergeIds, setMergeIds] = useState<string[]>([]);
  const [markRevised, setMarkRevised] = useState(false);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of forms) if (f.remittee_id) m.set(f.remittee_id, (m.get(f.remittee_id) ?? 0) + 1);
    return m;
  }, [forms]);
  const count = (id: string) => counts.get(id) ?? 0;
  const groups = useMemo(() => duplicateGroups(remittees), [remittees]);
  const byId = (id: string) => remittees.find((r) => r.id === id);

  function review(group: typeof remittees) {
    const keep = [...group].sort((a, b) => Number(looksRevised(a.name)) - Number(looksRevised(b.name)) || count(b.id) - count(a.id))[0]!;
    const rest = group.filter((r) => r.id !== keep.id);
    setKeepId(keep.id); setMergeIds(rest.map((r) => r.id)); setMarkRevised(rest.some((r) => looksRevised(r.name)));
  }
  function toggle(id: string) {
    setMergeIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  async function merge() {
    const keep = byId(keepId);
    if (!keep || !mergeIds.length) return;
    const moved = mergeIds.reduce((n, id) => n + count(id), 0);
    const names = mergeIds.map((id) => byId(id)?.name).join(", ");
    if (!confirm(`Move ${moved} form(s) from ${names} to "${keep.name}" and delete ${mergeIds.length} remittee(s)? This cannot be undone.`)) return;
    setBusy(true);
    const { error } = await supabase.rpc("merge_remittees", { keep_id: keepId, merge_ids: mergeIds, mark_revised: markRevised });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    await Promise.all([qc.invalidateQueries({ queryKey: ["remittees"] }), qc.invalidateQueries({ queryKey: ["forms"] })]);
    toast.success(`Merged into ${keep.nickname}`);
    setKeepId(""); setMergeIds([]); setMarkRevised(false);
  }

  const candidates = remittees.filter((r) => r.id !== keepId && (!q || `${r.nickname} ${r.name}`.toLowerCase().includes(q.toLowerCase())));
  const label = (r: (typeof remittees)[number]) => `${r.nickname}${r.nickname !== r.name ? ` — ${r.name}` : ""} (${count(r.id)} forms)`;

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}><Merge className="mr-1 h-4 w-4" />Merge duplicates</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader><DialogTitle>Merge duplicate remittees</DialogTitle></DialogHeader>

          {groups.length > 0 && <div>
            <h3 className="mb-2 text-sm font-medium">Possible duplicates</h3>
            <ul className="space-y-1.5 text-sm">
              {groups.map((g) => (
                <li key={g.map((r) => r.id).join()} className="flex items-center justify-between gap-3 rounded-md border px-3 py-1.5">
                  <span className="min-w-0">{g.map((r) => `${r.name} (${count(r.id)})`).join(" · ")}</span>
                  <Button size="sm" variant="ghost" onClick={() => review(g)}>Review</Button>
                </li>
              ))}
            </ul>
          </div>}

          <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="merge-keep" className="mb-1.5 block text-xs text-muted-foreground">Keep this remittee</Label>
              <select id="merge-keep" className="h-9 w-full rounded-md border bg-card px-3 text-sm" value={keepId}
                onChange={(e) => { setKeepId(e.target.value); setMergeIds((ids) => ids.filter((x) => x !== e.target.value)); }}>
                <option value="">—</option>
                {remittees.map((r) => <option key={r.id} value={r.id}>{label(r)}</option>)}
              </select>
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={markRevised} onChange={(e) => setMarkRevised(e.target.checked)} />
                Mark moved forms as revised
              </label>
              <p className="mt-3 text-xs text-muted-foreground">
                Forms keep the party details saved on them; forms without saved details will show the kept remittee's master data.
              </p>
            </div>
            <div>
              <Label htmlFor="merge-search" className="mb-1.5 block text-xs text-muted-foreground">Merge into it (selected: {mergeIds.length})</Label>
              <Input id="merge-search" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
              <div className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded-md border p-2 text-sm">
                {candidates.map((r) => (
                  <label key={r.id} className="flex items-center gap-2">
                    <input type="checkbox" checked={mergeIds.includes(r.id)} onChange={() => toggle(r.id)} /> {label(r)}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
            <Button onClick={merge} disabled={busy || !keepId || !mergeIds.length}>{busy ? "Merging…" : `Merge ${mergeIds.length || ""}`.trim()}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
