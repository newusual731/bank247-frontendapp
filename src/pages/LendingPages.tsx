import { useEffect, useState } from "react";
import { searchInvestments, searchLoans, type Investment, type Loan } from "../api/loans";
import { ApiError } from "../api/client";
import { ModuleScreen } from "../components/ModuleScreen";
import { Badge } from "../components/ui";
import { formatMoney, statusTone } from "../lib/statusTone";

export function LoansPage() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [rows, setRows] = useState<Loan[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search.trim()), 280);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const page = await searchLoans({
          loanNumber: debounced || undefined,
          size: 20,
        });
        if (!cancelled) {
          setRows(page.content || []);
          setTotal(page.totalElements ?? page.content?.length ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          setError(err instanceof ApiError ? err.message : "Unable to load loans");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  return (
    <ModuleScreen
      title="Loan Contracts"
      primaryAction={{ label: "+ Add New Contract", to: "/loans/new" }}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Loan number"
      loading={loading}
      error={error}
      emptyHint="Loan list/disburse via lending-service."
      columns={[
        { key: "num", header: "Loan number", render: (r) => r.loanNumber },
        { key: "cust", header: "Customer ID", render: (r) => r.customerId },
        { key: "product", header: "Product", render: (r) => r.productCode },
        {
          key: "amt",
          header: "Principal",
          render: (r) => `${formatMoney(r.principalAmount)} ${r.currency}`,
        },
        { key: "mat", header: "Maturity", render: (r) => r.maturityDate || "—" },
        {
          key: "status",
          header: "Status",
          render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>,
        },
      ]}
      rows={rows}
      rowKey={(r) => r.id}
      footer={
        <p style={{ marginTop: "0.75rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
          Showing {rows.length} of {total}
        </p>
      }
    />
  );
}

export function InvestmentsPage() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [rows, setRows] = useState<Investment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search.trim()), 280);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const page = await searchInvestments({
          investmentNumber: debounced || undefined,
          size: 20,
        });
        if (!cancelled) {
          setRows(page.content || []);
          setTotal(page.totalElements ?? page.content?.length ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          setError(err instanceof ApiError ? err.message : "Unable to load investments");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  return (
    <ModuleScreen
      title="Investments / Treasury Bills"
      primaryAction={{ label: "Book investment", to: "/investments/new" }}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Investment number"
      loading={loading}
      error={error}
      columns={[
        { key: "ref", header: "Reference", render: (r) => r.investmentNumber },
        { key: "type", header: "Instrument", render: (r) => r.investmentType || r.productCode },
        {
          key: "amt",
          header: "Amount",
          render: (r) => `${formatMoney(r.currentPrincipal ?? r.originalPrincipal)} ${r.currency}`,
        },
        { key: "rate", header: "Rate", render: (r) => (r.annualInterestRate != null ? String(r.annualInterestRate) : "—") },
        {
          key: "status",
          header: "Status",
          render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>,
        },
        { key: "mat", header: "Maturity", render: (r) => r.maturityDate || "—" },
      ]}
      rows={rows}
      rowKey={(r) => r.id}
      footer={
        <p style={{ marginTop: "0.75rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
          Showing {rows.length} of {total}
        </p>
      }
    />
  );
}
