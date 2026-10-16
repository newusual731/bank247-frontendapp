import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { searchCustomers, type Customer } from "../api/customers";
import { createMandate, listMandates, type Mandate } from "../api/mandates";
import { listTills, createTill, listVaults, createVault, type Till } from "../api/teller";
import { EXAMPLE_NUBAN, NUBAN_LENGTH, NUBAN_PLACEHOLDER, isValidNuban, sanitizeNubanInput } from "../lib/nuban";
import {
  applyLien,
  createRestriction,
  getAccountEnquiry,
  placeLien,
  releaseRestriction,
} from "../api/accounts";
import {
  FigmaCreatePanel,
  FigmaHubCard,
  FigmaTable,
  formatDate,
  statusBadge,
} from "../components/figma/FigmaHub";
import {
  ConfirmRemoveModal,
  FigmaDate,
  FigmaField,
  FigmaInput,
  FigmaRow,
  FigmaSelect,
  REMOVE_MODAL,
  SUCCESS_MODAL,
  SuccessModal,
} from "../components/figma/FigmaForm";
import { RowActionCell } from "./FigmaRemainingPages";

async function findCustomer(q: string): Promise<Customer | null> {
  if (!q.trim()) return null;
  const page = await searchCustomers({
    ...(/^\d+$/.test(q.trim()) || q.toUpperCase().startsWith("CIF")
      ? { cifNumber: q.trim() }
      : { name: q.trim() }),
    page: 0,
    size: 5,
  });
  return page.content?.[0] ?? null;
}

function CustomerSummaryRow({ c }: { c: Customer | null }) {
  if (!c) {
    return (
      <tr>
        <td colSpan={6} style={{ color: "#9ca3af" }}>
          Search a customer to load records
        </td>
      </tr>
    );
  }
  return (
    <tr>
      <td>{c.cifNumber || c.id.slice(0, 8)}</td>
      <td>{c.branchCode}</td>
      <td>{c.type === "INDIVIDUAL" ? "Individual" : "Corporate"}</td>
      <td>{c.displayName}</td>
      <td>{statusBadge(c.status === "ACTIVE" ? "Active" : c.status, c.status === "ACTIVE" ? "ok" : "neutral")}</td>
      <td>{formatDate(c.createdAt)}</td>
    </tr>
  );
}

/* ───────────── Mandate ───────────── */

export function MandatesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [rows, setRows] = useState<Mandate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deletedOk, setDeletedOk] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(async () => {
      if (!search.trim()) {
        setCustomer(null);
        setRows([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const c = await findCustomer(search);
        setCustomer(c);
        if (c) setRows(await listMandates(c.id));
        else setRows([]);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Unable to load mandates");
        setRows([]);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => window.clearTimeout(t);
  }, [search]);

  return (
    <>
      <FigmaHubCard
        title="Mandate Management"
        search={search}
        onSearch={setSearch}
        primaryLabel="Create Mandate"
        onPrimary={() => navigate(customer ? `/mandates/new?customerId=${customer.id}` : "/mandates/new")}
      >
        {error ? <p className="fg-error">{error}</p> : null}
        <FigmaTable
          wrapClassName="fg-hub-top"
          headers={["Customer Number", "Branch Name", "Customer type", "Customer Name", "Status", "Date Created"]}
        >
          {loading ? (
            <tr>
              <td colSpan={6}>Loading…</td>
            </tr>
          ) : (
            <CustomerSummaryRow c={customer} />
          )}
        </FigmaTable>
        <FigmaTable
          peach
          headers={["Mandate ID", "Signatory Name", "Signatory's Class", "Instruction", "Limit", "Date Created", "Status", ""]}
        >
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ color: "#9ca3af" }}>
                {customer ? "No mandates for this customer" : "—"}
              </td>
            </tr>
          ) : (
            rows.map((m) => {
              let signatory = "—";
              let cls = "—";
              try {
                const parsed = m.signatories ? JSON.parse(m.signatories) : [];
                if (Array.isArray(parsed) && parsed[0]) {
                  signatory = parsed[0].fullName || "—";
                  cls = parsed[0].role || "—";
                }
              } catch {
                /* ignore */
              }
              const tone = m.status === "ACTIVE" || m.status === "APPROVED" ? "ok" : m.status === "REJECTED" ? "bad" : "neutral";
              const label = m.status === "ACTIVE" ? "Approved" : m.status === "REJECTED" ? "Disapproved" : m.status;
              return (
                <tr key={m.id}>
                  <td>
                    <button
                      type="button"
                      className="cta"
                      style={{ border: "none", background: "none", color: "#111827", font: "inherit", cursor: "pointer", padding: 0 }}
                      onClick={() => navigate(`/mandates/${m.id}?customerId=${m.customerId}`)}
                    >
                      {m.id.slice(0, 8)}
                    </button>
                  </td>
                  <td>{signatory}</td>
                  <td>{cls}</td>
                  <td>{m.instruction || m.mandateType}</td>
                  <td>—</td>
                  <td>{formatDate(m.createdAt)}</td>
                  <td>{statusBadge(label, tone)}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <RowActionCell
                      items={[
                        {
                          label: "View Mandate",
                          onClick: () => navigate(`/mandates/${m.id}?customerId=${m.customerId}`),
                        },
                        {
                          label: "Update Mandate",
                          onClick: () => navigate(`/mandates/${m.id}/update?customerId=${m.customerId}`),
                        },
                        {
                          label: "Delete Mandate",
                          onClick: () => setDeleteId(m.id),
                          tone: "danger",
                        },
                      ]}
                    />
                  </td>
                </tr>
              );
            })
          )}
        </FigmaTable>
      </FigmaHubCard>
      {deleteId ? (
        <ConfirmRemoveModal
          {...REMOVE_MODAL.mandate}
          onCancel={() => setDeleteId(null)}
          onConfirm={() => {
            setRows((prev) => prev.filter((r) => r.id !== deleteId));
            setDeleteId(null);
            setDeletedOk(true);
          }}
        />
      ) : null}
      {deletedOk ? (
        <SuccessModal
          title="Deleted Successfully"
          message="Mandate has been deleted successfully"
          onOkay={() => setDeletedOk(false)}
        />
      ) : null}
    </>
  );
}

