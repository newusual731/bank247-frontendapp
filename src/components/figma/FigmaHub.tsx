import type { ReactNode } from "react";
import "./FigmaForm.css";

export function FigmaHubCard({
  title,
  subtitle,
  search,
  onSearch,
  searchPlaceholder = "Search by name, ID",
  primaryLabel,
  onPrimary,
  primaryLink,
  toolbarSwap,
  children,
}: {
  title: string;
  subtitle?: string;
  search: string;
  onSearch: (v: string) => void;
  searchPlaceholder?: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  primaryLink?: ReactNode;
  toolbarSwap?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="fg-hub">
      <header className="fg-hub-header">
        <h1>{title}</h1>
        {subtitle ? <p className="fg-hub-subtitle">{subtitle}</p> : null}
      </header>

      <div className={`fg-hub-toolbar${toolbarSwap ? " swap" : ""}`}>
        <input
          className="fg-search"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          aria-label="Search"
        />
        {primaryLink}
        {primaryLabel && onPrimary ? (
          <button type="button" className="fg-btn fg-btn-primary cta" onClick={onPrimary}>
            {primaryLabel}
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function FigmaTable({
  headers,
  peach,
  wrapClassName,
  children,
}: {
  headers: string[];
  peach?: boolean;
  wrapClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className={`fg-table-wrap${wrapClassName ? ` ${wrapClassName}` : ""}`}>
      <table className={`fg-table${peach ? " peach" : ""}`}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h || Math.random()}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function statusBadge(label: string, tone: "ok" | "bad" | "warn" | "neutral" = "neutral") {
  const cls = tone === "ok" ? "ok" : tone === "bad" ? "bad" : "neutral";
  const style =
    tone === "warn"
      ? { background: "#fff0eb", color: "#e86339" }
      : undefined;
  return (
    <span className={`fg-badge ${cls}`} style={style}>
      {label}
    </span>
  );
}

export function FigmaCreatePanel({
  title,
  subtitle,
  onClose,
  children,
  onSubmit,
  submitLabel = "Create",
  clearLabel = "Close",
  onClear,
  busy,
  error,
  hidePrimary,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  onSubmit?: () => void;
  submitLabel?: string;
  clearLabel?: string;
  onClear?: () => void;
  busy?: boolean;
  error?: string | null;
  hidePrimary?: boolean;
}) {
  return (
    <div className="fg-wizard">
      <div className="fg-wizard-bar" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button type="button" className="fg-close cta" onClick={onClose} aria-label="Close">
            ×
          </button>
          <div>
            <h1 className="fg-wizard-title" style={{ margin: 0 }}>
              {title}
            </h1>
            {subtitle ? <p className="fg-wizard-sub">{subtitle}</p> : null}
          </div>
        </div>
      </div>
      <div className="fg-body" style={{ maxWidth: 480 }}>
        {children}
        {error ? <p className="fg-error">{error}</p> : null}
        <div className="fg-actions" style={hidePrimary ? { justifyContent: "center" } : undefined}>
          <button type="button" className="fg-btn fg-btn-outline cta" onClick={onClear || onClose} disabled={busy}>
            {clearLabel}
          </button>
          {hidePrimary ? null : (
            <button type="button" className="fg-btn fg-btn-primary cta" onClick={onSubmit} disabled={busy}>
              {busy ? "Saving…" : submitLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}
