import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button, EmptyState, PageHeader } from "./ui";

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
};

type ModuleScreenProps<T> = {
  title: string;
  primaryAction?: { label: string; onClick?: () => void; to?: string; disabled?: boolean };
  tabs?: { id: string; label: string }[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  searchPlaceholder?: string;
  search?: string;
  onSearchChange?: (value: string) => void;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  emptyTitle?: string;
  emptyHint?: string;
  footer?: ReactNode;
  filters?: ReactNode;
};

export function ModuleScreen<T>({
  title,
  primaryAction,
  tabs,
  activeTab,
  onTabChange,
  searchPlaceholder = "Search by name, ID",
  search,
  onSearchChange,
  columns,
  rows,
  rowKey,
  loading,
  error,
  emptyTitle = "No records found",
  emptyHint,
  footer,
  filters,
}: ModuleScreenProps<T>) {
  return (
    <div>
      <PageHeader
        title={title}
        actions={
          primaryAction ? (
            primaryAction.to ? (
              <Link to={primaryAction.to} className="btn btn-primary cta">
                {primaryAction.label}
              </Link>
            ) : (
              <Button onClick={primaryAction.onClick} disabled={primaryAction.disabled}>
                {primaryAction.label}
              </Button>
            )
          ) : undefined
        }
      />

      {tabs && tabs.length > 0 ? (
        <div className="tabs" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              className={`tab cta${activeTab === tab.id ? " active" : ""}`}
              onClick={() => onTabChange?.(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="toolbar">
        {onSearchChange ? (
          <input
            className="field-input search"
            placeholder={searchPlaceholder}
            value={search ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search"
          />
        ) : null}
        {filters}
      </div>

      {error ? (
        <div className="alert-error" style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      ) : null}

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length}>Loading…</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState title={emptyTitle} hint={emptyHint} />
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={rowKey(row)}>
                  {columns.map((col) => (
                    <td key={col.key}>{col.render(row)}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}
