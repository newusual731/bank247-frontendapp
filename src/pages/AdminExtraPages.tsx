import { useEffect, useState } from "react";
import {
  listAccessRequests,
  listBreakGlass,
  listSodViolations,
  type AccessRequest,
  type BreakGlassGrant,
  type SodViolation,
} from "../api/iamExtra";
import { listWorkflowDefinitions, type WorkflowDefinition } from "../api/workflowDefs";
import { listEodRuns, type EodRun } from "../api/jobs";
import { ApiError } from "../api/client";
import { ModuleScreen } from "../components/ModuleScreen";
import { Badge } from "../components/ui";
import { statusTone } from "../lib/statusTone";

export function SodPage() {
  const [rows, setRows] = useState<SodViolation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await listSodViolations();
        if (!cancelled) setRows(data);
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          setError(err instanceof ApiError ? err.message : "Unable to load SoD violations");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ModuleScreen
      title="SoD violations"
      loading={loading}
      error={error}
      columns={[
        { key: "user", header: "User", render: (r) => r.username || r.userId },
        { key: "a", header: "Role A", render: (r) => r.roleACode },
        { key: "b", header: "Role B", render: (r) => r.roleBCode },
        { key: "sev", header: "Severity", render: (r) => r.severity },
        {
          key: "status",
          header: "Status",
          render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>,
        },
        {
          key: "date",
          header: "Detected",
          render: (r) => (r.detectedAt ? new Date(r.detectedAt).toLocaleString() : "—"),
        },
      ]}
      rows={rows}
      rowKey={(r) => r.id}
    />
  );
}

export function BreakGlassPage() {
  const [rows, setRows] = useState<BreakGlassGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await listBreakGlass();
        if (!cancelled) setRows(data);
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          setError(err instanceof ApiError ? err.message : "Unable to load break-glass grants");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ModuleScreen
      title="Break-glass"
      loading={loading}
      error={error}
      columns={[
        { key: "user", header: "User", render: (r) => r.userId },
        { key: "role", header: "Role", render: (r) => r.roleId },
        { key: "reason", header: "Reason", render: (r) => r.reason || "—" },
        {
          key: "status",
          header: "Status",
          render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>,
        },
        {
          key: "until",
          header: "Until",
          render: (r) => (r.requestedUntil ? new Date(r.requestedUntil).toLocaleString() : "—"),
        },
      ]}
      rows={rows}
      rowKey={(r) => r.id}
    />
  );
}

export function AccessRequestsPage() {
  const [rows, setRows] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await listAccessRequests();
        if (!cancelled) setRows(data);
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          setError(err instanceof ApiError ? err.message : "Unable to load access requests");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ModuleScreen
      title="Access requests"
      loading={loading}
      error={error}
      columns={[
        { key: "user", header: "User", render: (r) => r.userId },
        { key: "role", header: "Role", render: (r) => r.roleId },
        { key: "scope", header: "Branch scope", render: (r) => r.branchScope || "—" },
        { key: "sod", header: "SoD conflict", render: (r) => (r.sodConflict ? "Yes" : "No") },
        {
          key: "status",
          header: "Status",
          render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>,
        },
        { key: "reason", header: "Reason", render: (r) => r.reason || "—" },
      ]}
      rows={rows}
      rowKey={(r) => r.id}
    />
  );
}

export function WorkflowDefinitionsPage() {
  const [rows, setRows] = useState<WorkflowDefinition[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const page = await listWorkflowDefinitions({ size: 50 });
        if (!cancelled) {
          setRows(page.content || []);
          setTotal(page.totalElements ?? page.content?.length ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          setError(err instanceof ApiError ? err.message : "Unable to load workflow definitions");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ModuleScreen
      title="Workflow definitions"
      loading={loading}
      error={error}
      columns={[
        { key: "op", header: "Operation", render: (r) => r.operationCode },
        { key: "res", header: "Resource", render: (r) => r.resourceType },
        { key: "n", header: "Approvals", render: (r) => String(r.requiredApprovals) },
        {
          key: "roles",
          header: "Approver roles",
          render: (r) => r.approverRoleCodes?.join(", ") || "—",
        },
        {
          key: "status",
          header: "Enabled",
          render: (r) => (
            <Badge tone={r.enabled ? "success" : "neutral"}>{r.enabled ? "YES" : "NO"}</Badge>
          ),
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

export function EodRunsPage() {
  const [rows, setRows] = useState<EodRun[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const page = await listEodRuns();
        if (!cancelled) {
          setRows(page.items || []);
          setTotal(page.total ?? page.items?.length ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          setError(err instanceof ApiError ? err.message : "Unable to load EOD runs");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ModuleScreen
      title="EOD runs"
      loading={loading}
      error={error}
      columns={[
        { key: "date", header: "Business date", render: (r) => r.businessDate },
        {
          key: "status",
          header: "Status",
          render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>,
        },
        { key: "src", header: "Trigger", render: (r) => r.triggerSource || "—" },
        {
          key: "pct",
          header: "Progress",
          render: (r) =>
            r.percentComplete != null
              ? `${r.percentComplete}% (${r.completedSteps ?? 0}/${r.totalSteps ?? 0})`
              : "—",
        },
        {
          key: "started",
          header: "Started",
          render: (r) => (r.startedAt ? new Date(r.startedAt).toLocaleString() : "—"),
        },
        { key: "fail", header: "Failure", render: (r) => r.failureMessage || "—" },
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
