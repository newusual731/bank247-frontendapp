import { useMemo, useState } from "react";
import { ModuleScreen } from "../components/ModuleScreen";
import { Badge } from "../components/ui";

export type DemoRow = {
  id: string;
  c1: string;
  c2: string;
  c3: string;
  c4: string;
  status: string;
  date: string;
};

type Props = {
  title: string;
  primaryLabel?: string;
  primaryTo?: string;
  tabs?: { id: string; label: string }[];
  columns?: [string, string, string, string];
  emptyHint?: string;
  /** Optional seed rows so the screen matches Figma list layouts when APIs are empty. */
  seed?: DemoRow[];
};

const defaultCols: [string, string, string, string] = [
  "Reference",
  "Name",
  "Branch",
  "Type",
];

function tone(status: string) {
  const s = status.toUpperCase();
  if (s.includes("ACTIVE") || s.includes("APPROVED") || s.includes("POSTED") || s.includes("DISBURSED")) {
    return "success" as const;
  }
  if (s.includes("REJECT") || s.includes("FAIL") || s.includes("CANCEL") || s.includes("DEACTIV")) {
    return "danger" as const;
  }
  if (s.includes("PEND") || s.includes("DRAFT") || s.includes("SUBMIT")) {
    return "warning" as const;
  }
  return "neutral" as const;
}

/** Figma-faithful list screen for modules awaiting deeper API wiring. */
export function DesignListPage({
  title,
  primaryLabel = "Create",
  primaryTo,
  tabs,
  columns = defaultCols,
  emptyHint = "Records will appear here once created or synced from the CBS services.",
  seed = [],
}: Props) {
  const [tab, setTab] = useState(tabs?.[0]?.id ?? "all");
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return seed.filter((r) => {
      if (!q) return true;
      return [r.c1, r.c2, r.c3, r.c4, r.status].join(" ").toLowerCase().includes(q);
    });
  }, [seed, search]);

  return (
    <ModuleScreen
      title={title}
      primaryAction={
        primaryTo
          ? { label: primaryLabel, to: primaryTo }
          : { label: primaryLabel, disabled: true, onClick: () => undefined }
      }
      tabs={tabs}
      activeTab={tab}
      onTabChange={setTab}
      search={search}
      onSearchChange={setSearch}
      columns={[
        { key: "c1", header: columns[0], render: (r) => r.c1 },
        { key: "c2", header: columns[1], render: (r) => r.c2 },
        { key: "c3", header: columns[2], render: (r) => r.c3 },
        { key: "c4", header: columns[3], render: (r) => r.c4 },
        {
          key: "status",
          header: "Status",
          render: (r) => <Badge tone={tone(r.status)}>{r.status}</Badge>,
        },
        { key: "date", header: "Date", render: (r) => r.date },
        {
          key: "actions",
          header: "",
          render: () => (
            <span className="cta" style={{ color: "var(--brand-primary)", fontWeight: 650 }}>
              View
            </span>
          ),
        },
      ]}
      rows={rows}
      rowKey={(r) => r.id}
      emptyTitle="No records yet"
      emptyHint={emptyHint}
      footer={
        <p style={{ marginTop: "0.75rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
          Showing {rows.length} record{rows.length === 1 ? "" : "s"}
        </p>
      }
    />
  );
}
