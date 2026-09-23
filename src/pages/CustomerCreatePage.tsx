import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { createIndividualCustomer } from "../api/customersCreate";
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

const INDIVIDUAL_STEPS: FigmaStep[] = [
  { id: "personal", label: "Personal" },
  { id: "contact", label: "Contact" },
  { id: "id", label: "Means Of Ident" },
  { id: "employment", label: "Employment" },
  { id: "nok", label: "Next Of Kin" },
  { id: "others", label: "Others" },
  { id: "cif", label: "CIF Data" },
];

const MINOR_STEPS: FigmaStep[] = [
  { id: "personal", label: "Personal" },
  { id: "contact", label: "Contact" },
  { id: "id", label: "Means Of Ident" },
  { id: "employment", label: "Employment" },
  { id: "nok", label: "Next of Kin" },
  { id: "others", label: "Others" },
];

type Form = Record<string, string>;

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
  streetNumber: "",
  streetName: "",
  city: "",
  landmark: "",
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

export function CustomerCreatePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isMinor = params.get("variant") === "minor";
  const steps = isMinor ? MINOR_STEPS : INDIVIDUAL_STEPS;
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>({
    ...initial,
    userType: isMinor ? "Minor -Individual Customer" : "Individual Customer",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<{ id: string; cif?: string } | null>(null);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const userTypeChoices = useMemo(
    () => [
      "Individual Customer",
      "Minor -Individual Customer",
      "Non - Individual Customer",
      "Internal Record",
      "Government Record",
    ],
    [],
  );

  function onUserTypeChange(value: string) {
    set("userType", value);
    if (value.startsWith("Minor")) navigate("/customers/new?variant=minor");
    else if (value.includes("Non")) navigate("/customers/new/corporate");
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
              <FigmaSelect value={form.title} onChange={(e) => set("title", e.target.value)}>
                {opts(TITLE_OPTS)}
              </FigmaSelect>
            </FigmaField>
            {isMinor ? (
              <FigmaRow>
                <FigmaField label="Surname">
                  <FigmaInput placeholder="Enter Surname" value={form.surname} onChange={(e) => set("surname", e.target.value)} />
                </FigmaField>
                <FigmaField label="Middle name">
                  <FigmaInput placeholder="Enter Middle Name" value={form.middleName} onChange={(e) => set("middleName", e.target.value)} />
                </FigmaField>
              </FigmaRow>
            ) : (
              <>
                <FigmaField label="Surname">
                  <FigmaInput placeholder="Enter Surname" value={form.surname} onChange={(e) => set("surname", e.target.value)} />
                </FigmaField>
                <FigmaField label="Middle name">
                  <FigmaInput placeholder="Enter Middle Name" value={form.middleName} onChange={(e) => set("middleName", e.target.value)} />
                </FigmaField>
              </>
            )}
            {isMinor ? (
              <FigmaRow>
                <FigmaField label="Last Name">
                  <FigmaInput placeholder="Enter Last Name" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
                </FigmaField>
                <FigmaField label="Date of Birth">
                  <FigmaDate value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
                </FigmaField>
              </FigmaRow>
            ) : (
              <FigmaField label="Last name">
                <FigmaInput placeholder="Enter Last Name" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
              </FigmaField>
            )}
            {!isMinor ? (
              <FigmaRow>
                <FigmaField label="Date of Birth">
                  <FigmaDate value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
                </FigmaField>
                <FigmaField label="Gender">
                  <FigmaSelect value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                    {opts(GENDER_OPTS)}
                  </FigmaSelect>
                </FigmaField>
              </FigmaRow>
            ) : (
              <FigmaRow>
                <FigmaField label="Gender">
                  <FigmaSelect value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                    {opts(GENDER_OPTS)}
                  </FigmaSelect>
                </FigmaField>
                <FigmaField label="Martial Status">
                  <FigmaSelect value={form.maritalStatus} onChange={(e) => set("maritalStatus", e.target.value)}>
                    {opts(MARITAL_OPTS)}
                  </FigmaSelect>
                </FigmaField>
              </FigmaRow>
            )}
            <FigmaRow>
              <FigmaField label="Marital Status">
                <FigmaSelect value={form.maritalStatus} onChange={(e) => set("maritalStatus", e.target.value)}>
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
                <FigmaSelect value={form.nationality} onChange={(e) => set("nationality", e.target.value)}>
                  <option value="Nigerian">Nigerian</option>
                  <option value="Other">Other</option>
                </FigmaSelect>
              </FigmaField>
              <FigmaField label="State Of Origin">
                <FigmaSelect value={form.stateOfOrigin} onChange={(e) => set("stateOfOrigin", e.target.value)}>
                  {opts(STATE_OPTS)}
                </FigmaSelect>
              </FigmaField>
            </FigmaRow>
            <FigmaRow>
              <FigmaField label="LGA of Origin">
                <FigmaInput placeholder="Enter LGA" value={form.lgaOfOrigin} onChange={(e) => set("lgaOfOrigin", e.target.value)} />
              </FigmaField>
              <FigmaField label="State Of Origin">
                <FigmaSelect value={form.stateOfOrigin2} onChange={(e) => set("stateOfOrigin2", e.target.value)}>
                  {opts(STATE_OPTS)}
                </FigmaSelect>
              </FigmaField>
            </FigmaRow>
            <FigmaRow>
              <FigmaField label="Residence Permit Number">
                <FigmaInput placeholder="Enter Number" value={form.residencePermit} onChange={(e) => set("residencePermit", e.target.value)} />
              </FigmaField>
              <FigmaField label="BVN (Bank Verification Number)">
                <FigmaInput placeholder="Enter Number" value={form.bvn} onChange={(e) => set("bvn", e.target.value)} maxLength={11} />
              </FigmaField>
            </FigmaRow>
            {isMinor ? (
              <FigmaRow>
                <FigmaField label="BVN validation Date">
                  <FigmaDate value={form.bvnValidationDate} onChange={(e) => set("bvnValidationDate", e.target.value)} />
                </FigmaField>
                <FigmaField label="NIN (National Identification Number)">
                  <FigmaInput placeholder="Enter Number" value={form.nin} onChange={(e) => set("nin", e.target.value)} maxLength={11} />
                </FigmaField>
              </FigmaRow>
            ) : (
              <>
                <FigmaField label="BVN validation Date">
                  <FigmaDate value={form.bvnValidationDate} onChange={(e) => set("bvnValidationDate", e.target.value)} />
                </FigmaField>
                <FigmaRow>
                  <FigmaField label="NIN (National Identification Number)">
                    <FigmaInput placeholder="Enter Number" value={form.nin} onChange={(e) => set("nin", e.target.value)} maxLength={11} />
                  </FigmaField>
                  <FigmaField label="NIN validation Date">
                    <FigmaDate value={form.ninValidationDate} onChange={(e) => set("ninValidationDate", e.target.value)} />
                  </FigmaField>
                </FigmaRow>
              </>
            )}
            {isMinor ? (
              <FigmaField label="NIN validation Date">
                <FigmaDate value={form.ninValidationDate} onChange={(e) => set("ninValidationDate", e.target.value)} />
              </FigmaField>
            ) : null}
          </>
        ) : null}

        {step === 1 ? (
          <>
            <FigmaField label="Street Number">
              <FigmaInput placeholder="Enter Number" value={form.streetNumber} onChange={(e) => set("streetNumber", e.target.value)} />
            </FigmaField>
            <FigmaField label="Street Name">
              <FigmaInput placeholder="Enter Name" value={form.streetName} onChange={(e) => set("streetName", e.target.value)} />
            </FigmaField>
            <FigmaField label="City/Town">
              <FigmaInput placeholder="Enter City/Town" value={form.city} onChange={(e) => set("city", e.target.value)} />
            </FigmaField>
            <FigmaRow>
              <FigmaField label="Landmark">
                <FigmaInput placeholder="Enter landmark" value={form.landmark} onChange={(e) => set("landmark", e.target.value)} />
              </FigmaField>
              <FigmaField label="State">
                <FigmaSelect value={form.state} onChange={(e) => set("state", e.target.value)}>
                  {opts(STATE_OPTS)}
                </FigmaSelect>
              </FigmaField>
            </FigmaRow>
            <FigmaRow>
              <FigmaField label="Mobile Number 1">
                <FigmaInput placeholder="Number" value={form.mobile1} onChange={(e) => set("mobile1", e.target.value)} />
              </FigmaField>
              <FigmaField label="Mobile Number 2">
                <FigmaInput placeholder="Number" value={form.mobile2} onChange={(e) => set("mobile2", e.target.value)} />
              </FigmaField>
            </FigmaRow>
            <FigmaField label="Foreign Number">
              <FigmaPhone value={form.foreignNumber} onChange={(v) => set("foreignNumber", v)} />
            </FigmaField>
            <FigmaField label="Email Address">
              <FigmaInput type="email" placeholder="Enter Email" value={form.email} onChange={(e) => set("email", e.target.value)} />
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

        {step === 6 && !isMinor ? (
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
