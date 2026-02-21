"use client";

interface ChipProps {
  children: React.ReactNode;
  variant?: "cyan" | "amber";
  active?: boolean;
  onClick?: () => void;
}

export function Chip({
  children,
  variant = "cyan",
  active = true,
  onClick,
}: ChipProps) {
  const baseClasses =
    "inline-block px-3 py-1 rounded-full font-mono text-[10px] tracking-[0.08em] uppercase border transition-all";

  const variantClasses =
    variant === "amber"
      ? "bg-amber-dim text-amber border-amber/20"
      : "bg-cyan-dim text-cyan border-cyan/20";

  return (
    <span
      className={`${baseClasses} ${variantClasses} ${!active ? "opacity-50" : ""} ${onClick ? "cursor-pointer hover:opacity-80" : ""}`}
      onClick={onClick}
    >
      {children}
    </span>
  );
}
