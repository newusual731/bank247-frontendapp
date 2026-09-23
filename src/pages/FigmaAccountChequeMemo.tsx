import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { searchCustomers, type Customer } from "../api/customers";
import { issueChequeBook, openAccount } from "../api/accounts";
import { createMemo } from "../api/memos";
import {
  ConfirmRemoveModal,
  FigmaDate,
  FigmaField,
  FigmaInput,
  FigmaSelect,
  REMOVE_MODAL,
  SUCCESS_MODAL,
  SuccessModal,
} from "../components/figma/FigmaForm";
import { FigmaCreatePanel, formatDate } from "../components/figma/FigmaHub";
import { accountActionQuery } from "./FigmaAccountActions";
import { RowActionCell } from "./FigmaRemainingPages";
import { demoNuban, NUBAN_LENGTH, NUBAN_PLACEHOLDER, isValidNuban, sanitizeNubanInput } from "../lib/nuban";
import "../components/figma/FigmaForm.css";
import "./LoginPage.css";

const TABS = [
  { id: "INDIVIDUAL", label: "Individual" },
  { id: "MINOR", label: "Minor - Individual" },
  { id: "CORPORATE", label: "Non-Individual" },
  { id: "INTERNAL", label: "Internal Record" },
  { id: "GOVERNMENT", label: "Government Record" },
] as const;

const ACCOUNT_TYPES = [
  "Fixed Deposit",
  "Savings Account",
  "Current Account",
  "Loan Account",
  "Placement",
  "Treasury Bill",
] as const;

type DetailRow = {
  id: string;
  branchName: string;
  accountNumber: string;
  accountType: string;
  openDate: string;
  chequeBatchId: string;
  balance: string;
  memoLabel?: string;
};

function statusClass(status: string) {
  if (status === "ACTIVE") return "ok";
  if (status === "DEACTIVATED" || status === "INACTIVE" || status === "CLOSED") return "bad";
  return "neutral";
}

function customerLabel(c: Customer) {
  return c.displayName || [c.firstName, c.lastName].filter(Boolean).join(" ") || "—";
}

function detailRowsFor(c: Customer | null): DetailRow[] {
  if (!c) return [];
  const branch = c.branchCode || "123-Ikeja Top";
  const name = customerLabel(c);
  const date = formatDate(c.createdAt);
  const digits = (c.cifNumber || c.id).replace(/\D/g, "");
  const base = Number(digits.slice(-3) || "0");
  return [0, 1, 2, 3].map((i) => ({
    id: String(i + 1),
    branchName: branch,
    accountNumber: demoNuban(base + i),
    accountType: name,
    openDate: date,
    chequeBatchId: `${i * 500}-${(i + 1) * 500}`,
    balance: "N23,989",
    memoLabel: ["Inactive Account", "Policy Violation", "Fraudulent Activity", "Payment Issue"][i],
  }));
}

