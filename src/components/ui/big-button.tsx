"use client";

import type { LucideIcon } from "lucide-react";

interface BigButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: LucideIcon;
  variant?: "primary" | "secondary";
  className?: string;
}

export function BigButton({
  children,
  onClick,
  icon: Icon,
  variant = "primary",
  className = "",
}: BigButtonProps) {
  const base =
    "w-full py-4 rounded-2xl font-sans text-[15px] font-bold cursor-pointer transition-all active:scale-[0.98] tracking-[0.05em] flex items-center justify-center gap-2.5";

  const variants = {
    primary:
      "bg-gradient-to-br from-cyan to-[#0088AA] text-black shadow-[0_4px_20px_rgba(0,229,255,0.25)]",
    secondary: "bg-bg2 text-text border border-border shadow-none",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      onClick={onClick}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
}
