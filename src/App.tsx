import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { RequireAuth } from "./auth/RequireAuth";
import { AppShell } from "./layouts/AppShell";
import { LoginPage } from "./pages/LoginPage";
import { CustomersPage } from "./pages/CustomersPage";
import { CustomerCreatePage } from "./pages/CustomerCreatePage";
import { CustomerDetailPage } from "./pages/CustomerDetailPage";
import {
  BranchLoginPage,
  MandateUpdatePage,
  ModifyCustomerPage,
} from "./pages/FigmaRemainingPages";
import { UsersPage } from "./pages/UsersPage";
import { RolesPage } from "./pages/RolesPage";
import { ApprovalsPage } from "./pages/ApprovalsPage";
import { BrandingPage } from "./pages/BrandingPage";
import { CashTransactionPage } from "./pages/CashTransactionPage";
import { ReportsHubPage } from "./pages/ReportsHubPage";
import { ContractsHubPage } from "./pages/ContractsHubPage";
import { AuthHandoffPage } from "./pages/AuthHandoffPage";
import { AccountLookupPage } from "./pages/AccountLookupPage";
import { MandatesPage as LegacyMandatesPage } from "./pages/MandatesPage";
import { BranchesPage } from "./pages/BranchesPage";
import { TellerPositionsPage } from "./pages/TellerPositionsPage";
import { GlChartPage, GlJournalPage, GlSummaryPage } from "./pages/GlPages";
import { InvestmentsPage, LoansPage } from "./pages/LendingPages";
import { TradeInstrumentsPage, TreasuryDealsPage } from "./pages/MarketsPages";
import { ProductsPage } from "./pages/ProductsPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { AuditPage, TrialBalancePage } from "./pages/ReportingPages";
import {
  AccessRequestsPage,
  BreakGlassPage,
  EodRunsPage,
  SodPage,
  WorkflowDefinitionsPage,
} from "./pages/AdminExtraPages";
import {
  ChequePage as LegacyChequePage,
  EnquiryPage,
  GlMappingPage,
  PnlPage,
} from "./pages/RemainingModulesPages";
import { BankDraftsPage, MemosPage as LegacyMemosPage } from "./pages/MemoAndDraftPages";
import {
  CashHubPage,
  CashReversePage,
  TillCreatePage as LegacyTillCreatePage,
  TillTransferPage,
  VaultCreatePage as LegacyVaultCreatePage,
} from "./pages/TellerFlowPages";
import {
  GlCreatePage,
  LoanCreatePage,
  ProductCreatePage,
  ReverseEntryPage,
  TransferPage,
} from "./pages/OpsFlowPages";
import {
  AddDirectorPage,
  CorporateCustomerCreatePage,
  CustomerTypeSelectPage,
  UpdateDirectorPage,
} from "./pages/CustomerFlowPages";
import {
  BlockFundsPage as LegacyBlockFundsPage,
  ReleaseLienPage,
  RestrictionCreatePage as LegacyRestrictionCreatePage,
  RestrictionReleasePage,
} from "./pages/AccountOpsPages";
import {
  AccountStatementReportFigmaPage,
  TransactionReportFigmaPage,
} from "./pages/FigmaEnquiryReports";
import { CustomerDocumentUploadFigmaPage } from "./pages/FigmaDocumentUpload";
import {
  BlockFundCreateFigmaPage,
  BlockFundModifyPage,
  BlockFundsManagementPage,
  BlockFundViewPage,
  EnquiryManagementPage,
  EnquiryNewPage,
  EnquiryOverviewPage,
  GenerateStatementPage,
  GenerateTransactionReportPage,
  MandateCreatePage,
  MandatesPage,
  MandateViewPage,
  RestrictionCreateFigmaPage,
  RestrictionDeletePage,
  RestrictionManagementPage,
  RestrictionModifyPage,
  RestrictionViewPage,
  TillCloseFigmaPage,
  TillCreateFigmaPage,
  TillManagementPage,
  TillReactivateFigmaPage,
  TillSuspendFigmaPage,
  TillUpdateFigmaPage,
  TillViewPage,
  VaultCloseFigmaPage,
  VaultCreateFigmaPage,
  VaultInsuranceLimitFigmaPage,
  VaultManagementPage,
  VaultReactivateFigmaPage,
  VaultSuspendFigmaPage,
  VaultViewPage,
} from "./pages/FigmaOnboardingPages";
import {
  AccountManagementFigmaPage,
  AccountTypeSelectPage,
  ChequeManagementPage,
  ChequeUploadPage,
  CreateAccountFigmaPage,
  MemoCreatePage,
  MemoDeletePage,
  MemoManagementPage,
  MemoModifyPage,
  MemoViewPage,
  StopMultipleChequesPage,
  StopSingleChequePage,
  ViewStoppedChequePage,
} from "./pages/FigmaAccountChequeMemo";
import {
  ActivateAccountPage,
  ChequeViewBatchPage,
  CloseAccountBalancePage,
  CloseAccountPage,
  MigrateAccountBranchPage,
  MigrateAccountProductPage,
  ReactivateAccountPage,
  UpdateAccountPage,
} from "./pages/FigmaAccountActions";
import { BranchCreatePage, UserCreatePage, UserDetailPage } from "./pages/AdminFlowPages";
import {
  GlMappingAddPage,
  InvestmentBookPage,
  NotificationComposePage,
  PaymentComposePage,
  TradeInstrumentCreatePage,
  TreasuryDealCreatePage,
} from "./pages/ComposeFlowPages";
import {
  AccountTypePage,
  ContractBalancesPage,
  DailySummaryPage,
  FtModulePage,
  LandingPage,
  ModuleConfigPage,
  ReprintCashSlipPage,
  SpecialEntryPage,
} from "./pages/FigmaGapPages";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/branch" element={<BranchLoginPage />} />
          <Route path="/auth/handoff" element={<AuthHandoffPage />} />

          <Route element={<RequireAuth />}>
            {/* Fullscreen Figma wizards (no sidebar) */}
            <Route path="customers/types" element={<CustomerTypeSelectPage />} />
            <Route path="customers/new" element={<CustomerCreatePage />} />
            <Route path="customers/new/corporate" element={<CorporateCustomerCreatePage />} />
            <Route path="customers/directors/new" element={<AddDirectorPage />} />
            <Route path="customers/directors/update" element={<UpdateDirectorPage />} />
            <Route path="customers/:id/modify" element={<ModifyCustomerPage />} />
            <Route path="mandates/new" element={<MandateCreatePage />} />
            <Route path="mandates/:id/update" element={<MandateUpdatePage />} />
            <Route path="teller/till-create" element={<TillCreateFigmaPage />} />
            <Route path="teller/update" element={<TillUpdateFigmaPage />} />
            <Route path="teller/reactivate" element={<TillReactivateFigmaPage />} />
            <Route path="teller/suspend" element={<TillSuspendFigmaPage />} />
            <Route path="teller/close" element={<TillCloseFigmaPage />} />
            <Route path="teller/vault-create" element={<VaultCreateFigmaPage />} />
            <Route path="teller/vault-reactivate" element={<VaultReactivateFigmaPage />} />
            <Route path="teller/vault-suspend" element={<VaultSuspendFigmaPage />} />
            <Route path="teller/vault-insurance" element={<VaultInsuranceLimitFigmaPage />} />
            <Route path="teller/vault-close" element={<VaultCloseFigmaPage />} />
            <Route path="notifications/compose" element={<NotificationComposePage />} />
            <Route path="restrictions/new" element={<RestrictionCreateFigmaPage />} />
            <Route path="restrictions/modify" element={<RestrictionModifyPage />} />
            <Route path="restrictions/delete" element={<RestrictionDeletePage />} />
            <Route path="restrictions/view" element={<RestrictionViewPage />} />
            <Route path="liens/new" element={<BlockFundCreateFigmaPage />} />
            <Route path="liens/modify" element={<BlockFundModifyPage />} />
            <Route path="liens/view" element={<BlockFundViewPage />} />
            <Route path="cheques/upload" element={<ChequeUploadPage />} />
            <Route path="cheques/stop-single" element={<StopSingleChequePage />} />
            <Route path="cheques/stop-multiple" element={<StopMultipleChequesPage />} />
            <Route path="cheques/stop-view" element={<ViewStoppedChequePage />} />
            <Route path="memo/new" element={<MemoCreatePage />} />
            <Route path="memo/modify" element={<MemoModifyPage />} />
            <Route path="memo/delete" element={<MemoDeletePage />} />
            <Route path="accounts/create" element={<AccountTypeSelectPage />} />
            <Route path="accounts/create/form" element={<CreateAccountFigmaPage />} />
            <Route path="accounts/update" element={<UpdateAccountPage />} />
            <Route path="accounts/activate" element={<ActivateAccountPage />} />
            <Route path="accounts/reactivate" element={<ReactivateAccountPage />} />
            <Route path="accounts/migrate-branch" element={<MigrateAccountBranchPage />} />
            <Route path="accounts/migrate-product" element={<MigrateAccountProductPage />} />
            <Route path="accounts/close-balance" element={<CloseAccountBalancePage />} />
            <Route path="accounts/close" element={<CloseAccountPage />} />
            <Route path="enquiries/statement" element={<GenerateStatementPage />} />
            <Route path="enquiries/transaction-report" element={<GenerateTransactionReportPage />} />
            <Route path="enquiries/new" element={<EnquiryNewPage />} />
            <Route path="customers/upload" element={<CustomerDocumentUploadFigmaPage />} />
            <Route path="customers/:id/documents" element={<CustomerDocumentUploadFigmaPage />} />

            <Route element={<AppShell />}>
              <Route index element={<Navigate to="/customers" replace />} />
              <Route path="reports/daily-summary" element={<DailySummaryPage />} />
              <Route path="settings/modules" element={<ModuleConfigPage />} />
              <Route path="ft" element={<FtModulePage />} />
              <Route path="contracts/balances" element={<ContractBalancesPage />} />
              <Route path="accounts/types" element={<AccountTypePage />} />
              <Route path="teller/cash/reprint" element={<ReprintCashSlipPage />} />
              <Route path="gl/entries/special" element={<SpecialEntryPage title="Special Entry" />} />
              <Route path="gl/entries/pnl" element={<SpecialEntryPage title="P&L Entry" />} />
              <Route path="gl/entries/add" element={<SpecialEntryPage title="Add Entry" />} />

              <Route path="customers" element={<CustomersPage />} />
              <Route path="customers/:id" element={<CustomerDetailPage />} />
              <Route path="enquiries/statement-report" element={<AccountStatementReportFigmaPage />} />
              <Route path="enquiries/transaction-report-result" element={<TransactionReportFigmaPage />} />
              <Route path="reports/statements" element={<AccountStatementReportFigmaPage />} />

              <Route path="mandates" element={<MandatesPage />} />
              <Route path="mandates/:id" element={<MandateViewPage />} />
              <Route path="memo" element={<MemoManagementPage />} />
              <Route path="memo/view" element={<MemoViewPage />} />
              <Route path="memo/list" element={<LegacyMemosPage />} />

              <Route path="accounts" element={<AccountManagementFigmaPage />} />
              <Route path="accounts/open" element={<Navigate to="/accounts/create" replace />} />
              <Route path="accounts/lookup" element={<AccountLookupPage mode="accounts" />} />
              <Route path="restrictions" element={<RestrictionManagementPage />} />
              <Route path="restrictions/release" element={<RestrictionReleasePage />} />
              <Route path="liens" element={<BlockFundsManagementPage />} />
              <Route path="liens/legacy" element={<LegacyBlockFundsPage />} />
              <Route path="liens/release" element={<ReleaseLienPage />} />
              <Route path="cheques" element={<ChequeManagementPage />} />
              <Route path="cheques/batch" element={<ChequeViewBatchPage />} />
              <Route path="cheques/legacy" element={<LegacyChequePage />} />
              <Route path="transfers/customer" element={<TransferPage mode="customer" />} />
              <Route path="transfers/internal" element={<TransferPage mode="internal" />} />

              <Route path="teller" element={<TillManagementPage />} />
              <Route path="teller/positions" element={<TellerPositionsPage view="tills" />} />
              <Route path="vault" element={<VaultManagementPage />} />
              <Route path="vault/:id" element={<VaultViewPage />} />
              <Route path="enquiries" element={<EnquiryManagementPage />} />
              <Route path="enquiries/overview" element={<EnquiryOverviewPage />} />
              <Route path="enquiries/legacy" element={<EnquiryPage />} />
              <Route path="teller/cash" element={<CashHubPage />} />
              <Route
                path="teller/cash/deposit-lcy"
                element={<CashTransactionPage title="LCY Cash Deposit" mode="deposit" defaultCurrency="NGN" />}
              />
              <Route
                path="teller/cash/deposit-fcy"
                element={<CashTransactionPage title="FCY Cash Deposit" mode="deposit" defaultCurrency="USD" />}
              />
              <Route
                path="teller/cash/withdraw-lcy"
                element={<CashTransactionPage title="LCY Cash Withdrawal" mode="withdraw" defaultCurrency="NGN" />}
              />
              <Route
                path="teller/cash/withdraw-fcy"
                element={<CashTransactionPage title="FCY Cash Withdrawal" mode="withdraw" defaultCurrency="USD" />}
              />
              <Route
                path="teller/cash/withdraw-cheque"
                element={
                  <CashTransactionPage
                    title="Cash withdrawal with cheque"
                    mode="withdraw"
                    defaultCurrency="NGN"
                    accountLabel="Customer account"
                  />
                }
              />
              <Route path="teller/cash/reverse" element={<CashReversePage />} />
              <Route path="teller/till-transfer" element={<TillTransferPage />} />
              <Route path="teller/drafts" element={<BankDraftsPage />} />
              <Route path="teller/till-create-legacy" element={<LegacyTillCreatePage />} />
              <Route path="teller/vault-create-legacy" element={<LegacyVaultCreatePage />} />
              <Route path="restrictions/new-legacy" element={<LegacyRestrictionCreatePage />} />
              <Route path="mandates/legacy" element={<LegacyMandatesPage />} />
              <Route path="teller/:id" element={<TillViewPage />} />

              <Route path="gl" element={<GlSummaryPage />} />
              <Route path="gl/chart" element={<GlChartPage />} />
              <Route path="gl/create" element={<GlCreatePage />} />
              <Route path="gl/journal" element={<GlJournalPage />} />
              <Route path="gl/reverse" element={<ReverseEntryPage />} />
              <Route path="gl/mapping" element={<GlMappingPage />} />
              <Route path="gl/mapping/new" element={<GlMappingAddPage />} />

              <Route path="contracts" element={<ContractsHubPage />} />
              <Route path="loans" element={<LoansPage />} />
              <Route path="loans/new" element={<LoanCreatePage />} />
              <Route path="investments" element={<InvestmentsPage />} />
              <Route path="investments/new" element={<InvestmentBookPage />} />
              <Route
                path="markets/bonds"
                element={
                  <TreasuryDealsPage title="Bond Contracts" primary="New bond" typePrefix="SECURITY_" />
                }
              />
              <Route
                path="markets/forex"
                element={
                  <TreasuryDealsPage title="Forex Contracts" primary="New forex deal" typePrefix="FX_" />
                }
              />
              <Route
                path="markets/placements"
                element={
                  <TreasuryDealsPage
                    title="Placement Contracts"
                    primary="New placement"
                    typePrefix="MONEY_MARKET_"
                  />
                }
              />
              <Route
                path="markets/lc"
                element={
                  <TradeInstrumentsPage
                    title="Letters of Credit"
                    primary="Issue LC"
                    instrumentType="LETTER_OF_CREDIT"
                  />
                }
              />
              <Route path="markets/deals/new" element={<TreasuryDealCreatePage />} />
              <Route path="markets/lc/new" element={<TradeInstrumentCreatePage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="products/new" element={<ProductCreatePage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="payments/new" element={<PaymentComposePage />} />

              <Route path="reports" element={<ReportsHubPage />} />
              <Route path="reports/trial-balance" element={<TrialBalancePage />} />
              <Route path="reports/pnl" element={<PnlPage />} />
              <Route path="audit" element={<AuditPage />} />

              <Route path="iam/users" element={<UsersPage />} />
              <Route path="iam/users/new" element={<UserCreatePage />} />
              <Route path="iam/users/:id" element={<UserDetailPage />} />
              <Route path="iam/roles" element={<RolesPage />} />
              <Route path="iam/sod" element={<SodPage />} />
              <Route path="iam/break-glass" element={<BreakGlassPage />} />
              <Route path="iam/access-requests" element={<AccessRequestsPage />} />
              <Route path="approvals" element={<ApprovalsPage />} />
              <Route path="workflow/definitions" element={<WorkflowDefinitionsPage />} />
              <Route path="eod" element={<EodRunsPage />} />
              <Route path="settings/branding" element={<BrandingPage />} />
              <Route path="branches" element={<BranchesPage />} />
              <Route path="branches/new" element={<BranchCreatePage />} />
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