function useCustomerSearch(opts: {
  query: string;
  tab?: (typeof TABS)[number]["id"];
  filterByTab?: boolean;
}) {
  const [rows, setRows] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const apiType =
          opts.filterByTab && opts.tab
            ? opts.tab === "INDIVIDUAL" || opts.tab === "MINOR"
              ? "INDIVIDUAL"
              : "CORPORATE"
            : undefined;
        const page = await searchCustomers({
          name: opts.query.trim() || undefined,
          type: apiType,
          page: 0,
          size: 20,
        });
        if (!cancelled) {
          const list = page.content || [];
          setRows(list);
          setTotal(page.totalElements ?? list.length);
          setSelected(list[0] ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          setSelected(null);
          setTotal(0);
          setError(err instanceof ApiError ? err.message : "Unable to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    const t = window.setTimeout(load, opts.query ? 280 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [opts.query, opts.tab, opts.filterByTab]);

  return { rows, selected, setSelected, loading, error, total };
}

function CustomerTopTable({
  loading,
  rows,
  selected,
  onSelect,
}: {
  loading: boolean;
  rows: Customer[];
  selected: Customer | null;
  onSelect: (c: Customer) => void;
}) {
  return (
    <div className="fg-table-wrap fg-hub-top">
      <table className="fg-table">
        <thead>
          <tr>
            <th>Customer Number</th>
            <th>Branch Name</th>
            <th>Customer type</th>
            <th>Customer Name</th>
            <th>Status</th>
            <th>Date Created</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6}>Loading…</td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ color: "#9ca3af" }}>
                No customers found — search by name or ID
              </td>
            </tr>
          ) : (
            rows.map((c) => (
              <tr
                key={c.id}
                style={{ cursor: "pointer", background: selected?.id === c.id ? "#fff8f5" : undefined }}
                onClick={() => onSelect(c)}
              >
                <td>
                  <Link to={`/customers/${c.id}`}>{c.cifNumber || c.id.slice(0, 8)}</Link>
                </td>
                <td>{c.branchCode}</td>
                <td>{c.type === "INDIVIDUAL" ? "Individual" : "Non-Individual"}</td>
                <td>{customerLabel(c)}</td>
                <td>
                  <span className={`fg-badge ${statusClass(c.status)}`}>
                    {c.status === "ACTIVE" ? "Active" : c.status}
                  </span>
                </td>
                <td>{formatDate(c.createdAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function HubPager({ total, count }: { total: number; count: number }) {
  return (
    <div className="fg-pager">
      <span>
        Show Records
        <select defaultValue="20" aria-label="Page size">
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
      </span>
      <span>
        Showing 1 - {Math.min(20, count || total)} of {total}
        <span className="fg-pager-arrows" aria-hidden>
          ‹ ›
        </span>
      </span>
    </div>
  );
}

/* ───────────── Account Management ───────────── */

export function AccountManagementFigmaPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("INTERNAL");
  const [query, setQuery] = useState("");
  const { rows, selected, setSelected, loading, error, total } = useCustomerSearch({
    query,
    tab,
    filterByTab: true,
  });
  const details = detailRowsFor(selected);

  return (
    <div className="fg-hub">
      <h1>Account Management</h1>
      <div className="fg-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`fg-tab cta${tab === t.id ? " active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="fg-hub-toolbar">
        <input
          className="fg-search"
          placeholder="Search by name, ID"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search"
        />
        <button
          type="button"
          className="fg-btn fg-btn-primary cta"
          onClick={() =>
            navigate(selected ? `/accounts/create?customerId=${encodeURIComponent(selected.id)}` : "/accounts/create")
          }
        >
          Create Account
        </button>
      </div>
      {error ? <p className="fg-error">{error}</p> : null}
      <CustomerTopTable loading={loading} rows={rows} selected={selected} onSelect={setSelected} />
      <div className="fg-table-wrap">
        <table className="fg-table peach">
          <thead>
            <tr>
              <th>Branch Name</th>
              <th>Account Number</th>
              <th>Account Type</th>
              <th>Account Open Date</th>
              <th>Cheque Batch ID</th>
              <th>Account Balance</th>
              <th aria-label="actions" />
            </tr>
          </thead>
          <tbody>
            {details.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ color: "#9ca3af" }}>
                  Select a customer to view accounts
                </td>
              </tr>
            ) : (
              details.map((d) => (
                <tr key={d.id}>
                  <td>{d.branchName}</td>
                  <td>{d.accountNumber}</td>
                  <td>{d.accountType}</td>
                  <td>{d.openDate}</td>
                  <td>{d.chequeBatchId}</td>
                  <td>{d.balance}</td>
                  <RowActionCell
                    items={[
                      {
                        label: "Update Account",
                        onClick: () =>
                          navigate(
                            `/accounts/update?${accountActionQuery({
                              accountNumber: d.accountNumber,
                              customerId: selected!.id,
                              branchName: d.branchName,
                              accountType: d.accountType,
                              balance: d.balance,
                              from: "accounts",
                            })}`,
                          ),
                      },
                      {
                        label: "Activate Account",
                        onClick: () =>
                          navigate(
                            `/accounts/activate?${accountActionQuery({
                              accountNumber: d.accountNumber,
                              customerId: selected!.id,
                              branchName: d.branchName,
                              accountType: d.accountType,
                              balance: d.balance,
                              from: "accounts",
                            })}`,
                          ),
                      },
                      {
                        label: "Reactivate Account",
                        onClick: () =>
                          navigate(
                            `/accounts/reactivate?${accountActionQuery({
                              accountNumber: d.accountNumber,
                              customerId: selected!.id,
                              branchName: d.branchName,
                              accountType: d.accountType,
                              balance: d.balance,
                              from: "accounts",
                            })}`,
                          ),
                      },
                      {
                        label: "Migrate Account - Branch",
                        onClick: () =>
                          navigate(
                            `/accounts/migrate-branch?${accountActionQuery({
                              accountNumber: d.accountNumber,
                              customerId: selected!.id,
                              branchName: d.branchName,
                              accountType: d.accountType,
                              from: "accounts",
                            })}`,
                          ),
                      },
                      {
                        label: "Migrate Account - Product",
                        onClick: () =>
                          navigate(
                            `/accounts/migrate-product?${accountActionQuery({
                              accountNumber: d.accountNumber,
                              customerId: selected!.id,
                              branchName: d.branchName,
                              accountType: d.accountType,
                              from: "accounts",
                            })}`,
                          ),
                      },
                      {
                        label: "Close Account - Balance",
                        onClick: () =>
                          navigate(
                            `/accounts/close-balance?${accountActionQuery({
                              accountNumber: d.accountNumber,
                              customerId: selected!.id,
                              branchName: d.branchName,
                              balance: d.balance,
                              from: "accounts",
                            })}`,
                          ),
                        tone: "warn",
                      },
                      {
                        label: "Close Account",
                        onClick: () =>
                          navigate(
                            `/accounts/close?${accountActionQuery({
                              accountNumber: d.accountNumber,
                              customerId: selected!.id,
                              branchName: d.branchName,
                              from: "accounts",
                            })}`,
                          ),
                        tone: "warn",
                      },
                    ]}
                  />
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <HubPager total={total} count={rows.length} />
    </div>
  );
}

/* ───────────── Create Account ───────────── */

export function AccountTypeSelectPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const customerId = params.get("customerId") || "";
  const [active, setActive] = useState<string>(ACCOUNT_TYPES[1]);

  return (
    <div className="fg-type-page">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button type="button" className="fg-close cta" onClick={() => navigate("/accounts")} aria-label="Close">
          ×
        </button>
        <h1 className="fg-wizard-title">Create Account</h1>
      </div>
      <div className="fg-type-menu">
        {ACCOUNT_TYPES.map((label) => (
          <button
            key={label}
            type="button"
            className={`fg-type-option cta${active === label ? " active" : ""}`}
            onMouseEnter={() => setActive(label)}
            onFocus={() => setActive(label)}
            onClick={() =>
              navigate(
                `/accounts/create/form?type=${encodeURIComponent(label)}${
                  customerId ? `&customerId=${encodeURIComponent(customerId)}` : ""
                }`,
              )
            }
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CreateAccountFigmaPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const accountType = params.get("type") || "Savings Account";
  const [customerId, setCustomerId] = useState(params.get("customerId") || "");
  const [branchCode, setBranchCode] = useState("HQ01");
  const [currency, setCurrency] = useState("NGN");
  const [productCode, setProductCode] = useState(
    accountType.includes("Current") ? "CURRENT" : accountType.includes("Loan") ? "LOAN" : "SAVINGS",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function submit() {
    if (!customerId.trim()) {
      setError("Customer ID is required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const acct = await openAccount({
        customerId: customerId.trim(),
        productCode: productCode.trim().toUpperCase(),
        currency,
        branchCode: branchCode.trim().toUpperCase(),
      });
      setSuccess(acct.accountNumber);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create account failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <FigmaCreatePanel
        title="Create Account"
        onClose={() => navigate("/accounts/create")}
        onSubmit={() => {
          if (!customerId.trim()) {
            setError("Customer ID is required");
            return;
          }
          setConfirmOpen(true);
        }}
        submitLabel="Create Account"
        clearLabel="Close"
        busy={busy}
        error={error}
      >
        <FigmaField label="Account Type">
          <FigmaInput value={accountType} readOnly />
        </FigmaField>
        <FigmaField label="Customer ID">
          <FigmaInput placeholder="Enter Customer ID" value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
        </FigmaField>
        <FigmaField label="Branch">
          <FigmaSelect value={branchCode} onChange={(e) => setBranchCode(e.target.value)}>
            <option value="HQ01">HQ01</option>
            <option value="HQ">HQ</option>
          </FigmaSelect>
        </FigmaField>
        <FigmaField label="Product Code">
          <FigmaInput placeholder="Enter Product Code" value={productCode} onChange={(e) => setProductCode(e.target.value)} />
        </FigmaField>
        <FigmaField label="Currency">
          <FigmaSelect value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="NGN">NGN</option>
            <option value="USD">USD</option>
          </FigmaSelect>
        </FigmaField>
      </FigmaCreatePanel>
      {confirmOpen ? (
        <ConfirmRemoveModal
          {...REMOVE_MODAL.accountNumber}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            void submit();
          }}
          busy={busy}
        />
      ) : null}
      {success ? (
        <SuccessModal
          {...SUCCESS_MODAL.accountGenerated}
          message={success}
          onOkay={() => navigate("/accounts")}
        />
      ) : null}
    </>
  );
}

/* ───────────── Cheque Management ───────────── */

export function ChequeManagementPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { rows, selected, setSelected, loading, error, total } = useCustomerSearch({ query });
  const details = detailRowsFor(selected);

  return (
    <div className="fg-hub">
      <h1>Cheque Management</h1>
      <div className="fg-hub-toolbar">
        <input
          className="fg-search"
          placeholder="Search by name, ID"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search"
        />
        <button type="button" className="fg-upload-link cta" onClick={() => navigate("/cheques/upload")}>
          <span className="fg-upload-icon" aria-hidden>
            ↑
          </span>{" "}
          Create/ Upload Series
        </button>
      </div>
      {error ? <p className="fg-error">{error}</p> : null}
      <CustomerTopTable loading={loading} rows={rows} selected={selected} onSelect={setSelected} />
      <div className="fg-table-wrap">
        <table className="fg-table peach">
          <thead>
            <tr>
              <th>Branch Name</th>
              <th>Account Number</th>
              <th>Account Type</th>
              <th>Account Open Date</th>
              <th>Cheque Batch ID</th>
              <th>Account Balance</th>
              <th aria-label="actions" />
            </tr>
          </thead>
          <tbody>
            {details.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ color: "#9ca3af" }}>
                  Search a customer to view cheque batches
                </td>
              </tr>
            ) : (
              details.map((d) => (
                <tr key={d.id}>
                  <td>{d.branchName}</td>
                  <td>{d.accountNumber}</td>
                  <td>{d.accountType}</td>
                  <td>{d.openDate}</td>
                  <td>{d.chequeBatchId}</td>
                  <td>{d.balance}</td>
                  <RowActionCell
                    items={[
                      {
                        label: "Upload Series",
                        onClick: () =>
                          navigate(`/cheques/upload?accountNumber=${encodeURIComponent(d.accountNumber)}`),
                      },
                      {
                        label: "View Batch",
                        onClick: () =>
                          navigate(
                            `/cheques/batch?${accountActionQuery({
                              accountNumber: d.accountNumber,
                              customerId: selected?.id,
                              branchName: d.branchName,
                              accountType: d.accountType,
                              balance: d.balance,
                              batchId: d.chequeBatchId,
                              from: "cheques",
                            })}`,
                          ),
                      },
                      {
                        label: "Stop Single Cheque",
                        onClick: () =>
                          navigate(`/cheques/stop-single?accountNumber=${encodeURIComponent(d.accountNumber)}`),
                      },
                      {
                        label: "Stop Multiple Cheques",
                        onClick: () =>
                          navigate(`/cheques/stop-multiple?accountNumber=${encodeURIComponent(d.accountNumber)}`),
                      },
                      {
                        label: "View Stopped Cheque",
                        onClick: () =>
                          navigate(`/cheques/stop-view?accountNumber=${encodeURIComponent(d.accountNumber)}`),
                      },
                    ]}
                  />
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <HubPager total={total} count={rows.length} />
    </div>
  );
}

export function ChequeUploadPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [accountNumber, setAccountNumber] = useState(params.get("accountNumber") || "");
  const [startSerial, setStartSerial] = useState("");
  const [endSerial, setEndSerial] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit() {
    if (!isValidNuban(accountNumber)) {
      setError("Enter a valid 10-digit NUBAN account number");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const start = startSerial.trim() || "0";
      const end = endSerial.trim() || "500";
      const leaves = Math.max(1, Number(end) - Number(start) + 1) || 500;
      await issueChequeBook(accountNumber.trim(), {
        startNumber: start,
        endNumber: end,
        leaves,
      });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setSuccess(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <FigmaCreatePanel
        title="Cheque Series Upload"
        onClose={() => navigate("/cheques")}
        onSubmit={() => void submit()}
        submitLabel="Upload"
        clearLabel="Close"
        busy={busy}
        error={error}
      >
        <FigmaField label="Account Number">
          <FigmaInput
            placeholder={NUBAN_PLACEHOLDER}
            inputMode="numeric"
            maxLength={NUBAN_LENGTH}
            value={accountNumber}
            onChange={(e) => setAccountNumber(sanitizeNubanInput(e.target.value))}
          />
        </FigmaField>
        <FigmaField label="Start Serial">
          <FigmaInput placeholder="Enter" value={startSerial} onChange={(e) => setStartSerial(e.target.value)} />
        </FigmaField>
        <FigmaField label="End Serial">
          <FigmaInput placeholder="Enter" value={endSerial} onChange={(e) => setEndSerial(e.target.value)} />
        </FigmaField>
        <div className="fg-upload-drop">
          <div style={{ fontSize: 28, marginBottom: 8 }}>↑</div>
          Upload cheque series file (CSV / XLSX)
        </div>
      </FigmaCreatePanel>
      {success ? (
        <SuccessModal
          title="Generation Successful"
          message="Cheque series has been uploaded successfully"
          onOkay={() => navigate("/cheques")}
        />
      ) : null}
    </>
  );
}

/* ───────────── Memo Management (Memo.png pixel match) ───────────── */

export function MemoManagementPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(async () => {
      if (!query.trim()) {
        setCustomer(null);
        setError(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const page = await searchCustomers({
          ...(/^\d+$/.test(query.trim()) || query.trim().toUpperCase().startsWith("CIF")
            ? { cifNumber: query.trim() }
            : { name: query.trim() }),
          page: 0,
          size: 5,
        });
        setCustomer(page.content?.[0] ?? null);
      } catch (err) {
        setCustomer(null);
        setError(err instanceof ApiError ? err.message : "Unable to search");
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => window.clearTimeout(t);
  }, [query]);

  const name = customer ? customerLabel(customer) : "";
  const branch = customer?.branchCode || "123-Ikeja Top";
  const date = customer ? formatDate(customer.createdAt) : "";
  const digits = customer ? (customer.cifNumber || customer.id).replace(/\D/g, "") : "";
  const base = Number(digits.slice(-4) || "6690");

  const memoRows = customer
    ? [
        { accountNumber: demoNuban(base), label: "Inactive Account" },
        { accountNumber: demoNuban(base + 1), label: "Policy Violation" },
        { accountNumber: demoNuban(base + 2), label: "Fraudulent Activity" },
        { accountNumber: demoNuban(base + 3), label: "Payment Issue" },
      ]
    : [];

  return (
    <div className="fg-hub fg-memo">
      <h1>Memo Management</h1>

      <div className="fg-hub-toolbar" style={{ justifyContent: "center", position: "relative" }}>
        <input
          className="fg-search fg-memo-search"
          placeholder="Search by name, ID"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search by name, ID"
        />
        <button
          type="button"
          className="fg-btn fg-btn-primary cta"
          style={{ position: "absolute", right: 0 }}
          onClick={() => navigate("/memo/new")}
        >
          Create Memo
        </button>
      </div>

      {error ? <p className="fg-error">{error}</p> : null}

      <div className="fg-table-wrap fg-memo-customer fg-hub-top">
        <table className="fg-table">
          <thead>
            <tr>
              <th>Customer Number</th>
              <th>Branch Name</th>
              <th>Customer type</th>
              <th>Customer Name</th>
              <th>Status</th>
              <th>Date Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>Loading…</td>
              </tr>
            ) : customer ? (
              <tr>
                <td>{customer.cifNumber || customer.id.slice(0, 8)}</td>
                <td>{customer.branchCode}</td>
                <td>{customer.type === "INDIVIDUAL" ? "Individual" : "Non-Individual"}</td>
                <td>{name}</td>
                <td>
                  <span className={`fg-badge ${customer.status === "ACTIVE" ? "ok" : "neutral"}`}>
                    {customer.status === "ACTIVE" ? "Active" : customer.status}
                  </span>
                </td>
                <td>{date}</td>
              </tr>
            ) : (
              <tr>
                <td colSpan={6} className="fg-memo-empty">
                  {query.trim() ? "No customer found" : "Search by name or ID to load a customer"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="fg-table-wrap fg-memo-detail">
        <table className="fg-table peach fg-table-memo">
          <thead>
            <tr>
              <th>Branch Name</th>
              <th>Account Number</th>
              <th>Account Type</th>
              <th>Number of Memo</th>
              <th aria-label="actions" />
            </tr>
          </thead>
          <tbody>
            {memoRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="fg-memo-empty">
                  —
                </td>
              </tr>
            ) : (
              memoRows.map((m, i) => (
                <tr key={m.accountNumber} className={i === 1 ? "fg-memo-row-alt" : undefined}>
                  <td>{branch}</td>
                  <td>{m.accountNumber}</td>
                  <td>{name}</td>
                  <td>{m.label}</td>
                  <RowActionCell
                    items={[
                      {
                        label: "View Memo Block",
                        onClick: () =>
                          navigate(
                            `/memo/view?accountNumber=${encodeURIComponent(m.accountNumber)}&label=${encodeURIComponent(m.label)}&branch=${encodeURIComponent(branch)}`,
                          ),
                      },
                      {
                        label: "Modify Memo Block",
                        onClick: () =>
                          navigate(
                            `/memo/modify?accountNumber=${encodeURIComponent(m.accountNumber)}&label=${encodeURIComponent(m.label)}`,
                          ),
                      },
                      {
                        label: "Delete Memo Block",
                        onClick: () =>
                          navigate(
                            `/memo/delete?accountNumber=${encodeURIComponent(m.accountNumber)}&label=${encodeURIComponent(m.label)}&branch=${encodeURIComponent(branch)}`,
                          ),
                        tone: "warn",
                      },
                    ]}
                  />
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ───────────── Create / View / Modify Memo ───────────── */

function MemoFormFields({
  form,
  set,
  readOnly,
}: {
  form: {
    branch: string;
    customerId: string;
    accountNumber: string;
    accountName: string;
    accountType: string;
    currency: string;
    entityType: string;
    text: string;
    startDate: string;
    endDate: string;
  };
  set: (k: string, v: string) => void;
  readOnly?: boolean;
}) {
  return (
    <>
      <FigmaField label="Branch Details">
        <FigmaInput value={form.branch} onChange={(e) => set("branch", e.target.value)} readOnly={readOnly} />
      </FigmaField>
      <FigmaField label="Customer ID">
        <FigmaInput placeholder="Enter Name" value={form.customerId} onChange={(e) => set("customerId", e.target.value)} readOnly={readOnly} />
      </FigmaField>
      <FigmaField label="Account Number">
        <FigmaInput
          placeholder={NUBAN_PLACEHOLDER}
          inputMode="numeric"
          maxLength={NUBAN_LENGTH}
          value={form.accountNumber}
          onChange={(e) => set("accountNumber", sanitizeNubanInput(e.target.value))}
          readOnly={readOnly}
        />
      </FigmaField>
      <FigmaField label="Account Name">
        <FigmaInput placeholder="Enter ID" value={form.accountName} onChange={(e) => set("accountName", e.target.value)} readOnly={readOnly} />
      </FigmaField>
      <FigmaField label="Account type">
        <FigmaInput placeholder="Enter type" value={form.accountType} onChange={(e) => set("accountType", e.target.value)} readOnly={readOnly} />
      </FigmaField>
      <FigmaField label="Currency">
        {readOnly ? (
          <FigmaInput value={form.currency} readOnly />
        ) : (
          <FigmaSelect value={form.currency} onChange={(e) => set("currency", e.target.value)}>
            <option value="">Select</option>
            <option>NGN</option>
            <option>USD</option>
          </FigmaSelect>
        )}
      </FigmaField>
      <FigmaField label="Entity Type">
        {readOnly ? (
          <FigmaInput value={form.entityType} readOnly />
        ) : (
          <FigmaSelect value={form.entityType} onChange={(e) => set("entityType", e.target.value)}>
            <option>Customer instruction</option>
            <option>GENERAL</option>
            <option>INACTIVE_ACCOUNT</option>
            <option>POLICY_VIOLATION</option>
            <option>FRAUD</option>
            <option>PAYMENT_ISSUE</option>
          </FigmaSelect>
        )}
      </FigmaField>
      <FigmaField label="Information Block">
        <textarea
          className="fg-control"
          style={{ height: 100, padding: "12px 14px", resize: "vertical" }}
          placeholder="Text"
          value={form.text}
          onChange={(e) => set("text", e.target.value)}
          readOnly={readOnly}
        />
      </FigmaField>
      <FigmaField label="Start Date">
        {readOnly ? (
          <FigmaInput value={form.startDate || "Select"} readOnly />
        ) : (
          <FigmaDate value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
        )}
      </FigmaField>
      <FigmaField label="End Date">
        {readOnly ? (
          <FigmaInput value={form.endDate || "Select"} readOnly />
        ) : (
          <FigmaDate value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
        )}
      </FigmaField>
    </>
  );
}

export function MemoCreatePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    branch: "123- Ikeja Top",
    customerId: "",
    accountNumber: params.get("accountNumber") || "",
    accountName: "",
    accountType: "",
    currency: "NGN",
    entityType: "Customer instruction",
    text: "",
    startDate: "",
    endDate: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function clear() {
    setForm({
      branch: "123- Ikeja Top",
      customerId: "",
      accountNumber: params.get("accountNumber") || "",
      accountName: "",
      accountType: "",
      currency: "NGN",
      entityType: "Customer instruction",
      text: "",
      startDate: "",
      endDate: "",
    });
  }

  async function submit() {
    if (!isValidNuban(form.accountNumber)) {
      setError("Enter a valid 10-digit NUBAN account number");
      return;
    }
    if (!form.text.trim()) {
      setError("Information Block is required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createMemo(form.accountNumber.trim(), {
        memoType: form.entityType,
        severity: "INFO",
        text: form.text.trim(),
      });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setSuccess(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <FigmaCreatePanel
        title="Create Memo"
        onClose={() => navigate("/memo")}
        onClear={clear}
        clearLabel="Close"
        submitLabel="Create"
        onSubmit={() => void submit()}
        busy={busy}
        error={error}
      >
        <MemoFormFields form={form} set={set} />
      </FigmaCreatePanel>
      {success ? (
        <SuccessModal
          title="Memo Created Successfully"
          message="Memo has been created successfully"
          onOkay={() => navigate("/memo")}
        />
      ) : null}
    </>
  );
}

export function MemoModifyPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    branch: params.get("branch") || "123- Ikeja Top",
    customerId: "",
    accountNumber: params.get("accountNumber") || "",
    accountName: "",
    accountType: "",
    currency: "NGN",
    entityType: "Customer instruction",
    text: params.get("label") || "",
    startDate: "",
    endDate: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    if (!isValidNuban(form.accountNumber)) {
      setError("Enter a valid 10-digit NUBAN account number");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createMemo(form.accountNumber.trim(), {
        memoType: form.entityType,
        severity: "WARNING",
        text: form.text.trim() || "Updated memo",
      });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setSuccess(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <FigmaCreatePanel
        title="Modify Memo"
        onClose={() => navigate("/memo")}
        clearLabel="Close"
        submitLabel="Modify"
        onSubmit={() => void submit()}
        busy={busy}
        error={error}
      >
        <MemoFormFields form={form} set={set} />
      </FigmaCreatePanel>
      {success ? (
        <SuccessModal
          title="Memo Updated Successfully"
          message="Memo block has been updated successfully"
          onOkay={() => navigate("/memo")}
        />
      ) : null}
    </>
  );
}

export function MemoDeletePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    branch: params.get("branch") || "123- Ikeja Top",
    customerId: "",
    accountNumber: params.get("accountNumber") || "",
    accountName: "",
    accountType: "",
    currency: "NGN",
    entityType: "Customer instruction",
    text: params.get("label") || "",
    startDate: "",
    endDate: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletedOk, setDeletedOk] = useState(false);

  return (
    <>
      <FigmaCreatePanel
        title="Delete Memo Block"
        onClose={() => navigate("/memo")}
        clearLabel="Close"
        submitLabel="Delete"
        onSubmit={() => setConfirmOpen(true)}
      >
        <MemoFormFields form={form} set={set} readOnly />
      </FigmaCreatePanel>
      {confirmOpen ? (
        <ConfirmRemoveModal
          title="Delete Memo Block"
          message="This memo block will be permanently removed."
          confirmLabel="Delete Memo Block"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            setDeletedOk(true);
          }}
        />
      ) : null}
      {deletedOk ? (
        <SuccessModal
          title="Deleted Successfully"
          message="Memo block has been deleted successfully"
          onOkay={() => navigate("/memo")}
        />
      ) : null}
    </>
  );
}

export function MemoViewPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    branch: params.get("branch") || "123- Ikeja Top",
    customerId: "",
    accountNumber: params.get("accountNumber") || "",
    accountName: "",
    accountType: "",
    currency: "NGN",
    entityType: "Customer instruction",
    text: params.get("label") || "",
    startDate: "",
    endDate: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <FigmaCreatePanel title="View Memo Block" onClose={() => navigate("/memo")} hidePrimary clearLabel="Close">
      <MemoFormFields form={form} set={set} readOnly />
    </FigmaCreatePanel>
  );
}

/* ───────────── Stop Cheque (from Restriction Create-5/6/7 mislabeled frames) ───────────── */

type StopChequeForm = {
  branch: string;
  customerId: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  currency: string;
  balance: string;
  stopType: string;
  reason: string;
  chequeNumber: string;
  firstCheque: string;
  lastCheque: string;
  waive: string;
  charge: string;
  vat: string;
  total: string;
  inputter: string;
  approvedBy: string;
};

function StopChequeFields({
  form,
  set,
  mode,
  readOnly,
}: {
  form: StopChequeForm;
  set: (k: keyof StopChequeForm, v: string) => void;
  mode: "single" | "multiple" | "view";
  readOnly?: boolean;
}) {
  return (
    <>
      <FigmaField label="Branch Details">
        <FigmaInput value={form.branch} onChange={(e) => set("branch", e.target.value)} readOnly={readOnly} />
      </FigmaField>
      <FigmaField label="Customer ID">
        <FigmaInput placeholder="Enter Name" value={form.customerId} onChange={(e) => set("customerId", e.target.value)} readOnly={readOnly} />
      </FigmaField>
      <FigmaField label="Account Number">
        <FigmaInput
          placeholder={NUBAN_PLACEHOLDER}
          inputMode="numeric"
          maxLength={NUBAN_LENGTH}
          value={form.accountNumber}
          onChange={(e) => set("accountNumber", sanitizeNubanInput(e.target.value))}
          readOnly={readOnly}
        />
      </FigmaField>
      <FigmaField label="Account Name">
        <FigmaInput placeholder="Enter ID" value={form.accountName} onChange={(e) => set("accountName", e.target.value)} readOnly={readOnly} />
      </FigmaField>
      <FigmaField label="Account type">
        <FigmaInput placeholder="Enter type" value={form.accountType} onChange={(e) => set("accountType", e.target.value)} readOnly={readOnly} />
      </FigmaField>
      <FigmaField label="Currency">
        {readOnly ? (
          <FigmaInput value={form.currency} readOnly />
        ) : (
          <FigmaSelect value={form.currency} onChange={(e) => set("currency", e.target.value)}>
            <option value="">Select</option>
            <option>NGN</option>
            <option>USD</option>
          </FigmaSelect>
        )}
      </FigmaField>
      {mode !== "view" ? (
        <FigmaField label="Available Balance">
          <FigmaInput placeholder="0.00" value={form.balance} onChange={(e) => set("balance", e.target.value)} />
        </FigmaField>
      ) : null}
      <FigmaField label="Stop Cheque Type">
        {readOnly ? (
          <FigmaInput value={form.stopType} readOnly />
        ) : (
          <FigmaSelect value={form.stopType} onChange={(e) => set("stopType", e.target.value)}>
            <option>Customer instruction</option>
            <option>Lost cheque</option>
            <option>Stolen cheque</option>
          </FigmaSelect>
        )}
      </FigmaField>
      <FigmaField label="Reason">
        <FigmaInput placeholder="Text" value={form.reason} onChange={(e) => set("reason", e.target.value)} readOnly={readOnly} />
      </FigmaField>
      {mode === "multiple" ? (
        <>
          <FigmaField label="First Cheque Number">
            <FigmaInput placeholder="1001" value={form.firstCheque} onChange={(e) => set("firstCheque", e.target.value)} />
          </FigmaField>
          <FigmaField label="Last cheque Number">
            <FigmaInput placeholder="1005" value={form.lastCheque} onChange={(e) => set("lastCheque", e.target.value)} />
          </FigmaField>
        </>
      ) : (
        <FigmaField label="Cheque Number">
          <FigmaInput placeholder="1001" value={form.chequeNumber} onChange={(e) => set("chequeNumber", e.target.value)} readOnly={readOnly} />
        </FigmaField>
      )}
      <FigmaField label="Waive Charge">
        {readOnly ? (
          <FigmaInput value={form.waive} readOnly />
        ) : (
          <FigmaSelect value={form.waive} onChange={(e) => set("waive", e.target.value)}>
            <option value="">Yes/NO</option>
            <option>Yes</option>
            <option>No</option>
          </FigmaSelect>
        )}
      </FigmaField>
      <FigmaField label="Stop Cheque Charge Amount">
        <FigmaInput placeholder="N500.00" value={form.charge} onChange={(e) => set("charge", e.target.value)} readOnly={readOnly} />
      </FigmaField>
      {mode === "view" ? (
        <>
          <FigmaField label="Inputter">
            <FigmaInput value={form.inputter} readOnly />
          </FigmaField>
          <FigmaField label="Approved By">
            <FigmaInput value={form.approvedBy} readOnly />
          </FigmaField>
        </>
      ) : (
        <>
          <FigmaField label="VAT">
            <FigmaInput placeholder="0.75%" value={form.vat} onChange={(e) => set("vat", e.target.value)} />
          </FigmaField>
          <FigmaField label="Total Charge">
            <FigmaInput placeholder="575.00" value={form.total} onChange={(e) => set("total", e.target.value)} />
          </FigmaField>
        </>
      )}
    </>
  );
}

function useStopChequeForm(accountNumber = "") {
  const [form, setForm] = useState<StopChequeForm>({
    branch: "123- Ikeja Top",
    customerId: "",
    accountNumber,
    accountName: "",
    accountType: "",
    currency: "NGN",
    balance: "0.00",
    stopType: "Customer instruction",
    reason: "",
    chequeNumber: "1001",
    firstCheque: "1001",
    lastCheque: "",
    waive: "",
    charge: "N500.00",
    vat: "0.75%",
    total: "575.00",
    inputter: "0.75%",
    approvedBy: "575.00",
  });
  const set = (k: keyof StopChequeForm, v: string) => setForm((f) => ({ ...f, [k]: v }));
  return { form, set };
}

export function StopSingleChequePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { form, set } = useStopChequeForm(params.get("accountNumber") || "");
  const [success, setSuccess] = useState(false);

  return (
    <>
      <FigmaCreatePanel
        title="Stop Single Cheque"
        onClose={() => navigate("/cheques")}
        submitLabel="Stop Cheque"
        onSubmit={() => setSuccess(true)}
      >
        <StopChequeFields form={form} set={set} mode="single" />
      </FigmaCreatePanel>
      {success ? (
        <SuccessModal
          title="Cheque Stopped Successfully"
          message="The cheque has been stopped successfully"
          onOkay={() => navigate("/cheques")}
        />
      ) : null}
    </>
  );
}

export function StopMultipleChequesPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { form, set } = useStopChequeForm(params.get("accountNumber") || "");
  const [success, setSuccess] = useState(false);

  return (
    <>
      <FigmaCreatePanel
        title="Stop Multiple Cheques"
        onClose={() => navigate("/cheques")}
        submitLabel="Stop Cheque"
        onSubmit={() => setSuccess(true)}
      >
        <StopChequeFields form={form} set={set} mode="multiple" />
      </FigmaCreatePanel>
      {success ? (
        <SuccessModal
          title="Cheques Stopped Successfully"
          message="The cheque range has been stopped successfully"
          onOkay={() => navigate("/cheques")}
        />
      ) : null}
    </>
  );
}

export function ViewStoppedChequePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { form, set } = useStopChequeForm(params.get("accountNumber") || "");

  return (
    <FigmaCreatePanel title="View Stoppped Cheque" onClose={() => navigate("/cheques")} hidePrimary clearLabel="Close">
      <StopChequeFields form={form} set={set} mode="view" readOnly />
    </FigmaCreatePanel>
  );
}

