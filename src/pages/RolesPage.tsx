import { useEffect, useState } from "react";
import { ApiError } from "../api/client";
import { listPermissions, listRoles, type IamPermission, type IamRole } from "../api/iam";
import { Badge, Button, PageHeader, TextField } from "../components/ui";

export function RolesPage() {
  const [roles, setRoles] = useState<IamRole[]>([]);
  const [permissions, setPermissions] = useState<IamPermission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [r, p] = await Promise.all([listRoles(), listPermissions()]);
        if (!cancelled) {
          setRoles(r);
          setPermissions(p);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Unable to load roles");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function togglePermission(code: string) {
    setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  }

  return (
    <div>
      <PageHeader title="Role Management" />
      {error ? <div className="alert-error" style={{ marginBottom: "1rem" }}>{error}</div> : null}

      <div className="panel" style={{ marginBottom: "1.25rem" }}>
        <h2 style={{ fontSize: "1.05rem", marginBottom: "1rem" }}>Role details</h2>
        <div style={{ display: "grid", gap: "0.85rem", maxWidth: 560 }}>
          <TextField id="role-name" label="Role Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Finance Officer" />
          <TextField
            id="role-desc"
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
          />
          <div>
            <p className="field-label" style={{ marginBottom: "0.5rem" }}>
              Permissions (catalog)
            </p>
            <div
              style={{
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                maxHeight: 220,
                overflow: "auto",
                padding: "0.5rem 0.75rem",
              }}
            >
              {loading ? (
                <p style={{ color: "var(--text-muted)" }}>Loading catalog…</p>
              ) : (
                permissions.map((p) => (
                  <label key={p.code} className="cta" style={{ display: "flex", gap: "0.5rem", padding: "0.35rem 0" }}>
                    <input
                      type="checkbox"
                      checked={selected.includes(p.code)}
                      onChange={() => togglePermission(p.code)}
                    />
                    <span>
                      <strong>{p.code}</strong>
                      <span style={{ color: "var(--text-muted)", marginLeft: 8 }}>{p.module}</span>
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <Button variant="ghost" onClick={() => { setName(""); setDescription(""); setSelected([]); }}>
              Cancel
            </Button>
            <Button disabled title="Submit via POST /api/v1/iam/roles (maker-checker)">
              Save role
            </Button>
          </div>
        </div>
      </div>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Risk</th>
              <th>Permissions</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {roles.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ color: "var(--text-muted)" }}>
                  {loading ? "Loading…" : "No bank roles yet — compose from the catalog above."}
                </td>
              </tr>
            ) : (
              roles.map((r) => (
                <tr key={r.id}>
                  <td>{r.code}</td>
                  <td>{r.name}</td>
                  <td>{r.riskLevel || "—"}</td>
                  <td>{r.permissionCodes?.length ?? 0}</td>
                  <td>
                    <Badge tone={r.status === "ACTIVE" ? "success" : "warning"}>{r.status}</Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