export function MandateCreatePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [customerId, setCustomerId] = useState(params.get("customerId") || "");
  const [signatoryName, setSignatoryName] = useState("");
  const [signatoryClass, setSignatoryClass] = useState("");
  const [mobile, setMobile] = useState("");
  const [instruction, setInstruction] = useState("");
  const [limit, setLimit] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function clear() {
    setSignatoryName("");
    setSignatoryClass("");
    setMobile("");
    setInstruction("");
    setLimit("");
  }

  async function submit() {
    if (!customerId.trim()) {
      setError("Customer ID is required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createMandate(customerId.trim(), {
        mandateType: "SOLE",
        instruction: instruction.trim() || `Limit ${limit || "N/A"}`,
        signatories: [
          {
            fullName: signatoryName.trim(),
            role: signatoryClass.trim() || undefined,
            bvn: mobile.trim().replace(/\D/g, "").slice(0, 11) || undefined,
          },
        ],
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <FigmaCreatePanel
        title="Create Mandate"
        onClose={() => navigate("/mandates")}
        onClear={clear}
        clearLabel="Clear"
        submitLabel="Create mandate"
        onSubmit={() => void submit()}
        busy={busy}
        error={error}
      >
        {!params.get("customerId") ? (
          <FigmaField label="Customer ID">
            <FigmaInput placeholder="Enter Customer ID" value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
          </FigmaField>
        ) : null}
        <FigmaField label="Signatory Name">
          <FigmaInput placeholder="Enter name" value={signatoryName} onChange={(e) => setSignatoryName(e.target.value)} />
        </FigmaField>
        <FigmaField label="Signatory's Class">
          <FigmaInput placeholder="Enter Class" value={signatoryClass} onChange={(e) => setSignatoryClass(e.target.value)} />
        </FigmaField>
        <FigmaField label="Signatory's Mobile Number">
          <FigmaInput placeholder="Enter Number" value={mobile} onChange={(e) => setMobile(e.target.value)} />
        </FigmaField>
        <FigmaField label="Mandate Instruction">
          <textarea
            className="fg-control"
            style={{ height: 120, padding: "12px 14px", resize: "vertical" }}
            placeholder="Enter Instruction"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
          />
        </FigmaField>
        <FigmaField label="Limit (Amount)">
          <FigmaInput placeholder="Enter Limit" value={limit} onChange={(e) => setLimit(e.target.value)} />
        </FigmaField>
        <div className="fg-mandate-upload">
          <label className="fg-mandate-upload-circle cta">
            <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" hidden />
            <span className="fg-mandate-upload-cam" aria-hidden>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
                <circle cx="12" cy="13" r="3.2" />
                <path d="M19 5v4M17 7h4" strokeLinecap="round" />
              </svg>
            </span>
            <span>Upload Image</span>
          </label>
          <div className="fg-mandate-upload-meta">
            <div>Allowed format JPG, JPEG, and PNG</div>
            <div>Max file size 2MB</div>
          </div>
        </div>
      </FigmaCreatePanel>
      {success ? (
        <SuccessModal
          title="Mandate Created Successfully"
          message="Mandate has been created successfully"
          onOkay={() => navigate("/mandates")}
        />
      ) : null}
    </>
  );
}

export function MandateViewPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [params] = useSearchParams();
  const customerId = params.get("customerId") || "";
  const [mandate, setMandate] = useState<Mandate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletedOk, setDeletedOk] = useState(false);

  useEffect(() => {
    if (!customerId || !id) return;
    let cancelled = false;
    (async () => {
      try {
        const all = await listMandates(customerId);
        if (!cancelled) setMandate(all.find((m) => m.id === id) || all[0] || null);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Not found");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [customerId, id]);

  let signatory = "Samuel Smith Power";
  let cls = "class 34";
  let mobile = "0708732626";
  try {
    const parsed = mandate?.signatories ? JSON.parse(mandate.signatories) : [];
    if (Array.isArray(parsed) && parsed[0]) {
      signatory = parsed[0].fullName || signatory;
      cls = parsed[0].role || cls;
      mobile = parsed[0].bvn || mobile;
    }
  } catch {
    /* ignore */
  }

  const fields: [string, string][] = [
    ["Branch Code", "123456"],
    ["Customer Record ID", customerId.slice(0, 8) || "83732"],
    ["Mandate ID", mandate?.id?.replace(/\D/g, "").slice(0, 10) || id?.replace(/\D/g, "").slice(0, 10) || "6373838443"],
    ["Signatory Name", signatory],
    ["Signatory Mobile number", mobile],
    ["Signatory Class", cls],
    ["Mandate Instruction", mandate?.instruction || "Do touch"],
    ["Date Opened", formatDate(mandate?.createdAt) || "July 10, 2022"],
    ["Limit", "N50,000"],
  ];

  return (
    <>
      <div className="fg-hub fg-mandate-view">
        <button type="button" className="fg-mandate-back cta" onClick={() => navigate("/mandates")}>
          ← Back
        </button>

        {error ? <p className="fg-error">{error}</p> : null}

        <div className="fg-mandate-overview-label">Overview</div>

        <div className="fg-mandate-view-body">
          <div className="fg-mandate-view-fields">
            {fields.map(([label, value]) => (
              <div key={label} className="fg-mandate-field">
                <div className="label">{label}</div>
                <div className="value">{value}</div>
              </div>
            ))}
          </div>

          <div className="fg-mandate-signature">
            <div className="fg-mandate-sign-name">{signatory}</div>
            <div className="fg-mandate-sign-mark" aria-hidden>
              {signatory.split(" ").slice(0, 2).join(" ")}
            </div>
          </div>
        </div>

        <div className="fg-mandate-view-actions">
          <button type="button" className="fg-btn fg-btn-danger-outline cta" onClick={() => setDeleteOpen(true)}>
            Delete Mandate
          </button>
          <button
            type="button"
            className="fg-btn fg-btn-primary cta"
            onClick={() =>
              navigate(`/mandates/${id}/update?customerId=${encodeURIComponent(customerId)}`)
            }
          >
            Update Mandate
          </button>
        </div>
      </div>

      {deleteOpen ? (
        <ConfirmRemoveModal
          {...REMOVE_MODAL.mandate}
          onCancel={() => setDeleteOpen(false)}
          onConfirm={() => {
            setDeleteOpen(false);
            setDeletedOk(true);
          }}
        />
      ) : null}
      {deletedOk ? (
        <SuccessModal
          title="Deleted Successfully"
          message="Mandate has been deleted successfully"
          onOkay={() => navigate("/mandates")}
        />
      ) : null}
    </>
  );
}

/* ───────────── Till ───────────── */

export function TillManagementPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<Till[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const tills = await listTills();
        if (!cancelled) {
          const q = search.trim().toLowerCase();
          setRows(
            q
              ? tills.filter(
                  (t) =>
                    t.tellerId.toLowerCase().includes(q) ||
                    t.branchCode.toLowerCase().includes(q) ||
                    t.id.toLowerCase().includes(q),
                )
              : tills,
          );
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Unable to load tills");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [search]);

  const first = rows[0];
  const rawBranch = first?.branchCode || "232-Ikeja Top";
  const branchCode = rawBranch.split(/[-–—]/)[0]?.trim() || rawBranch;
  const branchName =
    rawBranch.includes("-") || rawBranch.includes("–") || rawBranch.includes("—")
      ? rawBranch.replace(/^[^-–—]+[-–—]\s*/, "").trim()
      : rawBranch;

  return (
    <FigmaHubCard
      title="Till Management"
      search={search}
      onSearch={setSearch}
      primaryLabel="Create Till"
      onPrimary={() => navigate("/teller/till-create")}
    >
      {error ? <p className="fg-error">{error}</p> : null}
      <FigmaTable
        wrapClassName="fg-hub-top fg-till-top"
        headers={["Tella ID", "Branch Name", "Tella type", "Tella Name", "Status", "Date Created"]}
      >
        {first ? (
          <tr>
            <td>{first.tellerId}</td>
            <td>{first.branchCode}</td>
            <td>{first.currency}</td>
            <td>{first.tellerId}</td>
            <td>{statusBadge(first.status === "ACTIVE" || first.status === "OPEN_INACTIVE" ? "Active" : first.status, "ok")}</td>
            <td>—</td>
          </tr>
        ) : (
          <tr>
            <td>637373</td>
            <td>232-Ikeja Top</td>
            <td>736376273</td>
            <td>Sam Kola</td>
            <td>{statusBadge("Active", "ok")}</td>
            <td>July 10, 2022</td>
          </tr>
        )}
      </FigmaTable>

      <div className="fg-till-gap">
        <div className="fg-till-branch" role="status">
          Branch Code: <strong>{branchCode}</strong>
          <span className="fg-till-branch-sep">
            Branch Name: <strong>{branchName}</strong>
          </span>
        </div>
      </div>

      <FigmaTable
        peach
        headers={["Teller ID", "Tella Name", "Till Account", "Currency", "Date Opened", "Status", "Date of last Transaction", ""]}
      >
        {rows.length === 0 ? (
          <tr>
            <td colSpan={8} style={{ color: "#9ca3af" }}>
              No till accounts for this branch yet
            </td>
          </tr>
        ) : (
          rows.map((t) => (
            <tr key={t.id}>
              <td>{t.tellerId}</td>
              <td>{t.tellerId}</td>
              <td>{t.ledgerAccountNumber || t.id.slice(0, 8)}</td>
              <td>{t.currency}</td>
              <td>—</td>
              <td>
                {statusBadge(
                  t.status.includes("ACTIVE") ? "Active" : t.status.includes("PENDING") ? "Pending" : t.status,
                  t.status.includes("ACTIVE") ? "ok" : t.status.includes("PENDING") ? "warn" : "bad",
                )}
              </td>
              <td>—</td>
              <RowActionCell
                items={[
                  {
                    label: "View Till",
                    onClick: () => navigate(`/teller/${t.id}`),
                  },
                  {
                    label: "Update Till",
                    onClick: () =>
                      navigate(
                        `/teller/update?${tillActionQuery({
                          id: t.id,
                          branch: t.branchCode,
                          customerId: t.tellerId,
                          currency: t.currency,
                          longAccount: t.ledgerAccountNumber,
                          tellerNumber: t.tellerId,
                        })}`,
                      ),
                  },
                  {
                    label: "Reactivate Till",
                    onClick: () =>
                      navigate(
                        `/teller/reactivate?${tillActionQuery({
                          id: t.id,
                          branch: t.branchCode,
                          customerId: t.tellerId,
                          currency: t.currency,
                          longAccount: t.ledgerAccountNumber,
                          tellerNumber: t.tellerId,
                        })}`,
                      ),
                  },
                  {
                    label: "Suspend Till",
                    onClick: () =>
                      navigate(
                        `/teller/suspend?${tillActionQuery({
                          id: t.id,
                          branch: t.branchCode,
                          customerId: t.tellerId,
                          currency: t.currency,
                          longAccount: t.ledgerAccountNumber,
                          tellerNumber: t.tellerId,
                        })}`,
                      ),
                    tone: "warn",
                  },
                  {
                    label: "Close Till",
                    onClick: () =>
                      navigate(
                        `/teller/close?${tillActionQuery({
                          id: t.id,
                          branch: t.branchCode,
                          customerId: t.tellerId,
                          currency: t.currency,
                          longAccount: t.ledgerAccountNumber,
                          tellerNumber: t.tellerId,
                        })}`,
                      ),
                    tone: "danger",
                  },
                ]}
              />
            </tr>
          ))
        )}
      </FigmaTable>
    </FigmaHubCard>
  );
}

function tillActionQuery(opts: {
  id?: string;
  branch?: string;
  customerId?: string;
  currency?: string;
  limit?: string;
  longAccount?: string;
  tellerNumber?: string;
}) {
  const q = new URLSearchParams();
  if (opts.id) q.set("id", opts.id);
  if (opts.branch) q.set("branch", opts.branch);
  if (opts.customerId) q.set("customerId", opts.customerId);
  if (opts.currency) q.set("currency", opts.currency);
  if (opts.limit) q.set("limit", opts.limit);
  if (opts.longAccount) q.set("longAccount", opts.longAccount);
  if (opts.tellerNumber) q.set("tellerNumber", opts.tellerNumber);
  return q.toString();
}

function useTillFormPrefill() {
  const [params] = useSearchParams();
  return {
    id: params.get("id") || "",
    branch: params.get("branch") || "HQ01",
    customerId: params.get("customerId") || "",
    currency: params.get("currency") || "NGN",
    limit: params.get("limit") || "",
    longAccount: params.get("longAccount") || "",
    tellerNumber: params.get("tellerNumber") || "",
  };
}

function TillDetailFields({
  branch,
  setBranch,
  customerId,
  setCustomerId,
  currency,
  setCurrency,
  limit,
  setLimit,
  longAccount,
  setLongAccount,
  tellerNumber,
  setTellerNumber,
}: {
  branch: string;
  setBranch: (v: string) => void;
  customerId: string;
  setCustomerId: (v: string) => void;
  currency: string;
  setCurrency: (v: string) => void;
  limit: string;
  setLimit: (v: string) => void;
  longAccount: string;
  setLongAccount: (v: string) => void;
  tellerNumber: string;
  setTellerNumber: (v: string) => void;
}) {
  return (
    <>
      <FigmaField label="Branch">
        <FigmaSelect value={branch} onChange={(e) => setBranch(e.target.value)}>
          <option value="">Select</option>
          <option value="HQ01">HQ01</option>
          <option value="HQ">HQ</option>
          <option value="232">232-Ikeja Top</option>
        </FigmaSelect>
      </FigmaField>
      <FigmaField label="Customer ID">
        <FigmaInput placeholder="Enter ID" value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
      </FigmaField>
      <FigmaField label="Currency">
        <FigmaSelect value={currency} onChange={(e) => setCurrency(e.target.value)}>
          <option value="">Select</option>
          <option value="NGN">NGN</option>
          <option value="USD">USD</option>
        </FigmaSelect>
      </FigmaField>
      <FigmaField label="Limit (Amount)">
        <FigmaInput placeholder="Enter Limit" value={limit} onChange={(e) => setLimit(e.target.value)} />
      </FigmaField>
      <FigmaField label="Long Account Number">
        <FigmaInput
          placeholder={NUBAN_PLACEHOLDER}
          inputMode="numeric"
          maxLength={NUBAN_LENGTH}
          value={longAccount}
          onChange={(e) => setLongAccount(sanitizeNubanInput(e.target.value))}
        />
      </FigmaField>
      <FigmaField label="Teller Number">
        <FigmaInput
          placeholder="Enter Teller Number"
          value={tellerNumber}
          onChange={(e) => setTellerNumber(e.target.value)}
        />
      </FigmaField>
    </>
  );
}

/** Till creation.png — Create Till */
export function TillCreateFigmaPage() {
  const navigate = useNavigate();
  const pre = useTillFormPrefill();
  const [branch, setBranch] = useState(pre.branch);
  const [customerId, setCustomerId] = useState(pre.customerId);
  const [currency, setCurrency] = useState(pre.currency || "NGN");
  const [limit, setLimit] = useState(pre.limit);
  const [tellerNumber, setTellerNumber] = useState(pre.tellerNumber);
  const [longAccount, setLongAccount] = useState(pre.longAccount);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await createTill({
        tellerId: (customerId || tellerNumber).trim(),
        branchCode: branch.trim().toUpperCase(),
        currency,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <FigmaCreatePanel
        title="Create Till"
        onClose={() => navigate("/teller")}
        onSubmit={() => void submit()}
        submitLabel="Submit"
        busy={busy}
        error={error}
      >
        <TillDetailFields
          branch={branch}
          setBranch={setBranch}
          customerId={customerId}
          setCustomerId={setCustomerId}
          currency={currency}
          setCurrency={setCurrency}
          limit={limit}
          setLimit={setLimit}
          longAccount={longAccount}
          setLongAccount={setLongAccount}
          tellerNumber={tellerNumber}
          setTellerNumber={setTellerNumber}
        />
      </FigmaCreatePanel>
      {success ? (
        <SuccessModal
          title="Till Created Successfully"
          message="Till has been created successfully"
          onOkay={() => navigate("/teller")}
        />
      ) : null}
    </>
  );
}

/** Update Till (from Till View) */
export function TillUpdateFigmaPage() {
  const navigate = useNavigate();
  const pre = useTillFormPrefill();
  const [branch, setBranch] = useState(pre.branch);
  const [customerId, setCustomerId] = useState(pre.customerId);
  const [currency, setCurrency] = useState(pre.currency || "NGN");
  const [limit, setLimit] = useState(pre.limit);
  const [tellerNumber, setTellerNumber] = useState(pre.tellerNumber);
  const [longAccount, setLongAccount] = useState(pre.longAccount);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  return (
    <>
      <FigmaCreatePanel
        title="Update Till"
        onClose={() => navigate(pre.id ? `/teller/${pre.id}` : "/teller")}
        submitLabel="Update"
        busy={busy}
        onSubmit={() => {
          setBusy(true);
          window.setTimeout(() => {
            setBusy(false);
            setSuccess(true);
          }, 350);
        }}
      >
        <TillDetailFields
          branch={branch}
          setBranch={setBranch}
          customerId={customerId}
          setCustomerId={setCustomerId}
          currency={currency}
          setCurrency={setCurrency}
          limit={limit}
          setLimit={setLimit}
          longAccount={longAccount}
          setLongAccount={setLongAccount}
          tellerNumber={tellerNumber}
          setTellerNumber={setTellerNumber}
        />
      </FigmaCreatePanel>
      {success ? (
        <SuccessModal
          title="Till Updated Successfully"
          message="Till has been updated successfully"
          onOkay={() => navigate(pre.id ? `/teller/${pre.id}` : "/teller")}
        />
      ) : null}
    </>
  );
}

/** Till creation-2 — Reactivate Till */
export function TillReactivateFigmaPage() {
  const navigate = useNavigate();
  const pre = useTillFormPrefill();
  const [branch, setBranch] = useState(pre.branch);
  const [customerId, setCustomerId] = useState(pre.customerId);
  const [currency, setCurrency] = useState(pre.currency || "NGN");
  const [limit, setLimit] = useState(pre.limit);
  const [longAccount, setLongAccount] = useState(pre.longAccount);
  const [tellerNumber, setTellerNumber] = useState(pre.tellerNumber);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  return (
    <>
      <FigmaCreatePanel
        title="Reactivate Till"
        onClose={() => navigate(pre.id ? `/teller/${pre.id}` : "/teller")}
        submitLabel="Reactivate"
        busy={busy}
        onSubmit={() => {
          setBusy(true);
          window.setTimeout(() => {
            setBusy(false);
            setSuccess(true);
          }, 350);
        }}
      >
        <TillDetailFields
          branch={branch}
          setBranch={setBranch}
          customerId={customerId}
          setCustomerId={setCustomerId}
          currency={currency}
          setCurrency={setCurrency}
          limit={limit}
          setLimit={setLimit}
          longAccount={longAccount}
          setLongAccount={setLongAccount}
          tellerNumber={tellerNumber}
          setTellerNumber={setTellerNumber}
        />
      </FigmaCreatePanel>
      {success ? (
        <SuccessModal
          title="Till Reactivated Successfully"
          message="Till has been reactivated successfully"
          onOkay={() => navigate(pre.id ? `/teller/${pre.id}` : "/teller")}
        />
      ) : null}
    </>
  );
}

/** Till creation-4 — Suspend Till */
export function TillSuspendFigmaPage() {
  const navigate = useNavigate();
  const pre = useTillFormPrefill();
  const [branch, setBranch] = useState(pre.branch);
  const [customerId, setCustomerId] = useState(pre.customerId);
  const [currency, setCurrency] = useState(pre.currency || "NGN");
  const [limit, setLimit] = useState(pre.limit);
  const [longAccount, setLongAccount] = useState(pre.longAccount);
  const [tellerNumber, setTellerNumber] = useState(pre.tellerNumber);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  return (
    <>
      <FigmaCreatePanel
        title="Suspend Till"
        onClose={() => navigate(pre.id ? `/teller/${pre.id}` : "/teller")}
        submitLabel="Suspend"
        busy={busy}
        onSubmit={() => {
          setBusy(true);
          window.setTimeout(() => {
            setBusy(false);
            setSuccess(true);
          }, 350);
        }}
      >
        <TillDetailFields
          branch={branch}
          setBranch={setBranch}
          customerId={customerId}
          setCustomerId={setCustomerId}
          currency={currency}
          setCurrency={setCurrency}
          limit={limit}
          setLimit={setLimit}
          longAccount={longAccount}
          setLongAccount={setLongAccount}
          tellerNumber={tellerNumber}
          setTellerNumber={setTellerNumber}
        />
        <FigmaField label="Reason">
          <textarea
            className="fg-control"
            style={{ height: 120, padding: "12px 14px", resize: "vertical" }}
            placeholder="Enter Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </FigmaField>
      </FigmaCreatePanel>
      {success ? (
        <SuccessModal
          title="Till Suspended Successfully"
          message="Till has been suspended successfully"
          onOkay={() => navigate(pre.id ? `/teller/${pre.id}` : "/teller")}
        />
      ) : null}
    </>
  );
}

/** Till creation-7 — Close Till */
export function TillCloseFigmaPage() {
  const navigate = useNavigate();
  const pre = useTillFormPrefill();
  const [branch, setBranch] = useState(pre.branch);
  const [customerId, setCustomerId] = useState(pre.customerId);
  const [currency, setCurrency] = useState(pre.currency || "NGN");
  const [limit, setLimit] = useState(pre.limit);
  const [longAccount, setLongAccount] = useState(pre.longAccount);
  const [tellerNumber, setTellerNumber] = useState(pre.tellerNumber);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  function submit() {
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      setSuccess(true);
    }, 350);
  }

  return (
    <>
      <FigmaCreatePanel
        title="Close Till"
        onClose={() => navigate(pre.id ? `/teller/${pre.id}` : "/teller")}
        hidePrimary
        clearLabel="Close"
        onClear={() => void submit()}
        busy={busy}
      >
        <TillDetailFields
          branch={branch}
          setBranch={setBranch}
          customerId={customerId}
          setCustomerId={setCustomerId}
          currency={currency}
          setCurrency={setCurrency}
          limit={limit}
          setLimit={setLimit}
          longAccount={longAccount}
          setLongAccount={setLongAccount}
          tellerNumber={tellerNumber}
          setTellerNumber={setTellerNumber}
        />
        <FigmaField label="Reason">
          <textarea
            className="fg-control"
            style={{ height: 120, padding: "12px 14px", resize: "vertical" }}
            placeholder="Enter Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </FigmaField>
      </FigmaCreatePanel>
      {success ? (
        <SuccessModal
          title="Till Closed Successfully"
          message="Till has been closed successfully"
          onOkay={() => navigate("/teller")}
        />
      ) : null}
    </>
  );
}

/** Till View.png */
export function TillViewPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [till, setTill] = useState<Till | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const tills = await listTills();
      if (!cancelled) setTill(tills.find((t) => t.id === id) || tills[0] || null);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const q = tillActionQuery({
    id: till?.id || id,
    branch: till?.branchCode,
    customerId: till?.tellerId,
    currency: till?.currency,
    longAccount: till?.ledgerAccountNumber,
    tellerNumber: till?.tellerId,
  });

  const fields: [string, string][] = [
    ["Branch Code", till?.branchCode || "123456"],
    ["Customer Record ID", till?.tellerId || "83732"],
    ["Currency", till?.currency === "NGN" ? "Naira" : till?.currency || "Naira"],
    ["Limit", "N60,000"],
    ["Long Account Name", till?.ledgerAccountNumber || EXAMPLE_NUBAN],
    ["Teller Number", till?.tellerId || "7834"],
    ["Authorization_Status", "Approved"],
    ["Account Status", till?.status?.includes("ACTIVE") ? "Active" : till?.status || "Active"],
    ["Mandate Instruction", "Do touch"],
    ["Date Opened", "July 10, 2022"],
    ["Reason", "Transact"],
    ["Date Created", "July 10, 2022"],
    ["Created By", "Approved"],
    ["Authorized Date", "July 10, 2022"],
    ["Last Modified By", "July 10, 2022"],
    ["Last Modified Date", "July 10, 2022"],
    ["Last Modified Authorized By", "Kenny smith"],
    ["Last Modified Authorized Date", "July 10, 2022"],
    ["System Name", "Macbook"],
    ["System IP", "169.9903.8392"],
  ];

  return (
    <div className="fg-hub">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <button
          type="button"
          className="cta"
          onClick={() => navigate("/teller")}
          style={{ border: "none", background: "none", fontWeight: 700, fontSize: 16, padding: 0 }}
        >
          ← Back
        </button>
        <div className="fg-detail-actions" style={{ marginBottom: 0 }}>
          <button
            type="button"
            className="fg-btn-link cta"
            onClick={() => navigate(`/teller/reactivate?${q}`)}
          >
            Reactivate Till
          </button>
          <button
            type="button"
            className="fg-btn fg-btn-danger-outline cta"
            onClick={() => navigate(`/teller/suspend?${q}`)}
          >
            Suspend Till
          </button>
          <button
            type="button"
            className="fg-btn fg-btn-primary cta"
            onClick={() => navigate(`/teller/update?${q}`)}
          >
            Update Till
          </button>
        </div>
      </div>
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

/* ───────────── Restrict / Vault / Block / Cheque / Memo / Enquiry ───────────── */

type RestrictionFormState = {
  branch: string;
  customerId: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  currency: string;
  entity: string;
  restrictionType: string;
  reason: string;
  startDate: string;
  endDate: string;
  inputter: string;
  approvedBy: string;
};

const RESTRICTION_FORM_DEFAULT: RestrictionFormState = {
  branch: "123- Ikeja Top",
  customerId: "",
  accountNumber: "",
  accountName: "",
  accountType: "",
  currency: "NGN",
  entity: "Customer & Account",
  restrictionType: "No BVN & No NIN",
  reason: "",
  startDate: "",
  endDate: "",
  inputter: "",
  approvedBy: "",
};

const DEMO_RESTRICTIONS = [
  { id: "r1", branch: "123-Ikeja Top", accountNumber: "0123456789", accountType: "Sam Kola", type: "Inactive Account", date: "July 10, 2022", status: "Active" },
  { id: "r2", branch: "123-Ikeja Top", accountNumber: "0123456790", accountType: "Sam Kola", type: "Policy Violation", date: "July 10, 2022", status: "Active" },
  { id: "r3", branch: "123-Ikeja Top", accountNumber: "0123456791", accountType: "Sam Kola", type: "Fraudulent Activity", date: "July 10, 2022", status: "Active" },
  { id: "r4", branch: "123-Ikeja Top", accountNumber: "0123456792", accountType: "Sam Kola", type: "Payment Issue", date: "July 10, 2022", status: "" },
];

function RestrictionFormFields({
  form,
  set,
  readOnly,
  showAudit,
}: {
  form: RestrictionFormState;
  set: (k: keyof RestrictionFormState, v: string) => void;
  readOnly?: boolean;
  showAudit?: boolean;
}) {
  return (
    <>
      <FigmaField label="Branch Details">
        <FigmaInput value={form.branch} onChange={(e) => set("branch", e.target.value)} readOnly={readOnly} />
      </FigmaField>
      <FigmaField label="Customer ID">
        <FigmaInput
          placeholder="Enter Name"
          value={form.customerId}
          onChange={(e) => set("customerId", e.target.value)}
          readOnly={readOnly}
        />
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
        <FigmaInput
          placeholder="Enter ID"
          value={form.accountName}
          onChange={(e) => set("accountName", e.target.value)}
          readOnly={readOnly}
        />
      </FigmaField>
      <FigmaField label="Account type">
        <FigmaInput
          placeholder="Enter type"
          value={form.accountType}
          onChange={(e) => set("accountType", e.target.value)}
          readOnly={readOnly}
        />
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
      <FigmaField label="Entity">
        {readOnly ? (
          <FigmaInput value={form.entity} readOnly />
        ) : (
          <FigmaSelect value={form.entity} onChange={(e) => set("entity", e.target.value)}>
            <option>Customer & Account</option>
            <option>Customer</option>
            <option>Account</option>
          </FigmaSelect>
        )}
      </FigmaField>
      <FigmaField label="Restriction type">
        {readOnly ? (
          <FigmaInput value={form.restrictionType} readOnly />
        ) : (
          <FigmaSelect value={form.restrictionType} onChange={(e) => set("restrictionType", e.target.value)}>
            <option>No BVN & No NIN</option>
            <option>Debit freeze</option>
            <option>Credit freeze</option>
            <option>Total freeze</option>
            <option>Inactive Account</option>
            <option>Policy Violation</option>
            <option>Fraudulent Activity</option>
            <option>Payment Issue</option>
          </FigmaSelect>
        )}
      </FigmaField>
      <FigmaField label="Reason">
        <FigmaInput
          placeholder="Text"
          value={form.reason}
          onChange={(e) => set("reason", e.target.value)}
          readOnly={readOnly}
        />
      </FigmaField>
      <FigmaField label="Restriction Start Date">
        {readOnly ? (
          <FigmaInput value={form.startDate || "—"} readOnly />
        ) : (
          <FigmaDate value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
        )}
      </FigmaField>
      <FigmaField label="Restriction End Date">
        {readOnly ? (
          <FigmaInput value={form.endDate || "—"} readOnly />
        ) : (
          <FigmaDate value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
        )}
      </FigmaField>
      {showAudit ? (
        <>
          <FigmaField label="Input / Modified By">
            <FigmaInput value={form.inputter} readOnly />
          </FigmaField>
          <FigmaField label="Approved By">
            <FigmaInput value={form.approvedBy} readOnly />
          </FigmaField>
        </>
      ) : null}
    </>
  );
}

function useRestrictionForm(seed?: Partial<RestrictionFormState>) {
  const [form, setForm] = useState<RestrictionFormState>({ ...RESTRICTION_FORM_DEFAULT, ...seed });
  const set = (k: keyof RestrictionFormState, v: string) => setForm((f) => ({ ...f, [k]: v }));
  return { form, set, setForm };
}

export function RestrictionManagementPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(async () => {
      try {
        setCustomer(search.trim() ? await findCustomer(search) : null);
      } catch {
        setCustomer(null);
      }
    }, 280);
    return () => window.clearTimeout(t);
  }, [search]);

  async function confirmRemove() {
    if (!removeId) return;
    setBusy(true);
    setError(null);
    try {
      if (!removeId.startsWith("r")) await releaseRestriction(removeId);
      setRemoveId(null);
      setDeleted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Remove failed");
    } finally {
      setBusy(false);
    }
  }

  const q = (row: (typeof DEMO_RESTRICTIONS)[number]) =>
    new URLSearchParams({
      accountNumber: row.accountNumber,
      restrictionType: row.type,
      branch: row.branch,
    }).toString();

  return (
    <>
      <FigmaHubCard
        title="Account Restriction Management"
        search={search}
        onSearch={setSearch}
        primaryLabel="Create Restriction"
        onPrimary={() => navigate("/restrictions/new")}
      >
        {error ? <p className="fg-error">{error}</p> : null}
        <FigmaTable
          wrapClassName="fg-hub-top"
          headers={["Customer Number", "Branch Name", "Customer type", "Customer Name", "Status", "Date Created"]}
        >
          <CustomerSummaryRow c={customer} />
        </FigmaTable>
        <FigmaTable
          peach
          headers={[
            "Branch Name",
            "Account Number",
            "Account Type",
            "Restriction Type",
            "Restriction Date",
            "Restriction Status",
            "",
          ]}
        >
          {customer ? (
            DEMO_RESTRICTIONS.map((row) => (
              <tr key={row.id}>
                <td>{row.branch}</td>
                <td>{row.accountNumber}</td>
                <td>{row.accountType}</td>
                <td>{row.type}</td>
                <td>{row.date}</td>
                <td>{row.status ? statusBadge(row.status, "ok") : null}</td>
                <RowActionCell
                  items={[
                    { label: "View Restriction", onClick: () => navigate(`/restrictions/view?${q(row)}`) },
                    { label: "Modify Restriction", onClick: () => navigate(`/restrictions/modify?${q(row)}`) },
                    {
                      label: "Delete Restriction",
                      onClick: () => navigate(`/restrictions/delete?${q(row)}`),
                      tone: "danger",
                    },
                    { label: "Remove Restriction", onClick: () => setRemoveId(row.id), tone: "warn" },
                  ]}
                />
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} style={{ color: "#9ca3af" }}>
                Search a customer, then manage restrictions
              </td>
            </tr>
          )}
        </FigmaTable>
      </FigmaHubCard>
      {removeId ? (
        <ConfirmRemoveModal
          {...REMOVE_MODAL.restriction}
          onCancel={() => setRemoveId(null)}
          onConfirm={() => void confirmRemove()}
          busy={busy}
        />
      ) : null}
      {deleted ? (
        <SuccessModal {...SUCCESS_MODAL.restrictionDeleted} onOkay={() => setDeleted(false)} />
      ) : null}
    </>
  );
}

export function RestrictionCreateFigmaPage() {
  const navigate = useNavigate();
  const { form, set } = useRestrictionForm();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit() {
    if (!isValidNuban(form.accountNumber)) {
      setError("Enter a valid 10-digit NUBAN account number");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createRestriction(form.accountNumber.trim(), {
        restrictionType: form.restrictionType,
        reason: form.reason.trim() || form.restrictionType,
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
        title="Create Restriction"
        onClose={() => navigate("/restrictions")}
        onSubmit={() => void submit()}
        submitLabel="Restrict"
        busy={busy}
        error={error}
      >
        <RestrictionFormFields form={form} set={set} />
      </FigmaCreatePanel>
      {success ? (
        <SuccessModal
          title="Restriction Created Successfully"
          message="Account restriction has been created successfully"
          onOkay={() => navigate("/restrictions")}
        />
      ) : null}
    </>
  );
}

export function RestrictionModifyPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { form, set } = useRestrictionForm({
    accountNumber: params.get("accountNumber") || "",
    restrictionType: params.get("restrictionType") || "No BVN & No NIN",
    branch: params.get("branch") || "123- Ikeja Top",
  });
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  return (
    <>
      <FigmaCreatePanel
        title="Modify Restriction"
        onClose={() => navigate("/restrictions")}
        onSubmit={() => {
          setBusy(true);
          window.setTimeout(() => {
            setBusy(false);
            setSuccess(true);
          }, 350);
        }}
        submitLabel="Modify"
        busy={busy}
      >
        <RestrictionFormFields form={form} set={set} />
      </FigmaCreatePanel>
      {success ? (
        <SuccessModal
          title="Restriction Modified Successfully"
          message="Account restriction has been modified successfully"
          onOkay={() => navigate("/restrictions")}
        />
      ) : null}
    </>
  );
}

export function RestrictionDeletePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { form, set } = useRestrictionForm({
    accountNumber: params.get("accountNumber") || "",
    restrictionType: params.get("restrictionType") || "",
    branch: params.get("branch") || "123- Ikeja Top",
    startDate: "23-3-22",
    endDate: "23-3-24",
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);

  return (
    <>
      <FigmaCreatePanel
        title="Delete Restriction"
        onClose={() => navigate("/restrictions")}
        onSubmit={() => setConfirmOpen(true)}
        submitLabel="Delete Restriction"
      >
        <RestrictionFormFields form={form} set={set} readOnly />
      </FigmaCreatePanel>
      {confirmOpen ? (
        <ConfirmRemoveModal
          {...REMOVE_MODAL.restriction}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            setDeleted(true);
          }}
        />
      ) : null}
      {deleted ? (
        <SuccessModal {...SUCCESS_MODAL.restrictionDeleted} onOkay={() => navigate("/restrictions")} />
      ) : null}
    </>
  );
}

export function RestrictionViewPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { form, set } = useRestrictionForm({
    accountNumber: params.get("accountNumber") || "",
    restrictionType: params.get("restrictionType") || "",
    branch: params.get("branch") || "123- Ikeja Top",
    startDate: "23-3-22",
    endDate: "23-3-24",
    inputter: "Emeka obicha",
    approvedBy: "Mr Oscar",
  });

  return (
    <FigmaCreatePanel
      title="View Restriction"
      onClose={() => navigate("/restrictions")}
      hidePrimary
      clearLabel="Close"
    >
      <RestrictionFormFields form={form} set={set} readOnly showAudit />
    </FigmaCreatePanel>
  );
}

export function VaultManagementPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<
    { id: string; branchCode: string; currency: string; status: string; ledgerAccountNumber?: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const vaults = await listVaults();
        if (!cancelled) {
          const q = search.trim().toLowerCase();
          setRows(q ? vaults.filter((v) => v.branchCode.toLowerCase().includes(q)) : vaults);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Unable to load vaults");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [search]);

  return (
    <FigmaHubCard
      title="Vault Management"
      subtitle="Vault account report"
      search={search}
      onSearch={setSearch}
      searchPlaceholder="Search by branch code"
      primaryLabel="Create Vault"
      onPrimary={() => navigate("/teller/vault-create")}
    >
      {error ? <p className="fg-error">{error}</p> : null}
      <FigmaTable
        headers={[
          "Branch Name",
          "Vault Account",
          "Currrency",
          "Date Created",
          "Status",
          "Date of last Transaction",
          "",
        ]}
      >
        {rows.length === 0 ? (
          <tr>
            <td colSpan={7} style={{ color: "#9ca3af" }}>
              No vaults yet
            </td>
          </tr>
        ) : (
          rows.map((v) => (
            <tr key={v.id}>
              <td>{v.branchCode}</td>
              <td>{v.ledgerAccountNumber || v.id.slice(0, 8)}</td>
              <td>{v.currency}</td>
              <td>—</td>
              <td>{statusBadge(v.status === "ACTIVE" ? "Active" : v.status, "ok")}</td>
              <td>—</td>
              <RowActionCell
                items={[
                  {
                    label: "View Vault",
                    onClick: () => navigate(`/vault/${v.id}`),
                  },
                  {
                    label: "Update Insurance Limit",
                    onClick: () =>
                      navigate(
                        `/teller/vault-insurance?${vaultActionQuery({
                          id: v.id,
                          branch: v.branchCode,
                          accountNumber: v.ledgerAccountNumber,
                          currency: v.currency,
                        })}`,
                      ),
                  },
                  {
                    label: "Reactivate Vault",
                    onClick: () =>
                      navigate(
                        `/teller/vault-reactivate?${vaultActionQuery({
                          id: v.id,
                          branch: v.branchCode,
                          accountNumber: v.ledgerAccountNumber,
                          currency: v.currency,
                        })}`,
                      ),
                  },
                  {
                    label: "Suspend Vault",
                    onClick: () =>
                      navigate(
                        `/teller/vault-suspend?${vaultActionQuery({
                          id: v.id,
                          branch: v.branchCode,
                          accountNumber: v.ledgerAccountNumber,
                          currency: v.currency,
                        })}`,
                      ),
                    tone: "warn",
                  },
                  {
                    label: "Close Vault",
                    onClick: () =>
                      navigate(
                        `/teller/vault-close?${vaultActionQuery({
                          id: v.id,
                          branch: v.branchCode,
                          accountNumber: v.ledgerAccountNumber,
                          currency: v.currency,
                        })}`,
                      ),
                    tone: "danger",
                  },
                ]}
              />
            </tr>
          ))
        )}
      </FigmaTable>
    </FigmaHubCard>
  );
}

function vaultActionQuery(opts: {
  id?: string;
  branch?: string;
  accountNumber?: string;
  currency?: string;
  limit?: string;
}) {
  const q = new URLSearchParams();
  if (opts.id) q.set("id", opts.id);
  if (opts.branch) q.set("branch", opts.branch);
  if (opts.accountNumber) q.set("accountNumber", opts.accountNumber);
  if (opts.currency) q.set("currency", opts.currency);
  if (opts.limit) q.set("limit", opts.limit);
  return q.toString();
}

function useVaultFormPrefill() {
  const [params] = useSearchParams();
  return {
    id: params.get("id") || "",
    branch: params.get("branch") || "HQ01",
    accountNumber: params.get("accountNumber") || "",
    currency: params.get("currency") || "NGN",
    limit: params.get("limit") || "",
  };
}

function VaultAccountFields({
  branch,
  setBranch,
  accountNumber,
  setAccountNumber,
  currency,
  setCurrency,
  limit,
  setLimit,
  limitLabel = "Limit (Amount)",
}: {
  branch: string;
  setBranch: (v: string) => void;
  accountNumber: string;
  setAccountNumber: (v: string) => void;
  currency: string;
  setCurrency: (v: string) => void;
  limit: string;
  setLimit: (v: string) => void;
  limitLabel?: string;
}) {
  return (
    <>
      <FigmaField label="Branch">
        <FigmaSelect value={branch} onChange={(e) => setBranch(e.target.value)}>
          <option value="">Select</option>
          <option value="HQ01">HQ01</option>
          <option value="HQ">HQ</option>
          <option value="232">232-Ikeja Top</option>
        </FigmaSelect>
      </FigmaField>
      <FigmaField label="Account Number">
        <FigmaInput
          placeholder={NUBAN_PLACEHOLDER}
          inputMode="numeric"
          maxLength={NUBAN_LENGTH}
          value={accountNumber}
          onChange={(e) => setAccountNumber(sanitizeNubanInput(e.target.value))}
        />
      </FigmaField>
      <FigmaField label="Currency">
        <FigmaSelect value={currency} onChange={(e) => setCurrency(e.target.value)}>
          <option value="">Select</option>
          <option value="NGN">NGN</option>
          <option value="USD">USD</option>
        </FigmaSelect>
      </FigmaField>
      <FigmaField label={limitLabel}>
        <FigmaInput placeholder="Enter Limit" value={limit} onChange={(e) => setLimit(e.target.value)} />
      </FigmaField>
    </>
  );
}

/** Till creation-1 — Create Vault Account */
export function VaultCreateFigmaPage() {
  const navigate = useNavigate();
  const [branch, setBranch] = useState("HQ01");
  const [accountNumber, setAccountNumber] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [limit, setLimit] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await createVault({ branchCode: branch.trim().toUpperCase(), currency });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <FigmaCreatePanel
        title="Create Vault Account"
        onClose={() => navigate("/vault")}
        onSubmit={() => void submit()}
        submitLabel="Create"
        busy={busy}
        error={error}
      >
        <VaultAccountFields
          branch={branch}
          setBranch={setBranch}
          accountNumber={accountNumber}
          setAccountNumber={setAccountNumber}
          currency={currency}
          setCurrency={setCurrency}
          limit={limit}
          setLimit={setLimit}
          limitLabel="Insurance Limit"
        />
      </FigmaCreatePanel>
      {success ? (
        <SuccessModal
          title="Vault Created Successfully"
          message="Vault has been created successfully"
          onOkay={() => navigate("/vault")}
        />
      ) : null}
    </>
  );
}

/** Till creation-3 — Reactivate Vault Account */
export function VaultReactivateFigmaPage() {
  const navigate = useNavigate();
  const pre = useVaultFormPrefill();
  const [branch, setBranch] = useState(pre.branch);
  const [accountNumber, setAccountNumber] = useState(pre.accountNumber);
  const [currency, setCurrency] = useState(pre.currency);
  const [limit, setLimit] = useState(pre.limit);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  return (
    <>
      <FigmaCreatePanel
        title="Reactivate Vault Account"
        onClose={() => navigate(pre.id ? `/vault/${pre.id}` : "/vault")}
        submitLabel="Reactivate"
        busy={busy}
        onSubmit={() => {
          setBusy(true);
          window.setTimeout(() => {
            setBusy(false);
            setSuccess(true);
          }, 350);
        }}
      >
        <VaultAccountFields
          branch={branch}
          setBranch={setBranch}
          accountNumber={accountNumber}
          setAccountNumber={setAccountNumber}
          currency={currency}
          setCurrency={setCurrency}
          limit={limit}
          setLimit={setLimit}
        />
        <FigmaField label="Reason">
          <FigmaInput placeholder="text" value={reason} onChange={(e) => setReason(e.target.value)} />
        </FigmaField>
      </FigmaCreatePanel>
      {success ? (
        <SuccessModal
          title="Vault Reactivated Successfully"
          message="Vault account has been reactivated successfully"
          onOkay={() => navigate(pre.id ? `/vault/${pre.id}` : "/vault")}
        />
      ) : null}
    </>
  );
}

/** Till creation-5 — Suspend Vault Account */
export function VaultSuspendFigmaPage() {
  const navigate = useNavigate();
  const pre = useVaultFormPrefill();
  const [branch, setBranch] = useState(pre.branch);
  const [accountNumber, setAccountNumber] = useState(pre.accountNumber);
  const [currency, setCurrency] = useState(pre.currency);
  const [limit, setLimit] = useState(pre.limit);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  return (
    <>
      <FigmaCreatePanel
        title="Suspend Vault Account"
        onClose={() => navigate(pre.id ? `/vault/${pre.id}` : "/vault")}
        submitLabel="Suspend"
        busy={busy}
        onSubmit={() => {
          setBusy(true);
          window.setTimeout(() => {
            setBusy(false);
            setSuccess(true);
          }, 350);
        }}
      >
        <VaultAccountFields
          branch={branch}
          setBranch={setBranch}
          accountNumber={accountNumber}
          setAccountNumber={setAccountNumber}
          currency={currency}
          setCurrency={setCurrency}
          limit={limit}
          setLimit={setLimit}
        />
        <FigmaField label="Reason">
          <textarea
            className="fg-control"
            style={{ height: 120, padding: "12px 14px", resize: "vertical" }}
            placeholder="Enter Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </FigmaField>
      </FigmaCreatePanel>
      {success ? (
        <SuccessModal
          title="Vault Suspended Successfully"
          message="Vault account has been suspended successfully"
          onOkay={() => navigate(pre.id ? `/vault/${pre.id}` : "/vault")}
        />
      ) : null}
    </>
  );
}

/** Till creation-6 — Update Insurance Limit */
export function VaultInsuranceLimitFigmaPage() {
  const navigate = useNavigate();
  const pre = useVaultFormPrefill();
  const [branch, setBranch] = useState(pre.branch);
  const [accountNumber, setAccountNumber] = useState(pre.accountNumber);
  const [currency, setCurrency] = useState(pre.currency);
  const [limit, setLimit] = useState(pre.limit);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  return (
    <>
      <FigmaCreatePanel
        title="Update Insurance Limit"
        onClose={() => navigate(pre.id ? `/vault/${pre.id}` : "/vault")}
        submitLabel="Update"
        busy={busy}
        onSubmit={() => {
          setBusy(true);
          window.setTimeout(() => {
            setBusy(false);
            setSuccess(true);
          }, 350);
        }}
      >
        <VaultAccountFields
          branch={branch}
          setBranch={setBranch}
          accountNumber={accountNumber}
          setAccountNumber={setAccountNumber}
          currency={currency}
          setCurrency={setCurrency}
          limit={limit}
          setLimit={setLimit}
        />
      </FigmaCreatePanel>
      {success ? (
        <SuccessModal
          title="Insurance Limit Updated Successfully"
          message="Vault insurance limit has been updated successfully"
          onOkay={() => navigate(pre.id ? `/vault/${pre.id}` : "/vault")}
        />
      ) : null}
    </>
  );
}

/** Till creation-8 — Close Vault Account */
export function VaultCloseFigmaPage() {
  const navigate = useNavigate();
  const pre = useVaultFormPrefill();
  const [branch, setBranch] = useState(pre.branch);
  const [accountNumber, setAccountNumber] = useState(pre.accountNumber);
  const [currency, setCurrency] = useState(pre.currency);
  const [limit, setLimit] = useState(pre.limit);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  function submit() {
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      setSuccess(true);
    }, 350);
  }

  return (
    <>
      <FigmaCreatePanel
        title="Close Vault Account"
        onClose={() => navigate(pre.id ? `/vault/${pre.id}` : "/vault")}
        hidePrimary
        clearLabel="Close"
        onClear={() => void submit()}
        busy={busy}
      >
        <VaultAccountFields
          branch={branch}
          setBranch={setBranch}
          accountNumber={accountNumber}
          setAccountNumber={setAccountNumber}
          currency={currency}
          setCurrency={setCurrency}
          limit={limit}
          setLimit={setLimit}
        />
        <FigmaField label="Reason">
          <textarea
            className="fg-control"
            style={{ height: 120, padding: "12px 14px", resize: "vertical" }}
            placeholder="Enter Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </FigmaField>
      </FigmaCreatePanel>
      {success ? (
        <SuccessModal
          title="Vault Closed Successfully"
          message="Vault account has been closed successfully"
          onOkay={() => navigate("/vault")}
        />
      ) : null}
    </>
  );
}

