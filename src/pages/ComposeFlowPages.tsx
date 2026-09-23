import { useState, type FormEvent, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { getAccountEnquiry, type AccountEnquiry } from "../api/accounts";
import { amendBranch, getBranchByCode, updateBranch } from "../api/branches";
import { bookInvestment, createInvestment } from "../api/loans";
import { createTradeInstrument, createTreasuryDeal } from "../api/markets";
import { createNotificationTemplate, sendNotification } from "../api/notifications";
import { createExternalPayment, createInternalPayment } from "../api/payments";
import { Badge, Button, PageHeader, TextField } from "../components/ui";
import { formatMoney, statusTone } from "../lib/statusTone";
import { NUBAN_LENGTH, NUBAN_PLACEHOLDER, sanitizeNubanInput } from "../lib/nuban";
import {
  FigmaAlert,
  FigmaField,
  FigmaInput,
  FigmaSelect,
} from "../components/figma/FigmaForm";
import { FigmaCreatePanel } from "../components/figma/FigmaHub";
import "../components/figma/FigmaForm.css";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function ref(prefix: string) {
  return `${prefix}-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

function PanelForm({
  title,
  onSubmit,
  busy,
  error,
  result,
  children,
}: {
  title: string;
  onSubmit: (e: FormEvent) => void;
  busy: boolean;
  error: string | null;
  result: string | null;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div>
      <PageHeader title={title} actions={<Button variant="ghost" onClick={() => navigate(-1)}>Close</Button>} />
      <form className="panel" style={{ maxWidth: 600 }} onSubmit={onSubmit}>
        <div style={{ display: "grid", gap: "0.9rem" }}>{children}</div>
        {error ? <div className="alert-error" style={{ marginTop: "1rem" }}>{error}</div> : null}
        {result ? <p style={{ marginTop: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>{result}</p> : null}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "1.25rem" }}>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? "Working…" : "Submit"}</Button>
        </div>
      </form>
    </div>
  );
}

export function PaymentComposePage() {
  const [mode, setMode] = useState<"internal" | "external">("internal");
  const [source, setSource] = useState("");
  const [dest, setDest] = useState("");
  const [bankCode, setBankCode] = useState("000");
  const [productCode, setProductCode] = useState("NIP");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [details, setDetails] = useState("");
  const [narration, setNarration] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const key = ref("PAY");
      if (mode === "internal") {
        const r = await createInternalPayment({
          idempotencyKey: key,
          sourceAccount: source.trim().toUpperCase(),
          destinationAccount: dest.trim().toUpperCase(),
          amount: Number(amount),
          currency: currency.toUpperCase(),
          narration: narration.trim() || undefined,
        });
        setResult(`${r.reference || key} · ${r.status || "OK"}`);
      } else {
        const r = await createExternalPayment({
          idempotencyKey: key,
          productCode: productCode.trim().toUpperCase(),
          sourceAccount: source.trim().toUpperCase(),
          destinationAccount: dest.trim().toUpperCase(),
          destinationBankCode: bankCode.trim(),
          amount: Number(amount),
          currency: currency.toUpperCase(),
          valueDate: today(),
          paymentDetails: details.trim() || "Payment",
          sessionId: ref("SES"),
          narration: narration.trim() || undefined,
        });
        setResult(`${r.reference} · ${r.status}`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Payment failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PanelForm title="New payment" onSubmit={(e) => void onSubmit(e)} busy={busy} error={error} result={result}>
      <label className="field" htmlFor="pmode">
        <span className="field-label">Channel</span>
        <select id="pmode" className="field-input" value={mode} onChange={(e) => setMode(e.target.value as "internal" | "external")}>
          <option value="internal">Internal</option>
          <option value="external">External (NIP / switch)</option>
        </select>
      </label>
      <TextField
        id="src"
        label="Source account"
        placeholder={NUBAN_PLACEHOLDER}
        inputMode="numeric"
        maxLength={NUBAN_LENGTH}
        value={source}
        onChange={(e) => setSource(sanitizeNubanInput(e.target.value))}
        required
      />
      <TextField
        id="dst"
        label="Destination account"
        placeholder={NUBAN_PLACEHOLDER}
        inputMode="numeric"
        maxLength={NUBAN_LENGTH}
        value={dest}
        onChange={(e) => setDest(sanitizeNubanInput(e.target.value))}
        required
      />
      {mode === "external" ? (
        <>
          <TextField id="bank" label="Destination bank code" value={bankCode} onChange={(e) => setBankCode(e.target.value)} required />
          <TextField id="prod" label="Product code" value={productCode} onChange={(e) => setProductCode(e.target.value)} required />
          <TextField id="det" label="Payment details" value={details} onChange={(e) => setDetails(e.target.value)} required />
        </>
      ) : null}
      <TextField id="amt" label="Amount" type="number" min={0.0001} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      <TextField id="ccy" label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} required />
      <TextField id="narr" label="Narration" value={narration} onChange={(e) => setNarration(e.target.value)} />
    </PanelForm>
  );
}

export function NotificationComposePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const mode = params.get("mode") === "template" ? "template" : "send";
  const prefillTemplate = params.get("template") || "OTP_SMS";
  const [templateCode, setTemplateCode] = useState(prefillTemplate);
  const [recipient, setRecipient] = useState("");
  const [varName, setVarName] = useState("name");
  const [varValue, setVarValue] = useState("");
  const [code, setCode] = useState("");
  const [channel, setChannel] = useState("SMS");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("Hello {{name}}");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      if (mode === "template") {
        await createNotificationTemplate({
          code: code.trim().toUpperCase(),
          channel,
          subjectTemplate: subject.trim() || undefined,
          bodyTemplate: body,
          active: true,
        });
      } else {
        const variables =
          varName.trim() && varValue.trim() ? { [varName.trim()]: varValue.trim() } : undefined;
        await sendNotification({
          requestReference: ref("NTF"),
          templateCode: templateCode.trim().toUpperCase(),
          recipient: recipient.trim(),
          variables,
        });
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Compose failed");
    } finally {
      setBusy(false);
    }
  }

  if (mode === "template") {
    return (
      <>
        <FigmaCreatePanel
          title="Create Notification Template"
          onClose={() => navigate("/notifications")}
          submitLabel="Create"
          onSubmit={() => void submit()}
          busy={busy}
          error={error}
        >
          <FigmaField label="Template Code">
            <FigmaInput
              placeholder="Enter code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </FigmaField>
          <FigmaField label="Channel">
            <FigmaSelect value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option value="SMS">SMS</option>
              <option value="EMAIL">EMAIL</option>
            </FigmaSelect>
          </FigmaField>
          <FigmaField label="Subject Template">
            <FigmaInput
              placeholder="Enter subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </FigmaField>
          <FigmaField label="Body Template">
            <textarea
              className="fg-control"
              style={{ height: 120, padding: "12px 14px", resize: "vertical" }}
              placeholder="Enter body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </FigmaField>
        </FigmaCreatePanel>
        {success ? (
          <FigmaAlert
            title="Success"
            message="Notification template created successfully"
            onClose={() => navigate("/notifications")}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <FigmaCreatePanel
        title="Compose Notification"
        onClose={() => navigate("/notifications")}
        submitLabel="Send"
        onSubmit={() => void submit()}
        busy={busy}
        error={error}
      >
        <FigmaField label="Template Code">
          <FigmaInput
            placeholder="Enter template code"
            value={templateCode}
            onChange={(e) => setTemplateCode(e.target.value)}
          />
        </FigmaField>
        <FigmaField label="Recipient">
          <FigmaInput
            placeholder="Enter recipient"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
        </FigmaField>
        <FigmaField label="Variable Name">
          <FigmaInput
            placeholder="e.g. name"
            value={varName}
            onChange={(e) => setVarName(e.target.value)}
          />
        </FigmaField>
        <FigmaField label="Variable Value">
          <FigmaInput
            placeholder="Enter value"
            value={varValue}
            onChange={(e) => setVarValue(e.target.value)}
          />
        </FigmaField>
      </FigmaCreatePanel>
      {success ? (
        <FigmaAlert
          title="Success"
          message="Notification sent successfully"
          onClose={() => navigate("/notifications")}
        />
      ) : null}
    </>
  );
}

const DEAL_TYPES = [
  "FX_SPOT",
  "FX_FORWARD",
  "FX_SWAP",
  "FX_OPTION",
  "MONEY_MARKET_PLACEMENT",
  "MONEY_MARKET_BORROWING",
  "SECURITY_BUY",
  "SECURITY_SELL",
];

function defaultDealType(prefix?: string | null) {
  if (!prefix) return "FX_SPOT";
  const p = prefix.toUpperCase();
  if (p.startsWith("FX_")) return "FX_SPOT";
  if (p.startsWith("MONEY_MARKET_")) return "MONEY_MARKET_PLACEMENT";
  if (p.startsWith("SECURITY_")) return "SECURITY_BUY";
  return "FX_SPOT";
}

export function TreasuryDealCreatePage() {
  const [params] = useSearchParams();
  const [dealType, setDealType] = useState(defaultDealType(params.get("typePrefix")));
  const [deskCode, setDeskCode] = useState("TREASURY");
  const [dealerId, setDealerId] = useState("DEALER01");
  const [counterpartyId, setCounterpartyId] = useState("");
  const [baseCurrency, setBaseCurrency] = useState("NGN");
  const [quoteCurrency, setQuoteCurrency] = useState("USD");
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("");
  const [tradeDate, setTradeDate] = useState(today());
  const [valueDate, setValueDate] = useState(today());
  const [maturityDate, setMaturityDate] = useState("");
  const [narration, setNarration] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const deal = await createTreasuryDeal({
        requestReference: ref("TD"),
        dealType,
        deskCode: deskCode.trim().toUpperCase(),
        dealerId: dealerId.trim(),
        counterpartyId: counterpartyId.trim(),
        baseCurrency: baseCurrency.toUpperCase(),
        quoteCurrency: quoteCurrency.trim() ? quoteCurrency.toUpperCase() : undefined,
        notionalAmount: Number(amount),
        agreedRate: rate ? Number(rate) : undefined,
        tradeDate,
        valueDate,
        maturityDate: maturityDate || undefined,
        narration: narration.trim() || undefined,
      });
      setResult(`${deal.dealReference} · ${deal.status}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Deal create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PanelForm title="Book treasury deal" onSubmit={(e) => void onSubmit(e)} busy={busy} error={error} result={result}>
      <label className="field" htmlFor="dtype">
        <span className="field-label">Deal type</span>
        <select id="dtype" className="field-input" value={dealType} onChange={(e) => setDealType(e.target.value)}>
          {DEAL_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </label>
      <TextField id="desk" label="Desk code" value={deskCode} onChange={(e) => setDeskCode(e.target.value)} required />
      <TextField id="dealer" label="Dealer ID" value={dealerId} onChange={(e) => setDealerId(e.target.value)} required />
      <TextField id="cp" label="Counterparty ID" value={counterpartyId} onChange={(e) => setCounterpartyId(e.target.value)} required />
      <TextField id="base" label="Base currency" value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value)} required />
      <TextField id="quote" label="Quote currency" value={quoteCurrency} onChange={(e) => setQuoteCurrency(e.target.value)} />
      <TextField id="amt" label="Notional amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      <TextField id="rate" label="Agreed rate" type="number" step="0.000001" value={rate} onChange={(e) => setRate(e.target.value)} />
      <TextField id="td" label="Trade date" type="date" value={tradeDate} onChange={(e) => setTradeDate(e.target.value)} required />
      <TextField id="vd" label="Value date" type="date" value={valueDate} onChange={(e) => setValueDate(e.target.value)} required />
      <TextField id="md" label="Maturity date" type="date" value={maturityDate} onChange={(e) => setMaturityDate(e.target.value)} />
      <TextField id="narr" label="Narration" value={narration} onChange={(e) => setNarration(e.target.value)} />
    </PanelForm>
  );
}

