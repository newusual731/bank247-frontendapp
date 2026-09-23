import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../auth/AuthContext";
import { FIGMA_SIDEBAR } from "../navigation/figmaNav";
import { FigmaNavIcon } from "../components/figma/FigmaNavIcon";
import { FigmaAlert, FIGMA_ALERT } from "../components/figma/FigmaForm";
import { listNotifications } from "../api/notifications";
import "../components/figma/FigmaForm.css";
import "./AppShell.css";

type LocationAlertState = {
  figmaAlert?: keyof typeof FIGMA_ALERT;
};

const NOTIF_LAST_READ_KEY = "bank247.notifLastReadAt";

function markNotificationsRead() {
  try {
    sessionStorage.setItem(NOTIF_LAST_READ_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

function lastReadAt(): number {
  try {
    return Number(sessionStorage.getItem(NOTIF_LAST_READ_KEY) || 0);
  } catch {
    return 0;
  }
}

export function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [alertKey, setAlertKey] = useState<keyof typeof FIGMA_ALERT | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const state = location.state as LocationAlertState | null;
    if (state?.figmaAlert && state.figmaAlert in FIGMA_ALERT) {
      setAlertKey(state.figmaAlert);
      navigate(location.pathname + location.search, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const refreshUnread = useCallback(async () => {
    try {
      const page = await listNotifications({ size: 50 });
      const items = page.content || [];
      const cutoff = lastReadAt();
      const unread = items.filter((n) => {
        if (!n.createdAt) return cutoff === 0;
        return new Date(n.createdAt).getTime() > cutoff;
      }).length;
      setUnreadCount(unread);
    } catch {
      /* keep prior count */
    }
  }, []);

  useEffect(() => {
    void refreshUnread();
    const id = window.setInterval(() => void refreshUnread(), 60_000);
    return () => window.clearInterval(id);
  }, [refreshUnread]);

  useEffect(() => {
    if (location.pathname === "/notifications") {
      markNotificationsRead();
      setUnreadCount(0);
    }
  }, [location.pathname]);

  const dismissAlert = useCallback(() => setAlertKey(null), []);

  return (
    <div className="shell">
      <aside className="sidebar">
        <nav className="sidebar-nav" aria-label="Main">
          {FIGMA_SIDEBAR.map((item) => (
            <NavLink
              key={`${item.to}-${item.label}`}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item cta${isActive ? " active" : ""}`}
            >
              <FigmaNavIcon id={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
          <div className="sidebar-spacer" aria-hidden />
        </nav>

        <div className="sidebar-footer">
          <NavLink
            to="/notifications"
            className="nav-item cta sidebar-notif-link"
            onClick={() => {
              markNotificationsRead();
              setUnreadCount(0);
            }}
          >
            <span className="sidebar-notif-icon">
              <FigmaNavIcon id="bell" />
              {unreadCount > 0 ? (
                <span className="sidebar-notif-badge" aria-label={`${unreadCount} unread`}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </span>
            <span>Notifications</span>
          </NavLink>
          <div className="sidebar-divider" />
          <div className="user-card">
            <div className="avatar" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c1.8-3.5 4.2-5 8-5s6.2 1.5 8 5" />
              </svg>
            </div>
            <div>
              <p className="user-name">{user?.displayName || "User's Name"}</p>
              <p className="user-role">{user?.roles[0] || "Owner"}</p>
            </div>
            <button type="button" className="logout cta" onClick={logout} aria-label="Log out">
              <FigmaNavIcon id="logout" size={18} />
            </button>
          </div>
        </div>
      </aside>

      <motion.main
        className="main"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        {alertKey ? <FigmaAlert {...FIGMA_ALERT[alertKey]} onClose={dismissAlert} /> : null}
        <Outlet />
      </motion.main>
    </div>
  );
}
