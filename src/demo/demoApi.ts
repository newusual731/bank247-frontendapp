import { demoNuban, EXAMPLE_NUBAN } from "../lib/nuban";

function page<T>(content: T[], pageNum = 0, size = 20) {
  return {
    content,
    page: pageNum,
    size,
    totalElements: content.length,
    totalPages: Math.max(1, Math.ceil(content.length / size) || 1),
  };
}

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso() {
  return new Date().toISOString();
}

const CUSTOMERS = [
  {
    id: "cust-001",
    cifNumber: "CIF0001001",
    type: "INDIVIDUAL" as const,
    displayName: "Adaobi Okonkwo",
    firstName: "Adaobi",
    lastName: "Okonkwo",
    branchCode: "HQ01",
    status: "ACTIVE" as const,
    email: "adaobi.okonkwo@example.com",
    mobileNumber: "+2348012345678",
    createdAt: "2025-11-12T09:00:00Z",
    kycStatus: "VERIFIED",
  },
  {
    id: "cust-002",
    cifNumber: "CIF0001002",
    type: "INDIVIDUAL" as const,
    displayName: "Chinedu Eze",
    firstName: "Chinedu",
    lastName: "Eze",
    branchCode: "HQ01",
    status: "ACTIVE" as const,
    email: "chinedu.eze@example.com",
    mobileNumber: "+2348098765432",
    createdAt: "2025-12-01T11:30:00Z",
    kycStatus: "VERIFIED",
  },
  {
    id: "cust-003",
    cifNumber: "CIF0002001",
    type: "CORPORATE" as const,
    displayName: "Lagos Trade Partners Ltd",
    companyName: "Lagos Trade Partners Ltd",
    branchCode: "LG02",
    status: "ACTIVE" as const,
    email: "ops@lagostrade.example.com",
    mobileNumber: "+2347011223344",
    createdAt: "2026-01-08T08:15:00Z",
    kycStatus: "VERIFIED",
  },
  {
    id: "cust-004",
    cifNumber: "CIF0001003",
    type: "INDIVIDUAL" as const,
    displayName: "Fatima Bello",
    firstName: "Fatima",
    lastName: "Bello",
    branchCode: "AB01",
    status: "PENDING_APPROVAL" as const,
    email: "fatima.bello@example.com",
    mobileNumber: "+2348033445566",
    createdAt: "2026-03-20T14:00:00Z",
    kycStatus: "IN_REVIEW",
  },
];

const BRANCHES = [
  {
    id: "br-hq01",
    branchCode: "HQ01",
    name: "Head Office",
    address: "1 Marina, Lagos",
    shortName: "HQ",
    regionCode: "SW",
    countryCode: "NG",
    currencyCode: "NGN",
    contactPhone: "+2347000000001",
    contactEmail: "hq@bank247.demo",
    status: "ACTIVE",
  },
  {
    id: "br-lg02",
    branchCode: "LG02",
    name: "Ikeja Branch",
    address: "Allen Avenue, Ikeja",
    shortName: "IKEJA",
    regionCode: "SW",
    countryCode: "NG",
    currencyCode: "NGN",
    status: "ACTIVE",
  },
  {
    id: "br-ab01",
    branchCode: "AB01",
    name: "Abuja Central",
    address: "Central Business District, Abuja",
    shortName: "ABJ",
    regionCode: "NC",
    countryCode: "NG",
    currencyCode: "NGN",
    status: "ACTIVE",
  },
];

const REGIONS = [
  { id: "reg-sw", code: "SW", name: "South West", zoneCode: "ZONE-A", countryCode: "NG", status: "ACTIVE" },
  { id: "reg-nc", code: "NC", name: "North Central", zoneCode: "ZONE-B", countryCode: "NG", status: "ACTIVE" },
];

const TILLS = [
  {
    id: "till-001",
    tellerId: "TELLER01",
    branchCode: "HQ01",
    currency: "NGN",
    ledgerAccountNumber: demoNuban(10),
    status: "ACTIVE",
  },
  {
    id: "till-002",
    tellerId: "TELLER02",
    branchCode: "LG02",
    currency: "NGN",
    ledgerAccountNumber: demoNuban(11),
    status: "ACTIVE",
  },
];

const VAULTS = [
  {
    id: "vault-001",
    branchCode: "HQ01",
    currency: "NGN",
    status: "ACTIVE",
    ledgerAccountNumber: demoNuban(20),
  },
  {
    id: "vault-002",
    branchCode: "LG02",
    currency: "NGN",
    status: "ACTIVE",
    ledgerAccountNumber: demoNuban(21),
  },
];

