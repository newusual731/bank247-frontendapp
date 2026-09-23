import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { createBranch } from "../api/branches";
import {
  applyUserCreate,
  createUser,
  disableUser,
  getUser,
  submitUserCreate,
  type IamUser,
} from "../api/iam";
import { Badge, Button, PageHeader, TextField } from "../components/ui";
import { statusTone } from "../lib/statusTone";

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
      <form className="panel" style={{ maxWidth: 560 }} onSubmit={onSubmit}>
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

export function UserCreatePage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [branchCode, setBranchCode] = useState("HQ01");
  const [departmentCode, setDepartmentCode] = useState("");
  const [mfaRequired, setMfaRequired] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = await createUser({
        username: username.trim(),
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        branchCode: branchCode.trim() || undefined,
        departmentCode: departmentCode.trim() || undefined,
        mfaRequired,
      });
      try {
        await submitUserCreate(created.id);
        await applyUserCreate(created.id);
      } catch {
        /* maker-checker may leave user pending */
      }
      navigate(`/iam/users/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create user failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PanelForm
      title="Add New User"
      onSubmit={(e) => void onSubmit(e)}
      busy={busy}
      error={error}
      result={null}
    >
      <TextField id="un" label="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
      <TextField id="em" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <TextField id="fn" label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
      <TextField id="ln" label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
      <TextField id="br" label="Branch code" value={branchCode} onChange={(e) => setBranchCode(e.target.value)} />
      <TextField id="dept" label="Department code" value={departmentCode} onChange={(e) => setDepartmentCode(e.target.value)} />
      <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
        <input type="checkbox" checked={mfaRequired} onChange={(e) => setMfaRequired(e.target.checked)} />
        MFA required
      </label>
    </PanelForm>
  );
}

export function UserDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<IamUser | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const row = await getUser(id);
        if (!cancelled) setUser(row);
      } catch (err) {
        if (!cancelled) {
          setUser(null);
          setError(err instanceof ApiError ? err.message : "Unable to load user");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, tick]);

  async function onDisable() {
    setBusy(true);
    setError(null);
    try {
      await disableUser(id, reason.trim() || undefined);
      setTick((n) => n + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Disable failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="User detail"
        actions={
          <Button variant="ghost" onClick={() => navigate("/iam/users")}>
            Back
          </Button>
        }
      />
      {loading ? <p style={{ color: "var(--text-muted)" }}>Loading…</p> : null}
      {error ? <div className="alert-error">{error}</div> : null}
      {user ? (
        <div className="panel" style={{ maxWidth: 560 }}>
          <div style={{ display: "grid", gap: "0.65rem" }}>
            <p style={{ margin: 0 }}><strong>Username</strong> · {user.username}</p>
            <p style={{ margin: 0 }}><strong>Name</strong> · {[user.firstName, user.lastName].filter(Boolean).join(" ") || "—"}</p>
            <p style={{ margin: 0 }}><strong>Email</strong> · {user.email || "—"}</p>
            <p style={{ margin: 0 }}><strong>Branch</strong> · {user.homeBranchCode || "—"}</p>
            <p style={{ margin: 0 }}>
              <strong>Status</strong> · <Badge tone={statusTone(user.status)}>{user.status}</Badge>
            </p>
          </div>
          <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "1.25rem 0" }} />
          <h3 style={{ marginTop: 0, fontSize: "1rem" }}>Disable user</h3>
          <TextField id="reason" label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.6rem" }}>
            <Button variant="secondary" disabled={busy || user.status === "DISABLED"} onClick={() => void onDisable()}>
              {busy ? "Disabling…" : "Disable user"}
            </Button>
            <Link to="/iam/roles" style={{ alignSelf: "center", color: "var(--brand-primary)", fontWeight: 650 }}>
              Role Management →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function BranchCreatePage() {
  const navigate = useNavigate();
  const [branchCode, setBranchCode] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [regionCode, setRegionCode] = useState("HQ");
  const [countryCode, setCountryCode] = useState("NG");
  const [currencyCode, setCurrencyCode] = useState("NGN");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createBranch({
        branchCode: branchCode.trim().toUpperCase(),
        name: name.trim(),
        address: address.trim(),
        regionCode: regionCode.trim().toUpperCase(),
        countryCode: countryCode.trim().toUpperCase(),
        currencyCode: currencyCode.trim().toUpperCase(),
        contactPhone: contactPhone.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
      });
      navigate("/branches");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create branch failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PanelForm
      title="Create branch"
      onSubmit={(e) => void onSubmit(e)}
      busy={busy}
      error={error}
      result={null}
    >
      <TextField id="code" label="Branch code" value={branchCode} onChange={(e) => setBranchCode(e.target.value)} required />
      <TextField id="name" label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <TextField id="addr" label="Address" value={address} onChange={(e) => setAddress(e.target.value)} required />
      <TextField id="region" label="Region code" value={regionCode} onChange={(e) => setRegionCode(e.target.value)} required />
      <TextField id="ccy" label="Currency" value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} required />
      <TextField id="country" label="Country" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} required />
      <TextField id="phone" label="Contact phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
      <TextField id="email" label="Contact email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
    </PanelForm>
  );
}
