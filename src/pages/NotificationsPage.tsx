import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listNotifications,
  listTemplates,
  type NotificationDelivery,
  type NotificationTemplate,
} from "../api/notifications";
import { ApiError } from "../api/client";
import { FigmaHubCard, FigmaTable, statusBadge } from "../components/figma/FigmaHub";
import { RowActionCell } from "./FigmaRemainingPages";
import "../components/figma/FigmaForm.css";

const TABS = [
  { id: "deliveries", label: "Deliveries" },
  { id: "templates", label: "Templates" },
] as const;

function deliveryTone(status: string): "ok" | "bad" | "warn" | "neutral" {
  const s = status.toUpperCase();
  if (s.includes("DELIVER") || s.includes("SENT") || s.includes("SUCCESS")) return "ok";
  if (s.includes("FAIL") || s.includes("ERROR") || s.includes("BOUNCE")) return "bad";
  if (s.includes("PEND") || s.includes("QUEUED") || s.includes("RETRY")) return "warn";
  return "neutral";
}

function formatWhen(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/** Notifications hub — Figma-consistent with Till / Vault / Customer menus */
export function NotificationsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("deliveries");
  const [search, setSearch] = useState("");
  const [deliveries, setDeliveries] = useState<NotificationDelivery[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (tab === "templates") {
          const rows = await listTemplates();
          if (!cancelled) setTemplates(rows);
        } else {
          const page = await listNotifications({ size: 50 });
          if (!cancelled) setDeliveries(page.content || []);
        }
      } catch (err) {
        if (!cancelled) {
          setDeliveries([]);
          setTemplates([]);
          setError(err instanceof ApiError ? err.message : "Unable to load notifications");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const q = search.trim().toLowerCase();
  const deliveryRows = deliveries.filter((r) =>
    !q
      ? true
      : [r.requestReference, r.templateCode, r.channel, r.status, r.recipientMasked]
          .join(" ")
          .toLowerCase()
          .includes(q),
  );
  const templateRows = templates.filter((r) =>
    !q ? true : [r.code, r.channel, r.status, r.subjectTemplate].join(" ").toLowerCase().includes(q),
  );

  return (
    <FigmaHubCard
      title="Notifications"
      subtitle="Delivery and template enquiry"
      search={search}
      onSearch={setSearch}
      searchPlaceholder="Search by reference, template, channel"
      primaryLabel="Compose"
      onPrimary={() =>
        navigate(tab === "templates" ? "/notifications/compose?mode=template" : "/notifications/compose")
      }
    >
      <div className="fg-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`fg-tab cta${tab === t.id ? " active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? <p className="fg-error">{error}</p> : null}
      {loading ? <p style={{ color: "#9ca3af" }}>Loading…</p> : null}

      {tab === "deliveries" ? (
        <FigmaTable
          peach
          headers={["Time", "Channel", "Template", "Recipient", "Status", "Reference", ""]}
        >
          {!loading && deliveryRows.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ color: "#9ca3af" }}>
                No notification deliveries yet
              </td>
            </tr>
          ) : (
            deliveryRows.map((r) => (
              <tr key={r.id}>
                <td>{formatWhen(r.createdAt)}</td>
                <td>{r.channel}</td>
                <td>{r.templateCode || "—"}</td>
                <td>{r.recipientMasked || "—"}</td>
                <td>{statusBadge(r.status, deliveryTone(r.status))}</td>
                <td>{r.requestReference}</td>
                <RowActionCell
                  items={[
                    {
                      label: "Compose Notification",
                      onClick: () => navigate("/notifications/compose"),
                    },
                    {
                      label: "Create Template",
                      onClick: () => navigate("/notifications/compose?mode=template"),
                    },
                  ]}
                />
              </tr>
            ))
          )}
        </FigmaTable>
      ) : (
        <FigmaTable headers={["Code", "Channel", "Subject", "Version", "Status", ""]} >
          {!loading && templateRows.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ color: "#9ca3af" }}>
                No templates yet
              </td>
            </tr>
          ) : (
            templateRows.map((r) => (
              <tr key={r.id}>
                <td>{r.code}</td>
                <td>{r.channel}</td>
                <td>{r.subjectTemplate || "—"}</td>
                <td>{r.version}</td>
                <td>
                  {statusBadge(
                    r.active || r.status === "ACTIVE" ? "Active" : r.status,
                    r.active || r.status === "ACTIVE" ? "ok" : "neutral",
                  )}
                </td>
                <RowActionCell
                  items={[
                    {
                      label: "Compose with template",
                      onClick: () =>
                        navigate(
                          `/notifications/compose?template=${encodeURIComponent(r.code)}`,
                        ),
                    },
                    {
                      label: "Create Template",
                      onClick: () => navigate("/notifications/compose?mode=template"),
                    },
                  ]}
                />
              </tr>
            ))
          )}
        </FigmaTable>
      )}
    </FigmaHubCard>
  );
}
