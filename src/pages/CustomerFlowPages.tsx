import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { createCorporateCustomer } from "../api/customersCreate";
import { createMandate as createMandateApi } from "../api/mandates";
import {
  AddCustomerChrome,
  FigmaActions,
  FigmaDate,
  FigmaField,
  FigmaInput,
  FigmaPhone,
  FigmaRow,
  FigmaSelect,
  FigmaAlert,
  FIGMA_ALERT,
  GENDER_OPTS,
  OCCUPATION_OPTS,
  STATE_OPTS,
  type FigmaStep,
} from "../components/figma/FigmaForm";
import { FigmaCreatePanel } from "../components/figma/FigmaHub";
import { Button, PageHeader, TextField } from "../components/ui";
import { NUBAN_LENGTH, NUBAN_PLACEHOLDER, sanitizeNubanInput } from "../lib/nuban";
import "../components/figma/FigmaForm.css";
import "./Wizard.css";

const CORP_STEPS: FigmaStep[] = [
  { id: "company", label: "Company Details" },
  { id: "others", label: "Others" },
  { id: "info", label: "Information" },
  { id: "cif", label: "CIF Data" },
];

const GOV_STEPS: FigmaStep[] = [
  { id: "company", label: "Company Details" },
  { id: "others", label: "Others" },
  { id: "info", label: "Information (Many to 1)" },
  { id: "cif", label: "CIF Data" },
];

const INTERNAL_STEPS: FigmaStep[] = [
  { id: "company", label: "Company Details" },
  { id: "others", label: "Others" },
  { id: "cif", label: "CIF Data" },
];

type Form = Record<string, string>;

export type DirectorRecord = {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  mobileNumber: string;
  nin: string;
  residentialAddress: string;
  residentialCity: string;
  residentialState: string;
  nationality: string;
  occupation: string;
  dateOfArrival: string;
  accountNumber: string;
  percentageHolding: string;
};

const DIRECTORS_STORAGE_KEY = "bank247.corporate.directors";

function emptyDirector(): Omit<DirectorRecord, "id"> {
  return {
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    mobileNumber: "",
    nin: "",
    residentialAddress: "",
    residentialCity: "",
    residentialState: "",
    nationality: "",
    occupation: "",
    dateOfArrival: "",
    accountNumber: "",
    percentageHolding: "",
  };
}

