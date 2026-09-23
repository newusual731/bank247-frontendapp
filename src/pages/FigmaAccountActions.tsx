import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { getAccount, type Account } from "../api/accounts";
import { EXAMPLE_NUBAN, NUBAN_LENGTH, NUBAN_PLACEHOLDER, sanitizeNubanInput } from "../lib/nuban";
import {
  ConfirmRemoveModal,
  FigmaField,
  FigmaInput,
  FigmaSelect,
  REMOVE_MODAL,
  SUCCESS_MODAL,
  SuccessModal,
} from "../components/figma/FigmaForm";
import { FigmaCreatePanel, formatDate } from "../components/figma/FigmaHub";
import "../components/figma/FigmaForm.css";

type Prefill = {
  accountNumber: string;
  customerId: string;
  branchName: string;
  accountType: string;
  balance: string;
  batchId: string;
  from: string;
  back: string;
};

function useAccountPrefill(): Prefill {
  const [params] = useSearchParams();
  const from = params.get("from") || "accounts";
  return {
    accountNumber: params.get("accountNumber") || "",
    customerId: params.get("customerId") || "",
    branchName: params.get("branchName") || "",
    accountType: params.get("accountType") || "",
    balance: params.get("balance") || "",
    batchId: params.get("batchId") || "",
    from,
    back: from === "customers" ? "/customers" : from === "cheques" ? "/cheques" : "/accounts",
  };
}

type DetailForm = {
  accountNumber: string;
  branchCode: string;
  branchName: string;
  customerId: string;
  customerName: string;
  accountName: string;
  productType: string;
  currency: string;
  officer: string;
};

function blankDetail(pre: Prefill): DetailForm {
  return {
    accountNumber: pre.accountNumber || EXAMPLE_NUBAN,
    branchCode: pre.branchName || "HQ01",
    branchName: pre.branchName || "HQ01",
    customerId: pre.customerId || "",
    customerName: "",
    accountName: "",
    productType: pre.accountType || "",
    currency: "NGN",
    officer: "",
  };
}

function AccountDetailFields({
  form,
  set,
}: {
  form: DetailForm;
  set: (k: keyof DetailForm, v: string) => void;
}) {
  return (
    <>
      <FigmaField label="Account Number">
        <FigmaInput
          placeholder={NUBAN_PLACEHOLDER}
          inputMode="numeric"
          maxLength={NUBAN_LENGTH}
          value={form.accountNumber}
          onChange={(e) => set("accountNumber", sanitizeNubanInput(e.target.value))}
        />
      </FigmaField>
      <FigmaField label="Branch Code">
        <FigmaInput
          placeholder="Enter Branch Code"
          value={form.branchCode}
          onChange={(e) => set("branchCode", e.target.value)}
        />
      </FigmaField>
      <FigmaField label="Branch Name">
        <FigmaInput
          placeholder="Enter Branch Name"
          value={form.branchName}
          onChange={(e) => set("branchName", e.target.value)}
        />
      </FigmaField>
      <FigmaField label="Customer ID">
        <FigmaInput
          placeholder="Enter Customer ID"
          value={form.customerId}
          onChange={(e) => set("customerId", e.target.value)}
        />
      </FigmaField>
      <FigmaField label="Customer Full Name">
        <FigmaInput
          placeholder="Enter Customer Full Name"
          value={form.customerName}
          onChange={(e) => set("customerName", e.target.value)}
        />
      </FigmaField>
      <FigmaField label="Account Name">
        <FigmaInput
          placeholder="Enter Account Name"
          value={form.accountName}
          onChange={(e) => set("accountName", e.target.value)}
        />
      </FigmaField>
      <FigmaField label="Product type">
        <FigmaSelect value={form.productType} onChange={(e) => set("productType", e.target.value)}>
          <option value="">Select</option>
          <option>Savings Account</option>
          <option>Current Account</option>
          <option>Fixed Deposit</option>
        </FigmaSelect>
      </FigmaField>
      <FigmaField label="Currency">
        <FigmaSelect value={form.currency} onChange={(e) => set("currency", e.target.value)}>
          <option value="">Select</option>
          <option>NGN</option>
          <option>USD</option>
          <option>GBP</option>
          <option>EUR</option>
        </FigmaSelect>
      </FigmaField>
      <FigmaField label="Account Officer">
        <FigmaSelect value={form.officer} onChange={(e) => set("officer", e.target.value)}>
          <option value="">Select</option>
          <option>Babalola</option>
          <option>Oscar Micheal</option>
        </FigmaSelect>
      </FigmaField>
    </>
  );
}

