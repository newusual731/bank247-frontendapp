import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { getCustomer } from "../api/customersCreate";
import type { Customer } from "../api/customers";
import { listMandates, createMandate, type Mandate } from "../api/mandates";
import { useAuth } from "../auth/AuthContext";
import {
  ConfirmRemoveModal,
  FigmaDate,
  FigmaField,
  FigmaInput,
  REMOVE_MODAL,
  SUCCESS_MODAL,
  SuccessModal,
} from "../components/figma/FigmaForm";
import { FigmaCreatePanel } from "../components/figma/FigmaHub";
import { NUBAN_LENGTH, NUBAN_PLACEHOLDER, sanitizeNubanInput } from "../lib/nuban";
import "../components/figma/FigmaForm.css";
import "./LoginPage.css";

/* ───────────── Shared popover (Figma Popover / Account List / Memo list) ───────────── */

export type PopoverItem = {
  label: string;
  onClick: () => void;
  tone?: "default" | "warn" | "danger";
};

type PopoverCoords = { top: number; left: number; minWidth: number };

function placePopover(
  anchor: DOMRect,
  menuWidth = 220,
  menuHeight: number,
): PopoverCoords {
  const gap = 4;
  const pad = 8;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const spaceBelow = vh - pad - (anchor.bottom + gap);
  const spaceAbove = anchor.top - gap - pad;

  let top: number;
  if (menuHeight <= spaceBelow || spaceBelow >= spaceAbove) {
    top = anchor.bottom + gap;
  } else {
    top = anchor.top - gap - menuHeight;
  }
  top = Math.max(pad, Math.min(top, Math.max(pad, vh - menuHeight - pad)));

  let left = anchor.right - menuWidth;
  if (left < pad) left = pad;
  if (left + menuWidth > vw - pad) left = Math.max(pad, vw - menuWidth - pad);
  return { top, left, minWidth: menuWidth };
}

