import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { listCasaProducts, type Product } from "../api/accounts";
import { getCashPositions } from "../api/branches";
import {
  addCustomerDocument,
  listCustomerDocuments,
  uploadToPresignedUrl,
  type CustomerDocument,
} from "../api/documents";
import { searchInvestments, searchLoans, type Investment, type Loan } from "../api/loans";
import { getLedgerTrialBalance } from "../api/ledger";
import { searchAuditEvents } from "../api/reporting";
import { getTellerTransaction } from "../api/teller";
import { internalTransfer } from "../api/transfers";
import { listApprovals } from "../api/workflow";
import { ModuleScreen } from "../components/ModuleScreen";
import { Badge, Button, PageHeader, TextField } from "../components/ui";
import { loadModuleConfig, saveModuleConfig, type ModuleToggle } from "../lib/moduleConfig";
import { formatMoney, statusTone } from "../lib/statusTone";
import "./LoginPage.css";

function PanelForm({
  title,
  onSubmit,
  busy,
  error,
  result,
  children,
}: {
  title: string;
  onSubmit: (e: FormEvent) => void;
  busy: boolean;
  error: string | null;
  result: string | null;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div>
      <PageHeader title={title} actions={<Button variant="ghost" onClick={() => navigate(-1)}>Close</Button>} />
      <form className="panel" style={{ maxWidth: 600 }} onSubmit={onSubmit}>
        <div style={{ display: "grid", gap: "0.9rem" }}>{children}</div>
        {error ? <div className="alert-error" style={{ marginTop: "1rem" }}>{error}</div> : null}
        {result ? <p style={{ marginTop: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>{result}</p> : null}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "1.25rem" }}>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? "Working…" : "Submit"}</Button>
        </div>
      </form>
    </div>
  );
}