function ReasonField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <FigmaField label="Reason">
      <textarea
        className="fg-control"
        style={{ height: 120, padding: "12px 14px", resize: "vertical" }}
        placeholder="Enter Reason"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </FigmaField>
  );
}

function SectionDivider() {
  return <hr style={{ border: 0, borderTop: "1px solid #e5e7eb", margin: "8px 0 16px" }} />;
}

function runMock(setBusy: (v: boolean) => void, setSuccess: (v: boolean) => void) {
  setBusy(true);
  window.setTimeout(() => {
    setBusy(false);
    setSuccess(true);
  }, 350);
}

/** Create-11 — Update Account */
export function UpdateAccountPage() {
  const navigate = useNavigate();
  const pre = useAccountPrefill();
  const [form, setForm] = useState(() => blankDetail(pre));
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const set = (k: keyof DetailForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <>
      <FigmaCreatePanel
        title="Update Account"
        subtitle="Update Account- Individual Account"
        onClose={() => navigate(pre.back)}
        submitLabel="Update Account"
        onSubmit={() => setConfirmOpen(true)}
        busy={busy}
      >
        <AccountDetailFields form={form} set={set} />
      </FigmaCreatePanel>
      {confirmOpen ? (
        <ConfirmRemoveModal
          {...REMOVE_MODAL.accountUpdate}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            runMock(setBusy, setSuccess);
          }}
          busy={busy}
        />
      ) : null}
      {success ? (
        <SuccessModal {...SUCCESS_MODAL.accountUpdated} onOkay={() => navigate(pre.back)} />
      ) : null}
    </>
  );
}

/** Activate Account */
export function ActivateAccountPage() {
  const navigate = useNavigate();
  const pre = useAccountPrefill();
  const [form, setForm] = useState(() => blankDetail(pre));
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const set = (k: keyof DetailForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <>
      <FigmaCreatePanel
        title="Activate Account"
        subtitle="Activate Account- Individual Account"
        onClose={() => navigate(pre.back)}
        submitLabel="Activate Account"
        onSubmit={() => runMock(setBusy, setSuccess)}
        busy={busy}
      >
        <AccountDetailFields form={form} set={set} />
        <ReasonField value={reason} onChange={setReason} />
      </FigmaCreatePanel>
      {success ? (
        <SuccessModal {...SUCCESS_MODAL.accountActivated} onOkay={() => navigate(pre.back)} />
      ) : null}
    </>
  );
}

/** Create-13 — Reactivate Account */
export function ReactivateAccountPage() {
  const navigate = useNavigate();
  const pre = useAccountPrefill();
  const [form, setForm] = useState(() => blankDetail(pre));
  const [dateSuspended, setDateSuspended] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const set = (k: keyof DetailForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <>
      <FigmaCreatePanel
        title="Reactivate Account"
        subtitle="Reactivate Account"
        onClose={() => navigate(pre.back)}
        submitLabel="Reactivate"
        onSubmit={() => setConfirmOpen(true)}
        busy={busy}
      >
        <AccountDetailFields form={form} set={set} />
        <FigmaField label="Date Suspended">
          <FigmaInput
            type="date"
            value={dateSuspended}
            onChange={(e) => setDateSuspended(e.target.value)}
          />
        </FigmaField>
        <ReasonField value={reason} onChange={setReason} />
      </FigmaCreatePanel>
      {confirmOpen ? (
        <ConfirmRemoveModal
          {...REMOVE_MODAL.accountReactivate}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            runMock(setBusy, setSuccess);
          }}
          busy={busy}
        />
      ) : null}
      {success ? (
        <SuccessModal {...SUCCESS_MODAL.accountReactivated} onOkay={() => navigate(pre.back)} />
      ) : null}
    </>
  );
}

