import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { saveTokens, type AuthTokens } from "../auth/session";

/** Cross-subdomain handoff: login host redirects here with #t=<encoded tokens>. */
export function AuthHandoffPage() {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const hash = window.location.hash.replace(/^#/, "");
      const params = new URLSearchParams(hash);
      const raw = params.get("t");
      if (!raw) {
        navigate("/login", { replace: true });
        return;
      }
      const tokens = JSON.parse(decodeURIComponent(raw)) as AuthTokens;
      if (!tokens?.accessToken) {
        navigate("/login", { replace: true });
        return;
      }
      saveTokens(tokens);
      window.history.replaceState(null, "", "/");
      window.location.assign("/");
    } catch {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return <p style={{ padding: "2rem" }}>Opening your bank workspace…</p>;
}