export function VaultViewPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [vault, setVault] = useState<{
    id: string;
    branchCode: string;
    currency: string;
    status: string;
    ledgerAccountNumber?: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const vaults = await listVaults();
      if (!cancelled) setVault(vaults.find((v) => v.id === id) || vaults[0] || null);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const q = vaultActionQuery({
    id: vault?.id || id,
    branch: vault?.branchCode,
    accountNumber: vault?.ledgerAccountNumber,
    currency: vault?.currency,
  });

  const fields: [string, string][] = [
    ["Branch Code", vault?.branchCode || "—"],
    ["Account Number", vault?.ledgerAccountNumber || EXAMPLE_NUBAN],
    ["Currency", vault?.currency === "NGN" ? "Naira" : vault?.currency || "—"],
    ["Insurance Limit", "—"],
    ["Account Status", vault?.status?.includes("ACTIVE") ? "Active" : vault?.status || "—"],
    ["Date Created", "—"],
  ];

  return (
    <div className="fg-hub">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <button
          type="button"
          className="cta"
          onClick={() => navigate("/vault")}
          style={{ border: "none", background: "none", fontWeight: 700, fontSize: 16, padding: 0 }}
        >
          ← Back
        </button>
        <div className="fg-detail-actions" style={{ marginBottom: 0 }}>
          <button type="button" className="fg-btn-link cta" onClick={() => navigate(`/teller/vault-reactivate?${q}`)}>
            Reactivate Vault
          </button>
          <button
            type="button"
            className="fg-btn fg-btn-danger-outline cta"
            onClick={() => navigate(`/teller/vault-suspend?${q}`)}
          >
            Suspend Vault
          </button>
          <button
            type="button"
            className="fg-btn fg-btn-primary cta"
            onClick={() => navigate(`/teller/vault-insurance?${q}`)}
          >
            Update Insurance Limit
          </button>
        </div>
      </div>
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

export function BlockFundsManagementPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removedOk, setRemovedOk] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(async () => {
      try {
        setCustomer(search.trim() ? await findCustomer(search) : null);
      } catch {
        setCustomer(null);
      }
    }, 280);
    return () => window.clearTimeout(t);
  }, [search]);

  return (
    <>
      <FigmaHubCard
        title="Block Funds Management"
        search={search}
        onSearch={setSearch}
        primaryLabel="Create Block Fund"
        onPrimary={() => navigate("/liens/new")}
      >
        <FigmaTable
          wrapClassName="fg-hub-top"
          headers={["Customer Number", "Branch Name", "Customer type", "Customer Name", "Status", "Date Created"]}
        >
          <CustomerSummaryRow c={customer} />
        </FigmaTable>
        <FigmaTable
          peach
          headers={["Branch Name", "Account Number", "Account Type", "Account Open Date", "Block Amount", "Account Balance", ""]}
        >
          {customer ? (
            <tr>
              <td>{customer.branchCode}</td>
              <td>—</td>
              <td>—</td>
              <td>{formatDate(customer.createdAt)}</td>
              <td>N0.00</td>
              <td>—</td>
              <RowActionCell
                items={[
                  { label: "View Block Fund", onClick: () => navigate("/liens/view") },
                  { label: "Modify Lien Account", onClick: () => navigate("/liens/modify") },
                  { label: "Remove Block Fund", onClick: () => setRemoveOpen(true), tone: "danger" },
                ]}
              />
            </tr>
          ) : (
            <tr>
              <td colSpan={7} style={{ color: "#9ca3af" }}>
                Search a customer to view blocked funds
              </td>
            </tr>
          )}
        </FigmaTable>
      </FigmaHubCard>
      {removeOpen ? (
        <ConfirmRemoveModal
          {...REMOVE_MODAL.blockFund}
          onCancel={() => setRemoveOpen(false)}
          onConfirm={() => {
            setRemoveOpen(false);
            setRemovedOk(true);
          }}
        />
      ) : null}
      {removedOk ? (
        <SuccessModal {...SUCCESS_MODAL.blockFundDeleted} onOkay={() => setRemovedOk(false)} />
      ) : null}
    </>
  );
}

export function BlockFundCreateFigmaPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    branch: "123- Ikeja Top",
    customerId: "",
    accountNumber: "",
    accountName: "",
    accountType: "",
    currency: "NGN",
    balance: "0.00",
    lienType: "Customer instruction",
    reason: "",
    amount: "0.00",
    startDate: "",
    endDate: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    if (!isValidNuban(form.accountNumber)) {
      setError("Enter a valid 10-digit NUBAN account number");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const placed = await placeLien(form.accountNumber.trim(), {
        amount: Number(form.amount) || 0,
        reason: form.reason.trim() || form.lienType,
        reference: `BF-${Date.now()}`,
      });
      try {
        await applyLien(placed.id);
      } catch {
        /* pending apply is fine */
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <FigmaCreatePanel
        title="Create Block Fund"
        onClose={() => navigate("/liens")}
        onSubmit={() => {
          if (!isValidNuban(form.accountNumber)) {
            setError("Enter a valid 10-digit NUBAN account number");
            return;
          }
          setConfirmOpen(true);
        }}
        submitLabel="Create"
        busy={busy}
        error={error}
      >
        {(
          [
            ["Branch Details", "branch", "text"],
            ["Customer ID", "customerId", "text"],
            ["Account Number", "accountNumber", "text"],
            ["Account Name", "accountName", "text"],
            ["Account type", "accountType", "text"],
            ["Currency", "currency", "select"],
            ["Available Balance", "balance", "text"],
            ["Lien Type", "lienType", "selectLien"],
            ["Reason", "reason", "text"],
            ["Lien Amount", "amount", "text"],
            ["Start Date", "startDate", "date"],
            ["End Date", "endDate", "date"],
          ] as const
        ).map(([label, key, kind]) => (
          <FigmaField key={key} label={label}>
            {kind === "date" ? (
              <FigmaDate value={form[key]} onChange={(e) => set(key, e.target.value)} />
            ) : kind === "select" ? (
              <FigmaSelect value={form[key]} onChange={(e) => set(key, e.target.value)}>
                <option>NGN</option>
                <option>USD</option>
              </FigmaSelect>
            ) : kind === "selectLien" ? (
              <FigmaSelect value={form[key]} onChange={(e) => set(key, e.target.value)}>
                <option>Customer instruction</option>
                <option>Court order</option>
                <option>Internal hold</option>
              </FigmaSelect>
            ) : (
              <FigmaInput value={form[key]} onChange={(e) => set(key, e.target.value)} />
            )}
          </FigmaField>
        ))}
      </FigmaCreatePanel>
      {confirmOpen ? (
        <ConfirmRemoveModal
          {...REMOVE_MODAL.blockFundCreate}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            void submit();
          }}
          busy={busy}
        />
      ) : null}
      {success ? (
        <SuccessModal {...SUCCESS_MODAL.blockFundCreated} onOkay={() => navigate("/liens")} />
      ) : null}
    </>
  );
}

