import { useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { intraBankTransfer, internalTransfer, reverseTransaction } from "../api/transfers";
import { createGlAccount, reverseLedgerPosting } from "../api/ledger";
import { openAccount, createCasaProduct } from "../api/accounts";
import { createLoan } from "../api/loans";
import { Button, PageHeader, TextField } from "../components/ui";
import { NUBAN_LENGTH, NUBAN_PLACEHOLDER, sanitizeNubanInput } from "../lib/nuban";

function useFormState() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  return { navigate, busy, setBusy, error, setError, result, setResult };
}

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
      <form className="panel" style={{ maxWidth: 560 }} onSubmit={onSubmit}>
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

export function TransferPage({ mode }: { mode: "customer" | "internal" }) {
  const { busy, setBusy, error, setError, result, setResult } = useFormState();
  const [source, setSource] = useState("");
  const [dest, setDest] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [narration, setNarration] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "customer") {
        const ref = `TRF-${crypto.randomUUID().slice(0, 8)}`;
        const r = await intraBankTransfer({
          sourceAccount: source.trim(),
          destinationAccount: dest.trim(),
          amount: Number(amount),
          currency: currency.toUpperCase(),
          transactionReference: ref,
          narration: narration || undefined,
        });
        setResult(`${r.transactionReference || ref} · ${r.status || "OK"}`);
      } else {
        const r = await internalTransfer({
          sourceAccount: source.trim(),
          destinationAccount: dest.trim(),
          amount: Number(amount),
          currency: currency.toUpperCase(),
          narration: narration || undefined,
        });
        setResult(`${r.reference || r.id || "OK"} · ${r.status || "OK"}`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Transfer failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PanelForm
      title={mode === "customer" ? "Customer account transfer" : "Internal account transfer"}
      onSubmit={(e) => void onSubmit(e)}
      busy={busy}
      error={error}
      result={result}
    >
      <TextField id="src" label="Source account" value={source} onChange={(e) => setSource(e.target.value)} required />
      <TextField id="dst" label="Destination account" value={dest} onChange={(e) => setDest(e.target.value)} required />
      <TextField id="amt" label="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      <TextField id="ccy" label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} required />
      <TextField id="narr" label="Narration" value={narration} onChange={(e) => setNarration(e.target.value)} />
    </PanelForm>
  );
}

export function ReverseEntryPage() {
  const { busy, setBusy, error, setError, result, setResult } = useFormState();
  const [reference, setReference] = useState("");
  const [kind, setKind] = useState<"ledger" | "transaction">("ledger");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (kind === "ledger") {
        const r = await reverseLedgerPosting(reference.trim());
        setResult(`Ledger reverse · ${r.reference || reference} · ${r.status || "OK"}`);
      } else {
        const r = await reverseTransaction(reference.trim());
        setResult(`Txn reverse · ${r.reference || reference} · ${r.status || "OK"}`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reverse failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PanelForm title="Reverse entry" onSubmit={(e) => void onSubmit(e)} busy={busy} error={error} result={result}>
      <label className="field" htmlFor="kind">
        <span className="field-label">Type</span>
        <select id="kind" className="field-input" value={kind} onChange={(e) => setKind(e.target.value as "ledger" | "transaction")}>
          <option value="ledger">Ledger posting</option>
          <option value="transaction">Account transaction</option>
        </select>
      </label>
      <TextField id="ref" label="Reference" value={reference} onChange={(e) => setReference(e.target.value)} required />
    </PanelForm>
  );
}

export function GlCreatePage() {
  const { busy, setBusy, error, setError, result, setResult } = useFormState();
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [nature, setNature] = useState("ASSET");
  const [parentCode, setParentCode] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [postable, setPostable] = useState(true);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const gl = await createGlAccount({
        code: code.trim().toUpperCase(),
        description: description.trim(),
        nature,
        parentCode: parentCode.trim().toUpperCase() || undefined,
        currency: currency.toUpperCase(),
        postable,
      });
      setResult(`Created ${gl.code} · ${gl.status}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "GL create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PanelForm title="GL Creation" onSubmit={(e) => void onSubmit(e)} busy={busy} error={error} result={result}>
      <TextField id="code" label="GL code" value={code} onChange={(e) => setCode(e.target.value)} required />
      <TextField id="desc" label="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
      <label className="field" htmlFor="nature">
        <span className="field-label">Nature</span>
        <select id="nature" className="field-input" value={nature} onChange={(e) => setNature(e.target.value)}>
          {["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </label>
      <TextField id="parent" label="Parent code (optional)" value={parentCode} onChange={(e) => setParentCode(e.target.value)} />
      <TextField id="ccy" label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} />
      <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
        <input type="checkbox" checked={postable} onChange={(e) => setPostable(e.target.checked)} />
        <span className="field-label" style={{ margin: 0 }}>Postable</span>
      </label>
    </PanelForm>
  );
}

export function AccountOpenPage() {
  const { navigate, busy, setBusy, error, setError, result, setResult } = useFormState();
  const [customerId, setCustomerId] = useState("");
  const [productCode, setProductCode] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [branchCode, setBranchCode] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const acct = await openAccount({
        customerId: customerId.trim(),
        productCode: productCode.trim().toUpperCase(),
        currency: currency.toUpperCase(),
        branchCode: branchCode.trim().toUpperCase(),
      });
      setResult(`${acct.accountNumber} · ${acct.status}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Open account failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PanelForm title="Open account" onSubmit={(e) => void onSubmit(e)} busy={busy} error={error} result={result}>
      <TextField id="cust" label="Customer ID (UUID)" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required />
      <TextField id="prod" label="Product code" value={productCode} onChange={(e) => setProductCode(e.target.value)} required />
      <TextField id="ccy" label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} required />
      <TextField id="branch" label="Branch code" value={branchCode} onChange={(e) => setBranchCode(e.target.value)} required />
      {result ? (
        <Button type="button" variant="secondary" onClick={() => navigate("/accounts")}>
          Go to accounts
        </Button>
      ) : null}
    </PanelForm>
  );
}

