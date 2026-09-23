import { useEffect, useState } from "react";
import { listBranches, listRegions, type Branch, type Region } from "../api/branches";
import { ApiError } from "../api/client";
import { ModuleScreen } from "../components/ModuleScreen";
import { Badge } from "../components/ui";
import { statusTone } from "../lib/statusTone";

export function BranchesPage() {
  const [tab, setTab] = useState("branches");
  const [search, setSearch] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (tab === "branches") {
          const page = await listBranches({ size: 50 });
          if (!cancelled) setBranches(page.content || []);
        } else {
          const rows = await listRegions();
          if (!cancelled) setRegions(rows);
        }
      } catch (err) {
        if (!cancelled) {
          setBranches([]);
          setRegions([]);
          setError(err instanceof ApiError ? err.message : "Unable to load branches");
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

  if (tab === "regions") {
    const filtered = regions.filter((r) =>
      !q ? true : [r.code, r.name, r.countryCode, r.status].join(" ").toLowerCase().includes(q),
    );
    return (
      <ModuleScreen
        title="Branches & regions"
        primaryAction={{ label: "Create branch", to: "/branches/new" }}
        tabs={[
          { id: "branches", label: "Branches" },
          { id: "regions", label: "Regions" },
        ]}
        activeTab={tab}
        onTabChange={setTab}
        search={search}
        onSearchChange={setSearch}
        loading={loading}
        error={error}
        emptyHint="Region → Branch hierarchy from branch-service."
        columns={[
          { key: "code", header: "Code", render: (r) => r.code },
          { key: "name", header: "Name", render: (r) => r.name },
          { key: "zone", header: "Zone", render: (r) => r.zoneCode || "—" },
          { key: "country", header: "Country", render: (r) => r.countryCode || "—" },
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
            Showing {filtered.length} region{filtered.length === 1 ? "" : "s"}
          </p>
        }
      />
    );
  }

  const filtered = branches.filter((r) =>
    !q
      ? true
      : [r.branchCode, r.name, r.regionCode, r.countryCode, r.status].join(" ").toLowerCase().includes(q),
  );

  return (
    <ModuleScreen
      title="Branches & regions"
      primaryAction={{ label: "Create branch", to: "/branches/new" }}
      tabs={[
        { id: "branches", label: "Branches" },
        { id: "regions", label: "Regions" },
      ]}
      activeTab={tab}
      onTabChange={setTab}
      search={search}
      onSearchChange={setSearch}
      loading={loading}
      error={error}
      emptyHint="Region → Branch hierarchy from branch-service."
      columns={[
        { key: "code", header: "Code", render: (r) => r.branchCode },
        { key: "name", header: "Name", render: (r) => r.name },
        { key: "region", header: "Region", render: (r) => r.regionCode || "—" },
        { key: "country", header: "Country", render: (r) => r.countryCode || "—" },
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
          Showing {filtered.length} branch{filtered.length === 1 ? "" : "es"}
        </p>
      }
    />
  );
}
