import { useEffect, useState } from "react";
import { getTrialBalance, searchAuditEvents, type AuditEvent, type TrialBalanceRow } from "../api/reporting";
import { ApiError } from "../api/client";
import { ModuleScreen } from "../components/ModuleScreen";
import { downloadCsv } from "../lib/csv";
import { formatMoney } from "../lib/statusTone";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function TrialBalancePage() {
  const [businessDate, setBusinessDate] = useState(todayIso());
  const [applied, setApplied] = useState(todayIso());
  const [rows, setRows] = useState<TrialBalanceRow[]>([]);
  const [meta, setMeta] = useState<{ balanced?: boolean; debit?: string | number; credit?: string | number }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const report = await getTrialBalance(applied);
        if (!cancelled) {
          setRows(report.rows || []);
          setMeta({
            balanced: report.movementBalanced,
            debit: report.totalDebits,
            credit: report.totalCredits,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          setError(err instanceof ApiError ? err.message : "Unable to load trial balance");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [applied]);

  return (
    <ModuleScreen
      title="Trial Balance Report"
      primaryAction={{ label: "Run report", onClick: () => setApplied(businessDate) }}
      filters={
        <label className="field" style={{ margin: 0 }}>
          <span className="field-label">Business date</span>
          <input
            className="field-input"
            type="date"
            value={businessDate}
            onChange={(e) => setBusinessDate(e.target.value)}
          />
        </label>
      }
      loading={loading}
      error={error}
      columns={[
        { key: "gl", header: "GL Code", render: (r) => r.glCode },
        { key: "cat", header: "Category", render: (r) => r.accountCategory || "—" },
        { key: "debit", header: "Debit", render: (r) => formatMoney(r.debitMovement) },
        { key: "credit", header: "Credit", render: (r) => formatMoney(r.creditMovement) },
        { key: "close", header: "Closing", render: (r) => formatMoney(r.closingBalance) },
        { key: "ccy", header: "Currency", render: (r) => r.currency },
      ]}
      rows={rows}
      rowKey={(r) => `${r.glCode}-${r.currency}-${r.branchCode || ""}`}
      footer={
        <p style={{ marginTop: "0.75rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
          Totals D {formatMoney(meta.debit)} / C {formatMoney(meta.credit)} · Balanced:{" "}
          {meta.balanced ? "yes" : "no"} · {rows.length} row(s)
        </p>
      }
    />
  );
}

export function AuditPage() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [rows, setRows] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search.trim()), 280);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const page = await searchAuditEvents({
          module: debounced || undefined,
          size: 50,
        });
        if (!cancelled) {
          setRows(page.content || []);
          setTotal(page.totalElements ?? page.content?.length ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          setError(err instanceof ApiError ? err.message : "Unable to load audit events");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  return (
    <ModuleScreen
      title="Audit Trail"
      primaryAction={{
        label: "Export",
        onClick: () =>
          downloadCsv(
            `audit-${new Date().toISOString().slice(0, 10)}.csv`,
            ["Time", "Actor", "Action", "Resource", "Module", "Branch"],
            rows.map((r) => [
              r.occurredAt ? new Date(r.occurredAt).toLocaleString() : "",
              r.actorId || "",
              r.action || "",
              [r.resourceType, r.resourceId].filter(Boolean).join(" "),
              r.module || "",
              r.branchCode || "",
            ]),
          ),
      }}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Filter by module"
      loading={loading}
      error={error}
      columns={[
        {
          key: "time",
          header: "Time",
          render: (r) => (r.occurredAt ? new Date(r.occurredAt).toLocaleString() : "—"),
        },
        { key: "actor", header: "Actor", render: (r) => r.actorId || "—" },
        { key: "action", header: "Action", render: (r) => r.action || "—" },
        {
          key: "res",
          header: "Resource",
          render: (r) => [r.resourceType, r.resourceId].filter(Boolean).join(" ") || "—",
        },
        { key: "mod", header: "Module", render: (r) => r.module || "—" },
        { key: "branch", header: "Branch", render: (r) => r.branchCode || "—" },
      ]}
      rows={rows}
      rowKey={(r) => r.id}
      footer={
        <p style={{ marginTop: "0.75rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
          Showing {rows.length} of {total}
        </p>
      }
    />
  );
}
