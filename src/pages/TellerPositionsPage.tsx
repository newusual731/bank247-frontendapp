import { useEffect, useState } from "react";
import { getCashPositions, type TillPosition, type VaultPosition } from "../api/branches";
import { ApiError } from "../api/client";
import { ModuleScreen } from "../components/ModuleScreen";
import { Badge, Button } from "../components/ui";
import { formatMoney, statusTone } from "../lib/statusTone";

type Props = { view: "tills" | "vaults" };

export function TellerPositionsPage({ view }: Props) {
  const [tick, setTick] = useState(0);
  const [tills, setTills] = useState<TillPosition[]>([]);
  const [vaults, setVaults] = useState<VaultPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const pos = await getCashPositions();
        if (!cancelled) {
          setTills(pos.tills || []);
          setVaults(pos.vaults || []);
        }
      } catch (err) {
        if (!cancelled) {
          setTills([]);
          setVaults([]);
          setError(err instanceof ApiError ? err.message : "Unable to load cash positions");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  if (view === "vaults") {
    return (
      <ModuleScreen
        title="Vault Record"
        primaryAction={{ label: "Vault transfer", to: "/teller/vault-create" }}
        filters={
          <Button variant="secondary" onClick={() => setTick((n) => n + 1)}>
            Refresh
          </Button>
        }
        loading={loading}
        error={error}
        emptyHint="Vault balances from teller positions API."
        columns={[
          { key: "id", header: "Vault", render: (r) => r.vaultId },
          { key: "branch", header: "Branch", render: (r) => r.branchCode },
          { key: "ccy", header: "Currency", render: (r) => r.currency },
          { key: "bal", header: "Balance", render: (r) => formatMoney(r.balance) },
          {
            key: "status",
            header: "Status",
            render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>,
          },
        ]}
        rows={vaults}
        rowKey={(r) => r.vaultId}
      />
    );
  }

  return (
    <ModuleScreen
      title="Till Records"
        primaryAction={{ label: "Till creation", to: "/teller/till-create" }}
      filters={
        <Button variant="secondary" onClick={() => setTick((n) => n + 1)}>
          Refresh
        </Button>
      }
      loading={loading}
      error={error}
      emptyHint="Till positions from /api/v1/teller/positions (no global till list)."
      columns={[
        { key: "id", header: "Till ID", render: (r) => r.tillId },
        { key: "teller", header: "Teller", render: (r) => r.tellerId },
        { key: "branch", header: "Branch", render: (r) => r.branchCode },
        { key: "ccy", header: "Currency", render: (r) => r.currency },
        { key: "bal", header: "Balance", render: (r) => formatMoney(r.balance) },
        {
          key: "status",
          header: "Status",
          render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>,
        },
      ]}
      rows={tills}
      rowKey={(r) => r.tillId}
    />
  );
}
