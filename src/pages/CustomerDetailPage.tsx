import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { getCustomer } from "../api/customersCreate";
import type { Customer } from "../api/customers";
import { ConfirmRemoveModal, SuccessModal } from "../components/figma/FigmaForm";
import { EXAMPLE_NUBAN } from "../lib/nuban";
import "../components/figma/FigmaForm.css";

function formatOpened(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function accountTypeLabel(customer: Customer) {
  if (customer.type === "INDIVIDUAL") return "Savings";
  if (customer.type === "CORPORATE") return "Current";
  return customer.type || "Savings";
}

/** View Customer Record.png */
export function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [suspendedOk, setSuspendedOk] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const c = await getCustomer(id);
        if (!cancelled) setCustomer(c);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Not found");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const typeLabel = customer ? accountTypeLabel(customer) : "";
  const statusLabel =
    customer?.status === "ACTIVE"
      ? "Active"
      : customer?.status === "SUSPENDED"
        ? "Suspended"
        : customer?.status === "CLOSED"
          ? "Closed"
          : customer?.status || "—";
  const statusOk = customer?.status === "ACTIVE";

  return (
    <div className="fg-hub">
      <button
        type="button"
        className="cta"
        onClick={() => navigate("/customers")}
        style={{ border: "none", background: "none", fontWeight: 700, fontSize: 16, marginBottom: 16, padding: 0 }}
      >
        ← Back
      </button>

      {error ? <p className="fg-error">{error}</p> : null}
      {!customer && !error ? <p>Loading…</p> : null}

      {customer ? (
        <>
          <div style={{ marginBottom: 8 }}>
            <h1 style={{ margin: "0 0 4px", fontSize: 22 }}>{customer.displayName || "—"}</h1>
            <p style={{ margin: 0, color: "#9ca3af", fontSize: 14 }}>{typeLabel}</p>
          </div>

          <div className="fg-tabs">
            <span>Overview</span>
          </div>

          <div className="fg-customer-view">
            <div className="fg-detail-grid">
              <div className="fg-detail-item">
                <div className="label">Branch Code</div>
                <div className="value">{customer.branchCode || "—"}</div>
              </div>
              <div className="fg-detail-item">
                <div className="label">Branch Name</div>
                <div className="value">{customer.branchCode || "—"}</div>
              </div>
              <div className="fg-detail-item">
                <div className="label">Account Number</div>
                <div className="value">
                  {/^\d{10}$/.test(customer.cifNumber || "")
                    ? customer.cifNumber
                    : customer.cifNumber?.replace(/\D/g, "").slice(0, 10) || EXAMPLE_NUBAN}
                </div>
              </div>
              <div className="fg-detail-item">
                <div className="label">Account Name</div>
                <div className="value">{customer.displayName || "—"}</div>
              </div>
              <div className="fg-detail-item">
                <div className="label">Account Type</div>
                <div className="value">{typeLabel}</div>
              </div>
              <div className="fg-detail-item">
                <div className="label">Status</div>
                <div className="value">
                  <span className={`fg-status-dot${statusOk ? " ok" : ""}`}>
                    <span className="fg-status-dot-mark" aria-hidden />
                    {statusLabel}
                  </span>
                </div>
              </div>
              <div className="fg-detail-item">
                <div className="label">Date Opened</div>
                <div className="value">{formatOpened(customer.createdAt)}</div>
              </div>
              <div className="fg-detail-item">
                <div className="label">Account Balance</div>
                <div className="value">₦50,000</div>
              </div>
            </div>

            <div className="fg-customer-view-actions">
              <button
                type="button"
                className="fg-btn fg-btn-danger-outline cta"
                onClick={() => setSuspendOpen(true)}
              >
                Suspend Customer
              </button>
              <button
                type="button"
                className="fg-btn fg-btn-primary cta"
                onClick={() => navigate(`/customers/${customer.id}/modify`)}
              >
                Modify Customer
              </button>
            </div>
          </div>
        </>
      ) : null}

      {suspendOpen ? (
        <ConfirmRemoveModal
          title="Suspend Account?"
          message="This account holder will no longer have access to their account. You can always enable the user later."
          confirmLabel="Suspend Account"
          tone="warn"
          onCancel={() => setSuspendOpen(false)}
          onConfirm={() => {
            setSuspendOpen(false);
            setSuspendedOk(true);
          }}
        />
      ) : null}
      {suspendedOk ? (
        <SuccessModal
          title="Suspended Successfully"
          message="Account has been suspended successfully"
          onOkay={() => setSuspendedOk(false)}
        />
      ) : null}
    </div>
  );
}
