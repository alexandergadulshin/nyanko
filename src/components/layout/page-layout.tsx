import { type ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function PageLayout({ 
  children, 
  title, 
  subtitle, 
  className = "" 
}: PageLayoutProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 ${className}`}>
      <div className="container mx-auto px-4 py-8">
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && (
              <h1 className="text-5xl font-bold text-white mb-4">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}