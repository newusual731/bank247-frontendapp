import { useState, type FormEvent, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ApiError } from "../api/client";
import {
  applyLien,
  applyReleaseLien,
  createRestriction,
  placeLien,
  releaseLien,
  releaseRestriction,
} from "../api/accounts";
import { Button, PageHeader, TextField } from "../components/ui";
import { ConfirmRemoveModal, REMOVE_MODAL, SUCCESS_MODAL, SuccessModal } from "../components/figma/FigmaForm";
import { NUBAN_LENGTH, NUBAN_PLACEHOLDER, sanitizeNubanInput } from "../lib/nuban";
import "../components/figma/FigmaForm.css";
import "../components/ui.css";

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

export function BlockFundsPage() {
  const [params] = useSearchParams();
  const [accountNumber, setAccountNumber] = useState(params.get("account") || "");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState(`LIEN-${Date.now().toString(36).toUpperCase()}`);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const placed = await placeLien(accountNumber.trim(), {
        amount: Number(amount),
        reason: reason.trim(),
        reference: reference.trim(),
      });
      try {
        const applied = await applyLien(placed.id);
        setResult(`Lien ${applied.id.slice(0, 8)} · ${applied.status}`);
      } catch {
        setResult(`Lien ${placed.id.slice(0, 8)} · ${placed.status} (pending apply)`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Block funds failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PanelForm title="Block Funds" onSubmit={(e) => void onSubmit(e)} busy={busy} error={error} result={result}>
      <TextField
        id="acct"
        label="Account number"
        placeholder={NUBAN_PLACEHOLDER}
        inputMode="numeric"
        maxLength={NUBAN_LENGTH}
        value={accountNumber}
        onChange={(e) => setAccountNumber(sanitizeNubanInput(e.target.value))}
        required
      />
      <TextField id="amt" label="Amount" type="number" min={0.0001} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      <TextField id="reason" label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} required />
      <TextField id="ref" label="Reference" value={reference} onChange={(e) => setReference(e.target.value)} required />
    </PanelForm>
  );
}

export function ReleaseLienPage() {
  const [params] = useSearchParams();
  const [lienId, setLienId] = useState(params.get("id") || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const released = await releaseLien(lienId.trim());
      try {
        const applied = await applyReleaseLien(released.id);
        setResult(`Released · ${applied.status}`);
      } catch {
        setResult(`Release requested · ${released.status}`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Release failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PanelForm title="Release block funds" onSubmit={(e) => void onSubmit(e)} busy={busy} error={error} result={result}>
      <TextField id="lien" label="Lien ID" value={lienId} onChange={(e) => setLienId(e.target.value)} required />
    </PanelForm>
  );
}

const RESTRICTION_TYPES = ["NO_DEBIT", "NO_CREDIT", "NO_POSTING", "COURT_ORDER"];

export function RestrictionCreatePage() {
  const [params] = useSearchParams();
  const [accountNumber, setAccountNumber] = useState(params.get("account") || "");
  const [restrictionType, setRestrictionType] = useState("NO_DEBIT");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const row = await createRestriction(accountNumber.trim(), {
        restrictionType,
        reason: reason.trim(),
      });
      setResult(`Restriction ${row.id.slice(0, 8)} · ${row.status}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create restriction failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PanelForm
      title="Restriction Management — Create"
      onSubmit={(e) => void onSubmit(e)}
      busy={busy}
      error={error}
      result={result}
    >
      <TextField
        id="acct"
        label="Account number"
        placeholder={NUBAN_PLACEHOLDER}
        inputMode="numeric"
        maxLength={NUBAN_LENGTH}
        value={accountNumber}
        onChange={(e) => setAccountNumber(sanitizeNubanInput(e.target.value))}
        required
      />
      <label className="field" htmlFor="rtype">
        <span className="field-label">Restriction type</span>
        <select id="rtype" className="field-input" value={restrictionType} onChange={(e) => setRestrictionType(e.target.value)}>
          {RESTRICTION_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </label>
      <TextField id="reason" label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} required />
    </PanelForm>
  );
}

export function RestrictionReleasePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [restrictionId, setRestrictionId] = useState(params.get("id") || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(Boolean(params.get("id")));
  const [deleted, setDeleted] = useState(false);

  async function onConfirm() {
    const id = restrictionId.trim();
    if (!id) {
      setError("Restriction ID is required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await releaseRestriction(id);
      setConfirmOpen(false);
      setDeleted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Remove restriction failed");
    } finally {
      setBusy(false);
    }
  }

  function closeAll() {
    navigate("/restrictions");
  }

  return (
    <div className="fg-hub fg-release-shell">
      <h1>Account Restriction Management</h1>
      <p className="fg-release-hint">Confirm removal of the account restriction.</p>
      {error ? <p className="fg-error">{error}</p> : null}

      {!deleted && !params.get("id") ? (
        <div className="fg-release-id" style={{ maxWidth: 420, marginBottom: 16 }}>
          <label className="field">
            <span className="field-label">Restriction ID</span>
            <input
              className="field-input"
              value={restrictionId}
              onChange={(e) => setRestrictionId(e.target.value)}
              placeholder="Enter Restriction ID"
            />
          </label>
          <button
            type="button"
            className="fg-btn fg-btn-primary cta"
            style={{ marginTop: 12 }}
            onClick={() => {
              if (!restrictionId.trim()) {
                setError("Restriction ID is required");
                return;
              }
              setError(null);
              setConfirmOpen(true);
            }}
          >
            Continue
          </button>
        </div>
      ) : null}

      {confirmOpen && !deleted ? (
        <ConfirmRemoveModal
          {...REMOVE_MODAL.restriction}
          onCancel={closeAll}
          onConfirm={() => void onConfirm()}
          busy={busy}
        />
      ) : null}

      {deleted ? (
        <SuccessModal {...SUCCESS_MODAL.restrictionDeleted} onOkay={closeAll} />
      ) : null}
    </div>
  );
}
