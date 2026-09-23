import { PageHeader } from "../components/ui";

export function PlaceholderPage({ title, hint }: { title: string; hint?: string }) {
  return (
    <div>
      <PageHeader title={title} />
      <div className="panel">
        <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: 1.55 }}>
          {hint ||
            "This module is scaffolded to match the Figma navigation. Screens and API wiring land next."}
        </p>
      </div>
    </div>
  );
}
