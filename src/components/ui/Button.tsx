import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--huza-green)] disabled:opacity-50 disabled:pointer-events-none",
        variant === "primary" &&
          "bg-[var(--huza-green)] text-white hover:bg-[var(--huza-green-dark)] shadow-[0_8px_24px_rgba(11,92,52,0.25)]",
        variant === "secondary" &&
          "bg-[var(--huza-gold)] text-[var(--huza-ink)] hover:brightness-95",
        variant === "ghost" &&
          "bg-transparent text-[var(--huza-green-dark)] hover:bg-[var(--huza-mint)]",
        variant === "danger" && "bg-red-700 text-white hover:bg-red-800",
        size === "sm" && "px-3 py-1.5 text-sm rounded-md",
        size === "md" && "px-5 py-2.5 text-sm rounded-lg",
        size === "lg" && "px-7 py-3.5 text-base rounded-xl",
        className
      )}
      {...props}
    />
  );
}
