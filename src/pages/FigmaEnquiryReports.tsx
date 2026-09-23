import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { listLedgerEntries, type LedgerEntry } from "../api/ledger";
import { formatMoney } from "../lib/statusTone";
import { EXAMPLE_NUBAN } from "../lib/nuban";
import "../components/figma/FigmaForm.css";

const DEMO_ROWS = [
  {
    id: "1",
    date: "2025/07/01",
    code: "DEP1001",
    description: "Deposit From ABC Ltd",
    debit: 500000,
    credit: 0,
    balance: 500000,
    currency: "NGN",
    status: "Posted",
  },
  {
    id: "2",
    date: "2025/07/01",
    code: "DEP1001",
    description: "Deposit From ABC Ltd",
    debit: 0,
    credit: 500000,
    balance: 1000000,
    currency: "NGN",
    status: "Posted",
  },
  {
    id: "3",
    date: "2025/07/01",
    code: "DEP1001",
    description: "Deposit From ABC Ltd",
    debit: 500000,
    credit: 0,
    balance: 500000,
    currency: "NGN",
    status: "Posted",
  },
  {
    id: "4",
    date: "2025/07/01",
    code: "DEP1001",
    description: "Deposit From ABC Ltd",
    debit: 0,
    credit: 500000,
    balance: 1000000,
    currency: "NGN",
    status: "Posted",
  },
  {
    id: "5",
    date: "2025/07/01",
    code: "DEP1001",
    description: "Deposit From ABC Ltd",
    debit: 500000,
    credit: 0,
    balance: 500000,
    currency: "NGN",
    status: "Posted",
  },
];

