import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { createIndividualCustomer } from "../api/customersCreate";
import {
  verifyBvn,
  verifyNin,
  type IdentityProfile,
  type IdentityVerifyResponse,
} from "../api/identityVerify";
import { useAuth } from "../auth/AuthContext";
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
  EMP_STATUS_OPTS,
  GENDER_OPTS,
  ID_TYPE_OPTS,
  MARITAL_OPTS,
  OCCUPATION_OPTS,
  RELATIONSHIP_OPTS,
  RELIGION_OPTS,
  SEGMENT_OPTS,
  STATE_OPTS,
  TITLE_OPTS,
  type FigmaStep,
} from "../components/figma/FigmaForm";
import { COUNTRY_OPTS, OTHER_COUNTRY, statesForCountry } from "../lib/geo";

/** Catalog permission: edit fields prefilled from BVN/NIN identity verify. */
const IDENTITY_OVERRIDE = "customer.identity.override";

const INDIVIDUAL_STEPS: FigmaStep[] = [
  { id: "personal", label: "Personal" },
  { id: "contact", label: "Contact" },
  { id: "id", label: "Means Of Ident" },
  { id: "employment", label: "Employment" },
  { id: "nok", label: "Next Of Kin" },
  { id: "others", label: "Others" },
  { id: "documents", label: "Document Capture" },
  { id: "cif", label: "CIF Data" },
];

const MINOR_STEPS: FigmaStep[] = [
  { id: "personal", label: "Personal" },
  { id: "contact", label: "Contact" },
  { id: "id", label: "Means Of Ident" },
  { id: "employment", label: "Employment" },
  { id: "nok", label: "Next of Kin" },
  { id: "others", label: "Others" },
  { id: "documents", label: "Document Capture" },
];

const CUSTOMER_CATEGORY_OPTS = [
  "",
  "Individual Customer",
  "Youth Corper",
  "Salary Customer",
  "Minor",
  "Student",
  "Not For Profit",
  "Joint Customers",
];

const OPERATING_INSTRUCTION_OPTS = [
  "Any one to sign",
  "All signatories to sign",
  "Either A or B",
  "A and B jointly",
  "Guardian only",
  "Parent / Guardian with minor",
];

const OTHER_DOC_TYPE_OPTS = [
  "",
  "NEPA Bill",
  "Utility Bill",
  "Affidavit",
  "ID Card",
  "Passport",
  "Birth Certificate",
  "Other",
];

type Form = Record<string, string>;

type OtherDocRow = {
  id: string;
  docType: string;
  fileName: string;
  file: File | null;
};

function newOtherDocRow(): OtherDocRow {
  return {
    id: `doc-${Math.random().toString(36).slice(2, 9)}`,
    docType: "",
    fileName: "",
    file: null,
  };
}

function DocCaptureUpload({
  label,
  hint,
  accept,
  fileName,
  onFile,
}: {
  label: string;
  hint: string;
  accept: string;
  fileName: string;
  onFile: (file: File | null) => void;
}) {
  return (
    <FigmaField label={label}>
      <div className="fg-mandate-upload">
        <label className="fg-mandate-upload-circle cta">
          <input
            type="file"
            accept={accept}
            hidden
            onChange={(e) => onFile(e.target.files?.[0] || null)}
          />
          <span className="fg-mandate-upload-cam" aria-hidden>
            ↑
          </span>
          <span>{fileName ? "Replace" : "Upload"}</span>
        </label>
        <div className="fg-mandate-upload-meta">
          <div>{fileName ? <strong>{fileName}</strong> : hint}</div>
          <div>JPG, JPEG, PNG, PDF · Max 2MB</div>
          {fileName ? (
            <button type="button" className="fg-btn-link cta" onClick={() => onFile(null)}>
              Remove
            </button>
          ) : null}
        </div>
      </div>
    </FigmaField>
  );
}

const initial: Form = {
  userType: "Individual Customer",
  title: "",
  surname: "",
  middleName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  maritalStatus: "",
  religion: "",
  nationality: "Nigerian",
  stateOfOrigin: "",
  lgaOfOrigin: "",
  stateOfOrigin2: "",
  residencePermit: "",
  bvn: "",
  bvnValidationDate: "",
  nin: "",
  ninValidationDate: "",
  customerCategory: "",
  streetNumber: "",
  streetName: "",
  city: "",
  landmark: "",
  country: "Nigeria",
  countryOther: "",
  state: "Lagos",
  mobile1: "",
  mobile2: "",
  foreignNumber: "",
  email: "",
  twitter: "",
  facebook: "",
  idType: "",
  idNumber: "",
  idIssuedDate: "",
  idExpiredDate: "",
  idValidatedDate: "",
  idWaiver: "",
  occupation: "",
  employmentStatus: "",
  natureOfBusiness: "",
  employmentDate: "",
  employmentMobile: "",
  empAddress: "",
  empLga: "",
  empState: "",
  nokRelationship: "",
  nokSurname: "",
  nokMiddleName: "",
  nokLastName: "",
  nokMobile: "",
  nokEmail: "",
  nokAddress: "",
  nokLandmark: "",
  nokState: "",
  nokCity: "",
  customerSegment: "",
  sector: "",
  industry: "",
  deceased: "",
  division: "",
  department: "",
  group: "",
  team: "",
  introducer: "",
  pep: "No",
  pepDescription: "",
  riskRating: "",
  origin: "",
  accountOfficerCode: "",
  cifNumber: "",
  cifBranch: "HQ01",
  cifStatus: "",
  cifBlacklisted: "",
  cifWatchlisted: "",
  cifCreatedDate: "",
  cifCreatedBy: "",
  cifApprovedDate: "",
  cifApprovedBy: "",
  cifModifiedDate: "",
  cifModifiedBy: "",
  ipAddress: "",
  deviceName: "",
  customerGroup: "",
  guardianName: "",
  guardianPhone: "",
  guardianRelationship: "",
};

