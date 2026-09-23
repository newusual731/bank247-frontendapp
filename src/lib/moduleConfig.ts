/** Bank staff module visibility (Figma Module Configuration). Stored per browser. */

const STORAGE_KEY = "bank247.moduleConfig";

export type ModuleToggle = {
  id: string;
  label: string;
  enabled: boolean;
};

const DEFAULTS: ModuleToggle[] = [
  { id: "customers", label: "Customer & CIF", enabled: true },
  { id: "accounts", label: "Accounts", enabled: true },
  { id: "branch", label: "Branch & cash", enabled: true },
  { id: "finance", label: "Finance / GL", enabled: true },
  { id: "contracts", label: "Contracts & products", enabled: true },
  { id: "reports", label: "Enquiry & reports", enabled: true },
  { id: "admin", label: "Administration", enabled: true },
  { id: "ft", label: "FT Module", enabled: true },
  { id: "markets", label: "Treasury / trade", enabled: true },
];

export function loadModuleConfig(): ModuleToggle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS.map((d) => ({ ...d }));
    const parsed = JSON.parse(raw) as ModuleToggle[];
    const byId = new Map(parsed.map((p) => [p.id, p]));
    return DEFAULTS.map((d) => ({ ...d, enabled: byId.get(d.id)?.enabled ?? d.enabled }));
  } catch {
    return DEFAULTS.map((d) => ({ ...d }));
  }
}

export function saveModuleConfig(modules: ModuleToggle[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(modules));
}

export function isModuleEnabled(moduleId: string): boolean {
  if (moduleId === "home") return true;
  const cfg = loadModuleConfig();
  const row = cfg.find((m) => m.id === moduleId);
  return row?.enabled !== false;
}