/** Create-14 — Migrate Account - Branch */
export function MigrateAccountBranchPage() {
  const navigate = useNavigate();
  const pre = useAccountPrefill();
  const [form, setForm] = useState(() => blankDetail(pre));
  const [newBranch, setNewBranch] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const set = (k: keyof DetailForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <>
      <FigmaCreatePanel
        title="Migrate Account"
        subtitle="Migrate Account - Branch"
        onClose={() => navigate(pre.back)}
        submitLabel="Migrate Account"
        onSubmit={() => setConfirmOpen(true)}
        busy={busy}
      >
        <AccountDetailFields form={form} set={set} />
        <SectionDivider />
        <FigmaField label="New Branch">
          <FigmaSelect value={newBranch} onChange={(e) => setNewBranch(e.target.value)}>
            <option value="">Select</option>
            <option>HQ01 — Head Office</option>
            <option>BR02 — Ikeja</option>
            <option>BR03 — Victoria Island</option>
          </FigmaSelect>
        </FigmaField>
      </FigmaCreatePanel>
      {confirmOpen ? (
        <ConfirmRemoveModal
          {...REMOVE_MODAL.migrateBranch}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            runMock(setBusy, setSuccess);
          }}
          busy={busy}
        />
      ) : null}
      {success ? (
        <SuccessModal {...SUCCESS_MODAL.migrateBranch} onOkay={() => navigate(pre.back)} />
      ) : null}
    </>
  );
}

/** Create-15 — Migrate Account - Product */
export function MigrateAccountProductPage() {
  const navigate = useNavigate();
  const pre = useAccountPrefill();
  const [form, setForm] = useState(() => blankDetail(pre));
  const [newProduct, setNewProduct] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const set = (k: keyof DetailForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <>
      <FigmaCreatePanel
        title="Migrate Account- Product"
        subtitle="Migrate Account - Product"
        onClose={() => navigate(pre.back)}
        submitLabel="Migrate Account"
        onSubmit={() => setConfirmOpen(true)}
        busy={busy}
      >
        <AccountDetailFields form={form} set={set} />
        <SectionDivider />
        <FigmaField label="New Product">
          <FigmaInput
            placeholder="Enter New Product"
            value={newProduct}
            onChange={(e) => setNewProduct(e.target.value)}
          />
        </FigmaField>
      </FigmaCreatePanel>
      {confirmOpen ? (
        <ConfirmRemoveModal
          {...REMOVE_MODAL.migrateProduct}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            runMock(setBusy, setSuccess);
          }}
          busy={busy}
        />
      ) : null}
      {success ? (
        <SuccessModal {...SUCCESS_MODAL.migrateProduct} onOkay={() => navigate(pre.back)} />
      ) : null}
    </>
  );
}

/** Create-16 — Close Account */
export function CloseAccountPage() {
  const navigate = useNavigate();
  const pre = useAccountPrefill();
  const [form, setForm] = useState(() => blankDetail(pre));
  const [balance, setBalance] = useState(pre.balance || "₦0.00");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const set = (k: keyof DetailForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <>
      <FigmaCreatePanel
        title="Close Account"
        subtitle="Close Account"
        onClose={() => navigate(pre.back)}
        submitLabel="Close Account"
        onSubmit={() => setConfirmOpen(true)}
        busy={busy}
      >
        <AccountDetailFields form={form} set={set} />
        <FigmaField label="Account Balance">
          <FigmaInput
            placeholder="₦0.00"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
          />
        </FigmaField>
        <ReasonField value={reason} onChange={setReason} />
      </FigmaCreatePanel>
      {confirmOpen ? (
        <ConfirmRemoveModal
          {...REMOVE_MODAL.accountClose}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            runMock(setBusy, setSuccess);
          }}
          busy={busy}
        />
      ) : null}
      {success ? (
        <SuccessModal {...SUCCESS_MODAL.accountClosed} onOkay={() => navigate(pre.back)} />
      ) : null}
    </>
  );
}

