import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { statusTone } from "@/lib/form-fields";

export function PageHeader({ eyebrow, title, actions }: { eyebrow?: string; title: string; actions?: ReactNode }) {
  return (
    <div className="no-print mb-6 flex flex-wrap items-end justify-between gap-4 border-b pb-5">
      <div>
        {eyebrow && <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">{eyebrow}</div>}
        <h1 className="mt-1 text-3xl">{title}</h1>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium", statusTone(status))}>
      {status}
    </span>
  );
}

export function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

export function fmtNum(n: number | null | undefined) {
  return n == null ? "—" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}