function opts(list: string[]) {
  return list.map((v) => (
    <option key={v || "__empty"} value={v}>
      {v || "Select"}
    </option>
  ));
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function profileToFormPatch(profile: IdentityProfile, kind: "BVN" | "NIN"): Partial<Form> {
  const validated = profile.validatedAt?.slice(0, 10) || todayIsoDate();
  return {
    title: profile.title || "",
    surname: profile.firstName || "",
    middleName: profile.middleName || "",
    lastName: profile.lastName || "",
    dateOfBirth: profile.dateOfBirth?.slice(0, 10) || "",
    gender: profile.gender || "",
    maritalStatus: profile.maritalStatus || "",
    nationality: profile.nationality || "Nigerian",
    stateOfOrigin: profile.stateOfOrigin || "",
    lgaOfOrigin: profile.lgaOfOrigin || "",
    stateOfOrigin2: profile.stateOfOrigin || "",
    mobile1: profile.phoneNumber || "",
    email: profile.email || "",
    ...(kind === "BVN" ? { bvnValidationDate: validated } : { ninValidationDate: validated }),
  };
}

function lockedKeysFromPatch(patch: Partial<Form>): string[] {
  return Object.entries(patch)
    .filter(([, v]) => typeof v === "string" && v.trim() !== "")
    .map(([k]) => k);
}

export function CustomerCreatePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  // Explicit grant only — empty demo "allow-all" must not unlock KYC-prefilled fields
  const canOverrideIdentity = Boolean(user?.permissions.includes(IDENTITY_OVERRIDE));
  const isMinor = params.get("variant") === "minor";
  const steps = isMinor ? MINOR_STEPS : INDIVIDUAL_STEPS;
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>({
    ...initial,
    userType: "Individual Customer",
  });
  const [lockedFields, setLockedFields] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);
  const [identityMsg, setIdentityMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState<"bvn" | "nin" | null>(null);
  const [success, setSuccess] = useState<{ id: string; cif?: string } | null>(null);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [operatingInstructions, setOperatingInstructions] = useState<string[]>([]);
  const [customInstruction, setCustomInstruction] = useState("");
  const [otherDocs, setOtherDocs] = useState<OtherDocRow[]>(() => [newOtherDocRow()]);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const contactStates = useMemo(() => statesForCountry(form.country), [form.country]);
  const isOtherCountry = form.country === OTHER_COUNTRY;
  const documentsStepIndex = steps.findIndex((s) => s.id === "documents");
  const cifStepIndex = steps.findIndex((s) => s.id === "cif");

  function toggleOperatingInstruction(value: string) {
    setOperatingInstructions((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  function addCustomInstruction() {
    const v = customInstruction.trim();
    if (!v) return;
    setOperatingInstructions((prev) => (prev.includes(v) ? prev : [...prev, v]));
    setCustomInstruction("");
  }

  function updateOtherDoc(id: string, patch: Partial<OtherDocRow>) {
    setOtherDocs((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeOtherDoc(id: string) {
    setOtherDocs((rows) => (rows.length <= 1 ? [newOtherDocRow()] : rows.filter((r) => r.id !== id)));
  }

  function onCountryChange(value: string) {
    setForm((f) => ({
      ...f,
      country: value,
      countryOther: value === OTHER_COUNTRY ? f.countryOther : "",
      state: "",
    }));
  }

  function isLocked(key: string) {
    return lockedFields.has(key) && !canOverrideIdentity;
  }

  function applyIdentity(result: IdentityVerifyResponse) {
    const patch = profileToFormPatch(result.profile, result.source);
    const keys = lockedKeysFromPatch(patch);
    setForm((f) => ({ ...f, ...patch }));
    setLockedFields((prev) => {
      const next = new Set(prev);
      for (const k of keys) next.add(k);
      return next;
    });
    setIdentityMsg(
      result.source === "BVN"
        ? "BVN verified with NIBSS. Personal details were prefilled and locked."
        : "NIN verified. Personal details were prefilled and locked.",
    );
    setError(null);
  }

  async function onVerifyBvn() {
    const bvn = form.bvn.replace(/\D/g, "");
    if (!/^\d{11}$/.test(bvn)) {
      setError("Enter a valid 11-digit BVN");
      return;
    }
    setVerifying("bvn");
    setError(null);
    setIdentityMsg(null);
    try {
      set("bvn", bvn);
      applyIdentity(await verifyBvn(bvn));
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "BVN verification failed");
    } finally {
      setVerifying(null);
    }
  }

  async function onVerifyNin() {
    const nin = form.nin.replace(/\D/g, "");
    if (!/^\d{11}$/.test(nin)) {
      setError("Enter a valid 11-digit NIN");
      return;
    }
    setVerifying("nin");
    setError(null);
    setIdentityMsg(null);
    try {
      set("nin", nin);
      applyIdentity(await verifyNin(nin));
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "NIN verification failed");
    } finally {
      setVerifying(null);
    }
  }

  const userTypeChoices = useMemo(
    () => ["Individual Customer", "Corporate", "Internal Record", "Government Record"],
    [],
  );

  function onUserTypeChange(value: string) {
    set("userType", value);
    if (value === "Corporate") navigate("/customers/new/corporate");
    else if (value.includes("Government")) navigate("/customers/new/corporate?variant=government");
    else if (value.includes("Internal")) navigate("/customers/new/corporate?variant=internal");
    else navigate("/customers/new");
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const mobile = form.mobile1.trim() || form.foreignNumber.trim();
      const mobileNumber = mobile.startsWith("+") ? mobile : `+234${mobile.replace(/^0+/, "")}`;
      const created = await createIndividualCustomer({
        firstName: form.surname.trim() || form.lastName.trim(),
        middleName: form.middleName.trim() || undefined,
        lastName: form.lastName.trim() || form.surname.trim(),
        dateOfBirth: form.dateOfBirth,
        bvn: form.bvn.trim(),
        nin: form.nin.trim(),
        email: form.email.trim(),
        mobileNumber,
        branchCode: (form.cifBranch || "HQ01").trim().toUpperCase(),
        pep: form.pep.toLowerCase() === "yes",
        nationality: form.nationality || undefined,
        occupation: form.occupation || undefined,
        addressLine1: [form.streetNumber, form.streetName].filter(Boolean).join(" ") || undefined,
        city: form.city || undefined,
        stateName: form.state || undefined,
        nextOfKinName: [form.nokSurname, form.nokMiddleName, form.nokLastName].filter(Boolean).join(" ") || undefined,
        nextOfKinPhone: form.nokMobile
          ? form.nokMobile.startsWith("+")
            ? form.nokMobile
            : `+234${form.nokMobile.replace(/^0+/, "")}`
          : undefined,
      });
      setSuccess({ id: created.id, cif: created.cifNumber });
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

  return (
    <>
      <AddCustomerChrome onClose={() => navigate("/customers")} steps={steps} stepIndex={step} wide>
        {step === 0 ? (
          <>
            <div className="fg-user-type">
              <h3>Account User Type</h3>
              <FigmaField label="Select User Type">
                <FigmaSelect value={form.userType} onChange={(e) => onUserTypeChange(e.target.value)}>
                  {userTypeChoices.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </FigmaSelect>
              </FigmaField>
            </div>

            <FigmaField label="Title (Optional)">
              <FigmaSelect
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                disabled={isLocked("title")}
              >
                {opts(TITLE_OPTS)}
              </FigmaSelect>
            </FigmaField>

            <FigmaField label="BVN (Bank Verification Number)">
              <div className="fg-identity-row">
                <FigmaInput
                  placeholder="Enter 11-digit BVN"
                  value={form.bvn}
                  onChange={(e) => set("bvn", e.target.value.replace(/\D/g, "").slice(0, 11))}
                  maxLength={11}
                  inputMode="numeric"
                />
                <button
                  type="button"
                  className="fg-btn fg-btn-outline cta"
                  onClick={() => void onVerifyBvn()}
                  disabled={verifying !== null || busy}
                >
                  {verifying === "bvn" ? "Validating…" : "Validate"}
                </button>
              </div>
            </FigmaField>

            <FigmaField label="NIN (National Identification Number)">
              <div className="fg-identity-row">
                <FigmaInput
                  placeholder="Enter 11-digit NIN"
                  value={form.nin}
                  onChange={(e) => set("nin", e.target.value.replace(/\D/g, "").slice(0, 11))}
                  maxLength={11}
                  inputMode="numeric"
                />
                <button
                  type="button"
                  className="fg-btn fg-btn-outline cta"
                  onClick={() => void onVerifyNin()}
                  disabled={verifying !== null || busy}
                >
                  {verifying === "nin" ? "Validating…" : "Validate"}
                </button>
              </div>
            </FigmaField>

            {(form.bvnValidationDate || form.ninValidationDate) && (
              <FigmaRow>
                {form.bvnValidationDate ? (
                  <FigmaField label="BVN validation Date">
                    <FigmaDate
                      value={form.bvnValidationDate}
                      onChange={(e) => set("bvnValidationDate", e.target.value)}
                      disabled={isLocked("bvnValidationDate")}
                    />
                  </FigmaField>
                ) : (
                  <div />
                )}
                {form.ninValidationDate ? (
                  <FigmaField label="NIN validation Date">
                    <FigmaDate
                      value={form.ninValidationDate}
                      onChange={(e) => set("ninValidationDate", e.target.value)}
                      disabled={isLocked("ninValidationDate")}
                    />
                  </FigmaField>
                ) : (
                  <div />
                )}
              </FigmaRow>
            )}

            <FigmaField label="Customer Category">
              <FigmaSelect
                value={form.customerCategory}
                onChange={(e) => set("customerCategory", e.target.value)}
              >
                {opts(CUSTOMER_CATEGORY_OPTS)}
              </FigmaSelect>
            </FigmaField>

            {identityMsg ? <p className="fg-identity-ok">{identityMsg}</p> : null}
            {lockedFields.size > 0 && !canOverrideIdentity ? (
              <p className="fg-identity-hint">
                Prefilled fields are read-only. Staff with <code>customer.identity.override</code> can edit them.
              </p>
            ) : null}

            {isMinor ? (
              <FigmaRow>
                <FigmaField label="Surname">
                  <FigmaInput
                    placeholder="Enter Surname"
                    value={form.surname}
                    onChange={(e) => set("surname", e.target.value)}
                    disabled={isLocked("surname")}
                  />
                </FigmaField>
                <FigmaField label="Middle name">
                  <FigmaInput
                    placeholder="Enter Middle Name"
                    value={form.middleName}
                    onChange={(e) => set("middleName", e.target.value)}
                    disabled={isLocked("middleName")}
                  />
                </FigmaField>
              </FigmaRow>
            ) : (
              <>
                <FigmaField label="Surname">
                  <FigmaInput
                    placeholder="Enter Surname"
                    value={form.surname}
                    onChange={(e) => set("surname", e.target.value)}
                    disabled={isLocked("surname")}
                  />
                </FigmaField>
                <FigmaField label="Middle name">
                  <FigmaInput
                    placeholder="Enter Middle Name"
                    value={form.middleName}
                    onChange={(e) => set("middleName", e.target.value)}
                    disabled={isLocked("middleName")}
                  />
                </FigmaField>
              </>
            )}
            {isMinor ? (
              <FigmaRow>
                <FigmaField label="Last Name">
                  <FigmaInput
                    placeholder="Enter Last Name"
                    value={form.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                    disabled={isLocked("lastName")}
                  />
                </FigmaField>
                <FigmaField label="Date of Birth">
                  <FigmaDate
                    value={form.dateOfBirth}
                    onChange={(e) => set("dateOfBirth", e.target.value)}
                    disabled={isLocked("dateOfBirth")}
                  />
                </FigmaField>
              </FigmaRow>
            ) : (
              <FigmaField label="Last name">
                <FigmaInput
                  placeholder="Enter Last Name"
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                  disabled={isLocked("lastName")}
                />
              </FigmaField>
            )}
            {!isMinor ? (
              <FigmaRow>
                <FigmaField label="Date of Birth">
                  <FigmaDate
                    value={form.dateOfBirth}
                    onChange={(e) => set("dateOfBirth", e.target.value)}
                    disabled={isLocked("dateOfBirth")}
                  />
                </FigmaField>
                <FigmaField label="Gender">
                  <FigmaSelect
                    value={form.gender}
                    onChange={(e) => set("gender", e.target.value)}
                    disabled={isLocked("gender")}
                  >
                    {opts(GENDER_OPTS)}
                  </FigmaSelect>
                </FigmaField>
              </FigmaRow>
            ) : (
              <FigmaRow>
                <FigmaField label="Gender">
                  <FigmaSelect
                    value={form.gender}
                    onChange={(e) => set("gender", e.target.value)}
                    disabled={isLocked("gender")}
                  >
                    {opts(GENDER_OPTS)}
                  </FigmaSelect>
                </FigmaField>
                <FigmaField label="Martial Status">
                  <FigmaSelect
                    value={form.maritalStatus}
                    onChange={(e) => set("maritalStatus", e.target.value)}
                    disabled={isLocked("maritalStatus")}
                  >
                    {opts(MARITAL_OPTS)}
                  </FigmaSelect>
                </FigmaField>
              </FigmaRow>
            )}
            <FigmaRow>
              <FigmaField label="Marital Status">
                <FigmaSelect
                  value={form.maritalStatus}
                  onChange={(e) => set("maritalStatus", e.target.value)}
                  disabled={isLocked("maritalStatus")}
                >
                  {opts(MARITAL_OPTS)}
                </FigmaSelect>
              </FigmaField>
              <FigmaField label="Religion">
                <FigmaSelect value={form.religion} onChange={(e) => set("religion", e.target.value)}>
                  {opts(RELIGION_OPTS)}
                </FigmaSelect>
              </FigmaField>
            </FigmaRow>
            <FigmaRow>
              <FigmaField label="Nationality">
                <FigmaSelect
                  value={form.nationality}
                  onChange={(e) => set("nationality", e.target.value)}
                  disabled={isLocked("nationality")}
                >
                  <option value="Nigerian">Nigerian</option>
                  <option value="Other">Other</option>
                </FigmaSelect>
              </FigmaField>
              <FigmaField label="State Of Origin">
                <FigmaSelect
                  value={form.stateOfOrigin}
                  onChange={(e) => set("stateOfOrigin", e.target.value)}
                  disabled={isLocked("stateOfOrigin")}
                >
                  {opts(STATE_OPTS)}
                </FigmaSelect>
              </FigmaField>
            </FigmaRow>
            <FigmaRow>
              <FigmaField label="LGA of Origin">
                <FigmaInput
                  placeholder="Enter LGA"
                  value={form.lgaOfOrigin}
                  onChange={(e) => set("lgaOfOrigin", e.target.value)}
                  disabled={isLocked("lgaOfOrigin")}
                />
              </FigmaField>
              <FigmaField label="State Of Origin">
                <FigmaSelect
                  value={form.stateOfOrigin2}
                  onChange={(e) => set("stateOfOrigin2", e.target.value)}
                  disabled={isLocked("stateOfOrigin2")}
                >
                  {opts(STATE_OPTS)}
                </FigmaSelect>
              </FigmaField>
            </FigmaRow>
            <FigmaField label="Residence Permit Number">
              <FigmaInput
                placeholder="Enter Number"
                value={form.residencePermit}
                onChange={(e) => set("residencePermit", e.target.value)}
              />
            </FigmaField>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <FigmaField label="Street Number">
              <FigmaInput
                placeholder="Enter Number"
                value={form.streetNumber}
                onChange={(e) => set("streetNumber", e.target.value)}
              />
            </FigmaField>
            <FigmaField label="Street Name">
              <FigmaInput
                placeholder="Enter Name"
                value={form.streetName}
                onChange={(e) => set("streetName", e.target.value)}
              />
            </FigmaField>
            <FigmaField label="City/Town">
              <FigmaInput
                placeholder="Enter City/Town"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
              />
            </FigmaField>
            <FigmaField label="Landmark">
              <FigmaInput placeholder="Enter landmark" value={form.landmark} onChange={(e) => set("landmark", e.target.value)} />
            </FigmaField>
            <FigmaField label="Country">
              <FigmaSelect value={form.country} onChange={(e) => onCountryChange(e.target.value)}>
                {COUNTRY_OPTS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </FigmaSelect>
            </FigmaField>
            {isOtherCountry ? (
              <FigmaField label="Country name">
                <FigmaInput
                  placeholder="Type country name"
                  value={form.countryOther}
                  onChange={(e) => set("countryOther", e.target.value)}
                />
              </FigmaField>
            ) : null}
            <FigmaField label={contactStates ? "State" : "State / Province"}>
              {contactStates ? (
                <FigmaSelect value={form.state} onChange={(e) => set("state", e.target.value)}>
                  <option value="">Select</option>
                  {contactStates.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </FigmaSelect>
              ) : (
                <FigmaInput
                  placeholder="Enter state or province"
                  value={form.state}
                  onChange={(e) => set("state", e.target.value)}
                />
              )}
            </FigmaField>
            <FigmaRow>
              <FigmaField label="Mobile Number 1">
                <FigmaInput
                  placeholder="Number"
                  value={form.mobile1}
                  onChange={(e) => set("mobile1", e.target.value)}
                  disabled={isLocked("mobile1")}
                />
              </FigmaField>
              <FigmaField label="Mobile Number 2">
                <FigmaInput placeholder="Number" value={form.mobile2} onChange={(e) => set("mobile2", e.target.value)} />
              </FigmaField>
            </FigmaRow>
            <FigmaField label="Foreign Number">
              <FigmaPhone value={form.foreignNumber} onChange={(v) => set("foreignNumber", v)} />
            </FigmaField>
            <FigmaField label="Email Address">
              <FigmaInput
                type="email"
                placeholder="Enter Email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                disabled={isLocked("email")}
              />
            </FigmaField>
            <FigmaField label="Twitter">
              <FigmaInput placeholder="Enter Twitter Username" value={form.twitter} onChange={(e) => set("twitter", e.target.value)} />
            </FigmaField>
            <FigmaField label="Facebook">
              <FigmaInput placeholder="Enter Facebook Username" value={form.facebook} onChange={(e) => set("facebook", e.target.value)} />
            </FigmaField>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <FigmaField label="ID Type">
              <FigmaSelect value={form.idType} onChange={(e) => set("idType", e.target.value)}>
                {opts(ID_TYPE_OPTS)}
              </FigmaSelect>
            </FigmaField>
            <FigmaField label="ID Number">
              <FigmaInput placeholder="Enter Number" value={form.idNumber} onChange={(e) => set("idNumber", e.target.value)} />
            </FigmaField>
            <FigmaRow>
              <FigmaField label="ID Issued Date">
                <FigmaDate value={form.idIssuedDate} onChange={(e) => set("idIssuedDate", e.target.value)} />
              </FigmaField>
              <FigmaField label="ID Expired Date">
                <FigmaDate value={form.idExpiredDate} onChange={(e) => set("idExpiredDate", e.target.value)} />
              </FigmaField>
            </FigmaRow>
            <FigmaField label="ID validated Date">
              <FigmaDate value={form.idValidatedDate} onChange={(e) => set("idValidatedDate", e.target.value)} />
            </FigmaField>
            <FigmaField label="ID waiver">
              <FigmaInput placeholder="Enter" value={form.idWaiver} onChange={(e) => set("idWaiver", e.target.value)} />
            </FigmaField>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <FigmaField label="Occupation/Profession">
              <FigmaSelect value={form.occupation} onChange={(e) => set("occupation", e.target.value)}>
                {opts(OCCUPATION_OPTS)}
              </FigmaSelect>
            </FigmaField>
            <FigmaField label="Employment Status">
              <FigmaSelect value={form.employmentStatus} onChange={(e) => set("employmentStatus", e.target.value)}>
                {opts(EMP_STATUS_OPTS)}
              </FigmaSelect>
            </FigmaField>
            <FigmaField label="Employment Nature of Business">
              <FigmaSelect value={form.natureOfBusiness} onChange={(e) => set("natureOfBusiness", e.target.value)}>
                {opts(["", "Banking", "Oil & Gas", "Technology", "Trading", "Agriculture", "Other"])}
              </FigmaSelect>
            </FigmaField>
            <FigmaRow>
              <FigmaField label="Employment Date">
                <FigmaDate value={form.employmentDate} onChange={(e) => set("employmentDate", e.target.value)} />
              </FigmaField>
              <FigmaField label="Employment Mobile Number">
                <FigmaInput placeholder="Enter Phone number" value={form.employmentMobile} onChange={(e) => set("employmentMobile", e.target.value)} />
              </FigmaField>
            </FigmaRow>
            <FigmaField label="Emp Address">
              <FigmaInput placeholder="Enter Address" value={form.empAddress} onChange={(e) => set("empAddress", e.target.value)} />
            </FigmaField>
            <FigmaRow>
              <FigmaField label="Employment Address LGA">
                <FigmaInput placeholder="Select" value={form.empLga} onChange={(e) => set("empLga", e.target.value)} />
              </FigmaField>
              <FigmaField label="Employment Address State">
                <FigmaSelect value={form.empState} onChange={(e) => set("empState", e.target.value)}>
                  {opts(STATE_OPTS)}
                </FigmaSelect>
              </FigmaField>
            </FigmaRow>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <FigmaField label="Next Of Kin Relationship">
              <FigmaSelect value={form.nokRelationship} onChange={(e) => set("nokRelationship", e.target.value)}>
                {opts(RELATIONSHIP_OPTS)}
              </FigmaSelect>
            </FigmaField>
            <FigmaField label="Surname">
              <FigmaInput placeholder="Enter Surname" value={form.nokSurname} onChange={(e) => set("nokSurname", e.target.value)} />
            </FigmaField>
            <FigmaField label="Middle name">
              <FigmaInput placeholder="Enter Middle Name" value={form.nokMiddleName} onChange={(e) => set("nokMiddleName", e.target.value)} />
            </FigmaField>
            <FigmaField label="Last name">
              <FigmaInput placeholder="Enter Last Name" value={form.nokLastName} onChange={(e) => set("nokLastName", e.target.value)} />
            </FigmaField>
            <FigmaRow>
              <FigmaField label="Mobile Number">
                <FigmaInput placeholder="Enter Phone number" value={form.nokMobile} onChange={(e) => set("nokMobile", e.target.value)} />
              </FigmaField>
              <FigmaField label="Email Address">
                <FigmaInput placeholder="Enter email" value={form.nokEmail} onChange={(e) => set("nokEmail", e.target.value)} />
              </FigmaField>
            </FigmaRow>
            <FigmaField label="Next Of Kin Detailed Address">
              <FigmaInput placeholder="Enter Address" value={form.nokAddress} onChange={(e) => set("nokAddress", e.target.value)} />
            </FigmaField>
            <FigmaField label="Next Of Kin Address Landmark">
              <FigmaInput placeholder="Enter Landmark" value={form.nokLandmark} onChange={(e) => set("nokLandmark", e.target.value)} />
            </FigmaField>
            <FigmaRow>
              <FigmaField label="NOK State">
                <FigmaSelect value={form.nokState} onChange={(e) => set("nokState", e.target.value)}>
                  {opts(STATE_OPTS)}
                </FigmaSelect>
              </FigmaField>
              <FigmaField label="NOK City">
                <FigmaInput placeholder="Select" value={form.nokCity} onChange={(e) => set("nokCity", e.target.value)} />
              </FigmaField>
            </FigmaRow>
            {isMinor ? (
              <>
                <FigmaField label="Guardian Name">
                  <FigmaInput placeholder="Enter Name" value={form.guardianName} onChange={(e) => set("guardianName", e.target.value)} />
                </FigmaField>
                <FigmaRow>
                  <FigmaField label="Guardian Phone">
                    <FigmaInput placeholder="Enter Phone number" value={form.guardianPhone} onChange={(e) => set("guardianPhone", e.target.value)} />
                  </FigmaField>
                  <FigmaField label="Guardian Relationship">
                    <FigmaSelect value={form.guardianRelationship} onChange={(e) => set("guardianRelationship", e.target.value)}>
                      {opts(RELATIONSHIP_OPTS)}
                    </FigmaSelect>
                  </FigmaField>
                </FigmaRow>
              </>
            ) : null}
          </>
        ) : null}

        {step === 5 ? (
          <>
            <FigmaField label="Customer Segment">
              <FigmaSelect value={form.customerSegment} onChange={(e) => set("customerSegment", e.target.value)}>
                {opts(SEGMENT_OPTS)}
              </FigmaSelect>
            </FigmaField>
            <FigmaRow>
              <FigmaField label="Sector">
                <FigmaSelect value={form.sector} onChange={(e) => set("sector", e.target.value)}>
                  {opts(["", "Private", "Public", "NGO"])}
                </FigmaSelect>
              </FigmaField>
              <FigmaField label="Industry">
                <FigmaSelect value={form.industry} onChange={(e) => set("industry", e.target.value)}>
                  {opts(["", "Banking", "Oil & Gas", "Technology", "Trading", "Other"])}
                </FigmaSelect>
              </FigmaField>
            </FigmaRow>
            <FigmaField label="Deceased">
              <FigmaInput placeholder="Enter" value={form.deceased} onChange={(e) => set("deceased", e.target.value)} />
            </FigmaField>
            <FigmaRow>
              <FigmaField label="Division">
                <FigmaSelect value={form.division} onChange={(e) => set("division", e.target.value)}>
                  {opts(["", "Retail", "Corporate", "Public Sector"])}
                </FigmaSelect>
              </FigmaField>
              <FigmaField label="Department">
                <FigmaSelect value={form.department} onChange={(e) => set("department", e.target.value)}>
                  {opts(["", "Operations", "Sales", "Compliance"])}
                </FigmaSelect>
              </FigmaField>
            </FigmaRow>
            <FigmaRow>
              <FigmaField label="Group">
                <FigmaSelect value={form.group} onChange={(e) => set("group", e.target.value)}>
                  {opts(["", "A", "B", "C"])}
                </FigmaSelect>
              </FigmaField>
              <FigmaField label="Team">
                <FigmaSelect value={form.team} onChange={(e) => set("team", e.target.value)}>
                  {opts(["", "Team 1", "Team 2"])}
                </FigmaSelect>
              </FigmaField>
            </FigmaRow>
            <FigmaRow>
              <FigmaField label="Introducer">
                <FigmaInput placeholder="Select" value={form.introducer} onChange={(e) => set("introducer", e.target.value)} />
              </FigmaField>
              <FigmaField label="PEP">
                <FigmaSelect value={form.pep} onChange={(e) => set("pep", e.target.value)}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </FigmaSelect>
              </FigmaField>
            </FigmaRow>
            <FigmaField label="PEP Description">
              <FigmaInput placeholder="Enter Description" value={form.pepDescription} onChange={(e) => set("pepDescription", e.target.value)} />
            </FigmaField>
            <FigmaField label="Risk Rating">
              <FigmaSelect value={form.riskRating} onChange={(e) => set("riskRating", e.target.value)}>
                {opts(["", "High", "Low", "Medium"])}
              </FigmaSelect>
            </FigmaField>
            <FigmaRow>
              <FigmaField label="Origin">
                <FigmaSelect value={form.origin} onChange={(e) => set("origin", e.target.value)}>
                  {opts(["", "Walk-in", "Referral", "Campaign"])}
                </FigmaSelect>
              </FigmaField>
              <FigmaField label="Account Officer Code">
                <FigmaInput placeholder="Enter code" value={form.accountOfficerCode} onChange={(e) => set("accountOfficerCode", e.target.value)} />
              </FigmaField>
            </FigmaRow>
          </>
        ) : null}

        {step === documentsStepIndex && documentsStepIndex >= 0 ? (
          <>
            <p className="fg-identity-hint">
              {isMinor
                ? "Capture parent / guardian documents for this minor. The customer’s own documents can be uploaded later via Document upload when the account is upgraded."
                : "Capture onboarding documents now. Additional documents can be uploaded later via Accounts ops → Document upload."}
            </p>

            <DocCaptureUpload
              label={isMinor ? "Parent / Guardian Picture" : "Picture (face capture or passport)"}
              hint={isMinor ? "Upload parent or guardian photo" : "Upload face photo or passport image"}
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              fileName={pictureFile?.name || ""}
              onFile={setPictureFile}
            />

            <DocCaptureUpload
              label={isMinor ? "Parent / Guardian Signature" : "Signature (customer / scanned)"}
              hint="Upload signature image or signed scanned signature"
              accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
              fileName={signatureFile?.name || ""}
              onFile={setSignatureFile}
            />

            <FigmaField label="Operating Instruction">
              <div className="fg-instruction-list">
                {OPERATING_INSTRUCTION_OPTS.map((opt) => (
                  <label key={opt} className="fg-instruction-check">
                    <input
                      type="checkbox"
                      checked={operatingInstructions.includes(opt)}
                      onChange={() => toggleOperatingInstruction(opt)}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
              {operatingInstructions.length > 0 ? (
                <div className="fg-instruction-chips">
                  {operatingInstructions.map((v) => (
                    <button
                      key={v}
                      type="button"
                      className="fg-instruction-chip cta"
                      onClick={() => toggleOperatingInstruction(v)}
                      title="Remove"
                    >
                      {v} ×
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="fg-identity-row" style={{ marginTop: 10 }}>
                <FigmaInput
                  placeholder="Add custom instruction"
                  value={customInstruction}
                  onChange={(e) => setCustomInstruction(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomInstruction();
                    }
                  }}
                />
                <button type="button" className="fg-btn fg-btn-outline cta" onClick={addCustomInstruction}>
                  Add
                </button>
              </div>
            </FigmaField>

            <div className="fg-other-docs">
              <h3 className="fg-other-docs-title">
                {isMinor ? "Other parent documents" : "Other documents"}
              </h3>
              <p className="fg-identity-hint" style={{ marginTop: 0 }}>
                Add NEPA bill, affidavit, and any other supporting documents.
              </p>
              {otherDocs.map((row) => (
                <div key={row.id} className="fg-other-doc-row">
                  <FigmaField label="Document Type">
                    <FigmaSelect
                      value={row.docType}
                      onChange={(e) => updateOtherDoc(row.id, { docType: e.target.value })}
                    >
                      {opts(OTHER_DOC_TYPE_OPTS)}
                    </FigmaSelect>
                  </FigmaField>
                  <FigmaField label="File">
                    <label className="fg-other-doc-file cta">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        hidden
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          updateOtherDoc(row.id, { file, fileName: file?.name || "" });
                        }}
                      />
                      <span>{row.fileName || "Choose file"}</span>
                    </label>
                  </FigmaField>
                  <button
                    type="button"
                    className="fg-btn fg-btn-ghost cta fg-other-doc-remove"
                    onClick={() => removeOtherDoc(row.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="fg-btn fg-btn-outline cta"
                onClick={() => setOtherDocs((rows) => [...rows, newOtherDocRow()])}
              >
                + Add document
              </button>
            </div>
          </>
        ) : null}

        {step === cifStepIndex && cifStepIndex >= 0 && !isMinor ? (
          <>
            <FigmaRow>
              <FigmaField label="CIF Number">
                <FigmaInput placeholder="Select" value={form.cifNumber} onChange={(e) => set("cifNumber", e.target.value)} />
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
                <FigmaInput placeholder="Status" value={form.cifStatus} onChange={(e) => set("cifStatus", e.target.value)} />
              </FigmaField>
              <FigmaField label="CIF BlackListed">
                <FigmaInput placeholder="Enter" value={form.cifBlacklisted} onChange={(e) => set("cifBlacklisted", e.target.value)} />
              </FigmaField>
            </FigmaRow>
            <FigmaField label="CIF Watchlisted">
              <FigmaInput placeholder="Enter" value={form.cifWatchlisted} onChange={(e) => set("cifWatchlisted", e.target.value)} />
            </FigmaField>
            <FigmaRow>
              <FigmaField label="Date CIF Created">
                <FigmaDate value={form.cifCreatedDate} onChange={(e) => set("cifCreatedDate", e.target.value)} />
              </FigmaField>
              <FigmaField label="CIF Created By">
                <FigmaInput placeholder="Select" value={form.cifCreatedBy} onChange={(e) => set("cifCreatedBy", e.target.value)} />
              </FigmaField>
            </FigmaRow>
            <FigmaRow>
              <FigmaField label="Date Creation Approved BY">
                <FigmaDate value={form.cifApprovedDate} onChange={(e) => set("cifApprovedDate", e.target.value)} />
              </FigmaField>
              <FigmaField label="CIF Creation Approved By">
                <FigmaInput placeholder="Select" value={form.cifApprovedBy} onChange={(e) => set("cifApprovedBy", e.target.value)} />
              </FigmaField>
            </FigmaRow>
            <FigmaRow>
              <FigmaField label="Date CIF Last Modified">
                <FigmaDate value={form.cifModifiedDate} onChange={(e) => set("cifModifiedDate", e.target.value)} />
              </FigmaField>
              <FigmaField label="CIF Last Modified By">
                <FigmaInput placeholder="Select" value={form.cifModifiedBy} onChange={(e) => set("cifModifiedBy", e.target.value)} />
              </FigmaField>
            </FigmaRow>
            <FigmaRow>
              <FigmaField label="IP address">
                <FigmaInput placeholder="Enter IP" value={form.ipAddress} onChange={(e) => set("ipAddress", e.target.value)} />
              </FigmaField>
              <FigmaField label="Device Name">
                <FigmaInput placeholder="Enter Name" value={form.deviceName} onChange={(e) => set("deviceName", e.target.value)} />
              </FigmaField>
            </FigmaRow>
            <FigmaField label="Customer Group">
              <FigmaSelect value={form.customerGroup} onChange={(e) => set("customerGroup", e.target.value)}>
                {opts(["", "Retail", "Corporate", "VIP"])}
              </FigmaSelect>
            </FigmaField>
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