function loadDirectors(): DirectorRecord[] {
  try {
    const raw = sessionStorage.getItem(DIRECTORS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DirectorRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveDirectors(rows: DirectorRecord[]) {
  sessionStorage.setItem(DIRECTORS_STORAGE_KEY, JSON.stringify(rows));
}

function opts(list: string[]) {
  return list.map((v) => (
    <option key={v || "__empty"} value={v}>
      {v || "Select"}
    </option>
  ));
}

function userTypeLabel(variant: string | null) {
  if (variant === "government") return "Government Record";
  if (variant === "internal") return "Internal Record";
  return "Non - Individual Customer";
}

function DirectorFormFields({
  form,
  set,
}: {
  form: Omit<DirectorRecord, "id">;
  set: (k: keyof Omit<DirectorRecord, "id">, v: string) => void;
}) {
  return (
    <>
      <h3 className="fg-section-title">Director&apos;s Personal Information</h3>
      <FigmaField label="First Name">
        <FigmaInput placeholder="Enter First Name" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
      </FigmaField>
      <FigmaField label="Middle Name">
        <FigmaInput placeholder="Enter Middle Name" value={form.middleName} onChange={(e) => set("middleName", e.target.value)} />
      </FigmaField>
      <FigmaField label="Last Name">
        <FigmaInput placeholder="Enter Last Name" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
      </FigmaField>
      <FigmaField label="Gender">
        <FigmaSelect value={form.gender} onChange={(e) => set("gender", e.target.value)}>
          {opts(GENDER_OPTS)}
        </FigmaSelect>
      </FigmaField>
      <FigmaField label="Date of Birth">
        <FigmaDate value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
      </FigmaField>
      <FigmaField label="Mobile Number">
        <FigmaInput placeholder="Enter Number" value={form.mobileNumber} onChange={(e) => set("mobileNumber", e.target.value)} />
      </FigmaField>
      <FigmaField label="National Identity Number">
        <FigmaInput placeholder="Enter NIN" value={form.nin} onChange={(e) => set("nin", e.target.value)} />
      </FigmaField>
      <FigmaField label="Residential Address">
        <FigmaInput placeholder="Text" value={form.residentialAddress} onChange={(e) => set("residentialAddress", e.target.value)} />
      </FigmaField>
      <FigmaField label="Residential City">
        <FigmaInput placeholder="Text" value={form.residentialCity} onChange={(e) => set("residentialCity", e.target.value)} />
      </FigmaField>
      <FigmaField label="Residential State">
        <FigmaSelect value={form.residentialState} onChange={(e) => set("residentialState", e.target.value)}>
          {opts(STATE_OPTS)}
        </FigmaSelect>
      </FigmaField>
      <FigmaField label="Nationality">
        <FigmaInput placeholder="Text" value={form.nationality} onChange={(e) => set("nationality", e.target.value)} />
      </FigmaField>
      <FigmaField label="Occupation">
        <FigmaSelect value={form.occupation} onChange={(e) => set("occupation", e.target.value)}>
          {opts(OCCUPATION_OPTS)}
        </FigmaSelect>
      </FigmaField>
      <FigmaField label="Date of Arrival">
        <FigmaDate value={form.dateOfArrival} onChange={(e) => set("dateOfArrival", e.target.value)} />
      </FigmaField>
      <FigmaField label="Account Number">
        <FigmaInput
          placeholder={NUBAN_PLACEHOLDER}
          inputMode="numeric"
          maxLength={NUBAN_LENGTH}
          value={form.accountNumber}
          onChange={(e) => set("accountNumber", sanitizeNubanInput(e.target.value))}
        />
      </FigmaField>
      <FigmaField label="Percentage Holding">
        <FigmaInput placeholder="Text" value={form.percentageHolding} onChange={(e) => set("percentageHolding", e.target.value)} />
      </FigmaField>
    </>
  );
}

function directorReturnPath(params: URLSearchParams) {
  const variant = params.get("variant");
  const base = "/customers/new/corporate";
  const q = new URLSearchParams();
  if (variant) q.set("variant", variant);
  q.set("step", "info");
  return `${base}?${q.toString()}`;
}

export function AddDirectorPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState(emptyDirector);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof Omit<DirectorRecord, "id">, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const back = directorReturnPath(params);

  function submit() {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First Name and Last Name are required");
      return;
    }
    const rows = loadDirectors();
    rows.push({ id: `dir-${Date.now()}`, ...form });
    saveDirectors(rows);
    navigate(back);
  }

  return (
    <FigmaCreatePanel
      title="Add Director"
      onClose={() => navigate(back)}
      onSubmit={submit}
      submitLabel="Add Director"
      clearLabel="Close"
      error={error}
    >
      <DirectorFormFields form={form} set={set} />
    </FigmaCreatePanel>
  );
}

export function UpdateDirectorPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const id = params.get("id") || "";
  const [form, setForm] = useState(emptyDirector);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const set = (k: keyof Omit<DirectorRecord, "id">, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const back = directorReturnPath(params);

  useEffect(() => {
    const row = loadDirectors().find((d) => d.id === id);
    if (!row) {
      setMissing(true);
      return;
    }
    const { id: _ignored, ...rest } = row;
    void _ignored;
    setForm(rest);
  }, [id]);

  function submit() {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First Name and Last Name are required");
      return;
    }
    const rows = loadDirectors().map((d) => (d.id === id ? { id, ...form } : d));
    saveDirectors(rows);
    navigate(back);
  }

  if (missing) {
    return (
      <FigmaCreatePanel title="Update Director" onClose={() => navigate(back)} hidePrimary clearLabel="Close">
        <p className="fg-error">Director not found. Add a director first.</p>
      </FigmaCreatePanel>
    );
  }

  return (
    <FigmaCreatePanel
      title="Update Director"
      onClose={() => navigate(back)}
      onSubmit={submit}
      submitLabel="Update Director"
      clearLabel="Close"
      error={error}
    >
      <DirectorFormFields form={form} set={set} />
    </FigmaCreatePanel>
  );
}

