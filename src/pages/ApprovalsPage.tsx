import { useEffect, useState } from "react";
import { ApiError } from "../api/client";
import { approveRequest, listApprovals, rejectRequest, type ApprovalRequest } from "../api/workflow";
import { ModuleScreen } from "../components/ModuleScreen";
import { Badge, Button } from "../components/ui";

export function ApprovalsPage() {
  const [rows, setRows] = useState<ApprovalRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("eligible");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const page = await listApprovals({
        eligibleOnly: tab === "eligible",
        status: tab === "pending" ? "PENDING" : undefined,
      });
      setRows(page.content || []);
    } catch (err) {
      setRows([]);
      setError(err instanceof ApiError ? err.message : "Unable to load approvals");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [tab]);

  async function onApprove(id: string) {
    setBusyId(id);
    try {
      await approveRequest(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Approve failed");
    } finally {
      setBusyId(null);
    }
  }

  async function onReject(id: string) {
    setBusyId(id);
    try {
      await rejectRequest(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reject failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ModuleScreen
      title="Approvals"
      tabs={[
        { id: "eligible", label: "Eligible for me" },
        { id: "pending", label: "Pending" },
        { id: "all", label: "All" },
      ]}
      activeTab={tab}
      onTabChange={setTab}
      loading={loading}
      error={error}
      columns={[
        { key: "op", header: "Operation", render: (r) => r.operationCode },
        { key: "type", header: "Resource", render: (r) => `${r.resourceType} / ${r.resourceId}` },
        { key: "by", header: "Requested by", render: (r) => r.requestedBy || "—" },
        {
          key: "status",
          header: "Status",
          render: (r) => (
            <Badge tone={r.status === "APPROVED" ? "success" : r.status === "REJECTED" ? "danger" : "warning"}>
              {r.status}
            </Badge>
          ),
        },
        {
          key: "actions",
          header: "Actions",
          render: (r) =>
            r.status === "PENDING" || r.status === "PENDING_APPROVAL" ? (
              <span style={{ display: "inline-flex", gap: "0.4rem" }}>
                <Button disabled={busyId === r.id} onClick={() => void onApprove(r.id)}>
                  Approve
                </Button>
                <Button variant="secondary" disabled={busyId === r.id} onClick={() => void onReject(r.id)}>
                  Reject
                </Button>
              </span>
            ) : (
              "—"
            ),
        },
      ]}
      rows={rows}
      rowKey={(r) => r.id}
      emptyHint="Maker-checker requests from IAM, customer, and other services appear here."
    />
  );
}
