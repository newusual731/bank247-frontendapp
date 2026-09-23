import { useState } from "react";
import { Button, PageHeader, TextField } from "../components/ui";

export function BrandingPage() {
  const [primary, setPrimary] = useState("#ff6b35");
  const [displayName, setDisplayName] = useState("Bank 24/7");

  return (
    <div>
      <PageHeader title="Branding" />
      <div className="panel" style={{ maxWidth: 560 }}>
        <div
          className="tabs"
          style={{ border: "none", marginBottom: "1rem", background: "var(--surface-sidebar)", borderRadius: 999, padding: 4, display: "inline-flex" }}
        >
          <button type="button" className="tab active cta" style={{ borderRadius: 999 }}>
            Upload Logo
          </button>
          <button type="button" className="tab cta" style={{ borderRadius: 999 }} disabled>
            Recent
          </button>
        </div>

        <div
          className="cta"
          style={{
            border: "2px dashed var(--border-strong)",
            borderRadius: "var(--radius-lg)",
            padding: "2.5rem 1rem",
            textAlign: "center",
            color: "var(--text-muted)",
            marginBottom: "1.25rem",
            background: "var(--surface-page)",
          }}
        >
          Click to upload your company logo here
        </div>

        <div style={{ display: "grid", gap: "0.85rem" }}>
          <TextField id="displayName" label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          <label className="field" htmlFor="primary">
            <span className="field-label">Primary color</span>
            <input id="primary" className="field-input" type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} />
          </label>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Logo, banners, and theme tokens will persist via a bank branding API. Preview applies locally for now.
          </p>
          <Button
            onClick={() => {
              document.documentElement.style.setProperty("--brand-primary", primary);
            }}
          >
            Apply preview
          </Button>
        </div>
      </div>
    </div>
  );
}
