import { PageHeader } from "../components/ui";
import { Link } from "react-router-dom";

const LINKS = [
  { to: "/loans", label: "Loan Contracts" },
  { to: "/investments", label: "Treasury Bill / Investments" },
  { to: "/markets/bonds", label: "Bond Contracts" },
  { to: "/markets/forex", label: "Forex Contracts" },
  { to: "/markets/placements", label: "Placement Contracts" },
  { to: "/markets/lc", label: "Letters of Credit" },
  { to: "/products", label: "Product Setup" },
];

export function ContractsHubPage() {
  return (
    <div>
      <PageHeader title="Contracts Products" />
      <div className="tabs" style={{ marginBottom: "1.25rem" }}>
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to} className="tab cta">
            {l.label}
          </Link>
        ))}
      </div>
      <div className="panel">
        <p style={{ margin: 0, color: "var(--text-secondary)" }}>
          Open a contract type from the tabs above. List screens match the Figma contract modules; create/disburse
          flows call lending and markets services through the API gateway.
        </p>
      </div>
    </div>
  );
}
