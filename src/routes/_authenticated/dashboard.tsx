import { pageMeta } from "@/lib/page-meta";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { formsQuery } from "@/lib/queries";
import { STATUSES } from "@/lib/form-fields";
import { PageHeader, StatusBadge, fmtDate, fmtNum } from "@/components/ui-bits";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => pageMeta("Dashboard", "Monitor Form 146 work, filings, pending UDIN and billing."),
  loader: ({ context }) => context.queryClient.ensureQueryData(formsQuery()),
  component: Dashboard,
});

function Dashboard() {
  const { data: forms } = useSuspenseQuery(formsQuery());
  const stats = useMemo(() => {
    const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<string, number>;
    const byClient: Record<string, number> = {};
    const byMonth: Record<string, number> = {};
    let pendingUdin = 0, uninvoiced = 0, unpaid = 0;
    for (const f of forms) {
      byStatus[f.status] = (byStatus[f.status] ?? 0) + 1;
      const c = f.remitter?.nickname ?? "—";
      byClient[c] = (byClient[c] ?? 0) + 1;
      if (f.filing_date) { const m = f.filing_date.slice(0, 7); byMonth[m] = (byMonth[m] ?? 0) + 1; }
      if (f.status === "Filed" && !f.udin) pendingUdin++;
      if ((f.udin || f.ack_no) && f.invoicing_status !== "Invoiced" && !f.billing_invoice_no) uninvoiced++;
      if (f.invoicing_status === "Invoiced" && f.payment_status === "Pending") unpaid += Number(f.certification_charges ?? 0);
    }
    const months = Object.entries(byMonth).sort().slice(-12);
    return { byStatus, byClient, months, pendingUdin, uninvoiced, unpaid };
  }, [forms]);
  const open = forms.filter((f) => ["Draft", "Pending with client", "Ready"].includes(f.status));
  const maxMonth = Math.max(1, ...stats.months.map(([, v]) => v));

  return (
    <div>
      <PageHeader eyebrow="Overview" title="Dashboard" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Forms on record" value={forms.length} />
        <Kpi label="Open (draft / pending)" value={open.length} tone="warning" />
        <Kpi label="Filed, UDIN pending" value={stats.pendingUdin} tone="info" />
        <Kpi label="Unpaid charges (₹)" value={fmtNum(stats.unpaid)} tone="success" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-lg border bg-card p-5 lg:col-span-2">
          <h2 className="text-lg">Filings by month</h2>
          <div className="mt-4 flex h-44 items-end gap-2">
            {stats.months.map(([m, v]) => (
              <div key={m} className="flex flex-1 flex-col items-center gap-1">
                <span className="font-mono text-[10px] text-muted-foreground">{v}</span>
                <div className="w-full rounded-t bg-primary" style={{ height: `${(v / maxMonth) * 100}%` }} />
                <span className="font-mono text-[10px] text-muted-foreground">{m.slice(2)}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-lg">By status</h2>
          <ul className="mt-3 space-y-2">
            {Object.entries(stats.byStatus).map(([s, n]) => (
              <li key={s} className="flex items-center justify-between"><StatusBadge status={s} /><span className="font-mono text-sm">{n}</span></li>
            ))}
          </ul>
          <h2 className="mt-6 text-lg">By client</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {Object.entries(stats.byClient).sort((a, b) => b[1] - a[1]).map(([c, n]) => (
              <li key={c} className="flex justify-between"><span>{c}</span><span className="font-mono">{n}</span></li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-6 rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-lg">Open work</h2>
          <span className="text-xs text-muted-foreground">{stats.uninvoiced} filed forms without a billing invoice</span>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {open.length === 0 && <tr><td className="px-5 py-6 text-muted-foreground">Nothing open.</td></tr>}
            {open.map((f) => (
              <tr key={f.id} className="border-b last:border-0 hover:bg-muted/50">
                <td className="px-5 py-2.5 font-mono text-xs">{f.sr_no ?? "—"}</td>
                <td className="py-2.5">{f.remitter?.nickname}</td>
                <td className="py-2.5">{f.remittee?.nickname}</td>
                <td className="py-2.5">{fmtDate(f.start_date)}</td>
                <td className="py-2.5"><StatusBadge status={f.status} /></td>
                <td className="px-5 py-2.5 text-right"><Link to="/forms/$id" params={{ id: f.id }} className="text-primary hover:underline">Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number | string; tone?: "warning" | "info" | "success" }) {
  const bar = tone === "warning" ? "bg-warning" : tone === "info" ? "bg-info" : tone === "success" ? "bg-success" : "bg-primary";
  return (
    <div className="relative overflow-hidden rounded-lg border bg-card p-5">
      <div className={`absolute inset-y-0 left-0 w-1 ${bar}`} />
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 font-mono text-3xl">{value}</div>
    </div>
  );
}
