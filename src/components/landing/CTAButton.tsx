import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";

type Props = {
  to?: ComponentProps<typeof Link>["to"];
  variant?: "light" | "primary";
  children: React.ReactNode;
};

export function CTAButton({ to = "/auth", variant = "light", children }: Props) {
  const base =
    "group relative inline-flex items-center gap-3 px-8 py-4 font-bold rounded-sm overflow-hidden transition-all duration-300 hover:pr-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  const variants =
    variant === "light"
      ? "bg-foreground text-background hover:shadow-[var(--shadow-glow-primary)]"
      : "bg-primary text-primary-foreground hover:shadow-[var(--shadow-glow-primary)]";

  return (
    <Link to={to} className={`${base} ${variants}`}>
      <span className="relative z-10">{children}</span>
      <span className="absolute right-0 top-0 h-full w-0 bg-primary group-hover:w-12 transition-all duration-300 grid place-items-center opacity-0 group-hover:opacity-100">
        <span className="size-2 rounded-full bg-background animate-pulse-dot" />
      </span>
    </Link>
  );
}
