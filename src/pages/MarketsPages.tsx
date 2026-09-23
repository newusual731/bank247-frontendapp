import { useEffect, useState } from "react";
import {
  searchTradeInstruments,
  searchTreasuryDeals,
  type TradeInstrument,
  type TreasuryDeal,
} from "../api/markets";
import { ApiError } from "../api/client";
import { ModuleScreen } from "../components/ModuleScreen";
import { Badge } from "../components/ui";
import { formatMoney, statusTone } from "../lib/statusTone";

type DealFilter = {
  title: string;
  primary: string;
  /** When set, client-filters dealType by prefix (e.g. FX_, MONEY_MARKET_, SECURITY_). */
  typePrefix?: string;
};

export function TreasuryDealsPage({ title, primary, typePrefix }: DealFilter) {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<TreasuryDeal[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const page = await searchTreasuryDeals({ size: 50 });
        if (!cancelled) {
          let content = page.content || [];
          if (typePrefix) {
            const p = typePrefix.toUpperCase();
            content = content.filter((d) => d.dealType?.toUpperCase().startsWith(p));
          }
          setRows(content);
          setTotal(content.length);
        }
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          setError(err instanceof ApiError ? err.message : "Unable to load treasury deals");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [typePrefix]);

  const q = search.trim().toLowerCase();
  const filtered = rows.filter((r) =>
    !q
      ? true
      : [r.dealReference, r.dealType, r.counterpartyId, r.status, r.deskCode].join(" ").toLowerCase().includes(q),
  );

  return (
    <ModuleScreen
      title={title}
      primaryAction={{ label: primary, to: `/markets/deals/new?typePrefix=${encodeURIComponent(typePrefix || "")}` }}
      search={search}
      onSearchChange={setSearch}
      loading={loading}
      error={error}
      columns={[
        { key: "ref", header: "Deal ID", render: (r) => r.dealReference },
        { key: "type", header: "Type", render: (r) => r.dealType },
        {
          key: "amt",
          header: "Amount",
          render: (r) =>
            r.notionalAmount != null
              ? `${formatMoney(r.notionalAmount)} ${r.baseCurrency || ""}`.trim()
              : "—",
        },
        { key: "rate", header: "Rate", render: (r) => (r.agreedRate != null ? String(r.agreedRate) : "—") },
        {
          key: "status",
          header: "Status",
          render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>,
        },
        { key: "mat", header: "Maturity", render: (r) => r.maturityDate || "—" },
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

export function TradeInstrumentsPage({
  title,
  primary,
  instrumentType,
}: {
  title: string;
  primary: string;
  instrumentType?: string;
}) {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<TradeInstrument[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const page = await searchTradeInstruments({
          instrumentType,
          size: 20,
        });
        if (!cancelled) {
          setRows(page.content || []);
          setTotal(page.totalElements ?? page.content?.length ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          setError(err instanceof ApiError ? err.message : "Unable to load trade instruments");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [instrumentType]);

  const q = search.trim().toLowerCase();
  const filtered = rows.filter((r) =>
    !q
      ? true
      : [r.instrumentReference, r.instrumentType, r.beneficiaryName, r.status].join(" ").toLowerCase().includes(q),
  );

  return (
    <ModuleScreen
      title={title}
      primaryAction={{ label: primary, to: "/markets/lc/new" }}
      search={search}
      onSearchChange={setSearch}
      loading={loading}
      error={error}
      columns={[
        { key: "ref", header: "LC Ref", render: (r) => r.instrumentReference },
        { key: "type", header: "Type", render: (r) => r.instrumentType },
        { key: "ben", header: "Beneficiary", render: (r) => r.beneficiaryName || "—" },
        {
          key: "amt",
          header: "Amount",
          render: (r) => `${formatMoney(r.faceAmount)} ${r.currency}`,
        },
        {
          key: "status",
          header: "Status",
          render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>,
        },
        { key: "exp", header: "Expiry", render: (r) => r.expiryDate || "—" },
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
