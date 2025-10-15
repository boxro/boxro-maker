'use client';

interface CommonBackgroundProps {
  children: React.ReactNode;
  customBackground?: string;
  className?: string;
}

export default function CommonBackground({ 
  children, 
  customBackground, 
  className = "" 
}: CommonBackgroundProps) {
  const defaultBackground = 'linear-gradient(130deg, #2563eb, #7c3aed, #ec4899)';
  
  return (
    <div 
      className={`min-h-screen py-[52px] md:py-[68px] ${className}`}
      style={{ 
        background: customBackground || defaultBackground,
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        minHeight: '100dvh'
      }}
    >
      {children}
    </div>
  );
}
