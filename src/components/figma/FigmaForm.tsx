import { useEffect, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import "./FigmaForm.css";

export function FigmaField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`fg-field ${className}`.trim()}>
      <label>{label}</label>
      {children}
    </div>
  );
}

export function FigmaInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="fg-control" {...props} />;
}

export function FigmaSelect({
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <div className="fg-select-wrap">
      <select className="fg-control" {...props}>
        {children}
      </select>
    </div>
  );
}

export function FigmaDate(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="fg-date-wrap">
      <input className="fg-control" type="date" {...props} />
    </div>
  );
}

export function FigmaPhone({
  value,
  onChange,
  placeholder = "*****",
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className={`fg-phone${disabled ? " is-locked" : ""}`}>
      <span className="fg-phone-prefix" aria-hidden>
        🇳🇬 +234 ▾
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode="tel"
        disabled={disabled}
      />
    </div>
  );
}

export function FigmaRow({ children }: { children: ReactNode }) {
  return <div className="fg-row">{children}</div>;
}

export type FigmaStep = { id: string; label: string };

export function FigmaStepper({ steps, index }: { steps: FigmaStep[]; index: number }) {
  return (
    <ol className="fg-stepper" aria-label="Progress">
      {steps.map((step, i) => {
        const state = i < index ? "done" : i === index ? "active" : "";
        return (
          <li key={step.id} style={{ display: "contents" }}>
            {i > 0 ? <span className="fg-step-chevron" aria-hidden>{">"}</span> : null}
            <span className={`fg-step ${state}`.trim()}>
              <span className="fg-step-mark" aria-hidden>
                {i < index ? "✓" : i + 1}
              </span>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function AddCustomerChrome({
  onClose,
  steps,
  stepIndex,
  children,
  wide,
}: {
  onClose: () => void;
  steps: FigmaStep[];
  stepIndex: number;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fg-wizard">
      <div className="fg-wizard-bar">
        <button type="button" className="fg-close cta" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h1 className="fg-wizard-title">Add Customer</h1>
      </div>
      <FigmaStepper steps={steps} index={stepIndex} />
      <div className={`fg-body${wide ? " wide" : ""}`}>{children}</div>
    </div>
  );
}

export function FigmaActions({
  onPrevious,
  onNext,
  nextLabel = "Next",
  previousLabel = "Previous",
  busy,
  hidePrevious,
}: {
  onPrevious?: () => void;
  onNext: () => void;
  nextLabel?: string;
  previousLabel?: string;
  busy?: boolean;
  hidePrevious?: boolean;
}) {
  return (
    <div className="fg-actions">
      {!hidePrevious ? (
        <button type="button" className="fg-btn fg-btn-outline cta" onClick={onPrevious} disabled={busy}>
          {previousLabel}
        </button>
      ) : null}
      <button type="button" className="fg-btn fg-btn-primary cta" onClick={onNext} disabled={busy}>
        {busy ? "Saving…" : nextLabel}
      </button>
    </div>
  );
}

export function SuccessModal({
  title,
  message,
  onOkay,
}: {
  title: string;
  message?: string;
  onOkay: () => void;
}) {
  return (
    <div className="fg-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="fg-success-title">
      <div className="fg-modal">
        <button type="button" className="fg-modal-x cta" onClick={onOkay} aria-label="Close">
          ×
        </button>
        <div className="fg-modal-icon" aria-hidden>
          ✓
        </div>
        <h2 id="fg-success-title">{title}</h2>
        {message ? <p>{message}</p> : null}
        <hr className="fg-modal-hr" />
        <button type="button" className="fg-btn fg-btn-primary cta" onClick={onOkay}>
          Okay
        </button>
      </div>
    </div>
  );
}

/** Alert.png / Alert-1…12 — Success toast; Alert-13 — credentials verified */
export const FIGMA_ALERT = {
  customerCreated: {
    title: "Success",
    message: "New customer created successfully",
  },
  credentialsVerified: {
    title: "Success",
    message: "Your login credentials have been successfully verified",
  },
} as const;

export function FigmaAlert({
  title = "Success",
  message,
  tone = "success",
  onClose,
  autoDismissMs = 4500,
}: {
  title?: string;
  message: string;
  tone?: "success";
  onClose: () => void;
  autoDismissMs?: number | null;
}) {
  useEffect(() => {
    if (autoDismissMs == null || autoDismissMs <= 0) return;
    const t = window.setTimeout(() => onClose(), autoDismissMs);
    return () => window.clearTimeout(t);
    // Intentionally only re-arm when duration changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDismissMs]);

  return (
    <div className={`fg-alert fg-alert-${tone}`} role="status" aria-live="polite">
      <div className="fg-alert-accent" aria-hidden />
      <div className="fg-alert-icon" aria-hidden>
        <span className="fg-alert-icon-circle">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6.2L4.8 8.5L9.5 3.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
      <div className="fg-alert-body">
        <div className="fg-alert-title">{title}</div>
        <div className="fg-alert-message">{message}</div>
      </div>
      <div className="fg-alert-sep" aria-hidden />
      <button type="button" className="fg-alert-close cta" onClick={onClose} aria-label="Dismiss">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path
            d="M3.5 3.5l7 7M10.5 3.5l-7 7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

export function ConfirmRemoveModal({
  title = "Remove Restriction",
  message = "This user’s account restriction will be permanently removed.",
  confirmLabel = "Remove Restriction",
  onCancel,
  onConfirm,
  busy,
  tone = "danger",
  icon = "trash",
}: {
  title?: string;
  message?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
  tone?: "danger" | "warn";
  icon?: "trash" | "user" | "warn";
}) {
  const showWarn = tone === "warn" || icon === "warn";
  return (
    <div className="fg-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="fg-remove-title">
      <div className="fg-modal fg-modal-remove">
        <button type="button" className="fg-modal-x cta" onClick={onCancel} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M9.133 8.001l5.034-5.034a.8.8 0 1 0-1.131-1.132L8.001 6.87 2.967 1.835a.8.8 0 1 0-1.132 1.132L6.87 8.001l-5.034 5.035a.8.8 0 1 0 1.132 1.131L8.001 9.133l5.035 5.034a.8.8 0 0 0 1.131-1.131L9.133 8.001z"
              fill="currentColor"
            />
          </svg>
        </button>
        <div className={`fg-modal-icon ${showWarn ? "warn" : "danger"}`} aria-hidden>
          {showWarn ? (
            "!"
          ) : icon === "user" ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.8" />
              <path
                d="M5.5 19.5c.8-3.4 3.4-5.25 6.5-5.25s5.7 1.85 6.5 5.25"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          )}
        </div>
        <h2 id="fg-remove-title">{title}</h2>
        <p>{message}</p>
        <hr className="fg-modal-hr" />
        <div className="fg-modal-actions">
          <button type="button" className="fg-btn fg-btn-ghost cta" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="fg-btn fg-btn-danger cta" onClick={onConfirm} disabled={busy}>
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Figma Remove Restriction / Remove User / proceed-confirm presets */
export const REMOVE_MODAL = {
  restriction: {
    title: "Remove Restriction",
    message: "This user’s account restriction will be permanently removed.",
    confirmLabel: "Remove Restriction",
    icon: "trash" as const,
  },
  blockFund: {
    title: "Remove Block Fund",
    message: "This user’s block on funds will be permanently removed.",
    confirmLabel: "Remove Block",
    icon: "trash" as const,
  },
  blockFundCreate: {
    title: "Block Fund Creation",
    message: "Are you sure , you want to continue with this process of Block Fund Creation",
    confirmLabel: "Block",
    icon: "user" as const,
  },
  mandate: {
    title: "Delete Mandate?",
    message: "This user’s account will be permanently deleted.",
    confirmLabel: "Delete Mandate",
    icon: "trash" as const,
  },
  removeUser: {
    title: "Remove User?",
    message: "This user’s account will be permanently deleted.",
    confirmLabel: "Remove User",
    icon: "trash" as const,
  },
  accountNumber: {
    title: "Proceed with Account Number",
    message: "Are you sure , you want to continue with this process of Account Generation ?",
    confirmLabel: "Yes",
    icon: "user" as const,
  },
  accountUpdate: {
    title: "Proceed with Account Update",
    message: "Are you sure , you want to continue with this process of Account Update",
    confirmLabel: "Yes",
    icon: "user" as const,
  },
  accountReactivate: {
    title: "Proceed with Account Reactivation",
    message: "Are you sure , you want to continue with this process of Account Reactivation",
    confirmLabel: "Yes",
    icon: "user" as const,
  },
  migrateBranch: {
    title: "Proceed with Account Migration by Branch",
    message: "Are you sure , you want to continue with this process of Account Migration",
    confirmLabel: "Yes",
    icon: "user" as const,
  },
  migrateProduct: {
    title: "Proceed with Account Migration by Product",
    message: "Are you sure , you want to continue with this process of Account Migration",
    confirmLabel: "Yes",
    icon: "user" as const,
  },
  accountClose: {
    title: "Proceed with Account Closure",
    message: "Are you sure , you want to continue with this process of Account Closure",
    confirmLabel: "Yes",
    icon: "user" as const,
  },
  closeBalance: {
    title: "Proceed with Account Closure - Transfer Balance",
    message: "Are you sure , you want to continue with this process of Account Closure",
    confirmLabel: "Yes",
    icon: "user" as const,
  },
} as const;

/** Figma Restriction Deleted Successfully / account-action success presets */
export const SUCCESS_MODAL = {
  restrictionDeleted: {
    title: "Restriction Deleted Successfully",
    message: "The account restriction has been deleted successfully.",
  },
  blockFundDeleted: {
    title: "Block Fund Deleted Successfully",
    message: "The block on funds has been deleted successfully.",
  },
  blockFundCreated: {
    title: "Block Fund Successfully",
    message: "The block on funds has been created successfully.",
  },
  accountGenerated: {
    title: "Account Number Generated Successfully",
    message: "",
  },
  accountUpdated: {
    title: "Account Updated Successfully",
  },
  accountActivated: {
    title: "Account Activated Successfully",
  },
  accountReactivated: {
    title: "Account Reactivated Successfully",
  },
  migrateBranch: {
    title: "Account Migrated (Branch) Successfully",
  },
  migrateProduct: {
    title: "Account Migrated (Product) Successfully",
  },
  accountClosed: {
    title: "Account Closed Successfully",
  },
  closeBalance: {
    title: "Account Closed (Transfer Balance) Successfully",
  },
} as const;

export function option(label: string, value = label) {
  return (
    <option key={value} value={value}>
      {label}
    </option>
  );
}

export const TITLE_OPTS = ["", "Mr", "Mrs", "Chief", "Miss", "Dr", "Alhaji", "Pastor"];
export const GENDER_OPTS = ["", "Male", "Female", "Other"];
export const MARITAL_OPTS = ["", "Single", "Married", "Divorced", "Widowed"];
export const RELIGION_OPTS = ["", "Christianity", "Islam", "Traditional", "Other"];
export const STATE_OPTS = [
  "",
  "Lagos",
  "Abuja",
  "Rivers",
  "Kano",
  "Oyo",
  "Delta",
  "Anambra",
  "Enugu",
  "Kaduna",
];
export const ID_TYPE_OPTS = ["", "NIN Slip", "National ID", "Passport", "Driver License", "Voter Card"];
export const OCCUPATION_OPTS = ["", "Employed", "Self Employed", "Student", "Retired", "Unemployed"];
export const EMP_STATUS_OPTS = ["", "Permanent", "Contract", "Temporary", "Unemployed"];
export const RELATIONSHIP_OPTS = ["", "Spouse", "Parent", "Sibling", "Child", "Guardian", "Friend", "Other"];
export const SEGMENT_OPTS = ["", "Retail", "Premium", "SME", "Corporate", "Government"];
