import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAccount, listLiens, listRestrictions, type Account, type Lien, type Restriction } from "../api/accounts";
import { ApiError } from "../api/client";
import { ModuleScreen } from "../components/ModuleScreen";
import { Badge, Button } from "../components/ui";
import { formatMoney, statusTone } from "../lib/statusTone";

type Mode = "accounts" | "liens" | "restrictions";

const META: Record<Mode, { title: string; primary: string; hint: string; placeholder: string }> = {
  accounts: {
    title: "Account Management",
    primary: "Open Account",
    hint: "Lookup by NUBAN / account number (no global account list API).",
    placeholder: "Account number",
  },
  liens: {
    title: "Block Fund Management",
    primary: "Block Funds",
    hint: "Enter an account number to list liens.",
    placeholder: "Account number",
  },
  restrictions: {
    title: "Restriction Management",
    primary: "Create Restriction",
    hint: "Enter an account number to list restrictions.",
    placeholder: "Account number",
  },
};

export function AccountLookupPage({ mode }: { mode: Mode }) {
  const meta = META[mode];
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [account, setAccount] = useState<Account | null>(null);
  const [liens, setLiens] = useState<Lien[]>([]);
  const [restrictions, setRestrictions] = useState<Restriction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setAccount(null);
      setLiens([]);
      setRestrictions([]);
      setError(null);
      return;
    }
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (mode === "accounts") {
          const row = await getAccount(query.trim());
          if (!cancelled) setAccount(row);
        } else if (mode === "liens") {
          const rows = await listLiens(query.trim());
          if (!cancelled) setLiens(rows);
        } else {
          const rows = await listRestrictions(query.trim());
          if (!cancelled) setRestrictions(rows);
        }
      } catch (err) {
        if (!cancelled) {
          setAccount(null);
          setLiens([]);
          setRestrictions([]);
          setError(err instanceof ApiError ? err.message : "Lookup failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [query, mode]);

  const accountRows = account ? [account] : [];

  if (mode === "accounts") {
    return (
      <ModuleScreen
        title={meta.title}
        primaryAction={{ label: meta.primary, to: "/accounts/open" }}
        search={input}
        onSearchChange={setInput}
        searchPlaceholder={meta.placeholder}
        filters={
          <Button variant="secondary" onClick={() => setQuery(input.trim())} disabled={!input.trim()}>
            Lookup
          </Button>
        }
        loading={loading}
        error={error}
        emptyHint={meta.hint}
        columns={[
          { key: "nuban", header: "NUBAN", render: (r) => r.accountNumber },
          { key: "product", header: "Product", render: (r) => r.productCode },
          { key: "branch", header: "Branch", render: (r) => r.branchCode },
          { key: "ccy", header: "Currency", render: (r) => r.currency },
          {
            key: "status",
            header: "Status",
            render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>,
          },
        ]}
        rows={accountRows}
        rowKey={(r) => r.id}
        footer={
          <p style={{ marginTop: "0.75rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            {account ? "1 account" : "Enter account number and Lookup"}
          </p>
        }
      />
    );
  }

  if (mode === "liens") {
    return (
      <ModuleScreen
        title={meta.title}
        primaryAction={{ label: meta.primary, to: "/liens/new" }}
        search={input}
        onSearchChange={setInput}
        searchPlaceholder={meta.placeholder}
        filters={
          <Button variant="secondary" onClick={() => setQuery(input.trim())} disabled={!input.trim()}>
            Lookup
          </Button>
        }
        loading={loading}
        error={error}
        emptyHint={meta.hint}
        columns={[
          { key: "acct", header: "Account", render: (r) => r.accountNumber },
          { key: "amt", header: "Amount", render: (r) => `${formatMoney(r.amount)} ${r.currency}` },
          { key: "reason", header: "Reason", render: (r) => r.reason || "—" },
          {
            key: "status",
            header: "Status",
            render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>,
          },
          {
            key: "date",
            header: "Date",
            render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"),
          },
          {
            key: "actions",
            header: "Actions",
            render: (r) => (
              <Link to={`/liens/release?id=${encodeURIComponent(r.id)}`} style={{ color: "var(--brand-primary)", fontWeight: 650 }}>
                Release
              </Link>
            ),
          },
        ]}
        rows={liens}
        rowKey={(r) => r.id}
      />
    );
  }

  return (
    <ModuleScreen
      title={meta.title}
      primaryAction={{ label: meta.primary, to: "/restrictions/new" }}
      search={input}
      onSearchChange={setInput}
      searchPlaceholder={meta.placeholder}
      filters={
        <Button variant="secondary" onClick={() => setQuery(input.trim())} disabled={!input.trim()}>
          Lookup
        </Button>
      }
      loading={loading}
      error={error}
      emptyHint={meta.hint}
      columns={[
        { key: "acct", header: "Account", render: (r) => r.accountNumber },
        { key: "type", header: "Type", render: (r) => r.restrictionType },
        { key: "reason", header: "Reason", render: (r) => r.reason || "—" },
        {
          key: "status",
          header: "Status",
          render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>,
        },
        {
          key: "date",
          header: "Date",
          render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"),
        },
        {
          key: "actions",
          header: "Actions",
          render: (r) => (
            <Link to={`/restrictions/release?id=${encodeURIComponent(r.id)}`} style={{ color: "var(--brand-primary)", fontWeight: 650 }}>
              Remove
            </Link>
          ),
        },
      ]}
      rows={restrictions}
      rowKey={(r) => r.id}
    />
  );
}