/** Create-17 — Close Account - Transfer Balance */
export function CloseAccountBalancePage() {
  const navigate = useNavigate();
  const pre = useAccountPrefill();
  const [form, setForm] = useState(() => blankDetail(pre));
  const [accountBalance, setAccountBalance] = useState(pre.balance || "₦0.00");
  const [reason, setReason] = useState("");
  const [transferBalance, setTransferBalance] = useState(pre.balance || "₦0.00");
  const [narration, setNarration] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const set = (k: keyof DetailForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <>
      <FigmaCreatePanel
        title="Close Account - Transfer Balance"
        subtitle="Close Account - Transfer Balance"
        onClose={() => navigate(pre.back)}
        submitLabel="Close Account"
        onSubmit={() => setConfirmOpen(true)}
        busy={busy}
      >
        <AccountDetailFields form={form} set={set} />
        <FigmaField label="Account Balance">
          <FigmaInput
            placeholder="₦0.00"
            value={accountBalance}
            onChange={(e) => setAccountBalance(e.target.value)}
          />
        </FigmaField>
        <ReasonField value={reason} onChange={setReason} />
        <FigmaField label="Account Balance">
          <FigmaInput
            placeholder="₦0.00"
            value={transferBalance}
            onChange={(e) => setTransferBalance(e.target.value)}
          />
        </FigmaField>
        <FigmaField label="Narration">
          <textarea
            className="fg-control"
            style={{ height: 120, padding: "12px 14px", resize: "vertical" }}
            placeholder="Enter Narration"
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
          />
        </FigmaField>
      </FigmaCreatePanel>
      {confirmOpen ? (
        <ConfirmRemoveModal
          {...REMOVE_MODAL.closeBalance}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            runMock(setBusy, setSuccess);
          }}
          busy={busy}
        />
      ) : null}
      {success ? (
        <SuccessModal {...SUCCESS_MODAL.closeBalance} onOkay={() => navigate(pre.back)} />
      ) : null}
    </>
  );
}

export function ChequeViewBatchPage() {
  const navigate = useNavigate();
  const pre = useAccountPrefill();
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pre.accountNumber) return;
    let cancelled = false;
    (async () => {
      try {
        const acct = await getAccount(pre.accountNumber);
        if (!cancelled) setAccount(acct);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pre.accountNumber]);

  const [start, end] = (pre.batchId || "0-500").split("-");
  const fields: [string, string][] = [
    ["Branch Name", pre.branchName || account?.branchCode || "—"],
    ["Account Number", pre.accountNumber || account?.accountNumber || "—"],
    ["Account Type", pre.accountType || account?.productCode || "—"],
    ["Cheque Batch ID", pre.batchId || "—"],
    ["Start Serial", start || "0"],
    ["End Serial", end || "500"],
    ["Leaves", String(Math.max(1, Number(end || 500) - Number(start || 0) + 1))],
    ["Account Balance", pre.balance || "—"],
    ["Currency", account?.currency || "NGN"],
    ["Account Status", account?.status || "Active"],
    ["Date Opened", formatDate(account?.createdAt)],
    ["Product Code", account?.productCode || "—"],
    ["Customer ID", pre.customerId || account?.customerId || "—"],
  ];

  return (
    <div className="fg-hub">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <button
          type="button"
          className="cta"
          onClick={() => navigate("/cheques")}
          style={{ border: "none", background: "none", fontWeight: 700, fontSize: 16, padding: 0 }}
        >
          ← Back
        </button>
        <div className="fg-detail-actions" style={{ marginBottom: 0 }}>
          <button
            type="button"
            className="fg-btn fg-btn-primary cta"
            onClick={() =>
              navigate(
                `/cheques/upload?accountNumber=${encodeURIComponent(pre.accountNumber || "")}`,
              )
            }
          >
            Upload Series
          </button>
        </div>
      </div>
      <h1 style={{ marginTop: 0 }}>View Batch</h1>
      {error ? <p className="fg-error">{error}</p> : null}
      <div className="fg-tabs">
        <span>Overview</span>
      </div>
      <div className="fg-detail-grid">
        {fields.map(([label, value]) => (
          <div key={label} className="fg-detail-item">
            <div className="label">{label}</div>
            <div className="value">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function accountActionQuery(opts: {
  accountNumber: string;
  customerId?: string;
  branchName?: string;
  accountType?: string;
  balance?: string;
  batchId?: string;
  from?: "accounts" | "customers" | "cheques";
}) {
  const q = new URLSearchParams();
  q.set("accountNumber", opts.accountNumber);
  if (opts.customerId) q.set("customerId", opts.customerId);
  if (opts.branchName) q.set("branchName", opts.branchName);
  if (opts.accountType) q.set("accountType", opts.accountType);
  if (opts.balance) q.set("balance", opts.balance);
  if (opts.batchId) q.set("batchId", opts.batchId);
  if (opts.from) q.set("from", opts.from);
  return q.toString();
}
