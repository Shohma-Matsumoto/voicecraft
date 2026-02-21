"use client";

interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionTitle({ children, className = "" }: SectionTitleProps) {
  return (
    <div
      className={`flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.15em] text-text-dim mb-4 ${className}`}
    >
      {children}
      <span className="flex-1 h-px bg-border" />
    </div>
  );
}
