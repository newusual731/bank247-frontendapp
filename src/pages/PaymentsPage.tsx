import { useEffect, useState } from "react";
import { listPayments, type Payment } from "../api/payments";
import { ApiError } from "../api/client";
import { ModuleScreen } from "../components/ModuleScreen";
import { Badge } from "../components/ui";
import { formatMoney, statusTone } from "../lib/statusTone";

export function PaymentsPage() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [rows, setRows] = useState<Payment[]>([]);
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
        const page = await listPayments({
          sourceAccount: debounced || undefined,
          size: 20,
        });
        if (!cancelled) {
          setRows(page.content || []);
          setTotal(page.totalElements ?? page.content?.length ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          setError(err instanceof ApiError ? err.message : "Unable to load payments");
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
      title="Payments"
      primaryAction={{ label: "New payment", to: "/payments/new" }}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Source account"
      loading={loading}
      error={error}
      columns={[
        { key: "ref", header: "Payment ID", render: (r) => r.reference },
        { key: "type", header: "Channel", render: (r) => r.paymentType },
        {
          key: "amt",
          header: "Amount",
          render: (r) => `${formatMoney(r.amount)} ${r.currency}`,
        },
        {
          key: "status",
          header: "Status",
          render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>,
        },
        { key: "src", header: "Source", render: (r) => r.sourceAccount || "—" },
        { key: "dst", header: "Destination", render: (r) => r.destinationAccount || "—" },
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