export function ProductCreatePage() {
  const { busy, setBusy, error, setError, result, setResult } = useFormState();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState("SAVINGS");
  const [currency, setCurrency] = useState("NGN");
  const [minimumBalance, setMinimumBalance] = useState("0");
  const [rate, setRate] = useState("0");
  const [interestGl, setInterestGl] = useState("");
  const [chargeGl, setChargeGl] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const p = await createCasaProduct({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        accountType,
        currency: currency.toUpperCase(),
        minimumBalance: Number(minimumBalance),
        annualInterestRate: Number(rate) || undefined,
        interestExpenseLedgerAccount: interestGl.trim() || undefined,
        chargeIncomeLedgerAccount: chargeGl.trim() || undefined,
      });
      setResult(`${p.code} · ${p.status}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Product create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PanelForm title="Product setup — create CASA" onSubmit={(e) => void onSubmit(e)} busy={busy} error={error} result={result}>
      <TextField id="code" label="Code" value={code} onChange={(e) => setCode(e.target.value)} required />
      <TextField id="name" label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <label className="field" htmlFor="atype">
        <span className="field-label">Account type</span>
        <select id="atype" className="field-input" value={accountType} onChange={(e) => setAccountType(e.target.value)}>
          {["SAVINGS", "CURRENT", "FIXED_DEPOSIT"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </label>
      <TextField id="ccy" label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} required />
      <TextField id="min" label="Minimum balance" value={minimumBalance} onChange={(e) => setMinimumBalance(e.target.value)} />
      <TextField id="rate" label="Annual interest rate" value={rate} onChange={(e) => setRate(e.target.value)} />
      <TextField id="igl" label="Interest expense GL" value={interestGl} onChange={(e) => setInterestGl(e.target.value)} />
      <TextField id="cgl" label="Charge income GL" value={chargeGl} onChange={(e) => setChargeGl(e.target.value)} />
    </PanelForm>
  );
}

export function LoanCreatePage() {
  const { busy, setBusy, error, setError, result, setResult } = useFormState();
  const [customerId, setCustomerId] = useState("");
  const [productCode, setProductCode] = useState("");
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [tenor, setTenor] = useState("12");
  const [purpose, setPurpose] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const loan = await createLoan({
        applicationReference: `LA-${crypto.randomUUID().slice(0, 10)}`,
        customerId: customerId.trim(),
        productCode: productCode.trim().toUpperCase(),
        disbursementAccount: account.trim(),
        amount: Number(amount),
        tenorMonths: Number(tenor),
        applicationDate: new Date().toISOString().slice(0, 10),
        purpose: purpose.trim() || undefined,
      });
      setResult(`${loan.loanNumber} · ${loan.status}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Loan create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PanelForm title="Add loan contract" onSubmit={(e) => void onSubmit(e)} busy={busy} error={error} result={result}>
      <TextField id="cust" label="Customer ID" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required />
      <TextField id="prod" label="Product code" value={productCode} onChange={(e) => setProductCode(e.target.value)} required />
      <TextField id="acct" label="Disbursement account" value={account} onChange={(e) => setAccount(e.target.value)} required />
      <TextField id="amt" label="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      <TextField id="tenor" label="Tenor (months)" value={tenor} onChange={(e) => setTenor(e.target.value)} required />
      <TextField id="purpose" label="Purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
    </PanelForm>
  );
}
