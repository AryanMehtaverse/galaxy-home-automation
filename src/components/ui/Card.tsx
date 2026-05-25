interface CardProps {
  children: React.ReactNode;
  className?: string;
  overdue?: boolean;
}

export function Card({ children, className = "", overdue = false }: CardProps) {
  return (
    <div
      className={`rounded-xl border bg-white p-5 shadow-sm transition-shadow dark:bg-zinc-900 ${
        overdue
          ? "border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20"
          : "border-zinc-200 dark:border-zinc-800"
      } ${className}`}
    >
      {children}
    </div>
  );
}
