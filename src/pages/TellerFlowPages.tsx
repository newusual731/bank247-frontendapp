import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import {
  acceptTillTransfer,
  activateTill,
  createTill,
  createTillTransfer,
  createVault,
  requestCashReversal,
  completeCashReversal,
} from "../api/teller";
import { Button, PageHeader, TextField } from "../components/ui";

function FormShell({
  title,
  children,
  onSubmit,
  busy,
  error,
  result,
}: {
  title: string;
  children: ReactNode;
  onSubmit: (e: FormEvent) => void;
  busy: boolean;
  error: string | null;
  result: string | null;
}) {
  const navigate = useNavigate();
  return (
    <div>
      <PageHeader
        title={title}
        actions={
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Close
          </Button>
        }
      />
      <form className="panel" style={{ maxWidth: 520 }} onSubmit={onSubmit}>
        <div style={{ display: "grid", gap: "0.9rem" }}>{children}</div>
        {error ? <div className="alert-error" style={{ marginTop: "1rem" }}>{error}</div> : null}
        {result ? (
          <p style={{ marginTop: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>{result}</p>
        ) : null}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "1.25rem" }}>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Working…" : "Submit"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function TillCreatePage() {
  const [tellerId, setTellerId] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const till = await createTill({
        tellerId: tellerId.trim(),
        branchCode: branchCode.trim().toUpperCase(),
        currency: currency.trim().toUpperCase(),
      });
      const activated = await activateTill(till.id);
      setResult(`Till ${activated.id} · ${activated.status}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Till creation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormShell title="Till creation" onSubmit={(e) => void onSubmit(e)} busy={busy} error={error} result={result}>
      <TextField id="teller" label="Teller ID" value={tellerId} onChange={(e) => setTellerId(e.target.value)} required />
      <TextField id="branch" label="Branch code" value={branchCode} onChange={(e) => setBranchCode(e.target.value)} required />
      <TextField id="ccy" label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} required />
    </FormShell>
  );
}

export function VaultCreatePage() {
  const [branchCode, setBranchCode] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const vault = await createVault({
        branchCode: branchCode.trim().toUpperCase(),
        currency: currency.trim().toUpperCase(),
      });
      setResult(`Vault ${vault.id} · ${vault.status}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Vault creation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormShell title="Vault creation" onSubmit={(e) => void onSubmit(e)} busy={busy} error={error} result={result}>
      <TextField id="branch" label="Branch code" value={branchCode} onChange={(e) => setBranchCode(e.target.value)} required />
      <TextField id="ccy" label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} required />
    </FormShell>
  );
}

export function TillTransferPage() {
  const [destinationTillId, setDestinationTillId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [narration, setNarration] = useState("");
  const [acceptRef, setAcceptRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const tx = await createTillTransfer({
        destinationTillId: destinationTillId.trim(),
        amount: Number(amount),
        currency: currency.trim().toUpperCase(),
        narration: narration.trim() || undefined,
      });
      setResult(`Transfer ${tx.reference} · ${tx.status}`);
      setAcceptRef(tx.reference);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Till transfer failed");
    } finally {
      setBusy(false);
    }
  }

  async function onAccept() {
    if (!acceptRef) return;
    setBusy(true);
    setError(null);
    try {
      const tx = await acceptTillTransfer(acceptRef);
      setResult(`Accepted ${tx.reference} · ${tx.status}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Accept failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <FormShell title="Cash till transfer" onSubmit={(e) => void onSubmit(e)} busy={busy} error={error} result={result}>
        <TextField
          id="dest"
          label="Destination till ID"
          value={destinationTillId}
          onChange={(e) => setDestinationTillId(e.target.value)}
          required
        />
        <TextField id="amt" label="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <TextField id="ccy" label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} required />
        <TextField id="narr" label="Narration" value={narration} onChange={(e) => setNarration(e.target.value)} />
      </FormShell>
      {acceptRef ? (
        <div className="panel" style={{ maxWidth: 520, marginTop: "1rem" }}>
          <p style={{ marginTop: 0 }}>Receiver can accept transfer {acceptRef}</p>
          <Button onClick={() => void onAccept()} disabled={busy}>
            Accept transfer
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function CashReversePage() {
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function onRequest(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const tx = await requestCashReversal(reference.trim());
      setResult(`Reversal requested · ${tx.reference} · ${tx.status}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reversal request failed");
    } finally {
      setBusy(false);
    }
  }

  async function onComplete() {
    setBusy(true);
    setError(null);
    try {
      const tx = await completeCashReversal(reference.trim());
      setResult(`Reversal completed · ${tx.reference} · ${tx.status}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Complete reversal failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <FormShell title="Reverse cash transaction" onSubmit={(e) => void onRequest(e)} busy={busy} error={error} result={result}>
        <TextField
          id="ref"
          label="Teller transaction reference"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          required
        />
      </FormShell>
      <div className="panel" style={{ maxWidth: 520, marginTop: "1rem" }}>
        <Button onClick={() => void onComplete()} disabled={busy || !reference.trim()} variant="secondary">
          Complete approved reversal
        </Button>
      </div>
    </div>
  );
}

export function CashHubPage() {
  const links = [
    { to: "/teller/cash/deposit-lcy", label: "LCY Cash Deposit" },
    { to: "/teller/cash/deposit-fcy", label: "FCY Cash Deposit" },
    { to: "/teller/cash/withdraw-lcy", label: "LCY Cash Withdrawal" },
    { to: "/teller/cash/withdraw-fcy", label: "FCY Cash Withdrawal" },
    { to: "/teller/cash/withdraw-cheque", label: "Cash withdrawal (cheque)" },
    { to: "/teller/cash/reverse", label: "Reverse cash transaction" },
    { to: "/teller/cash/reprint", label: "Reprint cash slip" },
    { to: "/teller/till-transfer", label: "Cash till transfer" },
    { to: "/teller/till-create", label: "Till creation" },
    { to: "/teller/vault-create", label: "Vault creation" },
  ];
  return (
    <div>
      <PageHeader title="Cash transactions" />
      <div className="card-grid">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className="kpi-card cta" style={{ textDecoration: "none" }}>
            <p className="kpi-label">Teller</p>
            <p className="kpi-value" style={{ fontSize: "1.05rem" }}>
              {l.label}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
