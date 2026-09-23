import { useEffect, useState } from "react";
import {
  listCasaProducts,
  listInvestmentProducts,
  listLoanProducts,
  type Product,
} from "../api/accounts";
import { ApiError } from "../api/client";
import { ModuleScreen } from "../components/ModuleScreen";
import { Badge } from "../components/ui";
import { statusTone } from "../lib/statusTone";

export function ProductsPage() {
  const [tab, setTab] = useState("casa");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const page =
          tab === "loans"
            ? await listLoanProducts({ size: 50 })
            : tab === "investments"
              ? await listInvestmentProducts({ size: 50 })
              : await listCasaProducts({ size: 50 });
        if (!cancelled) {
          setRows(page.content || []);
          setTotal(page.totalElements ?? page.content?.length ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          setError(err instanceof ApiError ? err.message : "Unable to load products");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const q = search.trim().toLowerCase();
  const filtered = rows.filter((r) =>
    !q ? true : [r.code, r.name, r.accountType, r.currency, r.status].join(" ").toLowerCase().includes(q),
  );

  return (
    <ModuleScreen
      title="Product Setup"
      primaryAction={{ label: "Add product", to: "/products/new" }}
      tabs={[
        { id: "casa", label: "CASA" },
        { id: "loans", label: "Loans" },
        { id: "investments", label: "Investments" },
      ]}
      activeTab={tab}
      onTabChange={setTab}
      search={search}
      onSearchChange={setSearch}
      loading={loading}
      error={error}
      columns={[
        { key: "code", header: "Code", render: (r) => r.code },
        { key: "name", header: "Name", render: (r) => r.name },
        { key: "cat", header: "Category", render: (r) => r.accountType || tab },
        { key: "ccy", header: "Currency", render: (r) => r.currency },
        {
          key: "status",
          header: "Status",
          render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>,
        },
      ]}
      rows={filtered}
      rowKey={(r) => r.id}
      footer={
        <p style={{ marginTop: "0.75rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
          Showing {filtered.length} of {total}
        </p>
      }
    />
  );
}