const USERS = [
  {
    id: "user-001",
    username: "demo",
    email: "demo@bank247.demo",
    firstName: "Demo",
    lastName: "User",
    status: "ACTIVE",
    homeBranchCode: "HQ01",
    departmentCode: "OPS",
    createdAt: "2025-10-01T10:00:00Z",
  },
  {
    id: "user-002",
    username: "maker01",
    email: "maker01@bank247.demo",
    firstName: "Maya",
    lastName: "Maker",
    status: "ACTIVE",
    homeBranchCode: "HQ01",
    departmentCode: "RETAIL",
    createdAt: "2025-11-15T10:00:00Z",
  },
  {
    id: "user-003",
    username: "checker01",
    email: "checker01@bank247.demo",
    firstName: "Chris",
    lastName: "Checker",
    status: "ACTIVE",
    homeBranchCode: "HQ01",
    departmentCode: "COMPLIANCE",
    createdAt: "2025-11-15T10:00:00Z",
  },
];

const ROLES = [
  {
    id: "role-001",
    code: "BRANCH_MANAGER",
    name: "Branch Manager",
    description: "Full branch operations",
    riskLevel: "HIGH",
    status: "ACTIVE",
    permissionCodes: [],
  },
  {
    id: "role-002",
    code: "TELLER",
    name: "Teller",
    description: "Cash and till operations",
    riskLevel: "MEDIUM",
    status: "ACTIVE",
    permissionCodes: [],
  },
];

const PERMISSIONS = [
  { id: "p1", code: "iam.user.write", module: "iam", action: "write", description: "Manage users" },
  { id: "p2", code: "ledger.post", module: "ledger", action: "post", description: "Post ledger entries" },
  { id: "p3", code: "customer.read", module: "customer", action: "read", description: "View customers" },
  { id: "p4", code: "teller.cash", module: "teller", action: "cash", description: "Cash transactions" },
  {
    id: "p5",
    code: "customer.identity.override",
    module: "customer",
    action: "override",
    description: "Edit identity-prefilled customer fields after BVN/NIN verify",
  },
];

const PRODUCTS_CASA = [
  { id: "prod-sav", code: "SAV001", name: "Savings Classic", accountType: "SAVINGS", currency: "NGN", status: "ACTIVE", createdAt: "2025-01-01T00:00:00Z" },
  { id: "prod-cur", code: "CUR001", name: "Current Plus", accountType: "CURRENT", currency: "NGN", status: "ACTIVE", createdAt: "2025-01-01T00:00:00Z" },
];

const PRODUCTS_LOAN = [
  { id: "prod-ln", code: "LN001", name: "Personal Loan", accountType: "LOAN", currency: "NGN", status: "ACTIVE", createdAt: "2025-01-01T00:00:00Z" },
];

const PRODUCTS_INV = [
  { id: "prod-tb", code: "TBILL", name: "Treasury Bill", accountType: "INVESTMENT", currency: "NGN", status: "ACTIVE", createdAt: "2025-01-01T00:00:00Z" },
];

const GL_ACCOUNTS = [
  { id: "gl-1", code: "1000", description: "Cash on Hand", nature: "ASSET", status: "ACTIVE", accountLevel: 1, postable: true, currency: "NGN", balance: 25000000 },
  { id: "gl-2", code: "1100", description: "Customer Deposits", nature: "LIABILITY", status: "ACTIVE", accountLevel: 1, postable: true, currency: "NGN", balance: 18000000 },
  { id: "gl-3", code: "4000", description: "Interest Income", nature: "INCOME", status: "ACTIVE", accountLevel: 1, postable: true, currency: "NGN", balance: 1200000 },
];

const APPROVALS = [
  {
    id: "apr-001",
    operationCode: "CUSTOMER_CREATE",
    resourceType: "CUSTOMER",
    resourceId: "cust-004",
    status: "PENDING",
    requestedBy: "maker01",
    requiredApprovals: 1,
    approvalCount: 0,
    createdAt: "2026-03-20T14:05:00Z",
  },
  {
    id: "apr-002",
    operationCode: "ACCOUNT_CLOSE",
    resourceType: "ACCOUNT",
    resourceId: EXAMPLE_NUBAN,
    status: "PENDING",
    requestedBy: "teller01",
    requiredApprovals: 1,
    approvalCount: 0,
    createdAt: "2026-03-21T09:00:00Z",
  },
];

