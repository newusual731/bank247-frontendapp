import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { env } from "../config/env";
import {
  ensureAccessToken,
  hasStoredSession,
  loadTokens,
  loginWithPassword,
  logout as clearSession,
  parseSession,
  sessionFromStoredTokens,
} from "./session";
import {
  assertBankMatchesHost,
  resolveTenantFromHost,
  tenantAppOrigin,
  type TenantContext,
} from "../tenant/tenant";

type SessionUser = {
  username: string;
  displayName: string;
  bankId: string;
  permissions: string[];
  roles: string[];
};

type AuthContextValue = {
  user: SessionUser | null;
  tenant: TenantContext;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (code: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const tenant = useMemo(() => resolveTenantFromHost(), []);
  const [user, setUser] = useState<SessionUser | null>(() => sessionFromStoredTokens());

  useEffect(() => {
    const current = sessionFromStoredTokens();
    if (current && !assertBankMatchesHost(current.bankId, tenant)) {
      clearSession();
      setUser(null);
      return;
    }
    if (current) setUser(current);

    // Proactively refresh if access is about to expire but refresh token exists.
    if (hasStoredSession()) {
      void ensureAccessToken(env.tokenUrl, env.clientId).then((token) => {
        if (!token) {
          setUser(null);
          return;
        }
        const parsed = parseSession(token);
        if (!parsed.bankId || !assertBankMatchesHost(parsed.bankId, tenant)) {
          clearSession();
          setUser(null);
          return;
        }
        setUser({
          username: parsed.username,
          displayName: parsed.displayName,
          bankId: parsed.bankId,
          permissions: parsed.permissions,
          roles: parsed.roles,
        });
      });
    }
  }, [tenant]);

  useEffect(() => {
    const onLost = () => setUser(null);
    window.addEventListener("bank247-auth-lost", onLost);
    return () => window.removeEventListener("bank247-auth-lost", onLost);
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const tokens = await loginWithPassword(env.tokenUrl, env.clientId, username, password);
      const parsed = parseSession(tokens.accessToken);
      if (!parsed.bankId) {
        clearSession();
        throw new Error("Token is missing bank_id — staff user is not linked to a bank");
      }
      if (!assertBankMatchesHost(parsed.bankId, tenant)) {
        clearSession();
        throw new Error("This account does not belong to the current bank host");
      }

      const nextUser: SessionUser = {
        username: parsed.username,
        displayName: parsed.displayName,
        bankId: parsed.bankId,
        permissions: parsed.permissions,
        roles: parsed.roles,
      };
      setUser(nextUser);

      const origin = tenantAppOrigin(parsed.bankId);
      if (origin && origin !== window.location.origin) {
        const handoff = encodeURIComponent(JSON.stringify(loadTokens()));
        window.location.assign(`${origin}/auth/handoff#t=${handoff}`);
      }
    },
    [tenant],
  );

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const hasPermission = useCallback(
    (code: string) => {
      if (!user) return false;
      if (user.permissions.length === 0) {
        return true;
      }
      return user.permissions.includes(code);
    },
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      tenant,
      isAuthenticated: Boolean(user) || hasStoredSession(),
      login,
      logout,
      hasPermission,
    }),
    [user, tenant, login, logout, hasPermission],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
