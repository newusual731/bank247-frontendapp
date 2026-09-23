export type NavItem = {
  to: string;
  label: string;
  end?: boolean;
};

export type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

/** Unified staff nav covering onboarding + transaction Figma packs. */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: "home",
    label: "Overview",
    items: [
      { to: "/", label: "Dashboard", end: true },
      { to: "/reports/daily-summary", label: "Daily Summary" },
      { to: "/ft", label: "FT Module" },
    ],
  },
  {
    id: "customers",
    label: "Front office",
    items: [
      { to: "/customers", label: "Customer" },
      { to: "/mandates", label: "Mandate" },
      { to: "/teller", label: "Till Records" },
      { to: "/restrictions", label: "Restrict Management" },
      { to: "/vault", label: "Vault Record" },
      { to: "/liens", label: "Block Funds" },
      { to: "/accounts", label: "Account Managemnt" },
      { to: "/cheques", label: "Cheque" },
      { to: "/memo", label: "Memo" },
      { to: "/enquiries", label: "Enquiry / Report" },
    ],
  },
  {
    id: "accounts",
    label: "Accounts ops",
    items: [
      { to: "/accounts/open", label: "Open account" },
      { to: "/accounts/types", label: "Account Type" },
      { to: "/restrictions/new", label: "Create restriction" },
      { to: "/liens/new", label: "Block funds create" },
      { to: "/customers/upload", label: "Document upload" },
      { to: "/customers/types", label: "Create Customer" },
      { to: "/mandates/new", label: "Create mandate" },
      { to: "/transfers/customer", label: "Customer transfer" },
      { to: "/transfers/internal", label: "Internal transfer" },
    ],
  },
  {
    id: "branch",
    label: "Branch & cash",
    items: [
      { to: "/teller/till-create", label: "Till creation" },
      { to: "/teller/vault-create", label: "Vault creation" },
      { to: "/teller/cash", label: "Cash transactions" },
      { to: "/teller/cash/reprint", label: "Reprint cash slip" },
      { to: "/teller/till-transfer", label: "Till transfer" },
      { to: "/teller/drafts", label: "Bank drafts" },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    items: [
      { to: "/gl", label: "General Ledger" },
      { to: "/gl/chart", label: "Chart of Accounts" },
      { to: "/gl/create", label: "GL Creation" },
      { to: "/gl/journal", label: "Journal / entries" },
      { to: "/gl/entries/add", label: "Add Entry" },
      { to: "/gl/entries/special", label: "Special Entry" },
      { to: "/gl/entries/pnl", label: "P&L Entry" },
      { to: "/gl/reverse", label: "Reverse entry" },
      { to: "/gl/mapping", label: "GL Mapping" },
      { to: "/gl/mapping/new", label: "Add GL mapping" },
    ],
  },
  {
    id: "contracts",
    label: "Contracts & products",
    items: [
      { to: "/loans", label: "Loan Contracts" },
      { to: "/loans/new", label: "New loan" },
      { to: "/investments", label: "Investments / T-Bills" },
      { to: "/investments/new", label: "Book investment" },
      { to: "/contracts/balances", label: "Contract Balances" },
      { to: "/markets/bonds", label: "Bond Contracts" },
      { to: "/markets/forex", label: "Forex Contracts" },
      { to: "/markets/placements", label: "Placement Contracts" },
      { to: "/markets/lc", label: "Letters of Credit" },
      { to: "/products", label: "Product Setup" },
      { to: "/products/new", label: "New product" },
      { to: "/payments", label: "Payments" },
      { to: "/payments/new", label: "New payment" },
    ],
  },
  {
    id: "reports",
    label: "Enquiry & reports",
    items: [
      { to: "/enquiries", label: "Enquiries" },
      { to: "/enquiries/new", label: "New enquiry" },
      { to: "/enquiries/statement", label: "Generate Account Statement" },
      { to: "/enquiries/transaction-report", label: "Generate Transaction Report" },
      { to: "/reports", label: "Reports hub" },
      { to: "/reports/trial-balance", label: "Trial Balance" },
      { to: "/reports/pnl", label: "P&L Report" },
      { to: "/reports/statements", label: "Account Statement" },
      { to: "/audit", label: "Audit Trail" },
    ],
  },
  {
    id: "admin",
    label: "Administration",
    items: [
      { to: "/iam/users", label: "User Management" },
      { to: "/iam/users/new", label: "Add user" },
      { to: "/iam/roles", label: "Role Management" },
      { to: "/iam/sod", label: "SoD violations" },
      { to: "/iam/break-glass", label: "Break-glass" },
      { to: "/iam/access-requests", label: "Access requests" },
      { to: "/approvals", label: "Approvals" },
      { to: "/workflow/definitions", label: "Workflow definitions" },
      { to: "/eod", label: "EOD runs" },
      { to: "/settings/branding", label: "Branding" },
      { to: "/settings/modules", label: "Module Configuration" },
      { to: "/branches", label: "Branches & regions" },
      { to: "/branches/new", label: "Create branch" },
      { to: "/notifications", label: "Notifications" },
      { to: "/notifications/compose", label: "Compose notification" },
    ],
  },
];
