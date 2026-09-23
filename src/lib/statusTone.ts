export function statusTone(status: string): "success" | "danger" | "warning" | "neutral" {
  const s = (status || "").toUpperCase();
  if (
    s.includes("ACTIVE") ||
    s.includes("APPROVED") ||
    s.includes("POSTED") ||
    s.includes("DISBURSED") ||
    s.includes("SETTLED") ||
    s.includes("COMPLETED") ||
    s.includes("SUCCESS") ||
    s.includes("OPEN") ||
    s.includes("BALANCED")
  ) {
    return "success";
  }
  if (
    s.includes("REJECT") ||
    s.includes("FAIL") ||
    s.includes("CANCEL") ||
    s.includes("DEACTIV") ||
    s.includes("CLOSED") ||
    s.includes("BLOCK") ||
    s.includes("VIOLAT")
  ) {
    return "danger";
  }
  if (s.includes("PEND") || s.includes("DRAFT") || s.includes("SUBMIT") || s.includes("RUNNING") || s.includes("PAUSED")) {
    return "warning";
  }
  return "neutral";
}

export function formatMoney(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === "") return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