export function TradeInstrumentCreatePage() {
  const [customerId, setCustomerId] = useState("");
  const [account, setAccount] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [amount, setAmount] = useState("");
  const [expiry, setExpiry] = useState("");
  const [purpose, setPurpose] = useState("");
  const [tenorDays, setTenorDays] = useState("90");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const inst = await createTradeInstrument({
        applicationReference: ref("LC"),
        instrumentType: "LETTER_OF_CREDIT",
        customerId: customerId.trim(),
        applicantAccount: account.trim().toUpperCase(),
        beneficiaryName: beneficiary.trim(),
        counterpartyBankCode: bankCode.trim() || undefined,
        currency: currency.toUpperCase(),
        amount: Number(amount),
        applicationDate: today(),
        expiryDate: expiry,
        purpose: purpose.trim() || undefined,
        tenorDays: Number(tenorDays) || undefined,
      });
      setResult(`${inst.instrumentReference} · ${inst.status}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "LC create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PanelForm title="Issue letter of credit" onSubmit={(e) => void onSubmit(e)} busy={busy} error={error} result={result}>
      <TextField id="cust" label="Customer ID (UUID)" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required />
      <TextField
        id="acct"
        label="Applicant account"
        placeholder={NUBAN_PLACEHOLDER}
        inputMode="numeric"
        maxLength={NUBAN_LENGTH}
        value={account}
        onChange={(e) => setAccount(sanitizeNubanInput(e.target.value))}
        required
      />
      <TextField id="ben" label="Beneficiary name" value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} required />
      <TextField id="bank" label="Counterparty bank code" value={bankCode} onChange={(e) => setBankCode(e.target.value)} />
      <TextField id="ccy" label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} required />
      <TextField id="amt" label="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      <TextField id="exp" label="Expiry date" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} required />
      <TextField id="tenor" label="Tenor (days)" value={tenorDays} onChange={(e) => setTenorDays(e.target.value)} />
      <TextField id="purpose" label="Purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
    </PanelForm>
  );
}

export function InvestmentBookPage() {
  const [customerId, setCustomerId] = useState("");
  const [productCode, setProductCode] = useState("");
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [tenorDays, setTenorDays] = useState("90");
  const [rate, setRate] = useState("");
  const [rollover, setRollover] = useState("NONE");
  const [bookNow, setBookNow] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = await createInvestment({
        applicationReference: ref("INV"),
        customerId: customerId.trim(),
        productCode: productCode.trim().toUpperCase(),
        settlementAccount: account.trim().toUpperCase(),
        amount: Number(amount),
        tenorDays: Number(tenorDays),
        applicationDate: today(),
        rolloverOption: rollover,
        annualInterestRate: rate ? Number(rate) : undefined,
      });
      if (bookNow) {
        try {
          const booked = await bookInvestment(created.investmentNumber, today());
          setResult(`${booked.investmentNumber} · ${booked.status}`);
        } catch {
          setResult(`${created.investmentNumber} · ${created.status} (created; book pending approval)`);
        }
      } else {
        setResult(`${created.investmentNumber} · ${created.status}`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Investment booking failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PanelForm title="Book investment" onSubmit={(e) => void onSubmit(e)} busy={busy} error={error} result={result}>
      <TextField id="cust" label="Customer ID (UUID)" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required />
      <TextField id="prod" label="Product code" value={productCode} onChange={(e) => setProductCode(e.target.value)} required />
      <TextField
        id="acct"
        label="Settlement account"
        placeholder={NUBAN_PLACEHOLDER}
        inputMode="numeric"
        maxLength={NUBAN_LENGTH}
        value={account}
        onChange={(e) => setAccount(sanitizeNubanInput(e.target.value))}
        required
      />
      <TextField id="amt" label="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      <TextField id="tenor" label="Tenor (days)" value={tenorDays} onChange={(e) => setTenorDays(e.target.value)} required />
      <TextField id="rate" label="Annual interest rate" type="number" step="0.000001" value={rate} onChange={(e) => setRate(e.target.value)} />
      <label className="field" htmlFor="roll">
        <span className="field-label">Rollover</span>
        <select id="roll" className="field-input" value={rollover} onChange={(e) => setRollover(e.target.value)}>
          {["NONE", "PRINCIPAL_ONLY", "PRINCIPAL_AND_INTEREST"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
        <input type="checkbox" checked={bookNow} onChange={(e) => setBookNow(e.target.checked)} />
        Book immediately after create
      </label>
    </PanelForm>
  );
}

export function GlMappingAddPage() {
  const [branchCode, setBranchCode] = useState("");
  const [mappingKey, setMappingKey] = useState("SUSPENSE");
  const [glCode, setGlCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const branch = await getBranchByCode(branchCode.trim().toUpperCase());
      const merged = {
        ...(branch.glMappings || {}),
        [mappingKey.trim().toUpperCase()]: glCode.trim().toUpperCase(),
      };
      const body = {
        name: branch.name,
        address: branch.address || branch.name,
        regionCode: branch.regionCode || "HQ",
        shortName: branch.shortName,
        contactPhone: branch.contactPhone,
        contactEmail: branch.contactEmail,
        glMappings: merged,
      };
      try {
        const updated = await updateBranch(branch.id, body);
        setResult(`${updated.branchCode} · ${mappingKey.toUpperCase()} → ${glCode.toUpperCase()}`);
      } catch {
        const amended = await amendBranch(branch.id, body);
        setResult(`${amended.branchCode} · mapping amend submitted · ${amended.status}`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Add mapping failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PanelForm title="Add GL mapping" onSubmit={(e) => void onSubmit(e)} busy={busy} error={error} result={result}>
      <TextField id="br" label="Branch code" value={branchCode} onChange={(e) => setBranchCode(e.target.value)} required />
      <TextField id="key" label="Mapping key" value={mappingKey} onChange={(e) => setMappingKey(e.target.value)} required />
      <TextField id="gl" label="GL code" value={glCode} onChange={(e) => setGlCode(e.target.value)} required />
      <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem" }}>
        Common keys: SUSPENSE, INTERBRANCH, BANK_DRAFT_LIABILITY, BANK_DRAFT_SETTLEMENT, VAULT
      </p>
    </PanelForm>
  );
}

export function EnquiryNewPage() {
  const navigate = useNavigate();
  const [account, setAccount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enquiry, setEnquiry] = useState<AccountEnquiry | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setEnquiry(null);
    try {
      const data = await getAccountEnquiry(account.trim());
      setEnquiry(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Enquiry failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="New enquiry"
        actions={<Button variant="ghost" onClick={() => navigate("/enquiries")}>Close</Button>}
      />
      <form className="panel" style={{ maxWidth: 560 }} onSubmit={(e) => void onSubmit(e)}>
        <TextField
          id="acct"
          label="Account number"
          placeholder={NUBAN_PLACEHOLDER}
          inputMode="numeric"
          maxLength={NUBAN_LENGTH}
          value={account}
          onChange={(e) => setAccount(sanitizeNubanInput(e.target.value))}
          required
        />
        {error ? <div className="alert-error" style={{ marginTop: "1rem" }}>{error}</div> : null}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "1.25rem" }}>
          <Button type="submit" disabled={busy}>{busy ? "Enquiring…" : "Enquire"}</Button>
        </div>
      </form>
      {enquiry ? (
        <div className="panel" style={{ marginTop: "1rem", maxWidth: 720 }}>
          <p style={{ marginTop: 0 }}>
            <strong>{enquiry.account.accountNumber}</strong> · {enquiry.account.productCode} ·{" "}
            <Badge tone={statusTone(enquiry.account.status)}>{enquiry.account.status}</Badge>
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Debit {enquiry.debitAllowed ? "allowed" : "blocked"} · Credit {enquiry.creditAllowed ? "allowed" : "blocked"}
          </p>
          <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.2rem" }}>
            <li>Restrictions: {enquiry.restrictions?.length ?? 0}</li>
            <li>
              Liens: {enquiry.liens?.length ?? 0}
              {enquiry.liens?.[0]
                ? ` (e.g. ${formatMoney(enquiry.liens[0].amount)} ${enquiry.liens[0].currency})`
                : ""}
            </li>
            <li>Mandates: {enquiry.mandates?.length ?? 0}</li>
          </ul>
          <div style={{ marginTop: "1rem" }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(`/enquiries?account=${encodeURIComponent(enquiry.account.accountNumber)}`)}
            >
              Open in enquiries list
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
