import { useEffect, useState } from "react";
import { searchCustomers } from "../api/customers";
import { listMandates, type Mandate } from "../api/mandates";
import { ApiError } from "../api/client";
import { ModuleScreen } from "../components/ModuleScreen";
import { Badge, Button } from "../components/ui";
import { statusTone } from "../lib/statusTone";

export function MandatesPage() {
  const [cifOrName, setCifOrName] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [rows, setRows] = useState<Mandate[]>([]);
  const [context, setContext] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!submitted.trim()) {
      setRows([]);
      setContext(null);
      return;
    }
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const q = submitted.trim();
        const page = await searchCustomers({
          ...(/^\d+$/.test(q) || q.toUpperCase().startsWith("CIF")
            ? { cifNumber: q }
            : { name: q }),
          page: 0,
          size: 5,
        });
        const customer = page.content?.[0];
        if (!customer) {
          if (!cancelled) {
            setRows([]);
            setContext(null);
            setError("No customer matched that search");
          }
          return;
        }
        const mandates = await listMandates(customer.id);
        if (!cancelled) {
          setRows(mandates);
          setContext(`${customer.displayName} (${customer.cifNumber})`);
        }
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          setContext(null);
          setError(err instanceof ApiError ? err.message : "Unable to load mandates");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [submitted]);

  return (
    <ModuleScreen
      title="Mandate Management"
      primaryAction={{ label: "Create Mandate", to: "/mandates/new" }}
      search={cifOrName}
      onSearchChange={setCifOrName}
      searchPlaceholder="Customer name or CIF"
      filters={
        <Button variant="secondary" onClick={() => setSubmitted(cifOrName.trim())} disabled={!cifOrName.trim()}>
          Load
        </Button>
      }
      loading={loading}
      error={error}
      emptyHint="Search a customer, then mandates load from customer-service."
      columns={[
        { key: "type", header: "Type", render: (r) => r.mandateType },
        { key: "signatories", header: "Signatories", render: (r) => r.signatories || "—" },
        { key: "instruction", header: "Instruction", render: (r) => r.instruction || "—" },
        { key: "ver", header: "Version", render: (r) => String(r.versionNo) },
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
      ]}
      rows={rows}
      rowKey={(r) => r.id}
      footer={
        <p style={{ marginTop: "0.75rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
          {context ? `Customer: ${context} · ${rows.length} mandate(s)` : "No customer loaded"}
        </p>
      }
    />
  );
}
