import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { depositCash, withdrawCash } from "../api/teller";
import { Button, PageHeader, TextField } from "../components/ui";
import { NUBAN_LENGTH, NUBAN_PLACEHOLDER, isValidNuban, sanitizeNubanInput } from "../lib/nuban";

type Mode = "deposit" | "withdraw";

type Props = {
  title: string;
  mode: Mode;
  defaultCurrency?: string;
  accountLabel?: string;
};

export function CashTransactionPage({
  title,
  mode,
  defaultCurrency = "NGN",
  accountLabel,
}: Props) {
  const navigate = useNavigate();
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [narration, setNarration] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");
  const [ctr, setCtr] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    if (!isValidNuban(account)) {
      setError("Enter a valid 10-digit NUBAN account number");
      setBusy(false);
      return;
    }
    try {
      const body = {
        customerAccount: account.trim(),
        amount: Number(amount),
        currency: currency.trim().toUpperCase(),
        narration: narration.trim() || undefined,
        chequeNumber: chequeNumber.trim() || undefined,
        ctrAcknowledged: ctr || undefined,
      };
      const tx = mode === "deposit" ? await depositCash(body) : await withdrawCash(body);
      setResult(`${tx.reference} · ${tx.status}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Transaction failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={title}
        actions={
          <Button variant="ghost" onClick={() => navigate("/teller")}>
            Close
          </Button>
        }
      />
      <form className="panel" style={{ maxWidth: 520 }} onSubmit={(e) => void onSubmit(e)}>
        <div style={{ display: "grid", gap: "0.9rem" }}>
          <TextField
            id="acct"
            label={accountLabel || (mode === "deposit" ? "Credit account" : "Debit account")}
            placeholder={NUBAN_PLACEHOLDER}
            inputMode="numeric"
            maxLength={NUBAN_LENGTH}
            value={account}
            onChange={(e) => setAccount(sanitizeNubanInput(e.target.value))}
            required
          />
          <TextField
            id="amt"
            label="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <TextField
            id="ccy"
            label="Currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            required
          />
          <TextField
            id="cheque"
            label="Cheque number (optional)"
            value={chequeNumber}
            onChange={(e) => setChequeNumber(e.target.value)}
          />
          <TextField
            id="narr"
            label="Narration"
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
          />
          <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
            <input type="checkbox" checked={ctr} onChange={(e) => setCtr(e.target.checked)} />
            <span className="field-label" style={{ margin: 0 }}>
              CTR acknowledged (large cash)
            </span>
          </label>
        </div>
        {error ? <div className="alert-error" style={{ marginTop: "1rem" }}>{error}</div> : null}
        {result ? (
          <p style={{ marginTop: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Posted: {result}
          </p>
        ) : null}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "1.25rem" }}>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Close
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Submitting…" : mode === "deposit" ? "Post deposit" : "Post withdrawal"}
          </Button>
        </div>
      </form>
    </div>
  );
}