export function FigmaPopover({
  open,
  onClose,
  items,
  anchorRef,
  anchorStyle,
}: {
  open: boolean;
  onClose: () => void;
  items: PopoverItem[];
  /** When set, menu is portaled to body with fixed coords (escapes table overflow). */
  anchorRef?: RefObject<HTMLElement | null>;
  anchorStyle?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<PopoverCoords | null>(null);

  const estimatedHeight = Math.max(48, items.length * 44 + 16);

  const reposition = useCallback(() => {
    const el = anchorRef?.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;
    const menu = ref.current?.getBoundingClientRect();
    const height = menu && menu.height > 0 ? menu.height : estimatedHeight;
    const width = menu && menu.width > 0 ? Math.max(220, menu.width) : 220;
    setCoords(placePopover(rect, width, height));
  }, [anchorRef, estimatedHeight]);

  useLayoutEffect(() => {
    if (!open || !anchorRef) {
      setCoords(null);
      return;
    }
    reposition();
    // Remeasure after paint once the menu is in the DOM
    const id = requestAnimationFrame(() => reposition());
    return () => cancelAnimationFrame(id);
  }, [open, anchorRef, items.length, reposition]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (ref.current?.contains(t)) return;
      if (anchorRef?.current?.contains(t)) return;
      onClose();
    }
    function onScrollOrResize() {
      if (anchorRef) reposition();
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open, onClose, anchorRef, reposition]);

  if (!open) return null;

  const menu = (
    <div
      className={`fg-popover${anchorRef ? " fg-popover-portal" : ""}`}
      ref={ref}
      style={
        anchorRef && coords
          ? { top: coords.top, left: coords.left, minWidth: coords.minWidth }
          : anchorStyle
      }
      role="menu"
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          className={`fg-popover-item cta${item.tone === "warn" ? " warn" : item.tone === "danger" ? " danger" : ""}`}
          role="menuitem"
          onClick={() => {
            item.onClick();
            onClose();
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );

  if (anchorRef) {
    if (!coords) return null;
    return createPortal(menu, document.body);
  }
  return menu;
}

export function RowActionCell({ items }: { items: PopoverItem[] }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  return (
    <td style={{ width: 48 }} onClick={(e) => e.stopPropagation()}>
      <button
        ref={btnRef}
        type="button"
        className="fg-row-more cta"
        aria-label="Actions"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        ···
      </button>
      <FigmaPopover
        open={open}
        onClose={() => setOpen(false)}
        items={items}
        anchorRef={btnRef}
      />
    </td>
  );
}

/* ───────────── Modify Customer Record (Modify.png) ───────────── */

export function ModifyCustomerPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState({
    branchCode: "",
    branchName: "",
    accountNumber: "",
    accountName: "",
    accountType: "",
    status: "",
    dateOpened: "",
  });
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const c = await getCustomer(id);
        if (cancelled) return;
        setCustomer(c);
        setForm({
          branchCode: c.branchCode || "",
          branchName: c.branchCode || "",
          accountNumber: c.cifNumber || c.id.slice(0, 10),
          accountName: c.displayName || "",
          accountType: c.type === "INDIVIDUAL" ? "Savings" : c.type,
          status: c.status || "",
          dateOpened: c.createdAt ? c.createdAt.slice(0, 10) : "",
        });
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Not found");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  function submit() {
    setBusy(true);
    setError(null);
    window.setTimeout(() => {
      setBusy(false);
      setSuccess(true);
    }, 400);
  }

  return (
    <>
      <div className="login-page modify-page">
        <section className="login-brand figma-brand">
          <h1>Elevate your Core Banking Experience with Bank 24/7</h1>
          <p>
            Our comprehensive design system offers you an unparalleled range of components, sparking creativity and
            boosting efficiency.
          </p>
          <blockquote className="figma-quote">
            …workflow have been game-changers. It&apos;s like having a toolkit filled with magic that accelerates our
            projects without compromising on quality.
            <footer>
              <span className="figma-avatar" aria-hidden />
              <span>
                <strong>Ariana Grande</strong>
                <br />
                Visual Designer, Google
              </span>
            </footer>
          </blockquote>
        </section>
        <section className="login-form-wrap">
          <div className="modify-form">
            <button type="button" className="fg-close cta modify-x" onClick={() => navigate(-1)} aria-label="Close">
              ×
            </button>
            <h2>Modify Customer Record</h2>
            {error ? <p className="fg-error">{error}</p> : null}
            {!customer && !error ? <p>Loading…</p> : null}
            <FigmaField label="Branch Code">
              <FigmaInput placeholder="123- Ikeja Top" value={form.branchCode} onChange={(e) => set("branchCode", e.target.value)} />
            </FigmaField>
            <FigmaField label="Branch Name">
              <FigmaInput placeholder="Enter Name" value={form.branchName} onChange={(e) => set("branchName", e.target.value)} />
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
            <FigmaField label="Account Name">
              <FigmaInput placeholder="Enter ID" value={form.accountName} onChange={(e) => set("accountName", e.target.value)} />
            </FigmaField>
            <FigmaField label="Account Type">
              <FigmaInput placeholder="Enter email" value={form.accountType} onChange={(e) => set("accountType", e.target.value)} />
            </FigmaField>
            <FigmaField label="Status">
              <FigmaInput placeholder="Enter email" value={form.status} onChange={(e) => set("status", e.target.value)} />
            </FigmaField>
            <FigmaField label="Date Opened">
              <FigmaDate value={form.dateOpened} onChange={(e) => set("dateOpened", e.target.value)} />
            </FigmaField>
            <div className="fg-actions" style={{ justifyContent: "flex-end", marginTop: 24 }}>
              <button type="button" className="fg-btn fg-btn-outline cta" onClick={() => navigate(-1)}>
                Close
              </button>
              <button type="button" className="fg-btn fg-btn-primary cta" onClick={submit} disabled={busy}>
                {busy ? "Saving…" : "Modify"}
              </button>
            </div>
          </div>
        </section>
      </div>
      {success ? (
        <SuccessModal
          {...SUCCESS_MODAL.accountUpdated}
          onOkay={() => navigate(id ? `/customers/${id}` : "/customers")}
        />
      ) : null}
    </>
  );
}

/* ───────────── Update Mandate (Update creation.png) ───────────── */

