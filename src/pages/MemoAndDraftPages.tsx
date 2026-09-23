import { useEffect, useState, type CSSProperties } from "react";
import { createMemo, releaseMemo, searchMemos, type AccountMemo } from "../api/memos";
import {
  cancelBankDraft,
  flagBankDraft,
  issueBankDraft,
  searchBankDrafts,
  settleBankDraft,
  type BankDraft,
} from "../api/drafts";
import { ApiError } from "../api/client";
import { ModuleScreen } from "../components/ModuleScreen";
import { Badge, Button, EmptyState, PageHeader, TextField } from "../components/ui";
import { NUBAN_LENGTH, NUBAN_PLACEHOLDER, sanitizeNubanInput } from "../lib/nuban";
import { formatMoney, statusTone } from "../lib/statusTone";

export function MemosPage() {
  const [rows, setRows] = useState<AccountMemo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tick, setTick] = useState(0);

  const [accountNumber, setAccountNumber] = useState("");
  const [memoType, setMemoType] = useState("GENERAL");
  const [severity, setSeverity] = useState("INFO");
  const [text, setText] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const page = await searchMemos({ size: 50 });
        if (!cancelled) {
          setRows(page.content || []);
          setTotal(page.totalElements ?? page.content?.length ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          setError(err instanceof ApiError ? err.message : "Unable to load memos");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  async function onCreate() {
    setCreating(true);
    setError(null);
    try {
      await createMemo(accountNumber.trim(), {
        memoType,
        severity,
        text: text.trim(),
      });
      setText("");
      setTick((n) => n + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create memo failed");
    } finally {
      setCreating(false);
    }
  }

  async function onRelease(id: string) {
    setError(null);
    try {
      await releaseMemo(id);
      setTick((n) => n + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Release failed");
    }
  }

  const q = search.trim().toLowerCase();
  const filtered = rows.filter((r) =>
    !q
      ? true
      : [r.accountNumber, r.branchCode, r.memoType, r.text, r.status].join(" ").toLowerCase().includes(q),
  );

  return (
    <div>
      <PageHeader title="Memo Management" />
      <div className="toolbar" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "flex-end", marginBottom: "1rem" }}>
        <TextField
          id="memo-acct"
          label="Account number"
          placeholder={NUBAN_PLACEHOLDER}
          inputMode="numeric"
          maxLength={NUBAN_LENGTH}
          value={accountNumber}
          onChange={(e) => setAccountNumber(sanitizeNubanInput(e.target.value))}
        />
        <label className="field" htmlFor="memo-type">
          <span className="field-label">Type</span>
          <select
            id="memo-type"
            className="field-input"
            value={memoType}
            onChange={(e) => setMemoType(e.target.value)}
          >
            {["GENERAL", "ALERT", "STOP", "VIP", "LEGAL"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="field" htmlFor="memo-sev">
          <span className="field-label">Severity</span>
          <select
            id="memo-sev"
            className="field-input"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
          >
            {["INFO", "WARNING", "CRITICAL"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <TextField id="memo-text" label="Memo" value={text} onChange={(e) => setText(e.target.value)} />
        <Button
          onClick={() => void onCreate()}
          disabled={creating || !accountNumber.trim() || !text.trim()}
        >
          {creating ? "Saving…" : "Create Memo"}
        </Button>
      </div>

      <ModuleScreen
        title="Active memos"
        search={search}
        onSearchChange={setSearch}
        loading={loading}
        error={error}
        emptyHint="Create an account memo above, or wait for records from account-service."
        columns={[
          { key: "branch", header: "Branch", render: (r) => r.branchCode },
          { key: "acct", header: "Account", render: (r) => r.accountNumber },
          { key: "type", header: "Type", render: (r) => r.memoType },
          { key: "memo", header: "Memo", render: (r) => r.text },
          {
            key: "status",
            header: "Status",
            render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>,
          },
          {
            key: "actions",
            header: "",
            render: (r) =>
              r.status === "ACTIVE" ? (
                <button
                  type="button"
                  className="cta"
                  style={{ color: "var(--brand-primary)", fontWeight: 650, background: "none", border: 0, cursor: "pointer" }}
                  onClick={() => void onRelease(r.id)}
                >
                  Release
                </button>
              ) : (
                "—"
              ),
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
    </div>
  );
}

export function BankDraftsPage() {
  const [tab, setTab] = useState("issue");
  const [rows, setRows] = useState<BankDraft[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tick, setTick] = useState(0);

  const [sourceAccount, setSourceAccount] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [branchCode, setBranchCode] = useState("");
  const [narration, setNarration] = useState("");
  const [issuing, setIssuing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const status =
          tab === "settle"
            ? "ISSUED"
            : tab === "cancel"
              ? undefined
              : tab === "flag"
                ? "ISSUED"
                : undefined;
        const page = await searchBankDrafts({ status, size: 50 });
        if (!cancelled) {
          setRows(page.content || []);
          setTotal(page.totalElements ?? page.content?.length ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          setError(err instanceof ApiError ? err.message : "Unable to load bank drafts");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [tab, tick]);

  async function onIssue() {
    setIssuing(true);
    setError(null);
    try {
      await issueBankDraft({
        sourceAccount: sourceAccount.trim(),
        beneficiaryName: beneficiaryName.trim(),
        amount: Number(amount),
        currency: currency.trim().toUpperCase(),
        branchCode: branchCode.trim() || undefined,
        narration: narration.trim() || undefined,
      });
      setBeneficiaryName("");
      setAmount("");
      setNarration("");
      setTick((n) => n + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Issue failed");
    } finally {
      setIssuing(false);
    }
  }

  async function act(kind: "settle" | "cancel" | "flag", draftNumber: string) {
    setError(null);
    try {
      if (kind === "settle") await settleBankDraft(draftNumber);
      if (kind === "cancel") await cancelBankDraft(draftNumber, "Cancelled from UI");
      if (kind === "flag") await flagBankDraft(draftNumber, "Flagged from UI");
      setTick((n) => n + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action failed");
    }
  }

  const q = search.trim().toLowerCase();
  const filtered = rows.filter((r) =>
    !q
      ? true
      : [r.draftNumber, r.beneficiaryName, r.sourceAccount, r.branchCode, r.status]
          .join(" ")
          .toLowerCase()
          .includes(q),
  );

  return (
    <div>
      <PageHeader title="Bank Drafts" />
      {tab === "issue" ? (
        <div className="toolbar" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "flex-end", marginBottom: "1rem" }}>
          <TextField
            id="bd-src"
            label="Source account"
            placeholder={NUBAN_PLACEHOLDER}
            inputMode="numeric"
            maxLength={NUBAN_LENGTH}
            value={sourceAccount}
            onChange={(e) => setSourceAccount(sanitizeNubanInput(e.target.value))}
          />
          <TextField
            id="bd-ben"
            label="Beneficiary"
            value={beneficiaryName}
            onChange={(e) => setBeneficiaryName(e.target.value)}
          />
          <TextField id="bd-amt" label="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <TextField
            id="bd-ccy"
            label="Currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          />
          <TextField
            id="bd-branch"
            label="Branch (optional)"
            value={branchCode}
            onChange={(e) => setBranchCode(e.target.value)}
          />
          <TextField
            id="bd-narr"
            label="Narration"
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
          />
          <Button
            onClick={() => void onIssue()}
            disabled={
              issuing || !sourceAccount.trim() || !beneficiaryName.trim() || !amount.trim() || !currency.trim()
            }
          >
            {issuing ? "Issuing…" : "Issue Bank Draft"}
          </Button>
        </div>
      ) : null}

      <ModuleScreen
        title="Drafts"
        tabs={[
          { id: "issue", label: "Issue" },
          { id: "settle", label: "Settle" },
          { id: "cancel", label: "Cancel" },
          { id: "flag", label: "Flag" },
        ]}
        activeTab={tab}
        onTabChange={setTab}
        search={search}
        onSearchChange={setSearch}
        loading={loading}
        error={error}
        emptyHint="Bank drafts from /api/v1/teller/drafts."
        emptyTitle={rows.length === 0 && !loading ? "No drafts yet" : undefined}
        columns={[
          { key: "no", header: "Draft No", render: (r) => r.draftNumber },
          { key: "ben", header: "Beneficiary", render: (r) => r.beneficiaryName },
          {
            key: "amt",
            header: "Amount",
            render: (r) => `${formatMoney(r.amount)} ${r.currency}`,
          },
          { key: "branch", header: "Branch", render: (r) => r.branchCode },
          {
            key: "status",
            header: "Status",
            render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>,
          },
          {
            key: "actions",
            header: "",
            render: (r) => {
              if (tab === "settle" && (r.status === "ISSUED" || r.status === "FLAGGED")) {
                return (
                  <button type="button" className="cta" style={linkBtn} onClick={() => void act("settle", r.draftNumber)}>
                    Settle / Repurchase
                  </button>
                );
              }
              if (tab === "cancel" && (r.status === "ISSUED" || r.status === "FLAGGED")) {
                return (
                  <button type="button" className="cta" style={linkBtn} onClick={() => void act("cancel", r.draftNumber)}>
                    Cancel
                  </button>
                );
              }
              if (tab === "flag" && r.status === "ISSUED") {
                return (
                  <button type="button" className="cta" style={linkBtn} onClick={() => void act("flag", r.draftNumber)}>
                    Flag
                  </button>
                );
              }
              return "—";
            },
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
      {tab === "issue" && filtered.length === 0 && !loading && !error ? (
        <div style={{ marginTop: "0.5rem" }}>
          <EmptyState title="No drafts yet" hint="Issue a bank draft using the form above." />
        </div>
      ) : null}
    </div>
  );
}

const linkBtn: CSSProperties = {
  color: "var(--brand-primary)",
  fontWeight: 650,
  background: "none",
  border: 0,
  cursor: "pointer",
};