type BlockFundFormState = {
  branch: string;
  customerId: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  currency: string;
  balance: string;
  lienType: string;
  reason: string;
  amount: string;
  startDate: string;
  endDate: string;
};

const BLOCK_FUND_DEFAULT: BlockFundFormState = {
  branch: "123- Ikeja Top",
  customerId: "",
  accountNumber: "",
  accountName: "",
  accountType: "",
  currency: "NGN",
  balance: "0.00",
  lienType: "Customer instruction",
  reason: "",
  amount: "0.00",
  startDate: "",
  endDate: "",
};

function BlockFundFormFields({
  form,
  set,
  readOnly,
}: {
  form: BlockFundFormState;
  set: (k: keyof BlockFundFormState, v: string) => void;
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
      <FigmaField label="Available Balance">
        <FigmaInput placeholder="0.00" value={form.balance} onChange={(e) => set("balance", e.target.value)} readOnly={readOnly} />
      </FigmaField>
      <FigmaField label="Lien Type">
        {readOnly ? (
          <FigmaInput value={form.lienType} readOnly />
        ) : (
          <FigmaSelect value={form.lienType} onChange={(e) => set("lienType", e.target.value)}>
            <option>Customer instruction</option>
            <option>Court order</option>
            <option>Internal hold</option>
            <option>Customer & Account</option>
          </FigmaSelect>
        )}
      </FigmaField>
      <FigmaField label="Reason">
        <FigmaInput placeholder="Text" value={form.reason} onChange={(e) => set("reason", e.target.value)} readOnly={readOnly} />
      </FigmaField>
      <FigmaField label="Lien Amount">
        <FigmaInput placeholder="0.00" value={form.amount} onChange={(e) => set("amount", e.target.value)} readOnly={readOnly} />
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

export function BlockFundModifyPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(BLOCK_FUND_DEFAULT);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const set = (k: keyof BlockFundFormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <>
      <FigmaCreatePanel
        title="Modify Lien Account"
        onClose={() => navigate("/liens")}
        onSubmit={() => {
          setBusy(true);
          window.setTimeout(() => {
            setBusy(false);
            setSuccess(true);
          }, 350);
        }}
        submitLabel="Modify"
        busy={busy}
      >
        <BlockFundFormFields form={form} set={set} />
      </FigmaCreatePanel>
      {success ? (
        <SuccessModal
          title="Lien Modified Successfully"
          message="Block fund has been modified successfully"
          onOkay={() => navigate("/liens")}
        />
      ) : null}
    </>
  );
}

export function BlockFundViewPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    ...BLOCK_FUND_DEFAULT,
    lienType: "Customer & Account",
    reason: "Text",
  });
  const set = (k: keyof BlockFundFormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <FigmaCreatePanel title="View Block Fund" onClose={() => navigate("/liens")} hidePrimary clearLabel="Close">
      <BlockFundFormFields form={form} set={set} readOnly />
    </FigmaCreatePanel>
  );
}

