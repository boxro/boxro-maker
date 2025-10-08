import React from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-[22px] font-bold text-white mb-1 font-cookie-run">
        {title}
      </h1>
      <p className="text-[14px] text-white/80">
        {description}
      </p>
    </div>
  );
}