export function MandateUpdatePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [params] = useSearchParams();
  const customerId = params.get("customerId") || "";
  const [signatoryName, setSignatoryName] = useState("Sam Smith");
  const [signatoryClass, setSignatoryClass] = useState("Class 1");
  const [mobile, setMobile] = useState("070862262332");
  const [instruction, setInstruction] = useState("Sole Signatory");
  const [limit, setLimit] = useState("N50,000");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!customerId || !id) return;
    let cancelled = false;
    (async () => {
      try {
        const all = await listMandates(customerId);
        const m: Mandate | undefined = all.find((x) => x.id === id) || all[0];
        if (!m || cancelled) return;
        try {
          const parsed = m.signatories ? JSON.parse(m.signatories) : [];
          if (Array.isArray(parsed) && parsed[0]) {
            setSignatoryName(parsed[0].fullName || "Sam Smith");
            setSignatoryClass(parsed[0].role || "Class 1");
            setMobile(parsed[0].bvn || "070862262332");
          }
        } catch {
          /* ignore */
        }
        setInstruction(m.instruction || "Sole Signatory");
      } catch {
        /* keep defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [customerId, id]);

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
      setError(err instanceof ApiError ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <FigmaCreatePanel
        title="Update Mandate"
        onClose={() => navigate("/mandates")}
        onClear={clear}
        clearLabel="Clear"
        submitLabel="Update mandate"
        onSubmit={() => void submit()}
        busy={busy}
        error={error}
      >
        <FigmaField label="Signatory Name">
          <FigmaInput value={signatoryName} onChange={(e) => setSignatoryName(e.target.value)} />
        </FigmaField>
        <FigmaField label="Signatory's Class">
          <FigmaInput value={signatoryClass} onChange={(e) => setSignatoryClass(e.target.value)} />
        </FigmaField>
        <FigmaField label="Signatory's Mobile Number">
          <FigmaInput value={mobile} onChange={(e) => setMobile(e.target.value)} />
        </FigmaField>
        <FigmaField label="Mandate Instruction">
          <textarea
            className="fg-control"
            style={{ height: 120, padding: "12px 14px", resize: "vertical" }}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
          />
        </FigmaField>
        <FigmaField label="Limit (Amount)">
          <FigmaInput value={limit} onChange={(e) => setLimit(e.target.value)} />
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
        <SuccessModal title="Mandate Updated Successfully" message="Mandate has been updated successfully" onOkay={() => navigate("/mandates")} />
      ) : null}
    </>
  );
}

/* ───────────── Log in by Branch ───────────── */

export function BranchLoginPage() {
  const { login, isAuthenticated, tenant } = useAuth();
  const navigate = useNavigate();
  const [branchCode, setBranchCode] = useState("HQ01");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(username.trim(), password);
      navigate("/customers", { replace: true, state: { figmaAlert: "credentialsVerified" } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = username.trim().length > 0 && password.length > 0 && branchCode.trim().length > 0;

  return (
    <div className="login-page">
      <section className="login-brand figma-brand">
        <h1>Elevate your Core Banking Experience with Bank 24/7</h1>
        <p>
          Our comprehensive design system offers you an unparalleled range of components, sparking creativity and
          boosting efficiency.
        </p>
        <blockquote className="figma-quote">
          Rayna has transformed the way our team approaches design. The sheer range of components and the seamless
          integration of the design system into our workflow have been game-changers.
          <footer>
            <span className="figma-avatar" aria-hidden />
            <span>
              <strong>Ariana Grande</strong>
              <br />
              Visual Designer, Google
            </span>
          </footer>
        </blockquote>
      </section>
      <section className="login-form-wrap">
        <form className="login-form login-card" onSubmit={(e) => void onSubmit(e)}>
          <h2>Log in by Branch</h2>
          <p className="login-sub">Enter your branch and credentials · {tenant.slug}.bank247.com</p>
          {error ? <div className="alert-error">{error}</div> : null}
          <label className="field" htmlFor="branch">
            <span className="field-label">Branch Code</span>
            <input
              id="branch"
              className="field-input"
              placeholder="Enter Branch Code"
              value={branchCode}
              onChange={(e) => setBranchCode(e.target.value)}
              required
            />
          </label>
          <label className="field" htmlFor="username">
            <span className="field-label">Email Address</span>
            <div className="password-row">
              <input
                id="username"
                className="field-input"
                placeholder="Enter Email"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <span className="field-icon" aria-hidden>
                ✉
              </span>
            </div>
          </label>
          <label className="field" htmlFor="password">
            <span className="field-label">Password</span>
            <div className="password-row">
              <input
                id="password"
                className="field-input"
                type={showPassword ? "text" : "password"}
                placeholder="Enter Password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" className="show-pass cta" onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? "Hide" : "👁"}
              </button>
            </div>
          </label>
          <button type="button" className="forgot-link cta" onClick={() => navigate("/login")}>
            Staff sign-in instead
          </button>
          <button type="submit" className={`login-submit cta${canSubmit ? " ready" : ""}`} disabled={busy || !canSubmit}>
            {busy ? "Signing in…" : "Log into Account"}
          </button>
        </form>
      </section>
    </div>
  );
}

/* ───────────── Suspend / Remove User success helpers used by hubs ───────────── */

export function SuspendSuccessBridge({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useSuspendFlow() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  return {
    open,
    done,
    askSuspend: () => setOpen(true),
    cancel: () => setOpen(false),
    confirm: () => {
      setOpen(false);
      setDone(true);
    },
    dismissDone: () => setDone(false),
    modal: open ? (
      <ConfirmRemoveModal
        title="Suspend Account?"
        message="This account holder will no longer have access to their account. You can always enable the user later."
        confirmLabel="Suspend Account"
        tone="warn"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          setDone(true);
        }}
      />
    ) : done ? (
      <SuccessModal title="Suspended Successfully" message="Account has been suspended successfully" onOkay={() => setDone(false)} />
    ) : null,
  };
}

export function useRemoveUserFlow() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  return {
    askRemove: () => setOpen(true),
    modal: open ? (
      <ConfirmRemoveModal
        {...REMOVE_MODAL.removeUser}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          setDone(true);
        }}
      />
    ) : done ? (
      <SuccessModal
        title="User Removed Successfully"
        message="The user has been removed successfully."
        onOkay={() => setDone(false)}
      />
    ) : null,
  };
}