export function CorporateCustomerCreatePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const variant = params.get("variant");
  const steps = variant === "government" ? GOV_STEPS : variant === "internal" ? INTERNAL_STEPS : CORP_STEPS;
  const initialStep = (() => {
    const s = params.get("step");
    if (s === "info") {
      const idx = steps.findIndex((x) => x.id === "info" || x.id.startsWith("info"));
      return idx >= 0 ? idx : 0;
    }
    if (s === "others") return 1;
    if (s === "cif") return steps.length - 1;
    return 0;
  })();
  const [step, setStep] = useState(initialStep);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ id: string; cif?: string } | null>(null);
  const [directors, setDirectors] = useState<DirectorRecord[]>(() => loadDirectors());
  const [form, setForm] = useState<Form>({
    userType: userTypeLabel(variant),
    tin: "",
    tinValidated: "",
    tinValidatedDate: "",
    companyName: "",
    incorporationType: variant === "government" ? "GOVERNMENT" : "LIMITED",
    certificateNumber: "",
    incorporationDate: "",
    streetName: "",
    streetNumber: "",
    city: "",
    landmark: "",
    state: "Lagos",
    phone: "",
    mobile1: "",
    mobile2: "",
    email: "",
    stockExchange: "",
    crmsCode: "",
    sector: "",
    industry: "",
    scumlNumber: "",
    customerSegment: "",
    division: "",
    department: "",
    introducer: "",
    pep: "No",
    pepDescription: "",
    accountOfficerCode: "",
    contactName: "",
    contactRole: "",
    contactEmail: "",
    contactPhone: "",
    cifBranch: "HQ01",
    cifStatus: "",
    cifBlacklisted: "",
    cifWatchlisted: "",
    cifCreatedDate: "",
    cifCreatedBy: "",
    customerGroup: "",
  });

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    setDirectors(loadDirectors());
  }, [params]);

  function directorQuery(extra?: Record<string, string>) {
    const q = new URLSearchParams();
    if (variant) q.set("variant", variant);
    if (extra) {
      for (const [k, v] of Object.entries(extra)) q.set(k, v);
    }
    return q.toString();
  }

  function removeDirector(id: string) {
    const next = loadDirectors().filter((d) => d.id !== id);
    saveDirectors(next);
    setDirectors(next);
  }

  function onUserTypeChange(value: string) {
    set("userType", value);
    if (value.startsWith("Individual") && !value.includes("Minor") && !value.includes("Non")) {
      navigate("/customers/new");
    } else if (value.includes("Minor")) navigate("/customers/new?variant=minor");
    else if (value.includes("Government")) navigate("/customers/new/corporate?variant=government");
    else if (value.includes("Internal")) navigate("/customers/new/corporate?variant=internal");
    else navigate("/customers/new/corporate");
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const mobile = form.mobile1.trim() || form.phone.trim();
      const mobileNumber = mobile.startsWith("+") ? mobile : `+234${mobile.replace(/^0+/, "")}`;
      const created = await createCorporateCustomer({
        companyName: form.companyName.trim(),
        incorporationType: form.incorporationType.trim() || "LIMITED",
        certificateNumber: form.certificateNumber.trim(),
        incorporationDate: form.incorporationDate,
        tin: form.tin.trim(),
        email: form.email.trim(),
        mobileNumber,
        branchCode: (form.cifBranch || "HQ01").trim().toUpperCase(),
        category: "CORPORATE",
        addressLine1: [form.streetNumber, form.streetName].filter(Boolean).join(" ") || undefined,
        city: form.city || undefined,
        stateName: form.state || undefined,
      });
      setSuccess({ id: created.id, cif: created.cifNumber });
      saveDirectors([]);
      setDirectors([]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  function next() {
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
      setError(null);
      return;
    }
    void submit();
  }

  function previous() {
    if (step === 0) navigate("/customers");
    else setStep((s) => s - 1);
  }

  const othersStep = 1;
  const infoStep = variant === "internal" ? -1 : 2;
  const cifStep = variant === "internal" ? 2 : 3;

  return (
    <>
      <AddCustomerChrome onClose={() => navigate("/customers")} steps={steps} stepIndex={step} wide>
        {step === 0 ? (
          <>
            <div className="fg-user-type">
              <h3>Account User Type</h3>
              <FigmaField label="Select User Type">
                <FigmaSelect value={form.userType} onChange={(e) => onUserTypeChange(e.target.value)}>
                  <option>Individual Customer</option>
                  <option>Minor -Individual Customer</option>
                  <option>Non - Individual Customer</option>
                  <option>Internal Record</option>
                  <option>Government Record</option>
                </FigmaSelect>
              </FigmaField>
            </div>
            {variant === "government" ? (
              <>
                <FigmaField label="Company Name">
                  <FigmaSelect value={form.companyName} onChange={(e) => set("companyName", e.target.value)}>
                    {opts(["", "Federal Ministry", "State Agency", "Local Government", "Parastatal"])}
                  </FigmaSelect>
                </FigmaField>
                <FigmaRow>
                  <FigmaField label="Public Sector Type">
                    <FigmaSelect value={form.sector} onChange={(e) => set("sector", e.target.value)}>
                      {opts(["", "Federal", "State", "Local", "MDA"])}
                    </FigmaSelect>
                  </FigmaField>
                  <FigmaField label="Government Tier">
                    <FigmaSelect value={form.customerSegment} onChange={(e) => set("customerSegment", e.target.value)}>
                      {opts(["", "Tier 1", "Tier 2", "Tier 3"])}
                    </FigmaSelect>
                  </FigmaField>
                </FigmaRow>
                <FigmaRow>
                  <FigmaField label="Street Name">
                    <FigmaInput placeholder="Enter Name" value={form.streetName} onChange={(e) => set("streetName", e.target.value)} />
                  </FigmaField>
                  <FigmaField label="Street Number">
                    <FigmaInput placeholder="Enter Number" value={form.streetNumber} onChange={(e) => set("streetNumber", e.target.value)} />
                  </FigmaField>
                </FigmaRow>
                <FigmaRow>
                  <FigmaField label="City/Town">
                    <FigmaInput placeholder="Enter City/Town" value={form.city} onChange={(e) => set("city", e.target.value)} />
                  </FigmaField>
                  <FigmaField label="Landmark">
                    <FigmaInput placeholder="Enter Landmark" value={form.landmark} onChange={(e) => set("landmark", e.target.value)} />
                  </FigmaField>
                </FigmaRow>
                <FigmaRow>
                  <FigmaField label="Mobile Number 1">
                    <FigmaInput placeholder="Enter Number" value={form.mobile1} onChange={(e) => set("mobile1", e.target.value)} />
                  </FigmaField>
                  <FigmaField label="Mobile Number 2">
                    <FigmaInput placeholder="Enter Number" value={form.mobile2} onChange={(e) => set("mobile2", e.target.value)} />
                  </FigmaField>
                </FigmaRow>
                <FigmaRow>
                  <FigmaField label="State">
                    <FigmaSelect value={form.state} onChange={(e) => set("state", e.target.value)}>
                      {opts(STATE_OPTS)}
                    </FigmaSelect>
                  </FigmaField>
                  <FigmaField label="Phone Number">
                    <FigmaPhone value={form.phone} onChange={(v) => set("phone", v)} />
                  </FigmaField>
                </FigmaRow>
                <FigmaRow>
                  <FigmaField label="Email Address">
                    <FigmaInput placeholder="Enter Address" value={form.email} onChange={(e) => set("email", e.target.value)} />
                  </FigmaField>
                  <FigmaField label="Section">
                    <FigmaInput placeholder="Enter" value={form.department} onChange={(e) => set("department", e.target.value)} />
                  </FigmaField>
                </FigmaRow>
                <FigmaRow>
                  <FigmaField label="CRMS Code">
                    <FigmaInput placeholder="Enter Code" value={form.crmsCode} onChange={(e) => set("crmsCode", e.target.value)} />
                  </FigmaField>
                  <FigmaField label="Sector">
                    <FigmaSelect value={form.industry} onChange={(e) => set("industry", e.target.value)}>
                      {opts(["", "Public Administration", "Education", "Health", "Other"])}
                    </FigmaSelect>
                  </FigmaField>
                </FigmaRow>
                <FigmaField label="Industry">
                  <FigmaSelect value={form.stockExchange} onChange={(e) => set("stockExchange", e.target.value)}>
                    {opts(["", "Government", "Public Sector", "Other"])}
                  </FigmaSelect>
                </FigmaField>
              </>
            ) : variant === "internal" ? (
              <>
                <FigmaField label="Company Name">
                  <FigmaInput placeholder="Enter Company Name" value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
                </FigmaField>
                <FigmaRow>
                  <FigmaField label="Street Name">
                    <FigmaInput placeholder="Enter Name" value={form.streetName} onChange={(e) => set("streetName", e.target.value)} />
                  </FigmaField>
                  <FigmaField label="Street Number">
                    <FigmaInput placeholder="Enter Number" value={form.streetNumber} onChange={(e) => set("streetNumber", e.target.value)} />
                  </FigmaField>
                </FigmaRow>
                <FigmaRow>
                  <FigmaField label="City/Town">
                    <FigmaInput placeholder="Enter City/Town" value={form.city} onChange={(e) => set("city", e.target.value)} />
                  </FigmaField>
                  <FigmaField label="Landmark">
                    <FigmaInput placeholder="Enter Landmark" value={form.landmark} onChange={(e) => set("landmark", e.target.value)} />
                  </FigmaField>
                </FigmaRow>
                <FigmaRow>
                  <FigmaField label="State">
                    <FigmaSelect value={form.state} onChange={(e) => set("state", e.target.value)}>
                      {opts(STATE_OPTS)}
                    </FigmaSelect>
                  </FigmaField>
                  <FigmaField label="Phone Number">
                    <FigmaPhone value={form.phone} onChange={(v) => set("phone", v)} />
                  </FigmaField>
                </FigmaRow>
                <FigmaRow>
                  <FigmaField label="Mobile Number 1">
                    <FigmaInput placeholder="Enter Number" value={form.mobile1} onChange={(e) => set("mobile1", e.target.value)} />
                  </FigmaField>
                  <FigmaField label="Email Address">
                    <FigmaInput placeholder="Enter Address" value={form.email} onChange={(e) => set("email", e.target.value)} />
                  </FigmaField>
                </FigmaRow>
                <FigmaField label="Tax Identification Number (TIN)">
                  <FigmaInput placeholder="Enter TIN" value={form.tin} onChange={(e) => set("tin", e.target.value)} />
                </FigmaField>
              </>
            ) : (
              <>
            <FigmaField label="Tax Identification Number (TIN)">
              <FigmaInput placeholder="Enter TIN" value={form.tin} onChange={(e) => set("tin", e.target.value)} />
            </FigmaField>
            <FigmaRow>
              <FigmaField label="TIN Validated">
                <FigmaInput placeholder="Enter" value={form.tinValidated} onChange={(e) => set("tinValidated", e.target.value)} />
              </FigmaField>
              <FigmaField label="TIN Validated Date">
                <FigmaDate value={form.tinValidatedDate} onChange={(e) => set("tinValidatedDate", e.target.value)} />
              </FigmaField>
            </FigmaRow>
            <FigmaRow>
              <FigmaField label="Company Name">
                <FigmaInput placeholder="Enter Company Name" value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
              </FigmaField>
              <FigmaField label="Incorporation Type">
                <FigmaSelect value={form.incorporationType} onChange={(e) => set("incorporationType", e.target.value)}>
                  <option value="LIMITED">LIMITED</option>
                  <option value="PLC">PLC</option>
                  <option value="LLP">LLP</option>
                  <option value="GOVERNMENT">GOVERNMENT</option>
                  <option value="NGO">NGO</option>
                </FigmaSelect>
              </FigmaField>
            </FigmaRow>
            <FigmaRow>
              <FigmaField label="Certificate of Incorporation No">
                <FigmaInput placeholder="Enter Number" value={form.certificateNumber} onChange={(e) => set("certificateNumber", e.target.value)} />
              </FigmaField>
              <FigmaField label="Date of Incorporation">
                <FigmaDate value={form.incorporationDate} onChange={(e) => set("incorporationDate", e.target.value)} />
              </FigmaField>
            </FigmaRow>
            <FigmaRow>
              <FigmaField label="Street Name">
                <FigmaInput placeholder="Enter Name" value={form.streetName} onChange={(e) => set("streetName", e.target.value)} />
              </FigmaField>
              <FigmaField label="Street Number">
                <FigmaInput placeholder="Enter Number" value={form.streetNumber} onChange={(e) => set("streetNumber", e.target.value)} />
              </FigmaField>
            </FigmaRow>
            <FigmaRow>
              <FigmaField label="City/Town">
                <FigmaInput placeholder="Enter City/Town" value={form.city} onChange={(e) => set("city", e.target.value)} />
              </FigmaField>
              <FigmaField label="Landmark">
                <FigmaInput placeholder="Enter Landmark" value={form.landmark} onChange={(e) => set("landmark", e.target.value)} />
              </FigmaField>
            </FigmaRow>
            <FigmaRow>
              <FigmaField label="State">
                <FigmaSelect value={form.state} onChange={(e) => set("state", e.target.value)}>
                  {opts(STATE_OPTS)}
                </FigmaSelect>
              </FigmaField>
              <FigmaField label="Phone Number">
                <FigmaPhone value={form.phone} onChange={(v) => set("phone", v)} />
              </FigmaField>
            </FigmaRow>
            <FigmaRow>
              <FigmaField label="Mobile Number 1">
                <FigmaInput placeholder="Enter Number" value={form.mobile1} onChange={(e) => set("mobile1", e.target.value)} />
              </FigmaField>
              <FigmaField label="Mobile Number 2">
                <FigmaInput placeholder="Enter Number" value={form.mobile2} onChange={(e) => set("mobile2", e.target.value)} />
              </FigmaField>
            </FigmaRow>
            <FigmaRow>
              <FigmaField label="Email Address">
                <FigmaInput placeholder="Enter Address" value={form.email} onChange={(e) => set("email", e.target.value)} />
              </FigmaField>
              <FigmaField label="Stock Exchange">
                <FigmaInput placeholder="Enter Number" value={form.stockExchange} onChange={(e) => set("stockExchange", e.target.value)} />
              </FigmaField>
            </FigmaRow>
            <FigmaRow>
              <FigmaField label="CRMS Code">
                <FigmaInput placeholder="Enter Code" value={form.crmsCode} onChange={(e) => set("crmsCode", e.target.value)} />
              </FigmaField>
              <FigmaField label="Sector">
                <FigmaSelect value={form.sector} onChange={(e) => set("sector", e.target.value)}>
                  {opts(["", "Private", "Public", "NGO"])}
                </FigmaSelect>
              </FigmaField>
            </FigmaRow>
            <FigmaRow>
              <FigmaField label="Industry">
                <FigmaSelect value={form.industry} onChange={(e) => set("industry", e.target.value)}>
                  {opts(["", "Banking", "Oil & Gas", "Technology", "Trading", "Other"])}
                </FigmaSelect>
              </FigmaField>
              <FigmaField label="SCUML Number">
                <FigmaInput placeholder="Enter Number" value={form.scumlNumber} onChange={(e) => set("scumlNumber", e.target.value)} />
              </FigmaField>
            </FigmaRow>
              </>
            )}
          </>
        ) : null}

        {step === othersStep ? (
          <>
            <FigmaField label="Division">
              <FigmaSelect value={form.division} onChange={(e) => set("division", e.target.value)}>
                {opts(["", "Corporate", "Public Sector", "Internal"])}
              </FigmaSelect>
            </FigmaField>
            <FigmaField label="Department">
              <FigmaSelect value={form.department} onChange={(e) => set("department", e.target.value)}>
                {opts(["", "Operations", "Sales", "Compliance", "Treasury"])}
              </FigmaSelect>
            </FigmaField>
            <FigmaRow>
              <FigmaField label="Group">
                <FigmaSelect value={form.customerGroup} onChange={(e) => set("customerGroup", e.target.value)}>
                  {opts(["", "Corporate", "SME", "Government", "Internal"])}
                </FigmaSelect>
              </FigmaField>
              <FigmaField label="Team">
                <FigmaSelect value={form.customerSegment} onChange={(e) => set("customerSegment", e.target.value)}>
                  {opts(["", "Team A", "Team B", "Team C"])}
                </FigmaSelect>
              </FigmaField>
            </FigmaRow>
            <FigmaField label="Introducer">
              <FigmaSelect value={form.introducer} onChange={(e) => set("introducer", e.target.value)}>
                {opts(["", "Staff referral", "Walk-in", "Campaign"])}
              </FigmaSelect>
            </FigmaField>
            <FigmaField label="Account Officer Code">
              <FigmaInput placeholder="Enter" value={form.accountOfficerCode} onChange={(e) => set("accountOfficerCode", e.target.value)} />
            </FigmaField>
            {variant !== "government" && variant !== "internal" ? (
              <>
                <FigmaField label="PEP">
                  <FigmaSelect value={form.pep} onChange={(e) => set("pep", e.target.value)}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </FigmaSelect>
                </FigmaField>
                <FigmaField label="PEP Description">
                  <FigmaInput placeholder="Enter Description" value={form.pepDescription} onChange={(e) => set("pepDescription", e.target.value)} />
                </FigmaField>
              </>
            ) : null}
          </>
        ) : null}

        {step === infoStep ? (
          <>
            <FigmaField label="Primary Contact Name">
              <FigmaInput placeholder="Enter Name" value={form.contactName} onChange={(e) => set("contactName", e.target.value)} />
            </FigmaField>
            <FigmaRow>
              <FigmaField label="Contact Role">
                <FigmaInput placeholder="Enter Role" value={form.contactRole} onChange={(e) => set("contactRole", e.target.value)} />
              </FigmaField>
              <FigmaField label="Contact Phone">
                <FigmaInput placeholder="Enter Number" value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
              </FigmaField>
            </FigmaRow>
            <FigmaField label="Contact Email">
              <FigmaInput placeholder="Enter Email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
            </FigmaField>

            <div className="fg-directors-block">
              <div className="fg-directors-head">
                <h3 className="fg-section-title" style={{ margin: 0 }}>
                  Directors
                </h3>
                <button
                  type="button"
                  className="fg-btn fg-btn-primary cta"
                  onClick={() => navigate(`/customers/directors/new?${directorQuery()}`)}
                >
                  Add Director
                </button>
              </div>
              {directors.length === 0 ? (
                <p className="fg-directors-empty">No directors added yet. Add at least one director for this company.</p>
              ) : (
                <div className="fg-table-wrap" style={{ marginTop: 12 }}>
                  <table className="fg-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Mobile</th>
                        <th>% Holding</th>
                        <th aria-label="actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {directors.map((d) => (
                        <tr key={d.id}>
                          <td>{[d.firstName, d.middleName, d.lastName].filter(Boolean).join(" ")}</td>
                          <td>{d.mobileNumber || "—"}</td>
                          <td>{d.percentageHolding || "—"}</td>
                          <td>
                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                              <button
                                type="button"
                                className="fg-btn fg-btn-outline cta"
                                style={{ minWidth: 0, height: 32, padding: "0 10px", fontSize: 12 }}
                                onClick={() => navigate(`/customers/directors/update?${directorQuery({ id: d.id })}`)}
                              >
                                Update
                              </button>
                              <button
                                type="button"
                                className="fg-btn fg-btn-ghost cta"
                                style={{ minWidth: 0, height: 32, padding: "0 10px", fontSize: 12, color: "#d92d20" }}
                                onClick={() => removeDirector(d.id)}
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}

        {step === cifStep ? (
          <>
            <FigmaRow>
              <FigmaField label="CIF Number">
                <FigmaSelect value={form.cifStatus} onChange={(e) => set("cifStatus", e.target.value)}>
                  {opts(["", "Auto-generate", "Manual"])}
                </FigmaSelect>
              </FigmaField>
              <FigmaField label="CIF Creation Branch">
                <FigmaSelect value={form.cifBranch} onChange={(e) => set("cifBranch", e.target.value)}>
                  <option value="HQ01">HQ01</option>
                  <option value="HQ">HQ</option>
                </FigmaSelect>
              </FigmaField>
            </FigmaRow>
            <FigmaRow>
              <FigmaField label="CIF Status">
                <FigmaInput placeholder="Status" value={form.cifBlacklisted} onChange={(e) => set("cifBlacklisted", e.target.value)} />
              </FigmaField>
              <FigmaField label="CIF BlackListed">
                <FigmaInput placeholder="Enter" value={form.cifWatchlisted} onChange={(e) => set("cifWatchlisted", e.target.value)} />
              </FigmaField>
            </FigmaRow>
            <FigmaField label="CIF Watchlisted">
              <FigmaInput placeholder="Enter" value={form.scumlNumber} onChange={(e) => set("scumlNumber", e.target.value)} />
            </FigmaField>
            <FigmaRow>
              <FigmaField label="Date CIF Created">
                <FigmaDate value={form.cifCreatedDate} onChange={(e) => set("cifCreatedDate", e.target.value)} />
              </FigmaField>
              <FigmaField label="CIF Created By">
                <FigmaSelect value={form.cifCreatedBy} onChange={(e) => set("cifCreatedBy", e.target.value)}>
                  {opts(["", "Maker", "System"])}
                </FigmaSelect>
              </FigmaField>
            </FigmaRow>
            <FigmaRow>
              <FigmaField label="Date Creation Approved BY">
                <FigmaDate value={form.tinValidatedDate} onChange={(e) => set("tinValidatedDate", e.target.value)} />
              </FigmaField>
              <FigmaField label="CIF Creation Approved By">
                <FigmaSelect value={form.tinValidated} onChange={(e) => set("tinValidated", e.target.value)}>
                  {opts(["", "Checker", "Supervisor"])}
                </FigmaSelect>
              </FigmaField>
            </FigmaRow>
            <FigmaRow>
              <FigmaField label="IP address">
                <FigmaInput placeholder="Enter IP" value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
              </FigmaField>
              <FigmaField label="Device Name">
                <FigmaInput placeholder="Enter Name" value={form.contactName} onChange={(e) => set("contactName", e.target.value)} />
              </FigmaField>
            </FigmaRow>
          </>
        ) : null}

        {error ? <p className="fg-error">{error}</p> : null}
        <FigmaActions
          onPrevious={previous}
          onNext={next}
          nextLabel={step === steps.length - 1 ? "Submit" : "Next"}
          busy={busy}
        />
      </AddCustomerChrome>

      {success ? (
        <FigmaAlert
          {...FIGMA_ALERT.customerCreated}
          onClose={() => navigate(`/customers/${success.id}`)}
        />
      ) : null}
    </>
  );
}

export function MandateCreatePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [customerId, setCustomerId] = useState(params.get("customerId") || "");
  const [mandateType, setMandateType] = useState("SOLE");
  const [instruction, setInstruction] = useState("");
  const [signatoryName, setSignatoryName] = useState("");
  const [signatoryRole, setSignatoryRole] = useState("");
  const [signatoryBvn, setSignatoryBvn] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createMandateApi(customerId.trim(), {
        mandateType,
        instruction: instruction.trim(),
        signatories: [
          {
            fullName: signatoryName.trim(),
            role: signatoryRole.trim() || undefined,
            bvn: signatoryBvn.trim() || undefined,
          },
        ],
      });
      navigate("/mandates");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Create Mandate" actions={<Button variant="ghost" onClick={() => navigate("/mandates")}>Close</Button>} />
      <form className="panel" style={{ maxWidth: 640 }} onSubmit={(e) => void onSubmit(e)}>
        <div style={{ display: "grid", gap: "0.9rem", gridTemplateColumns: "1fr 1fr" }}>
          <TextField id="cid" label="Customer ID" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required />
          <label className="field">
            <span className="field-label">Mandate type</span>
            <select className="field-input" value={mandateType} onChange={(e) => setMandateType(e.target.value)}>
              <option value="SOLE">SOLE</option>
              <option value="JOINT">JOINT</option>
              <option value="EITHER_TO_SIGN">EITHER_TO_SIGN</option>
              <option value="ANY_TWO">ANY_TWO</option>
            </select>
          </label>
          <TextField id="inst" label="Instruction" value={instruction} onChange={(e) => setInstruction(e.target.value)} required />
          <TextField id="sname" label="Signatory full name" value={signatoryName} onChange={(e) => setSignatoryName(e.target.value)} required />
          <TextField id="srole" label="Signatory role" value={signatoryRole} onChange={(e) => setSignatoryRole(e.target.value)} />
          <TextField id="sbvn" label="Signatory BVN (11 digits)" value={signatoryBvn} onChange={(e) => setSignatoryBvn(e.target.value)} />
        </div>
        {error ? <div className="alert-error" style={{ marginTop: "1rem" }}>{error}</div> : null}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "1.25rem" }}>
          <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Create mandate"}</Button>
        </div>
      </form>
    </div>
  );
}

export function CustomerTypeSelectPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState("Individual Customer");
  const options = [
    { label: "Individual Customer", to: "/customers/new" },
    { label: "Minor- Individual Customer", to: "/customers/new?variant=minor" },
    { label: "Non Individual Customer", to: "/customers/new/corporate" },
    { label: "Internal Record", to: "/customers/new/corporate?variant=internal" },
    { label: "Government Record", to: "/customers/new/corporate?variant=government" },
  ];

  return (
    <div className="fg-type-page">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button type="button" className="fg-close cta" onClick={() => navigate("/customers")} aria-label="Close">
          ×
        </button>
        <h1 className="fg-wizard-title">Create Customer</h1>
      </div>
      <div className="fg-type-menu">
        {options.map((o) => (
          <button
            key={o.label}
            type="button"
            className={`fg-type-option cta${active === o.label ? " active" : ""}`}
            onMouseEnter={() => setActive(o.label)}
            onFocus={() => setActive(o.label)}
            onClick={() => navigate(o.to)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