export {
  AccountManagementFigmaPage,
  ChequeManagementPage,
  ChequeUploadPage,
  MemoManagementPage,
} from "./FigmaAccountChequeMemo";

export function EnquiryManagementPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [search, setSearch] = useState(() => params.get("q") || "");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const q = params.get("q");
    if (q != null) setSearch(q);
  }, [params]);

  useEffect(() => {
    const t = window.setTimeout(async () => {
      const q = search.trim();
      if (!q) {
        setCustomer(null);
        setSearched(false);
        return;
      }
      try {
        setCustomer(await findCustomer(q));
      } catch {
        setCustomer(null);
      } finally {
        setSearched(true);
      }
    }, 280);
    return () => window.clearTimeout(t);
  }, [search]);

  const demoAccounts = [
    { branch: "123-Ikeja Top", nuban: "0123456789", type: "Sam Kola", currency: "NGN", balance: "NGN 80,000", note: "Inactive Account" },
    { branch: "123-Ikeja Top", nuban: "0123456790", type: "Sam Kola", currency: "Dollors", balance: "NGN 80,000", note: "Policy Violation" },
    { branch: "123-Ikeja Top", nuban: "0123456791", type: "Sam Kola", currency: "NGN", balance: "NGN 80,000", note: "Fraudulent Activity" },
    { branch: "123-Ikeja Top", nuban: "0123456792", type: "Sam Kola", currency: "NGN", balance: "NGN 80,000", note: "Payment Issue" },
  ];

  return (
    <FigmaHubCard
      title="Enquiry Report Management"
      search={search}
      onSearch={setSearch}
      primaryLabel="Find Customer"
      onPrimary={() => navigate("/enquiries/new")}
      toolbarSwap
      primaryLink={
        <button
          type="button"
          className="fg-btn fg-btn-outline cta"
          onClick={() => navigate("/enquiries/statement")}
        >
          Generate Account Statement
        </button>
      }
    >
      <FigmaTable
        wrapClassName="fg-hub-top fg-enquiry-top"
        headers={["Customer Number", "Branch Name", "Customer type", "Customer Name", "Status", "Date Created"]}
      >
        {customer ? (
          <CustomerSummaryRow c={customer} />
        ) : searched ? (
          <tr>
            <td colSpan={6} style={{ color: "#9ca3af" }}>
              No customer found — try another name or ID
            </td>
          </tr>
        ) : (
          <>
            <tr>
              <td>637373</td>
              <td>123-Ikeja Top</td>
              <td>Individual</td>
              <td>Sam Kola</td>
              <td>{statusBadge("Active", "ok")}</td>
              <td>July 10, 2022</td>
            </tr>
            {Array.from({ length: 3 }).map((_, i) => (
              <tr key={`enq-pad-${i}`} className="fg-pad-row" aria-hidden>
                <td colSpan={6}>&nbsp;</td>
              </tr>
            ))}
          </>
        )}
      </FigmaTable>

      <FigmaTable
        peach
        headers={["Branch Name", "NUBAN", "Account Type", "Currency", "Available Balance", "Account Status", "Last Transaction Date", ""]}
      >
        {customer ? (
          <tr>
            <td>{customer.branchCode}</td>
            <td>{customer.cifNumber || customer.id.slice(0, 8)}</td>
            <td>{customer.displayName}</td>
            <td>NGN</td>
            <td>—</td>
            <td>{statusBadge("Active", "ok")}</td>
            <td>—</td>
            <td>
              <Link
                to={`/enquiries/overview?${new URLSearchParams({
                  account: customer.cifNumber || customer.id.slice(0, 8),
                  owner: customer.displayName || [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "—",
                  branch: customer.branchCode || "",
                  customerId: customer.cifNumber || customer.id,
                }).toString()}`}
                className="fg-enquiry-view"
              >
                View
              </Link>
            </td>
          </tr>
        ) : (
          demoAccounts.map((a) => (
            <tr key={a.nuban}>
              <td>{a.branch}</td>
              <td>{a.nuban}</td>
              <td>{a.type}</td>
              <td>{a.currency}</td>
              <td>{a.balance}</td>
              <td>{statusBadge("Active", "ok")}</td>
              <td>{a.note}</td>
              <td>
                <Link
                  to={`/enquiries/overview?${new URLSearchParams({
                    account: a.nuban,
                    owner: a.type,
                    branch: a.branch,
                    customerId: "634001966",
                  }).toString()}`}
                  className="fg-enquiry-view"
                >
                  View
                </Link>
              </td>
            </tr>
          ))
        )}
      </FigmaTable>
    </FigmaHubCard>
  );
}

