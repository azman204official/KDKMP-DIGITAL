import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Logo({ className = "", size = "md" }: LogoProps) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xl: "w-44 h-44"
  };

  const logoUrl = "https://cdn.phototourl.com/free/2026-04-28-a960d9af-d6d2-4c3f-9806-8bcc668e885f.png";

  return (
    <div className={`${sizes[size]} flex items-center justify-center relative ${className}`}>
      <img 
        src={logoUrl} 
        alt="KDKMP Digital Logo" 
        className="w-full h-full object-contain drop-shadow-sm"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
