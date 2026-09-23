import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../api/client";
import { listUsers, type IamUser } from "../api/iam";
import { ModuleScreen } from "../components/ModuleScreen";
import { Badge } from "../components/ui";

export function UsersPage() {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<IamUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listUsers({ username: search.trim() || undefined });
        if (!cancelled) setRows(data);
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          setError(err instanceof ApiError ? err.message : "Unable to load users");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [search]);

  return (
    <ModuleScreen
      title="User Management"
      primaryAction={{ label: "+ Add New User", to: "/iam/users/new" }}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search by username"
      loading={loading}
      error={error}
      columns={[
        { key: "id", header: "User ID", render: (u) => u.id.slice(0, 8) },
        {
          key: "name",
          header: "Full Name",
          render: (u) => [u.firstName, u.lastName].filter(Boolean).join(" ") || "—",
        },
        { key: "username", header: "User Name", render: (u) => u.username },
        { key: "email", header: "Email", render: (u) => u.email || "—" },
        { key: "branch", header: "Branch", render: (u) => u.homeBranchCode || "—" },
        {
          key: "status",
          header: "Status",
          render: (u) => (
            <Badge tone={u.status === "ACTIVE" ? "success" : "warning"}>{u.status}</Badge>
          ),
        },
        {
          key: "actions",
          header: "Actions",
          render: (u) => (
            <Link to={`/iam/users/${u.id}`} style={{ color: "var(--brand-primary)", fontWeight: 650 }}>
              View
            </Link>
          ),
        },
      ]}
      rows={rows}
      rowKey={(u) => u.id}
      emptyHint="Create staff via IAM APIs / maker-checker, then refresh."
      footer={
        <p style={{ marginTop: "0.75rem" }}>
          <Link to="/iam/roles" style={{ color: "var(--brand-primary)", fontWeight: 650 }}>
            Role Management →
          </Link>
        </p>
      }
    />
  );
}
