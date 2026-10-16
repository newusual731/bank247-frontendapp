import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { searchCustomers, type Customer } from "../api/customers";
import { ApiError } from "../api/client";
import { RowActionCell, useRemoveUserFlow, useSuspendFlow } from "./FigmaRemainingPages";
import { accountActionQuery } from "./FigmaAccountActions";
import "../components/figma/FigmaForm.css";

const TABS = [
  { id: "INDIVIDUAL", label: "Individual" },
  { id: "CORPORATE", label: "Corporate" },
  { id: "INTERNAL", label: "Internal Record" },
  { id: "GOVERNMENT", label: "Government Record" },
] as const;

function statusClass(status: string) {
  if (status === "ACTIVE") return "ok";
  if (status === "BLACKLISTED" || status === "CLOSED" || status === "INACTIVE" || status === "SUSPENDED") return "bad";
  return "neutral";
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

export function CustomersPage() {
  const navigate = useNavigate();
  const suspend = useSuspendFlow();
  const removeUser = useRemoveUserFlow();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("INDIVIDUAL");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const apiType = tab === "INDIVIDUAL" ? "INDIVIDUAL" : "CORPORATE";
        const page = await searchCustomers({
          name: query.trim() || undefined,
          type: apiType,
          page: 0,
          size: 20,
        });
        if (!cancelled) {
          setRows(page.content || []);
          setTotal(page.totalElements ?? page.content?.length ?? 0);
          setSelected(page.content?.[0] ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          setTotal(0);
          setSelected(null);
          setError(err instanceof ApiError ? err.message : "Unable to load customers");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    const handle = window.setTimeout(load, query ? 280 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [tab, query]);

  return (
    <div className="fg-hub">
      <h1>Customer Type Management</h1>

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
          aria-label="Search customers"
        />
        <button type="button" className="fg-btn fg-btn-primary cta" onClick={() => navigate("/customers/types")}>
          Create Customer
        </button>
      </div>

      {error ? <p className="fg-error">{error}</p> : null}

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
              <th aria-label="actions" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>Loading…</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7}>No customers found</td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr
                  key={c.id}
                  style={{ cursor: "pointer", background: selected?.id === c.id ? "#fff8f5" : undefined }}
                  onClick={() => setSelected(c)}
                >
                  <td>
                    <Link to={`/customers/${c.id}`}>{c.cifNumber || c.id.slice(0, 8)}</Link>
                  </td>
                  <td>{c.branchCode}</td>
                  <td>{c.type}</td>
                  <td>{c.displayName || [c.firstName, c.lastName].filter(Boolean).join(" ") || "—"}</td>
                  <td>
                    <span className={`fg-badge ${statusClass(c.status)}`}>
                      {c.status === "ACTIVE" ? "Active" : c.status}
                    </span>
                  </td>
                  <td>{formatDate(c.createdAt)}</td>
                  <RowActionCell
                    items={[
                      { label: "View Record", onClick: () => navigate(`/customers/${c.id}`) },
                      { label: "Modify Record", onClick: () => navigate(`/customers/${c.id}/modify`) },
                      { label: "Suspend Customer Record", onClick: () => suspend.askSuspend(), tone: "warn" },
                      { label: "Remove User", onClick: () => removeUser.askRemove(), tone: "danger" },
                    ]}
                  />
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="fg-table-wrap">
        <table className="fg-table peach">
          <thead>
            <tr>
              <th>Branch Code</th>
              <th>Branch Name</th>
              <th>NUBAN</th>
              <th>Account Name</th>
              <th>Status</th>
              <th>Date Opened</th>
              <th>Available Balance</th>
              <th aria-label="actions" />
            </tr>
          </thead>
          <tbody>
            {selected ? (
              <tr>
                <td>{selected.branchCode}</td>
                <td>{selected.branchCode}</td>
                <td>—</td>
                <td>{selected.displayName || "—"}</td>
                <td>
                  <span className={`fg-badge ${statusClass(selected.status)}`}>
                    {selected.status === "ACTIVE" ? "Active" : selected.status}
                  </span>
                </td>
                <td>{formatDate(selected.createdAt)}</td>
                <td>—</td>
                <RowActionCell
                  items={[
                    {
                      label: "Update Account",
                      onClick: () =>
                        navigate(
                          `/accounts/update?${accountActionQuery({
                            accountNumber: selected.id,
                            customerId: selected.id,
                            branchName: selected.branchCode,
                            from: "customers",
                          })}`,
                        ),
                    },
                    {
                      label: "Activate Account",
                      onClick: () =>
                        navigate(
                          `/accounts/activate?${accountActionQuery({
                            accountNumber: selected.id,
                            customerId: selected.id,
                            branchName: selected.branchCode,
                            from: "customers",
                          })}`,
                        ),
                    },
                    {
                      label: "Reactivate Account",
                      onClick: () =>
                        navigate(
                          `/accounts/reactivate?${accountActionQuery({
                            accountNumber: selected.id,
                            customerId: selected.id,
                            branchName: selected.branchCode,
                            from: "customers",
                          })}`,
                        ),
                    },
                    {
                      label: "Migrate Account - Branch",
                      onClick: () =>
                        navigate(
                          `/accounts/migrate-branch?${accountActionQuery({
                            accountNumber: selected.id,
                            customerId: selected.id,
                            branchName: selected.branchCode,
                            from: "customers",
                          })}`,
                        ),
                    },
                    {
                      label: "Migrate Account - Product",
                      onClick: () =>
                        navigate(
                          `/accounts/migrate-product?${accountActionQuery({
                            accountNumber: selected.id,
                            customerId: selected.id,
                            branchName: selected.branchCode,
                            from: "customers",
                          })}`,
                        ),
                    },
                    {
                      label: "Close Account - Balance",
                      onClick: () =>
                        navigate(
                          `/accounts/close-balance?${accountActionQuery({
                            accountNumber: selected.id,
                            customerId: selected.id,
                            branchName: selected.branchCode,
                            from: "customers",
                          })}`,
                        ),
                      tone: "warn",
                    },
                    {
                      label: "Close Account",
                      onClick: () =>
                        navigate(
                          `/accounts/close?${accountActionQuery({
                            accountNumber: selected.id,
                            customerId: selected.id,
                            branchName: selected.branchCode,
                            from: "customers",
                          })}`,
                        ),
                      tone: "warn",
                    },
                  ]}
                />
              </tr>
            ) : (
              <tr>
                <td colSpan={8}>Select a customer to view linked accounts</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="fg-pager">
        <span>
          Show Records
          <select defaultValue="20" aria-label="Page size">
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </span>
        <span>
          Showing 1 - {Math.min(20, rows.length || total)} of {total}
          <span className="fg-pager-arrows" aria-hidden>
            ‹ ›
          </span>
        </span>
      </div>
      {suspend.modal}
      {removeUser.modal}
    </div>
  );
}