const LOANS = [
  {
    id: "loan-001",
    loanNumber: "LN-2026-0001",
    customerId: "cust-001",
    productCode: "LN001",
    principal: 500000,
    currency: "NGN",
    status: "ACTIVE",
    branchCode: "HQ01",
    createdAt: "2026-02-01T10:00:00Z",
  },
];

const INVESTMENTS = [
  {
    id: "inv-001",
    investmentNumber: "TB-2026-0001",
    customerId: "cust-003",
    productCode: "TBILL",
    amount: 10000000,
    currency: "NGN",
    status: "BOOKED",
    createdAt: "2026-03-01T10:00:00Z",
  },
];

function accountFor(accountNumber: string) {
  return {
    id: `acct-${accountNumber}`,
    accountNumber,
    customerId: "cust-001",
    productCode: "SAV001",
    currency: "NGN",
    branchCode: "HQ01",
    status: "ACTIVE",
    customerType: "INDIVIDUAL",
    createdAt: "2025-12-15T10:00:00Z",
  };
}

function pathOnly(full: string): string {
  return full.split("?")[0];
}

function match(path: string, pattern: RegExp): RegExpMatchArray | null {
  return pathOnly(path).match(pattern);
}

/**
 * In-memory stub for all staff API calls while VITE_DEMO_MODE=true.
 * Unknown routes get a benign success-shaped payload so UI flows keep working.
 */
