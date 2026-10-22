/** Suggests groups of remittees that are probably the same payee, for the merge dialog. Suggestions only — the user decides. */
type Named = { id: string; name: string; nickname: string };

const NOISE = /\b(the|inc|incorporated|ltd|limited|llc|plc|ag|gmbh|corp|corporation|co|company|pvt|private|p|revised|rev|jan|feb|mar|april|apr|may|june|jun|july|jul|aug|august|sep|sept|september|oct|october|nov|november|dec|december|january|february|march)\b/g;

export function normaliseName(name: string): string {
  return name.toLowerCase().replace(/\(.*?\)/g, " ").replace(/[^a-z0-9]+/g, " ").replace(NOISE, " ").replace(/\s+/g, " ").trim();
}

/** Whether a remittee name marks a revised filing, e.g. "TrustArc Inc-revised". */
export const looksRevised = (name: string) => /revis/i.test(name);

function editDistance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]!; prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]!;
      prev[j] = Math.min(prev[j]! + 1, prev[j - 1]! + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length]!;
}

function similar(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const short = a.length <= b.length ? a : b, long = short === a ? b : a;
  if (short.length >= 5 && editDistance(a, b) <= 2) return true;
  if (short.length >= 5 && long.replace(/ /g, "").startsWith(short.replace(/ /g, ""))) return true; // mongo / mongodb
  const longWords = new Set(long.split(" "));
  return short.length >= 4 && short.split(" ").every((w) => longWords.has(w)); // mccarren / andrea a mccarren
}

export function duplicateGroups<T extends Named>(rows: T[]): T[][] {
  const keys = rows.map((r) => normaliseName(r.name || r.nickname));
  const parent = rows.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i]!)));
  for (let i = 0; i < rows.length; i++)
    for (let j = i + 1; j < rows.length; j++)
      if (similar(keys[i]!, keys[j]!)) parent[find(j)] = find(i);
  const groups = new Map<number, T[]>();
  rows.forEach((r, i) => groups.set(find(i), [...(groups.get(find(i)) ?? []), r]));
  return [...groups.values()].filter((g) => g.length > 1);
}
