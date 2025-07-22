import { type ReactNode } from "react";

interface SectionCardProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export function SectionCard({ 
  children, 
  title, 
  className = "" 
}: SectionCardProps) {
  return (
    <div className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:bg-white/20 transition-all duration-300 ${className}`}>
      {title && (
        <h2 className="text-2xl font-semibold text-white mb-6">{title}</h2>
      )}
      {children}
    </div>
  );
}