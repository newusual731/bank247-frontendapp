import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getAccountEnquiry,
  issueChequeBook,
  type AccountEnquiry,
  type ChequeBook,
} from "../api/accounts";
import { listBranches, type Branch } from "../api/branches";
import { getLedgerTrialBalance, listLedgerEntries, type LedgerEntry } from "../api/ledger";
import { ApiError } from "../api/client";
import { ModuleScreen } from "../components/ModuleScreen";
import { Badge, Button, EmptyState, PageHeader, TextField } from "../components/ui";
import { downloadCsv } from "../lib/csv";
import { NUBAN_LENGTH, NUBAN_PLACEHOLDER, sanitizeNubanInput } from "../lib/nuban";
import { formatMoney, statusTone } from "../lib/statusTone";

type EnquiryRow = {
  id: string;
  kind: string;
  detail: string;
  status: string;
  extra: string;
};

export function EnquiryPage() {
  const [params] = useSearchParams();
  const initialAccount = params.get("account") || "";
  const [input, setInput] = useState(initialAccount);
  const [query, setQuery] = useState(initialAccount);
  const [enquiry, setEnquiry] = useState<AccountEnquiry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setEnquiry(null);
      setError(null);
      return;
    }
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getAccountEnquiry(query.trim());
        if (!cancelled) setEnquiry(data);
      } catch (err) {
        if (!cancelled) {
          setEnquiry(null);
          setError(err instanceof ApiError ? err.message : "Enquiry failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [query]);

  const rows: EnquiryRow[] = useMemo(() => {
    if (!enquiry) return [];
    const out: EnquiryRow[] = [
      {
        id: "acct",
        kind: "Account",
        detail: `${enquiry.account.accountNumber} · ${enquiry.account.productCode} · ${enquiry.account.branchCode}`,
        status: enquiry.account.status,
        extra: `Debit ${enquiry.debitAllowed ? "allowed" : "blocked"} · Credit ${enquiry.creditAllowed ? "allowed" : "blocked"}`,
      },
    ];
    for (const r of enquiry.restrictions || []) {
      out.push({
        id: `r-${r.id}`,
        kind: "Restriction",
        detail: r.restrictionType,
        status: r.status,
        extra: r.reason || "—",
      });
    }
    for (const l of enquiry.liens || []) {
      out.push({
        id: `l-${l.id}`,
        kind: "Lien",
        detail: `${formatMoney(l.amount)} ${l.currency}`,
        status: l.status,
        extra: l.reason || "—",
      });
    }
    for (const m of enquiry.mandates || []) {
      out.push({
        id: `m-${m.id}`,
        kind: "Mandate",
        detail: m.mandateType,
        status: m.status,
        extra: m.signatories || m.instruction || "—",
      });
    }
    return out;
  }, [enquiry]);

  return (
    <ModuleScreen
      title="Enquiries"
      primaryAction={{ label: "New enquiry", to: "/enquiries/new" }}
      search={input}
      onSearchChange={setInput}
      searchPlaceholder="Account number"
      filters={
        <Button variant="secondary" onClick={() => setQuery(input.trim())} disabled={!input.trim()}>
          Enquire
        </Button>
      }
      loading={loading}
      error={error}
      emptyHint="Account enquiry returns status, posting flags, restrictions, liens, and mandates."
      columns={[
        { key: "kind", header: "Type", render: (r) => r.kind },
        { key: "detail", header: "Detail", render: (r) => r.detail },
        {
          key: "status",
          header: "Status",
          render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>,
        },
        { key: "extra", header: "Notes", render: (r) => r.extra },
      ]}
      rows={rows}
      rowKey={(r) => r.id}
    />
  );
}

export function AccountStatementPage() {
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
        const page = await listLedgerEntries(accountNumber.trim(), 0, 100);
        if (!cancelled) {
          setRows(page.content || []);
          setTotal(page.totalElements ?? page.content?.length ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          setError(err instanceof ApiError ? err.message : "Unable to load statement");
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
      title="Account Statement Report"
      primaryAction={{
        label: "Generate",
        onClick: () => setAccountNumber(sanitizeNubanInput(input)),
        disabled: !sanitizeNubanInput(input),
      }}
      search={input}
      onSearchChange={(v) => setInput(sanitizeNubanInput(v))}
      searchPlaceholder={NUBAN_PLACEHOLDER}
      loading={loading}
      error={error}
      emptyHint="Enter an account number to load ledger entries as a statement."
      columns={[
        {
          key: "date",
          header: "Date",
          render: (r) => (r.postedAt ? new Date(r.postedAt).toLocaleString() : "—"),
        },
        { key: "narr", header: "Narration", render: (r) => r.narration || r.transactionReference },
        {
          key: "debit",
          header: "Debit",
          render: (r) => (r.direction === "DEBIT" ? formatMoney(r.amount) : "—"),
        },
        {
          key: "credit",
          header: "Credit",
          render: (r) => (r.direction === "CREDIT" ? formatMoney(r.amount) : "—"),
        },
        { key: "ccy", header: "Currency", render: (r) => r.currency },
      ]}
      rows={rows}
      rowKey={(r) => r.id}
      footer={
        <p style={{ marginTop: "0.75rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
          Showing {rows.length} of {total}
          {accountNumber ? ` · ${accountNumber}` : ""}
        </p>
      }
    />
  );
}

type MappingRow = {
  id: string;
  branchCode: string;
  branchName: string;
  mappingKey: string;
  glCode: string;
  status: string;
};

export function GlMappingPage() {
  const [search, setSearch] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const page = await listBranches({ size: 100 });
        if (!cancelled) setBranches(page.content || []);
      } catch (err) {
        if (!cancelled) {
          setBranches([]);
          setError(err instanceof ApiError ? err.message : "Unable to load branch GL mappings");
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

  const rows: MappingRow[] = useMemo(() => {
    const out: MappingRow[] = [];
    for (const b of branches) {
      const map = b.glMappings || {};
      for (const [key, glCode] of Object.entries(map)) {
        out.push({
          id: `${b.id}-${key}`,
          branchCode: b.branchCode,
          branchName: b.name,
          mappingKey: key,
          glCode,
          status: b.status,
        });
      }
    }
    return out;
  }, [branches]);

  const q = search.trim().toLowerCase();
  const filtered = rows.filter((r) =>
    !q
      ? true
      : [r.branchCode, r.branchName, r.mappingKey, r.glCode].join(" ").toLowerCase().includes(q),
  );

  return (
    <ModuleScreen
      title="GL Mapping"
      primaryAction={{ label: "Add Mapping", to: "/gl/mapping/new" }}
      search={search}
      onSearchChange={setSearch}
      loading={loading}
      error={error}
      emptyHint="Branch GL mappings from branch-service (key → GL code per branch)."
      columns={[
        { key: "key", header: "Mapping key", render: (r) => r.mappingKey },
        { key: "gl", header: "GL code", render: (r) => r.glCode },
        { key: "branch", header: "Branch", render: (r) => `${r.branchCode} · ${r.branchName}` },
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
          Showing {filtered.length} mapping{filtered.length === 1 ? "" : "s"} across {branches.length}{" "}
          branch{branches.length === 1 ? "" : "es"}
        </p>
      }
    />
  );
}

export function ChequePage() {
  const [accountNumber, setAccountNumber] = useState("");
  const [startNumber, setStartNumber] = useState("");
  const [endNumber, setEndNumber] = useState("");
  const [leaves, setLeaves] = useState("25");
  const [issued, setIssued] = useState<ChequeBook[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onIssue() {
    setSubmitting(true);
    setError(null);
    try {
      const book = await issueChequeBook(accountNumber.trim(), {
        startNumber: startNumber.trim(),
        endNumber: endNumber.trim(),
        leaves: Number(leaves) || 1,
      });
      setIssued((prev) => [book, ...prev]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Issue failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader title="Cheque Series Upload" />
      <p style={{ color: "var(--text-muted)", marginTop: 0, marginBottom: "1rem", fontSize: "0.9rem" }}>
        Upload / issue cheque leaf series against an account (Figma: Cheque Series Upload).
      </p>
      <div className="toolbar" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "flex-end" }}>
        <TextField
          id="cheque-acct"
          label="Account number"
          placeholder={NUBAN_PLACEHOLDER}
          inputMode="numeric"
          maxLength={NUBAN_LENGTH}
          value={accountNumber}
          onChange={(e) => setAccountNumber(sanitizeNubanInput(e.target.value))}
        />
        <TextField
          id="cheque-start"
          label="Start number"
          value={startNumber}
          onChange={(e) => setStartNumber(e.target.value)}
        />
        <TextField
          id="cheque-end"
          label="End number"
          value={endNumber}
          onChange={(e) => setEndNumber(e.target.value)}
        />
        <TextField
          id="cheque-leaves"
          label="Leaves"
          type="number"
          min={1}
          value={leaves}
          onChange={(e) => setLeaves(e.target.value)}
        />
        <Button
          onClick={() => void onIssue()}
          disabled={submitting || !accountNumber.trim() || !startNumber.trim() || !endNumber.trim()}
        >
          {submitting ? "Issuing…" : "Issue Cheque Book"}
        </Button>
      </div>
      {error ? <div className="alert-error" style={{ marginBottom: "1rem" }}>{error}</div> : null}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Account</th>
              <th>Series</th>
              <th>Leaves</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {issued.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState title="No cheque books issued this session" hint="Fill the form and issue a book." />
                </td>
              </tr>
            ) : (
              issued.map((r) => (
                <tr key={r.id}>
                  <td>{r.accountNumber}</td>
                  <td>
                    {r.startNumber}–{r.endNumber}
                  </td>
                  <td>{r.leaves}</td>
                  <td>
                    <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                  </td>
                  <td>{r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PnlPage() {
  const [rows, setRows] = useState<
    { id: string; nature: string; accountType: string; currency: string; debit: string | number; credit: string | number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balanced, setBalanced] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const tb = await getLedgerTrialBalance();
        if (!cancelled) {
          const lines = (tb.lines || [])
            .filter((l) => l.nature === "INCOME" || l.nature === "EXPENSE")
            .map((l) => ({
              id: `${l.nature}-${l.accountType}-${l.currency}`,
              nature: l.nature,
              accountType: l.accountType,
              currency: l.currency,
              debit: l.debit,
              credit: l.credit,
            }));
          setRows(lines);
          setBalanced(tb.balanced);
        }
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          setError(err instanceof ApiError ? err.message : "Unable to load P&L lines");
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

  return (
    <ModuleScreen
      title="P&L Report"
      primaryAction={{
        label: "Run report",
        onClick: () =>
          downloadCsv(
            `pnl-${new Date().toISOString().slice(0, 10)}.csv`,
            ["Line", "Description", "Debit", "Credit", "Currency"],
            rows.map((r) => [r.nature, r.accountType, String(r.debit), String(r.credit), r.currency]),
          ),
      }}
      loading={loading}
      error={error}
      emptyHint="Interim view: income/expense lines from ledger trial-balance (full P&L API not yet available)."
      columns={[
        { key: "nature", header: "Line", render: (r) => r.nature },
        { key: "type", header: "Description", render: (r) => r.accountType },
        { key: "debit", header: "Debit", render: (r) => formatMoney(r.debit) },
        { key: "credit", header: "Credit", render: (r) => formatMoney(r.credit) },
        { key: "ccy", header: "Currency", render: (r) => r.currency },
      ]}
      rows={rows}
      rowKey={(r) => r.id}
      footer={
        <p style={{ marginTop: "0.75rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
          Ledger balanced: {balanced == null ? "—" : balanced ? "yes" : "no"} · {rows.length} income/expense
          line(s)
        </p>
      }
    />
  );
}

export function PendingFeaturePage({
  title,
  primaryLabel,
  hint,
}: {
  title: string;
  primaryLabel: string;
  hint: string;
}) {
  return (
    <div>
      <PageHeader title={title} actions={<Button disabled>{primaryLabel}</Button>} />
      <div className="data-table-wrap" style={{ padding: "2rem" }}>
        <EmptyState title="Backend API not available yet" hint={hint} />
      </div>
    </div>
  );
}
