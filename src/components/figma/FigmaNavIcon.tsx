import type { FigmaIconId } from "../../navigation/figmaNav";

const stroke = "currentColor";

/** Line icons matching Figma Navs.png style */
export function FigmaNavIcon({ id, size = 20 }: { id: FigmaIconId; size?: number }) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (id) {
    case "dashboard":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" rx="1.2" />
          <rect x="14" y="3" width="7" height="7" rx="1.2" />
          <rect x="3" y="14" width="7" height="7" rx="1.2" />
          <rect x="14" y="14" width="7" height="7" rx="1.2" />
        </svg>
      );
    case "customer":
      return (
        <svg {...props}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <circle cx="12" cy="10" r="2.5" />
          <path d="M8 17c1.2-1.5 2.5-2.2 4-2.2S14.8 15.5 16 17" />
        </svg>
      );
    case "mandate":
      return (
        <svg {...props}>
          <circle cx="9" cy="8" r="2.2" />
          <circle cx="15" cy="8" r="2.2" />
          <circle cx="12" cy="13.5" r="2.2" />
          <path d="M5.5 18c1-2 2.5-3 4.5-3M18.5 18c-1-2-2.5-3-4.5-3M9.5 18c.7-1.2 1.5-1.8 2.5-1.8s1.8.6 2.5 1.8" />
        </svg>
      );
    case "till":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l2.5 1.5" />
          <path d="M16.5 6.5A8 8 0 0 1 19 12" />
        </svg>
      );
    case "restrict":
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="3" />
          <path d="M6 19c1.5-3 3.5-4.5 6-4.5S16.5 16 18 19" />
          <rect x="15.5" y="14.5" width="5" height="4" rx="1" />
          <path d="M16.8 14.5v-1.2a1.2 1.2 0 0 1 2.4 0v1.2" />
        </svg>
      );
    case "vault":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M12 4v2M12 18v2M4 12h2M18 12h2" />
        </svg>
      );
    case "block":
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="3" />
          <path d="M6 18c1.5-2.8 3.5-4 6-4s4.5 1.2 6 4" />
          <rect x="8" y="19" width="8" height="3" rx="1.5" />
          <circle cx="11" cy="20.5" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case "account":
      return (
        <svg {...props}>
          <circle cx="10" cy="8" r="3" />
          <path d="M4 19c1.4-2.8 3.2-4 6-4" />
          <path d="M15 14l2.2 2.2 4-4" />
          <path d="M14.5 18.5h6" />
        </svg>
      );
    case "cheque":
      return (
        <svg {...props}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <circle cx="12" cy="12" r="3" />
          <circle cx="12" cy="12" r="1.2" />
        </svg>
      );
    case "memo":
      return (
        <svg {...props}>
          <rect x="7" y="7" width="10" height="10" rx="2" />
          <path d="M9 4v3M15 4v3M9 17v3M15 17v3M4 9h3M4 15h3M17 9h3M17 15h3" />
        </svg>
      );
    case "enquiry":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v5" />
          <circle cx="12" cy="16.5" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      );
    case "bell":
      return (
        <svg {...props}>
          <path d="M6 16h12l-1.2-2.2a6 6 0 0 1-1.3-3.6V9a4.5 4.5 0 1 0-9 0v1.2c0 1.3-.4 2.6-1.3 3.6L6 16Z" />
          <path d="M10 18a2 2 0 0 0 4 0" />
        </svg>
      );
    case "logout":
      return (
        <svg {...props}>
          <path d="M10 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-2" />
          <path d="M15 12H4m0 0 3-3m-3 3 3 3" />
        </svg>
      );
    default:
      return null;
  }
}