export async function demoApiRequest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  // Simulate light latency for a more realistic demo feel
  await new Promise((r) => setTimeout(r, 80));

  const method = (options.method || "GET").toUpperCase();
  const body = (options.body ?? {}) as Record<string, unknown>;
  const p = pathOnly(path);

  // —— Customers ——
  if (method === "GET" && p === "/api/v1/customers") {
    return page(CUSTOMERS) as T;
  }
  if (method === "GET" && match(p, /^\/api\/v1\/customers\/([^/]+)$/)) {
    const cid = match(p, /^\/api\/v1\/customers\/([^/]+)$/)![1];
    const found = CUSTOMERS.find((c) => c.id === cid) || {
      ...CUSTOMERS[0],
      id: cid,
      displayName: "Demo Customer",
    };
    return found as T;
  }
  if (method === "POST" && (p === "/api/v1/customers/individual" || p === "/api/v1/customers/corporate")) {
    return {
      id: id("cust"),
      cifNumber: `CIF${Date.now().toString().slice(-7)}`,
      type: p.endsWith("corporate") ? "CORPORATE" : "INDIVIDUAL",
      displayName: String(body.displayName || body.companyName || body.firstName || "New Customer"),
      branchCode: String(body.branchCode || "HQ01"),
      status: "PENDING_APPROVAL",
      createdAt: nowIso(),
      kycStatus: "PENDING",
    } as T;
  }
  if (method === "POST" && p === "/api/v1/customers/identity/bvn") {
    const bvn = String(body.bvn || "").replace(/\D/g, "");
    if (!/^\d{11}$/.test(bvn)) {
      throw new Error("BVN must be 11 digits");
    }
    return {
      source: "BVN",
      reference: bvn,
      profile: {
        title: "Mr",
        firstName: "Chinedu",
        middleName: "Emeka",
        lastName: "Okafor",
        dateOfBirth: "1990-04-12",
        gender: "Male",
        maritalStatus: "Married",
        nationality: "Nigerian",
        stateOfOrigin: "Anambra",
        lgaOfOrigin: "Awka South",
        phoneNumber: "08031234567",
        email: "chinedu.okafor@example.com",
        addressLine1: "14 Admiralty Way",
        city: "Lekki",
        stateName: "Lagos",
        validatedAt: nowIso().slice(0, 10),
      },
    } as T;
  }
  if (method === "POST" && p === "/api/v1/customers/identity/nin") {
    const nin = String(body.nin || "").replace(/\D/g, "");
    if (!/^\d{11}$/.test(nin)) {
      throw new Error("NIN must be 11 digits");
    }
    return {
      source: "NIN",
      reference: nin,
      profile: {
        title: "Mr",
        firstName: "Chinedu",
        middleName: "Emeka",
        lastName: "Okafor",
        dateOfBirth: "1990-04-12",
        gender: "Male",
        maritalStatus: "Married",
        nationality: "Nigerian",
        stateOfOrigin: "Anambra",
        lgaOfOrigin: "Awka South",
        phoneNumber: "08031234567",
        email: "chinedu.okafor@example.com",
        addressLine1: "14 Admiralty Way",
        city: "Lekki",
        stateName: "Lagos",
        validatedAt: nowIso().slice(0, 10),
      },
    } as T;
  }
  if (method === "GET" && match(p, /^\/api\/v1\/customers\/([^/]+)\/mandates$/)) {
    return [
      {
        id: "man-001",
        versionNo: 1,
        mandateType: "SINGLE",
        instruction: "Any one to sign",
        signatories: "Adaobi Okonkwo",
        status: "ACTIVE",
      },
    ] as T;
  }
  if (method === "POST" && match(p, /^\/api\/v1\/customers\/([^/]+)\/mandates$/)) {
    return {
      id: id("man"),
      versionNo: 1,
      mandateType: String(body.mandateType || "SINGLE"),
      instruction: String(body.instruction || ""),
      status: "ACTIVE",
    } as T;
  }
  if (method === "GET" && match(p, /^\/api\/v1\/customers\/([^/]+)\/documents$/)) {
    return [
      {
        id: "doc-001",
        documentType: "ID_CARD",
        fileName: "national-id.pdf",
        status: "VERIFIED",
        uploadedAt: "2025-11-12T09:30:00Z",
      },
    ] as T;
  }
  if (method === "POST" && match(p, /^\/api\/v1\/customers\/([^/]+)\/documents$/)) {
    return {
      id: id("doc"),
      documentType: String(body.documentType || "OTHER"),
      fileName: String(body.fileName || "upload.pdf"),
      status: "UPLOADED",
      uploadedAt: nowIso(),
    } as T;
  }

  // —— Accounts ——
  if (method === "GET" && match(p, /^\/api\/v1\/accounts\/([^/]+)\/enquiry$/)) {
    const acct = match(p, /^\/api\/v1\/accounts\/([^/]+)\/enquiry$/)![1];
    return {
      account: accountFor(acct),
      debitAllowed: true,
      creditAllowed: true,
      restrictions: [],
      liens: [],
      mandates: [{ id: "man-001", versionNo: 1, mandateType: "SINGLE", status: "ACTIVE" }],
    } as T;
  }
  if (method === "GET" && match(p, /^\/api\/v1\/accounts\/([^/]+)\/liens$/)) {
    return [] as T;
  }
  if (method === "GET" && match(p, /^\/api\/v1\/accounts\/([^/]+)\/restrictions$/)) {
    return [] as T;
  }
  if (method === "GET" && match(p, /^\/api\/v1\/accounts\/([^/]+)\/memos$/)) {
    return [] as T;
  }
  if (method === "GET" && match(p, /^\/api\/v1\/accounts\/([^/]+)$/)) {
    const acct = match(p, /^\/api\/v1\/accounts\/([^/]+)$/)![1];
    return accountFor(acct) as T;
  }
  if (method === "POST" && p === "/api/v1/accounts") {
    return {
      ...accountFor(demoNuban(Math.floor(Math.random() * 90))),
      productCode: String(body.productCode || "SAV001"),
      customerId: String(body.customerId || "cust-001"),
      status: "PENDING_ACTIVATION",
      createdAt: nowIso(),
    } as T;
  }
  if (
    method === "POST" &&
    (match(p, /\/apply-open$/) ||
      match(p, /\/activation\/retry$/) ||
      match(p, /\/reactivate$/) ||
      match(p, /\/close$/) ||
      match(p, /\/apply-close$/))
  ) {
    const acct = p.split("/")[4] || EXAMPLE_NUBAN;
    return { ...accountFor(decodeURIComponent(acct)), status: "ACTIVE" } as T;
  }
  if (method === "POST" && match(p, /\/cheque-books$/)) {
    return {
      id: id("chq"),
      accountNumber: EXAMPLE_NUBAN,
      startNumber: "000001",
      endNumber: "000025",
      leaves: 25,
      status: "ISSUED",
      createdAt: nowIso(),
    } as T;
  }
  if (method === "POST" && match(p, /\/liens$/)) {
    return {
      id: id("lien"),
      accountNumber: String(body.accountNumber || EXAMPLE_NUBAN),
      amount: body.amount ?? 0,
      currency: String(body.currency || "NGN"),
      reason: String(body.reason || ""),
      status: "PENDING",
      createdAt: nowIso(),
    } as T;
  }
  if (method === "POST" && (match(p, /\/liens\/[^/]+\/(apply|release|apply-release)$/))) {
    return {
      id: id("lien"),
      accountNumber: EXAMPLE_NUBAN,
      amount: 0,
      currency: "NGN",
      status: "ACTIVE",
      createdAt: nowIso(),
    } as T;
  }
  if (method === "POST" && match(p, /\/restrictions$/)) {
    return {
      id: id("rest"),
      accountNumber: EXAMPLE_NUBAN,
      restrictionType: String(body.restrictionType || "DEBIT_BLOCK"),
      reason: String(body.reason || ""),
      status: "ACTIVE",
      createdAt: nowIso(),
    } as T;
  }
  if (method === "POST" && match(p, /\/restrictions\/[^/]+\/release$/)) {
    return {
      id: id("rest"),
      accountNumber: EXAMPLE_NUBAN,
      restrictionType: "DEBIT_BLOCK",
      status: "RELEASED",
      createdAt: nowIso(),
    } as T;
  }
  if (method === "POST" && match(p, /\/memos$/)) {
    return {
      id: id("memo"),
      accountNumber: EXAMPLE_NUBAN,
      memoType: String(body.memoType || "GENERAL"),
      text: String(body.text || body.narrative || "Demo memo"),
      status: "ACTIVE",
      createdAt: nowIso(),
    } as T;
  }

  // —— Products ——
  if (method === "GET" && p.startsWith("/api/v1/products/casa")) return page(PRODUCTS_CASA) as T;
  if (method === "GET" && p.startsWith("/api/v1/products/loans")) return page(PRODUCTS_LOAN) as T;
  if (method === "GET" && p.startsWith("/api/v1/products/investments")) return page(PRODUCTS_INV) as T;
  if (method === "POST" && p === "/api/v1/products/casa") {
    return {
      id: id("prod"),
      code: String(body.code || "NEW001"),
      name: String(body.name || "New Product"),
      currency: String(body.currency || "NGN"),
      status: "ACTIVE",
      createdAt: nowIso(),
    } as T;
  }

  // —— Teller ——
  if (method === "GET" && p === "/api/v1/teller/admin/tills") return TILLS as T;
  if (method === "GET" && p === "/api/v1/teller/admin/vaults") return VAULTS as T;
  if (method === "POST" && p === "/api/v1/teller/admin/tills") {
    return {
      id: id("till"),
      tellerId: String(body.tellerId || "TELLER"),
      branchCode: String(body.branchCode || "HQ01"),
      currency: String(body.currency || "NGN"),
      ledgerAccountNumber: demoNuban(50),
      status: "ACTIVE",
    } as T;
  }
  if (method === "POST" && p === "/api/v1/teller/admin/vaults") {
    return {
      id: id("vault"),
      branchCode: String(body.branchCode || "HQ01"),
      currency: String(body.currency || "NGN"),
      status: "ACTIVE",
      ledgerAccountNumber: demoNuban(51),
    } as T;
  }
  if (method === "POST" && match(p, /\/tills\/[^/]+\/activate$/)) {
    return { ...TILLS[0], status: "ACTIVE" } as T;
  }
  if (method === "POST" && (p.includes("/deposits") || p.includes("/withdrawals"))) {
    return {
      reference: `TXN-${Date.now()}`,
      type: p.includes("deposit") ? "DEPOSIT" : "WITHDRAWAL",
      customerAccount: String(body.customerAccount || EXAMPLE_NUBAN),
      amount: body.amount ?? 0,
      currency: String(body.currency || "NGN"),
      status: "COMPLETED",
      narration: String(body.narration || "Demo cash txn"),
    } as T;
  }
  if (method === "POST" && (match(p, /reversal/) || match(p, /complete-reversal$/))) {
    return { reference: p.split("/")[5] || "TXN-DEMO", status: "REVERSED" } as T;
  }
  if (method === "GET" && match(p, /^\/api\/v1\/teller\/transactions\/[^/]+$/)) {
    return {
      reference: p.split("/").pop(),
      type: "DEPOSIT",
      amount: 50000,
      currency: "NGN",
      status: "COMPLETED",
    } as T;
  }
  if (method === "POST" && p === "/api/v1/teller/till-transfers") {
    return { reference: `TT-${Date.now()}`, status: "PENDING" } as T;
  }
  if (method === "POST" && match(p, /\/till-transfers\/[^/]+\/accept$/)) {
    return { reference: p.split("/")[5], status: "ACCEPTED" } as T;
  }
  if (method === "GET" && p.startsWith("/api/v1/teller/drafts")) {
    return page([
      {
        id: "draft-001",
        draftNumber: "BD-2026-0001",
        amount: 250000,
        currency: "NGN",
        status: "ISSUED",
        beneficiaryName: "Lagos Trade Partners Ltd",
        createdAt: "2026-03-10T10:00:00Z",
      },
    ]) as T;
  }
  if (method === "POST" && p === "/api/v1/teller/drafts") {
    return {
      id: id("draft"),
      draftNumber: `BD-${Date.now()}`,
      amount: body.amount ?? 0,
      currency: String(body.currency || "NGN"),
      status: "ISSUED",
      createdAt: nowIso(),
    } as T;
  }
  if (method === "POST" && match(p, /\/drafts\/[^/]+\/(settle|cancel|flag)$/)) {
    return {
      id: id("draft"),
      draftNumber: p.split("/")[5],
      status: "SETTLED",
      amount: 0,
      currency: "NGN",
    } as T;
  }
  if (method === "GET" && p === "/api/v1/teller/positions") {
    return {
      branchCode: "HQ01",
      tills: TILLS.map((t) => ({ ...t, tillId: t.id, balance: 1500000 })),
      vaults: VAULTS.map((v) => ({ ...v, vaultId: v.id, balance: 45000000 })),
    } as T;
  }

  // —— Branches / regions ——
  if (method === "GET" && p.startsWith("/api/v1/branches/by-code/")) {
    const code = decodeURIComponent(p.split("/").pop() || "HQ01");
    return (BRANCHES.find((b) => b.branchCode === code) || BRANCHES[0]) as T;
  }
  if (method === "GET" && match(p, /^\/api\/v1\/branches\/[^/]+$/) && !p.includes("by-code")) {
    const bid = p.split("/").pop();
    return (BRANCHES.find((b) => b.id === bid) || BRANCHES[0]) as T;
  }
  if (method === "GET" && p.startsWith("/api/v1/branches")) return page(BRANCHES, 0, 50) as T;
  if (method === "POST" && p === "/api/v1/branches") {
    return {
      id: id("br"),
      branchCode: String(body.branchCode || "XX01"),
      name: String(body.name || "New Branch"),
      status: "ACTIVE",
      regionCode: String(body.regionCode || "SW"),
      currencyCode: "NGN",
    } as T;
  }
  if (method === "PUT" || (method === "PATCH" && p.startsWith("/api/v1/branches/"))) {
    return { ...BRANCHES[0], name: String(body.name || BRANCHES[0].name) } as T;
  }
  if (method === "POST" && match(p, /\/branches\/[^/]+\/amend$/)) {
    return { ...BRANCHES[0], status: "PENDING_AMEND" } as T;
  }
  if (method === "GET" && p === "/api/v1/regions") return REGIONS as T;

  // —— IAM ——
  if (method === "GET" && p.startsWith("/api/v1/iam/users/") && p !== "/api/v1/iam/users") {
    const uid = p.split("/").pop();
    return (USERS.find((u) => u.id === uid) || USERS[0]) as T;
  }
  if (method === "GET" && p.startsWith("/api/v1/iam/users")) return USERS as T;
  if (method === "POST" && p === "/api/v1/iam/users") {
    return {
      id: id("user"),
      username: String(body.username || "newuser"),
      email: String(body.email || ""),
      status: "PENDING",
      homeBranchCode: String(body.homeBranchCode || "HQ01"),
      createdAt: nowIso(),
    } as T;
  }
  if (method === "POST" && match(p, /\/iam\/users\/[^/]+\//)) {
    return { ...USERS[0], status: "ACTIVE" } as T;
  }
  if (method === "GET" && p === "/api/v1/iam/roles") return ROLES as T;
  if (method === "GET" && p === "/api/v1/iam/permissions") return PERMISSIONS as T;
  if (method === "GET" && p.startsWith("/api/v1/iam/sod-violations")) return [] as T;
  if (method === "GET" && p === "/api/v1/iam/break-glass") return [] as T;
  if (method === "GET" && p.startsWith("/api/v1/iam/access-requests")) {
    return [
      {
        id: "ar-001",
        requester: "maker01",
        requestedRole: "TELLER",
        status: "PENDING",
        createdAt: "2026-03-18T10:00:00Z",
      },
    ] as T;
  }

  // —— Workflow / approvals ——
  if (method === "GET" && p.startsWith("/api/v1/approval-requests")) return page(APPROVALS) as T;
  if (method === "POST" && match(p, /\/approval-requests\/[^/]+\/approve$/)) {
    return { ...APPROVALS[0], id: p.split("/")[4], status: "APPROVED", approvalCount: 1 } as T;
  }
  if (method === "POST" && match(p, /\/approval-requests\/[^/]+\/reject$/)) {
    return { ...APPROVALS[0], id: p.split("/")[4], status: "REJECTED" } as T;
  }
  if (method === "GET" && p.startsWith("/api/v1/workflow-definitions")) {
    return page([
      {
        id: "wf-001",
        code: "CUSTOMER_CREATE",
        name: "Customer Create Approval",
        status: "ACTIVE",
        version: 1,
      },
    ]) as T;
  }

  // —— Ledger / GL ——
  if (method === "GET" && p.startsWith("/api/v1/gl/accounts")) return page(GL_ACCOUNTS, 0, 50) as T;
  if (method === "POST" && p === "/api/v1/gl/accounts") {
    return {
      id: id("gl"),
      code: String(body.code || "9999"),
      description: String(body.description || "New GL"),
      nature: String(body.nature || "ASSET"),
      status: "ACTIVE",
      accountLevel: 1,
      postable: true,
      currency: "NGN",
      balance: 0,
    } as T;
  }
  if (method === "GET" && match(p, /\/ledger\/accounts\/[^/]+\/entries/)) {
    return page([
      {
        id: "le-1",
        transactionReference: "TXN-DEMO-001",
        direction: "CREDIT",
        amount: 25000,
        currency: "NGN",
        narration: "Salary credit",
        postedAt: "2026-03-15T08:00:00Z",
      },
      {
        id: "le-2",
        transactionReference: "TXN-DEMO-002",
        direction: "DEBIT",
        amount: 5000,
        currency: "NGN",
        narration: "ATM withdrawal",
        postedAt: "2026-03-16T12:30:00Z",
      },
    ]) as T;
  }
  if (method === "GET" && p.startsWith("/api/v1/ledger/trial-balance")) {
    return {
      lines: [
        { nature: "ASSET", accountType: "CASH", currency: "NGN", debit: 25000000, credit: 0 },
        { nature: "LIABILITY", accountType: "DEPOSIT", currency: "NGN", debit: 0, credit: 25000000 },
      ],
      totals: [{ currency: "NGN", debit: 25000000, credit: 25000000, balanced: true }],
      balanced: true,
    } as T;
  }
  if (method === "POST" && match(p, /\/ledger\/postings\/[^/]+\/reverse$/)) {
    return { reference: p.split("/")[5], status: "REVERSED" } as T;
  }

  // —— Transfers / payments ——
  if (
    method === "POST" &&
    (p === "/api/v1/accounts/transfers" ||
      p === "/api/v1/transactions/internal-transfers" ||
      p.startsWith("/api/v1/payments/"))
  ) {
    return {
      reference: `PAY-${Date.now()}`,
      status: "COMPLETED",
      id: id("pay"),
    } as T;
  }
  if (method === "POST" && match(p, /\/transactions\/[^/]+\/reverse$/)) {
    return { reference: p.split("/")[4], status: "REVERSED" } as T;
  }
  if (method === "GET" && p.startsWith("/api/v1/payments")) {
    return page([
      {
        id: "pay-001",
        reference: "PAY-DEMO-001",
        amount: 100000,
        currency: "NGN",
        status: "COMPLETED",
        createdAt: "2026-03-14T10:00:00Z",
      },
    ]) as T;
  }

  // —— Loans / investments ——
  if (method === "GET" && p.startsWith("/api/v1/loans")) return page(LOANS) as T;
  if (method === "POST" && p === "/api/v1/loans") {
    return {
      id: id("loan"),
      loanNumber: `LN-${Date.now()}`,
      customerId: String(body.customerId || "cust-001"),
      productCode: String(body.productCode || "LN001"),
      principal: body.principal ?? 0,
      currency: "NGN",
      status: "PENDING",
      createdAt: nowIso(),
    } as T;
  }
  if (method === "GET" && p.startsWith("/api/v1/investments")) return page(INVESTMENTS) as T;
  if (method === "POST" && p === "/api/v1/investments") {
    return {
      id: id("inv"),
      investmentNumber: `INV-${Date.now()}`,
      productCode: String(body.productCode || "TBILL"),
      amount: body.amount ?? 0,
      currency: "NGN",
      status: "PENDING",
      createdAt: nowIso(),
    } as T;
  }
  if (method === "POST" && match(p, /\/investments\/[^/]+\/book$/)) {
    return { ...INVESTMENTS[0], status: "BOOKED" } as T;
  }

  // —— Markets ——
  if (method === "GET" && p.startsWith("/api/v1/treasury/deals")) {
    return page([
      {
        id: "deal-001",
        dealReference: "TD-2026-0001",
        instrumentType: "TBILL",
        amount: 50000000,
        currency: "NGN",
        status: "BOOKED",
        createdAt: "2026-03-05T10:00:00Z",
      },
    ]) as T;
  }
  if (method === "POST" && p === "/api/v1/treasury/deals") {
    return {
      id: id("deal"),
      dealReference: `TD-${Date.now()}`,
      status: "PENDING",
      amount: body.amount ?? 0,
      currency: "NGN",
      createdAt: nowIso(),
    } as T;
  }
  if (method === "POST" && match(p, /\/treasury\/deals\/[^/]+\/book$/)) {
    return { id: id("deal"), dealReference: p.split("/")[5], status: "BOOKED", currency: "NGN" } as T;
  }
  if (method === "GET" && p.startsWith("/api/v1/trade/instruments")) {
    return page([
      {
        id: "ti-001",
        code: "TBILL-91",
        name: "91-Day T-Bill",
        currency: "NGN",
        status: "ACTIVE",
      },
    ]) as T;
  }
  if (method === "POST" && p === "/api/v1/trade/instruments") {
    return {
      id: id("ti"),
      code: String(body.code || "NEW"),
      name: String(body.name || "Instrument"),
      currency: "NGN",
      status: "ACTIVE",
    } as T;
  }

  // —— Memos list / release ——
  if (method === "GET" && p.startsWith("/api/v1/account-memos")) {
    return page([
      {
        id: "memo-001",
        accountNumber: EXAMPLE_NUBAN,
        memoType: "GENERAL",
        text: "VIP customer — prefer branch service",
        status: "ACTIVE",
        createdAt: "2026-02-20T10:00:00Z",
      },
    ]) as T;
  }
  if (method === "POST" && match(p, /\/account-memos\/[^/]+\/release$/)) {
    return { id: p.split("/")[4], status: "RELEASED", accountNumber: EXAMPLE_NUBAN } as T;
  }

  // —— Notifications ——
  if (method === "GET" && p.startsWith("/api/v1/notifications") && !p.includes("templates")) {
    return page([
      {
        id: "n-001",
        channel: "EMAIL",
        subject: "Welcome to Bank247",
        status: "SENT",
        createdAt: "2026-03-01T10:00:00Z",
      },
    ]) as T;
  }
  if (method === "POST" && p === "/api/v1/notifications") {
    return { id: id("n"), channel: "EMAIL", status: "QUEUED", createdAt: nowIso() } as T;
  }
  if (method === "GET" && p.startsWith("/api/v1/notification-templates")) {
    return [
      { id: "nt-001", code: "WELCOME", name: "Welcome email", channel: "EMAIL", status: "ACTIVE" },
    ] as T;
  }
  if (method === "POST" && p === "/api/v1/notification-templates") {
    return {
      id: id("nt"),
      code: String(body.code || "TMP"),
      name: String(body.name || "Template"),
      channel: "EMAIL",
      status: "ACTIVE",
    } as T;
  }

  // —— Reporting / audit / EOD ——
  if (method === "GET" && p.startsWith("/api/v1/reports/financial/trial-balance")) {
    return {
      businessDate: "2026-03-21",
      lines: [
        { accountCode: "1000", accountName: "Cash", debit: 25000000, credit: 0 },
        { accountCode: "1100", accountName: "Deposits", debit: 0, credit: 25000000 },
      ],
      balanced: true,
    } as T;
  }
  if (method === "GET" && p.startsWith("/api/v1/audit/events")) {
    return page([
      {
        id: "aud-001",
        action: "LOGIN",
        actor: "demo",
        resourceType: "SESSION",
        createdAt: "2026-03-21T08:00:00Z",
      },
      {
        id: "aud-002",
        action: "CUSTOMER_VIEW",
        actor: "demo",
        resourceType: "CUSTOMER",
        resourceId: "cust-001",
        createdAt: "2026-03-21T08:05:00Z",
      },
    ]) as T;
  }
  if (method === "GET" && p.startsWith("/api/v1/eod/runs")) {
    return page([
      {
        id: "eod-001",
        businessDate: "2026-03-20",
        status: "COMPLETED",
        startedAt: "2026-03-20T23:00:00Z",
        completedAt: "2026-03-20T23:45:00Z",
      },
    ]) as T;
  }

  // Benign fallback — keep create/submit UIs from hard-failing
  if (method === "GET") {
    return page([]) as T;
  }
  if (method === "POST" || method === "PUT" || method === "PATCH") {
    return {
      id: id("demo"),
      reference: `DEMO-${Date.now()}`,
      status: "SUCCESS",
      createdAt: nowIso(),
      ...body,
    } as T;
  }

  throw new Error(`Demo stub: unsupported ${method} ${p}`);
}
