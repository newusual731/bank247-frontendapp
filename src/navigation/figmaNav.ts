import type { NavItem } from "./nav";

/** Primary sidebar from Navs.png — Dashboard label kept; home route is Customer. */
export const FIGMA_SIDEBAR: (NavItem & { icon: FigmaIconId })[] = [
  { to: "/", label: "Dashboard", end: true, icon: "dashboard" },
  { to: "/customers", label: "Customer", icon: "customer" },
  { to: "/mandates", label: "Mandate", icon: "mandate" },
  { to: "/teller", label: "Till Records", icon: "till" },
  { to: "/restrictions", label: "Restrict Management", icon: "restrict" },
  { to: "/vault", label: "Vault Record", icon: "vault" },
  { to: "/liens", label: "Block Funds", icon: "block" },
  { to: "/accounts", label: "Account Managemnt", icon: "account" },
  { to: "/cheques", label: "Cheque", icon: "cheque" },
  { to: "/memo", label: "Memo", icon: "memo" },
  { to: "/enquiries", label: "Enquiry / Report", icon: "enquiry" },
];

export type FigmaIconId =
  | "dashboard"
  | "customer"
  | "mandate"
  | "till"
  | "restrict"
  | "vault"
  | "block"
  | "account"
  | "cheque"
  | "memo"
  | "enquiry"
  | "bell"
  | "logout";