function naira(n: number) {
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Figma: Account Statement Report (filters + debit/credit table) */
export function AccountStatementReportFigmaPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [from, setFrom] = useState(params.get("from") || "2025-06-15");
  const [to, setTo] = useState(params.get("to") || "2025-06-15");
  const [accountNumber, setAccountNumber] = useState(params.get("account") || "0051389315");
  const [accountType, setAccountType] = useState("CCD1");
  const [txnCode, setTxnCode] = useState("DEP1001");
  const [currency, setCurrency] = useState("Usd");
  const [branch, setBranch] = useState("Victoria Island");
  const [status, setStatus] = useState("Posted");
  const [rows, setRows] = useState(DEMO_ROWS);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const acct = params.get("account");
    if (!acct?.trim()) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const page = await listLedgerEntries(acct.trim(), 0, 100);
        if (cancelled) return;
        const mapped = (page.content || []).map((e: LedgerEntry, i: number) => ({
          id: e.id || String(i),
          date: e.postedAt ? new Date(e.postedAt).toISOString().slice(0, 10).replace(/-/g, "/") : "—",
          code: e.transactionReference?.slice(0, 8) || "—",
          description: e.narration || e.transactionReference || "—",
          debit: e.direction === "DEBIT" ? Number(e.amount) : 0,
          credit: e.direction === "CREDIT" ? Number(e.amount) : 0,
          balance: Number(e.amount) || 0,
          currency: e.currency || "NGN",
          status: "Posted",
        }));
        if (mapped.length) setRows(mapped);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Unable to load statement");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params]);

  const totalBalance = useMemo(() => rows.reduce((a, r) => a + (r.balance || 0), 0), [rows]);

  function exportCsv() {
    const header = "Date,Transaction Code,Description,Debit,Credit,Balance,Currency,Status\n";
    const body = rows
      .map((r) =>
        [r.date, r.code, `"${r.description}"`, r.debit, r.credit, r.balance, r.currency, r.status].join(","),
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `account-statement-${accountNumber || "report"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fg-hub fg-statement-report">
      <div className="fg-statement-top">
        <button type="button" className="fg-btn-link cta" onClick={() => navigate("/enquiries")}>
          ← Back
        </button>
      </div>
      <h1>Account Statement Report</h1>

      <div className="fg-statement-filters">
        <label className="fg-statement-field">
          <span>From</span>
          <input type="date" className="fg-control" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="fg-statement-field">
          <span>To</span>
          <input type="date" className="fg-control" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <label className="fg-statement-field">
          <span>Account Number</span>
          <select className="fg-control" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}>
            <option value={accountNumber}>{accountNumber}</option>
          </select>
        </label>
        <label className="fg-statement-field">
          <span>Account Type</span>
          <select className="fg-control" value={accountType} onChange={(e) => setAccountType(e.target.value)}>
            <option>CCD1</option>
            <option>CC01</option>
            <option>SAV</option>
          </select>
        </label>
        <label className="fg-statement-field">
          <span>Transaction Code</span>
          <select className="fg-control" value={txnCode} onChange={(e) => setTxnCode(e.target.value)}>
            <option>DEP1001</option>
            <option>WDL1001</option>
          </select>
        </label>
        <label className="fg-statement-field">
          <span>Currency</span>
          <select className="fg-control" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option>Usd</option>
            <option>NGN</option>
          </select>
        </label>
        <label className="fg-statement-field">
          <span>Branch</span>
          <select className="fg-control" value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option>Victoria Island</option>
            <option>Ikeja Top</option>
          </select>
        </label>
        <label className="fg-statement-field">
          <span>Status</span>
          <select className="fg-control" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>Posted</option>
            <option>Pending</option>
          </select>
        </label>
      </div>

      <div className="fg-statement-actions">
        <button type="button" className="fg-stmt-btn export cta" onClick={exportCsv}>
          <span aria-hidden>↑</span> Export
        </button>
        <button type="button" className="fg-stmt-btn print cta" onClick={() => window.print()}>
          <span aria-hidden>↓</span> Print
        </button>
      </div>

      {error ? <p className="fg-error">{error}</p> : null}
      {loading ? <p style={{ color: "#9ca3af" }}>Loading…</p> : null}

      <div className="fg-table-wrap fg-statement-table-wrap">
        <table className="fg-table fg-statement-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Transaction Code</th>
              <th>Description</th>
              <th className="debit-h">Debit</th>
              <th className="credit-h">Credit</th>
              <th>Balance</th>
              <th>Currency</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.date}</td>
                <td>{r.code}</td>
                <td>{r.description}</td>
                <td>{r.debit ? naira(r.debit) : "—"}</td>
                <td>{r.credit ? naira(r.credit) : "—"}</td>
                <td>{naira(r.balance)}</td>
                <td>{r.currency}</td>
                <td>{r.status}</td>
              </tr>
            ))}
            <tr className="fg-statement-total">
              <td colSpan={5}>
                <strong>TOTAL</strong>
              </td>
              <td>
                <strong>{naira(totalBalance || 500000)}</strong>
              </td>
              <td colSpan={2} />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Lightweight transaction report result (Generate Transaction Report success). */
export function TransactionReportFigmaPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const branch = params.get("branch") || "HQ01";
  const from = params.get("from") || "—";
  const to = params.get("to") || "—";

  return (
    <div className="fg-hub fg-statement-report">
      <div className="fg-statement-top">
        <button type="button" className="fg-btn-link cta" onClick={() => navigate("/enquiries")}>
          ← Back
        </button>
      </div>
      <h1>Transaction Report</h1>
      <p style={{ color: "#6b7280", marginTop: -8, marginBottom: 24 }}>
        Branch <strong>{branch}</strong> · {from} → {to}
      </p>
      <div className="fg-statement-actions">
        <button type="button" className="fg-stmt-btn export cta" onClick={() => window.print()}>
          <span aria-hidden>↑</span> Export
        </button>
        <button type="button" className="fg-stmt-btn print cta" onClick={() => window.print()}>
          <span aria-hidden>↓</span> Print
        </button>
      </div>
      <div className="fg-table-wrap">
        <table className="fg-table peach">
          <thead>
            <tr>
              <th>Date</th>
              <th>Reference</th>
              <th>Teller</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_ROWS.slice(0, 4).map((r) => (
              <tr key={r.id}>
                <td>{r.date}</td>
                <td>{r.code}</td>
                <td>Tella 1</td>
                <td>{r.debit ? formatMoney(r.debit) : "—"}</td>
                <td>{r.credit ? formatMoney(r.credit) : "—"}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
