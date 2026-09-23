import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../auth/AuthContext";
import "./LoginPage.css";

export function LoginPage() {
  const { login, isAuthenticated, tenant } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(username.trim(), password);
      navigate("/customers", { replace: true, state: { figmaAlert: "credentialsVerified" } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = username.trim().length > 0 && password.length > 0;

  return (
    <div className="login-page">
      <motion.section
        className="login-brand figma-brand"
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1>Elevate your Core Banking Experience with Bank 24/7</h1>
        <p>
          Our comprehensive design system offers you an unparalleled range of components, sparking creativity and
          boosting efficiency.
        </p>
        <blockquote className="figma-quote">
          Rayna has transformed the way our team approaches design. The sheer range of components and the seamless
          integration of the design system into our workflow have been game-changers. It&apos;s like having a toolkit
          filled with magic that accelerates our projects without compromising on quality.
          <footer>
            <span className="figma-avatar" aria-hidden />
            <span>
              <strong>Ariana Grande</strong>
              <br />
              Visual Designer, Google
            </span>
          </footer>
        </blockquote>
      </motion.section>

      <motion.section
        className="login-form-wrap"
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      >
        <form className="login-form login-card" onSubmit={(e) => void onSubmit(e)}>
          <h2>Log In</h2>
          <p className="login-sub">Enter your credentials to access your account · {tenant.slug}</p>

          {error ? <div className="alert-error">{error}</div> : null}

          <label className="field" htmlFor="username">
            <span className="field-label">Email Address</span>
            <div className="password-row">
              <input
                id="username"
                className="field-input"
                placeholder="Enter Email"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <span className="field-icon" aria-hidden>
                ✉
              </span>
            </div>
          </label>

          <label className="field" htmlFor="password">
            <span className="field-label">Password</span>
            <div className="password-row">
              <input
                id="password"
                className="field-input"
                type={showPassword ? "text" : "password"}
                placeholder="Enter Password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" className="show-pass cta" onClick={() => setShowPassword((v) => !v)} aria-label="Toggle password">
                {showPassword ? "Hide" : "👁"}
              </button>
            </div>
          </label>

          <button type="button" className="forgot-link cta">
            Forgot Password?
          </button>

          <button type="button" className="forgot-link cta" style={{ alignSelf: "flex-start" }} onClick={() => navigate("/login/branch")}>
            Log in by Branch
          </button>

          <button type="submit" className={`login-submit cta${canSubmit ? " ready" : ""}`} disabled={busy || !canSubmit}>
            {busy ? "Signing in…" : "Log into Account"}
          </button>
        </form>
      </motion.section>
    </div>
  );
}
