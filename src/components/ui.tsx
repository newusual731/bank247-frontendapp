import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";
import "./ui.css";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = {
  variant?: ButtonVariant;
  children: ReactNode;
  className?: string;
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  disabled?: boolean;
  title?: string;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
};

export function Button({
  variant = "primary",
  children,
  className = "",
  type = "button",
  disabled,
  title,
  onClick,
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      className={`btn btn-${variant} cta ${className}`.trim()}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ duration: 0.15 }}
      disabled={disabled}
      title={title}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "success" | "danger" | "warning" | "neutral";
  children: ReactNode;
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function TextField({
  label,
  id,
  ...props
}: { label: string; id: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="field" htmlFor={id}>
      <span className="field-label">{label}</span>
      <input id={id} className="field-input" {...props} />
    </label>
  );
}

export function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <header className="page-header">
      <h1>{title}</h1>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </header>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="empty-state">
      <p className="empty-title">{title}</p>
      {hint ? <p className="empty-hint">{hint}</p> : null}
    </div>
  );
}
