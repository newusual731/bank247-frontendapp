import { useEffect, useState } from "react";
import {
  getLedgerTrialBalance,
  listLedgerEntries,
  searchGlAccounts,
  type GlAccount,
  type LedgerEntry,
  type LedgerTrialBalance,
} from "../api/ledger";
import { ApiError } from "../api/client";
import { ModuleScreen } from "../components/ModuleScreen";
import { Badge, Button } from "../components/ui";
import { formatMoney, statusTone } from "../lib/statusTone";

export function GlChartPage() {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<GlAccount[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const page = await searchGlAccounts({ size: 50 });
        if (!cancelled) {
          setRows(page.content || []);
          setTotal(page.totalElements ?? page.content?.length ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          setError(err instanceof ApiError ? err.message : "Unable to load GL accounts");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = rows.filter((r) =>
    !q ? true : [r.code, r.description, r.nature, r.currency, r.status].join(" ").toLowerCase().includes(q),
  );

  return (
    <ModuleScreen
      title="Chart of Accounts"
      primaryAction={{ label: "GL Creation", to: "/gl/create" }}
      search={search}
      onSearchChange={setSearch}
      loading={loading}
      error={error}
      columns={[
        { key: "code", header: "GL Code", render: (r) => r.code },
        { key: "name", header: "Name", render: (r) => r.description },
        { key: "nature", header: "Type", render: (r) => r.nature },
        { key: "ccy", header: "Currency", render: (r) => r.currency },
        { key: "bal", header: "Balance", render: (r) => formatMoney(r.balance) },
        {
          key: "status",
          header: "Status",
          render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>,
        },
      ]}
      rows={filtered}
      rowKey={(r) => r.id}
      footer={
        <p style={{ marginTop: "0.75rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
          Showing {filtered.length} of {total}
        </p>
      }
    />
  );
}

export function GlSummaryPage() {
  const [tb, setTb] = useState<LedgerTrialBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getLedgerTrialBalance();
        if (!cancelled) setTb(data);
      } catch (err) {
        if (!cancelled) {
          setTb(null);
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
  }, []);

  const rows = tb?.lines ?? [];

  return (
    <ModuleScreen
      title="General Ledger"
      primaryAction={{ label: "Reverse Entry", to: "/gl/reverse" }}
      loading={loading}
      error={error}
      emptyHint="Ledger trial-balance summary by nature / account type."
      columns={[
        { key: "nature", header: "Nature", render: (r) => r.nature },
        { key: "type", header: "Account type", render: (r) => r.accountType },
        { key: "ccy", header: "Currency", render: (r) => r.currency },
        { key: "debit", header: "Debit", render: (r) => formatMoney(r.debit) },
        { key: "credit", header: "Credit", render: (r) => formatMoney(r.credit) },
      ]}
      rows={rows}
      rowKey={(r) => `${r.nature}-${r.accountType}-${r.currency}`}
      footer={
        <p style={{ marginTop: "0.75rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
          Balanced: {tb?.balanced ? "yes" : "no"} · {rows.length} line(s)
        </p>
      }
    />
  );
}

export function GlJournalPage() {
  const [input, setInput] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [rows, setRows] = useState<LedgerEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountNumber.trim()) {
      setRows([]);
      return;
    }
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const page = await listLedgerEntries(accountNumber.trim());
        if (!cancelled) {
          setRows(page.content || []);
          setTotal(page.totalElements ?? page.content?.length ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          setError(err instanceof ApiError ? err.message : "Unable to load journal");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [accountNumber]);

  return (
    <ModuleScreen
      title="Journal Report"
      primaryAction={{ label: "Reverse Entry", to: "/gl/reverse" }}
      search={input}
      onSearchChange={setInput}
      searchPlaceholder="Ledger account number"
      filters={
        <Button variant="secondary" onClick={() => setAccountNumber(input.trim())} disabled={!input.trim()}>
          Load
        </Button>
      }
      loading={loading}
      error={error}
      emptyHint="Enter a ledger account number to load entries."
      columns={[
        { key: "ref", header: "Reference", render: (r) => r.transactionReference },
        { key: "dir", header: "Direction", render: (r) => r.direction },
        { key: "amt", header: "Amount", render: (r) => `${formatMoney(r.amount)} ${r.currency}` },
        { key: "narr", header: "Narration", render: (r) => r.narration || "—" },
        {
          key: "date",
          header: "Posted",
          render: (r) => (r.postedAt ? new Date(r.postedAt).toLocaleString() : "—"),
        },
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