/** Restriction Management -1.png → Enquiry Report Management - Overview */
export function EnquiryOverviewPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const accountParam = params.get("account") || "0112213334";
  const ownerParam = params.get("owner") || "Oscar Micheal";
  const branchParam = params.get("branch") || "Airport Road - IKJ";
  const customerIdParam = params.get("customerId") || "634001966";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState<{
    accountNumber: string;
    product: string;
    currency: string;
    branch: string;
    status: string;
    createdAt?: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAccountEnquiry(accountParam);
        if (cancelled) return;
        setLive({
          accountNumber: data.account.accountNumber,
          product: data.account.productCode || "Savings - Regular",
          currency: data.account.currency || "NGN",
          branch: data.account.branchCode || branchParam,
          status: data.account.status || "Active",
          createdAt: data.account.createdAt,
        });
      } catch (err) {
        if (!cancelled) {
          setLive(null);
          if (err instanceof ApiError) setError(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accountParam, branchParam]);

  const accountNumber = live?.accountNumber || accountParam;
  const currency = live?.currency || "NGN";
  const product = live?.product?.includes("Savings") ? live.product : live?.product || "Savings - Regular";
  const branch = live?.branch || branchParam;
  const acStatus = live?.status === "ACTIVE" || live?.status === "Active" ? "Active" : live?.status || "Active";
  const arrangementDate = live?.createdAt
    ? new Date(live.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()
    : "26 APR 2016";

  const summaryLeft: [string, string][] = [
    ["Arrangement", `AA${accountNumber.replace(/\D/g, "").slice(0, 8) || "16117VTZ"}4n`],
    ["Product", product],
    ["Owner", ownerParam],
    ["Branch", branch],
  ];
  const summaryRight: [string, string][] = [
    ["Account", `${accountNumber} - ${currency}`],
    ["Arrangement Date", arrangementDate],
    ["Orig Contract Date", arrangementDate],
    ["Status", "Authorised"],
    ["Ac Status", acStatus],
  ];

  const customerFields: [string, string][] = [
    ["Owner ID", customerIdParam.replace(/\D/g, "").slice(0, 6) || "345742"],
    ["BVN", "22116422411"],
    ["Co-Owner", ""],
    ["NIN", "4004510600"],
    ["Customer Status", "Individual Staff"],
  ];

  const accountStatusFields: [string, string][] = [
    ["Title", ownerParam],
    ["Primary Officer", "Babalola . ouiw"],
  ];

  const interestFields: [string, string][] = [
    ["Credit Interest", "Single Rate"],
    ["", "Variable 5.67% (Saving Act Group)"],
    ["Schedule", "Interest / Credit Interest"],
    ["", "Capitalised Monthly on the last Fri of the month"],
  ];

  const accountDetails: [string, string][] = [
    ["Ledger Balance", "1,378.56"],
    ["Cleared Balance", "1,378.56"],
    ["Working Balance", "378.56"],
    ["Account Unauthorised Balance", "0.00"],
  ];

  const fundsAvailability: [string, string][] = [
    ["Date", ""],
    ["Credits/Debits", "0.00"],
    ["Available", "1,378.56"],
  ];

  return (
    <div className="fg-hub fg-enquiry-overview">
      <button type="button" className="fg-mandate-back cta" onClick={() => navigate("/enquiries")}>
        ← Back
      </button>

      <div className="fg-enquiry-ov-titlebar">
        <h1>Enquiry Report Management - Overview</h1>
        <div className="fg-enquiry-ov-actions">
          <button
            type="button"
            className="fg-btn fg-btn-outline cta"
            onClick={() =>
              navigate(
                `/enquiries/statement?account=${encodeURIComponent(accountNumber)}`,
              )
            }
          >
            Generate Account Statement
          </button>
          <button
            type="button"
            className="fg-btn fg-btn-primary cta"
            onClick={() => navigate("/enquiries/transaction-report")}
          >
            Generate Transaction Report
          </button>
        </div>
      </div>

      {loading ? <p style={{ color: "#98a2b3" }}>Loading account…</p> : null}
      {error ? <p className="fg-error">{error}</p> : null}

      <div className="fg-enquiry-ov-card">
        <div className="fg-enquiry-ov-summary">
          <div className="fg-enquiry-ov-summary-col">
            {summaryLeft.map(([label, value]) => (
              <div key={label} className="fg-enquiry-ov-kv">
                <span className="label">{label}</span>
                <span className="value">{value}</span>
              </div>
            ))}
          </div>
          <div className="fg-enquiry-ov-summary-col">
            {summaryRight.map(([label, value]) => (
              <div key={label} className="fg-enquiry-ov-kv">
                <span className="label">{label}</span>
                <span className="value">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="fg-enquiry-ov-band">{customerIdParam}</div>

        <div className="fg-enquiry-ov-body">
          <div className="fg-enquiry-ov-main">
            <section className="fg-enquiry-ov-section">
              <h2>Customer Information</h2>
              <div className="fg-enquiry-ov-grid">
                {customerFields.map(([label, value]) => (
                  <div key={label} className="fg-enquiry-ov-kv">
                    <span className="label">{label}</span>
                    <span className="value">{value || "\u00a0"}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="fg-enquiry-ov-section">
              <h2>Account Status</h2>
              <div className="fg-enquiry-ov-grid">
                {accountStatusFields.map(([label, value]) => (
                  <div key={label} className="fg-enquiry-ov-kv">
                    <span className="label">{label}</span>
                    <span className="value">{value}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="fg-enquiry-ov-section">
              <h2>Interest</h2>
              <div className="fg-enquiry-ov-interest">
                {interestFields.map(([label, value], i) =>
                  label ? (
                    <div key={`${label}-${i}`} className="fg-enquiry-ov-kv">
                      <span className="label">{label}</span>
                      <span className="value">{value}</span>
                    </div>
                  ) : (
                    <p key={`sub-${i}`} className="fg-enquiry-ov-sub">
                      {value}
                    </p>
                  ),
                )}
              </div>
            </section>
          </div>

          <aside className="fg-enquiry-ov-aside">
            <div className="fg-enquiry-ov-panel">
              <div className="fg-enquiry-ov-panel-head">Account Details</div>
              <div className="fg-enquiry-ov-panel-body">
                {accountDetails.map(([label, value]) => (
                  <div key={label} className="fg-enquiry-ov-panel-row">
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </div>
            <div className="fg-enquiry-ov-panel">
              <div className="fg-enquiry-ov-panel-head">Funds Availability</div>
              <div className="fg-enquiry-ov-panel-body">
                {fundsAvailability.map(([label, value]) => (
                  <div key={label} className="fg-enquiry-ov-panel-row">
                    <span>{label}</span>
                    <strong>{value || "\u00a0"}</strong>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/** Find Customer (Frame 1618868195) — Enquiry hub primary CTA */
export function FindCustomerPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    customerRecordNumber: "",
    accountNumber: "",
    bvn: "",
    email: "",
    nin: "",
    mobileNumber: "",
    tin: "",
    regNumber: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function search() {
    const q =
      form.customerRecordNumber.trim() ||
      form.accountNumber.trim() ||
      form.bvn.trim() ||
      form.email.trim() ||
      form.nin.trim() ||
      form.mobileNumber.trim() ||
      form.tin.trim() ||
      form.regNumber.trim();
    if (!q) {
      setError("Enter at least one search field");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const page = await searchCustomers({
        ...(form.customerRecordNumber.trim()
          ? { cifNumber: form.customerRecordNumber.trim() }
          : form.email.trim()
            ? { name: form.email.trim() }
            : /^\d+$/.test(q) || q.toUpperCase().startsWith("CIF")
              ? { cifNumber: q }
              : { name: q }),
        page: 0,
        size: 5,
      });
      const hit = page.content?.[0];
      const resultQ = hit?.cifNumber || hit?.displayName || q;
      navigate(`/enquiries?q=${encodeURIComponent(resultQ)}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Search failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fg-wizard">
      <div className="fg-wizard-bar" style={{ justifyContent: "flex-end" }}>
        <button type="button" className="fg-close cta" onClick={() => navigate("/enquiries")} aria-label="Close">
          ×
        </button>
      </div>
      <div className="fg-body fg-find-customer">
        <h1 className="fg-find-customer-title">Find Customer</h1>
        <FigmaRow>
          <FigmaField label="Customer Record Number">
            <FigmaInput
              placeholder="123- Ikeja Top"
              value={form.customerRecordNumber}
              onChange={(e) => set("customerRecordNumber", e.target.value)}
            />
          </FigmaField>
          <FigmaField label="Account Number">
            <FigmaInput
              placeholder={NUBAN_PLACEHOLDER}
              inputMode="numeric"
              maxLength={NUBAN_LENGTH}
              value={form.accountNumber}
              onChange={(e) => set("accountNumber", sanitizeNubanInput(e.target.value))}
            />
          </FigmaField>
        </FigmaRow>
        <FigmaRow>
          <FigmaField label="BVN">
            <FigmaInput placeholder="Enter BVN" value={form.bvn} onChange={(e) => set("bvn", e.target.value)} />
          </FigmaField>
          <FigmaField label="Email">
            <FigmaInput
              placeholder="Enter email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </FigmaField>
        </FigmaRow>
        <FigmaRow>
          <FigmaField label="NIN">
            <FigmaInput placeholder="Enter NIN" value={form.nin} onChange={(e) => set("nin", e.target.value)} />
          </FigmaField>
          <FigmaField label="Mobile Number">
            <FigmaInput
              placeholder="Enter mobile number"
              value={form.mobileNumber}
              onChange={(e) => set("mobileNumber", e.target.value)}
            />
          </FigmaField>
        </FigmaRow>
        <FigmaRow>
          <FigmaField label="TIN">
            <FigmaInput placeholder="Enter TIN" value={form.tin} onChange={(e) => set("tin", e.target.value)} />
          </FigmaField>
          <FigmaField label="Reg Number">
            <FigmaInput
              placeholder="Enter reg number"
              value={form.regNumber}
              onChange={(e) => set("regNumber", e.target.value)}
            />
          </FigmaField>
        </FigmaRow>
        {error ? <p className="fg-error">{error}</p> : null}
        <div className="fg-find-customer-actions">
          <button
            type="button"
            className="fg-btn fg-btn-primary cta fg-find-customer-search"
            onClick={() => void search()}
            disabled={busy}
          >
            {busy ? "Searching…" : "Search"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function GenerateStatementPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [account, setAccount] = useState(() => params.get("account") || "");
  const [reportType, setReportType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [success, setSuccess] = useState(false);

  function clear() {
    setAccount("");
    setReportType("");
    setFrom("");
    setTo("");
  }

  function goReport() {
    const q = new URLSearchParams();
    if (account.trim()) q.set("account", account.trim());
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    if (reportType) q.set("type", reportType);
    navigate(`/enquiries/statement-report?${q.toString()}`);
  }

  return (
    <>
      <FigmaCreatePanel
        title="Generate Account Statement"
        onClose={() => navigate("/enquiries")}
        onClear={clear}
        clearLabel="Clear"
        onSubmit={() => setSuccess(true)}
        submitLabel="Generate"
      >
        <FigmaField label="Account Number">
          <FigmaInput
            placeholder={NUBAN_PLACEHOLDER}
            inputMode="numeric"
            maxLength={NUBAN_LENGTH}
            value={account}
            onChange={(e) => setAccount(sanitizeNubanInput(e.target.value))}
          />
        </FigmaField>
        <FigmaField label="Report Type">
          <FigmaSelect value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="">Select</option>
            <option value="FULL">Full statement</option>
            <option value="SUMMARY">Summary</option>
            <option value="PDF">PDF download</option>
          </FigmaSelect>
        </FigmaField>
        <FigmaField label="Start Date">
          <FigmaDate value={from} onChange={(e) => setFrom(e.target.value)} />
        </FigmaField>
        <FigmaField label="End Date">
          <FigmaDate value={to} onChange={(e) => setTo(e.target.value)} />
        </FigmaField>
      </FigmaCreatePanel>
      {success ? (
        <SuccessModal
          title="Generation Successful"
          message="Account statement has been generated successfully"
          onOkay={goReport}
        />
      ) : null}
    </>
  );
}

/** Find Customer CTA → Frame 1618868195 */
export const EnquiryNewPage = FindCustomerPage;

export function GenerateTransactionReportPage() {
  const navigate = useNavigate();
  const [branch, setBranch] = useState("HQ01");
  const [reportType, setReportType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [success, setSuccess] = useState(false);

  function clear() {
    setBranch("HQ01");
    setReportType("");
    setFrom("");
    setTo("");
  }

  function goReport() {
    const q = new URLSearchParams({ branch });
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    if (reportType) q.set("type", reportType);
    navigate(`/enquiries/transaction-report-result?${q.toString()}`);
  }

  return (
    <>
      <FigmaCreatePanel
        title="Generate Transaction Report"
        onClose={() => navigate("/enquiries")}
        onClear={clear}
        clearLabel="Clear"
        onSubmit={() => setSuccess(true)}
        submitLabel="Generate"
      >
        <FigmaField label="Branch">
          <FigmaSelect value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="HQ01">HQ01</option>
            <option value="HQ">HQ</option>
          </FigmaSelect>
        </FigmaField>
        <FigmaField label="Report Type">
          <FigmaSelect value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="">Select</option>
            <option value="DAILY">Daily</option>
            <option value="RANGE">Date range</option>
            <option value="TELLER">By teller</option>
          </FigmaSelect>
        </FigmaField>
        <FigmaField label="Start Date">
          <FigmaDate value={from} onChange={(e) => setFrom(e.target.value)} />
        </FigmaField>
        <FigmaField label="End Date">
          <FigmaDate value={to} onChange={(e) => setTo(e.target.value)} />
        </FigmaField>
      </FigmaCreatePanel>
      {success ? (
        <SuccessModal
          title="Generation Successful"
          message="Transaction report has been generated successfully"
          onOkay={goReport}
        />
      ) : null}
    </>
  );
}
