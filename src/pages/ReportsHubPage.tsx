import { PageHeader } from "../components/ui";
import { Link } from "react-router-dom";

const REPORTS = [
  { to: "/reports/daily-summary", label: "Daily Summary" },
  { to: "/reports/trial-balance", label: "Trial Balance Report" },
  { to: "/reports/pnl", label: "P&L Report" },
  { to: "/reports/statements", label: "Account Statement Report" },
  { to: "/gl", label: "General Ledger" },
  { to: "/audit", label: "Audit Trail" },
  { to: "/enquiries", label: "Enquiries" },
  { to: "/contracts/balances", label: "Contract Balances" },
];

export function ReportsHubPage() {
  return (
    <div>
      <PageHeader title="Enquiry / Report" />
      <div className="card-grid">
        {REPORTS.map((r) => (
          <Link key={r.to} to={r.to} className="kpi-card cta" style={{ textDecoration: "none" }}>
            <p className="kpi-label">Report</p>
            <p className="kpi-value" style={{ fontSize: "1.1rem" }}>
              {r.label}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