export function CustomerDocumentUploadPage() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const [customerId, setCustomerId] = useState(id || params.get("customerId") || "");
  const [docs, setDocs] = useState<CustomerDocument[]>([]);
  const [documentType, setDocumentType] = useState("PASSPORT");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [signatureImage, setSignatureImage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (id) setCustomerId(id);
  }, [id]);

  useEffect(() => {
    if (!customerId.trim()) {
      setDocs([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await listCustomerDocuments(customerId.trim());
        if (!cancelled) setDocs(rows);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Unable to load documents");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [customerId, tick]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!customerId.trim()) {
      setError("Customer ID required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await addCustomerDocument(customerId.trim(), {
        documentType: documentType.trim().toUpperCase(),
        referenceNumber: referenceNumber.trim() || `DOC-${Date.now()}`,
        fileName: file?.name,
        contentType: file?.type || undefined,
        signatureImage,
      });
      if (file && created.uploadUrl) {
        await uploadToPresignedUrl(created.uploadUrl, file, created.uploadMethod || "PUT");
        setResult(`Uploaded ${created.fileName || file.name} · ${created.status}`);
      } else {
        setResult(`Registered ${created.documentType} · ${created.status} (awaiting file bytes)`);
      }
      setFile(null);
      setTick((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Customer document upload"
        actions={
          customerId ? (
            <Link to={`/customers/${customerId}`}>
              <Button variant="ghost">Customer record</Button>
            </Link>
          ) : null
        }
      />
      <form className="panel" style={{ maxWidth: 560 }} onSubmit={(e) => void onSubmit(e)}>
        <div style={{ display: "grid", gap: "0.9rem" }}>
          {!id ? (
            <TextField
              id="cid"
              label="Customer ID"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
            />
          ) : null}
          <label className="field" htmlFor="dtype">
            <span className="field-label">Document type</span>
            <select id="dtype" className="field-input" value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
              {["PASSPORT", "NIN_SLIP", "UTILITY_BILL", "CAC", "SIGNATURE", "OTHER"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <TextField id="ref" label="Reference number" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} />
          <label className="field" htmlFor="file">
            <span className="field-label">File</span>
            <input id="file" type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
            <input type="checkbox" checked={signatureImage} onChange={(e) => setSignatureImage(e.target.checked)} />
            Signature image
          </label>
        </div>
        {error ? <div className="alert-error" style={{ marginTop: "1rem" }}>{error}</div> : null}
        {result ? <p style={{ marginTop: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>{result}</p> : null}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.25rem" }}>
          <Button type="submit" disabled={busy || !customerId.trim()}>{busy ? "Uploading…" : "Upload"}</Button>
        </div>
      </form>
      <div className="panel" style={{ marginTop: "1rem" }}>
        <h3 style={{ marginTop: 0, fontSize: "1rem" }}>Documents</h3>
        {loading ? <p style={{ color: "var(--text-muted)" }}>Loading…</p> : null}
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Reference</th>
              <th>File</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {docs.length === 0 ? (
              <tr><td colSpan={4} style={{ color: "var(--text-muted)" }}>No documents yet</td></tr>
            ) : (
              docs.map((d) => (
                <tr key={d.id}>
                  <td>{d.documentType}</td>
                  <td>{d.referenceNumber}</td>
                  <td>{d.fileName || "—"}</td>
                  <td><Badge tone={statusTone(d.status)}>{d.status}</Badge></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ModuleConfigPage() {
  const [modules, setModules] = useState<ModuleToggle[]>(() => loadModuleConfig());
  const [saved, setSaved] = useState(false);

  function toggle(id: string) {
    setModules((prev) => prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)));
    setSaved(false);
  }

  function onSave() {
    saveModuleConfig(modules);
    setSaved(true);
    window.dispatchEvent(new Event("bank247-module-config"));
  }

  return (
    <div>
      <PageHeader title="Module Configuration" />
      <p style={{ color: "var(--text-muted)", marginTop: 0 }}>
        Enable or disable staff nav modules for this workstation (Figma Module Configuration).
      </p>
      <div className="panel" style={{ maxWidth: 520 }}>
        {modules.map((m) => (
          <label
            key={m.id}
            className="field"
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}
          >
            <span>{m.label}</span>
            <input type="checkbox" checked={m.enabled} onChange={() => toggle(m.id)} />
          </label>
        ))}
        <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
          {saved ? <span style={{ color: "var(--text-muted)", alignSelf: "center", fontSize: "0.85rem" }}>Saved</span> : null}
          <Button onClick={onSave}>Save configuration</Button>
        </div>
      </div>
    </div>
  );
}

export function DailySummaryPage() {
  const [asset, setAsset] = useState("—");
  const [liability, setLiability] = useState("—");
  const [pnl, setPnl] = useState("—");
  const [pending, setPending] = useState("—");
  const [tills, setTills] = useState("—");
  const [activity, setActivity] = useState<{ id: string; time: string; module: string; ref: string; status: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [tb, cash, approvals, audit] = await Promise.allSettled([
          getLedgerTrialBalance(),
          getCashPositions(),
          listApprovals({ status: "PENDING", size: 20 }),
          searchAuditEvents({ size: 10 }),
        ]);
        if (cancelled) return;
        if (tb.status === "fulfilled") {
          const lines = tb.value.lines || [];
          const sum = (nature: string, field: "debit" | "credit") =>
            lines.filter((l) => l.nature === nature).reduce((a, l) => a + Number(l[field] || 0), 0);
          setAsset(formatMoney(sum("ASSET", "debit") - sum("ASSET", "credit")));
          setLiability(formatMoney(sum("LIABILITY", "credit") - sum("LIABILITY", "debit")));
          const income = sum("INCOME", "credit") - sum("INCOME", "debit");
          const expense = sum("EXPENSE", "debit") - sum("EXPENSE", "credit");
          setPnl(formatMoney(income - expense));
        }
        if (cash.status === "fulfilled") {
          const n = (cash.value.tills?.length || 0) + (cash.value.vaults?.length || 0);
          setTills(String(n));
        }
        if (approvals.status === "fulfilled") {
          setPending(String(approvals.value.totalElements ?? approvals.value.content?.length ?? 0));
        }
        if (audit.status === "fulfilled") {
          setActivity(
            (audit.value.content || []).map((e) => ({
              id: e.id,
              time: e.occurredAt ? new Date(e.occurredAt).toLocaleString() : "—",
              module: e.module || e.resourceType || "—",
              ref: e.resourceId || e.action || "—",
              status: e.action || "—",
            })),
          );
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Unable to load daily summary");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <PageHeader title="Daily Summary" />
      {error ? <div className="alert-error">{error}</div> : null}
      {loading ? <p style={{ color: "var(--text-muted)" }}>Loading…</p> : null}
      <div className="card-grid" style={{ marginTop: "0.5rem" }}>
        {[
          { label: "Total Asset", value: asset },
          { label: "Total Liability", value: liability },
          { label: "Net P&L", value: pnl },
          { label: "Pending approvals", value: pending },
          { label: "Open tills / vaults", value: tills },
        ].map((kpi) => (
          <article key={kpi.label} className="kpi-card">
            <p className="kpi-label">{kpi.label}</p>
            <p className="kpi-value">{kpi.value}</p>
          </article>
        ))}
      </div>
      <section className="panel" style={{ marginTop: "1.25rem" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Dashboard report · recent activity</h2>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Module</th>
                <th>Reference</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {activity.length === 0 ? (
                <tr><td colSpan={4} style={{ color: "var(--text-muted)" }}>No audit events</td></tr>
              ) : (
                activity.map((r) => (
                  <tr key={r.id}>
                    <td>{r.time}</td>
                    <td>{r.module}</td>
                    <td>{r.ref}</td>
                    <td>{r.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function SpecialEntryPage({ title = "Special Entry" }: { title?: string }) {
  const [source, setSource] = useState("");
  const [dest, setDest] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [narration, setNarration] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await internalTransfer({
        sourceAccount: source.trim(),
        destinationAccount: dest.trim(),
        amount: Number(amount),
        currency: currency.toUpperCase(),
        narration: narration.trim() || title,
      });
      setResult(`${r.reference || r.transactionReference || "OK"} · ${r.status || "POSTED"}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Entry failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PanelForm title={title} onSubmit={(e) => void onSubmit(e)} busy={busy} error={error} result={result}>
      <TextField id="src" label="Debit account (GL / internal)" value={source} onChange={(e) => setSource(e.target.value)} required />
      <TextField id="dst" label="Credit account (GL / internal)" value={dest} onChange={(e) => setDest(e.target.value)} required />
      <TextField id="amt" label="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      <TextField id="ccy" label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} required />
      <TextField id="narr" label="Narration" value={narration} onChange={(e) => setNarration(e.target.value)} />
    </PanelForm>
  );
}

export function ContractBalancesPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [l, i] = await Promise.all([searchLoans({ size: 50 }), searchInvestments({ size: 50 })]);
        if (!cancelled) {
          setLoans(l.content || []);
          setInvestments(i.content || []);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Unable to load balances");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  type Row = { id: string; kind: string; ref: string; amount: string; status: string; mat: string };
  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    for (const l of loans) {
      out.push({
        id: `L-${l.id}`,
        kind: "Loan",
        ref: l.loanNumber,
        amount: `${formatMoney(l.outstandingPrincipal ?? l.principalAmount)} ${l.currency}`,
        status: l.status,
        mat: l.maturityDate || "—",
      });
    }
    for (const i of investments) {
      out.push({
        id: `I-${i.id}`,
        kind: "Investment",
        ref: i.investmentNumber,
        amount: `${formatMoney(i.currentPrincipal ?? i.originalPrincipal)} ${i.currency}`,
        status: i.status,
        mat: i.maturityDate || "—",
      });
    }
    const q = search.trim().toLowerCase();
    return q ? out.filter((r) => [r.kind, r.ref, r.status].join(" ").toLowerCase().includes(q)) : out;
  }, [loans, investments, search]);

  return (
    <ModuleScreen
      title="Contract Balances"
      search={search}
      onSearchChange={setSearch}
      loading={loading}
      error={error}
      emptyHint="Outstanding loan and investment balances."
      columns={[
        { key: "kind", header: "Contract", render: (r) => r.kind },
        { key: "ref", header: "Reference", render: (r) => r.ref },
        { key: "amt", header: "Balance", render: (r) => r.amount },
        { key: "status", header: "Status", render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
        { key: "mat", header: "Maturity", render: (r) => r.mat },
      ]}
      rows={rows}
      rowKey={(r) => r.id}
    />
  );
}

export function AccountTypePage() {
  const [rows, setRows] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const page = await listCasaProducts({ size: 50 });
        if (!cancelled) setRows(page.content || []);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Unable to load account types");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = rows.filter((r) =>
    !q ? true : [r.code, r.name, r.accountType, r.currency, r.status].join(" ").toLowerCase().includes(q),
  );

  return (
    <ModuleScreen
      title="Account Type"
      primaryAction={{ label: "New product", to: "/products/new" }}
      search={search}
      onSearchChange={setSearch}
      loading={loading}
      error={error}
      emptyHint="CASA products grouped by account type (SAVINGS / CURRENT / …)."
      columns={[
        { key: "type", header: "Account type", render: (r) => r.accountType || "—" },
        { key: "code", header: "Product code", render: (r) => r.code },
        { key: "name", header: "Name", render: (r) => r.name },
        { key: "ccy", header: "Currency", render: (r) => r.currency },
        { key: "status", header: "Status", render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
      ]}
      rows={filtered}
      rowKey={(r) => r.id}
    />
  );
}

export function FtModulePage() {
  const cards = [
    { to: "/transfers/customer", label: "Customer transfer", hint: "CASA ↔ CASA" },
    { to: "/transfers/internal", label: "Internal transfer", hint: "GL / internal accounts" },
    { to: "/payments/new", label: "External payment", hint: "NIP / switch" },
    { to: "/payments", label: "Payment enquiry", hint: "List & status" },
    { to: "/gl/entries/special", label: "Special entry", hint: "Manual GL posting" },
    { to: "/gl/entries/add", label: "Add entry", hint: "Journal-style transfer" },
  ];
  return (
    <div>
      <PageHeader title="FT Module" />
      <p style={{ color: "var(--text-muted)", marginTop: 0 }}>Funds transfer hub (Figma FT Module).</p>
      <div className="card-grid">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="kpi-card cta" style={{ textDecoration: "none", color: "inherit" }}>
            <p className="kpi-label">{c.hint}</p>
            <p className="kpi-value" style={{ fontSize: "1.1rem" }}>{c.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ReprintCashSlipPage() {
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slip, setSlip] = useState<{
    reference: string;
    type?: string;
    account?: string;
    amount?: string;
    currency?: string;
    status: string;
    narration?: string;
  } | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSlip(null);
    try {
      const tx = await getTellerTransaction(reference.trim());
      setSlip({
        reference: tx.reference,
        type: tx.type,
        account: tx.customerAccount,
        amount: tx.amount != null ? String(tx.amount) : undefined,
        currency: tx.currency,
        status: tx.status,
        narration: tx.narration,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Transaction not found");
    } finally {
      setBusy(false);
    }
  }

  function onPrint() {
    window.print();
  }

  return (
    <div>
      <PageHeader title="Reprint Cash Slip" />
      <form className="panel" style={{ maxWidth: 480 }} onSubmit={(e) => void onSubmit(e)}>
        <TextField id="ref" label="Transaction reference" value={reference} onChange={(e) => setReference(e.target.value)} required />
        {error ? <div className="alert-error" style={{ marginTop: "1rem" }}>{error}</div> : null}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
          <Button type="submit" disabled={busy}>{busy ? "Looking up…" : "Load slip"}</Button>
        </div>
      </form>
      {slip ? (
        <div className="panel" id="cash-slip" style={{ marginTop: "1rem", maxWidth: 420 }}>
          <h3 style={{ marginTop: 0 }}>Bank247 Cash Slip</h3>
          <p><strong>Reference</strong> · {slip.reference}</p>
          <p><strong>Type</strong> · {slip.type || "—"}</p>
          <p><strong>Account</strong> · {slip.account || "—"}</p>
          <p><strong>Amount</strong> · {slip.amount || "—"} {slip.currency || ""}</p>
          <p><strong>Status</strong> · {slip.status}</p>
          <p><strong>Narration</strong> · {slip.narration || "—"}</p>
          <Button type="button" onClick={onPrint}>Print / Reprint</Button>
        </div>
      ) : null}
    </div>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="login-page">
      <section className="login-brand figma-brand">
        <h1>Elevate your Core Banking Experience with Bank 24/7</h1>
        <p>
          Our comprehensive design system offers you an unparalleled range of components, sparking creativity and
          boosting efficiency.
        </p>
        <blockquote className="figma-quote">
          Rayna has transformed the way our team approaches design. The sheer range of components and the seamless
          integration of the design system into our workflow have been game-changers.
          <footer>
            <span className="figma-avatar" aria-hidden />
            <span>
              <strong>Ariana Grande</strong>
              <br />
              Visual Designer, Google
            </span>
          </footer>
        </blockquote>
      </section>
      <section className="login-form-wrap">
        <div className="login-form login-card">
          <h2>Bank 24/7</h2>
          <p className="login-sub">Staff access for every institution</p>
          <button type="button" className="login-submit ready cta" onClick={() => navigate("/login")}>
            Staff sign-in
          </button>
          <button type="button" className="fg-btn fg-btn-outline cta" style={{ width: "100%" }} onClick={() => navigate("/login/branch")}>
            Log in by Branch
          </button>
        </div>
      </section>
    </div>
  );
}
