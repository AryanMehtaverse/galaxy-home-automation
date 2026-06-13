import { type ButtonHTMLAttributes, type CSSProperties } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const variants = {
  primary: "text-zinc-950 font-semibold focus-visible:ring-[#C9A840]",
  secondary:
    "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700",
  ghost:
    "bg-transparent text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
  danger: "bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

const primaryStyle: CSSProperties = {
  background: "linear-gradient(135deg, #E0C050 0%, #C9A840 50%, #A07820 100%)",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  style,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-zinc-900 ${variants[variant]} ${sizes[size]} ${className}`}
      style={variant === "primary" ? { ...primaryStyle, ...style } : style}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
