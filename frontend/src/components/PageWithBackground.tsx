'use client';

import { ReactNode } from 'react';
import { useBackgroundSettings } from '@/hooks/useBackgroundSettings';

interface PageWithBackgroundProps {
  children: ReactNode;
  className?: string;
}

export function PageWithBackground({ children, className = '' }: PageWithBackgroundProps) {
  const { currentConfig, getBackgroundStyle } = useBackgroundSettings();
  const backgroundStyle = getBackgroundStyle(currentConfig);

  return (
    <div className={`min-h-screen w-full relative ${className}`}>
      {/* Background Layer */}
      <div
        className="absolute inset-0 z-0"
        style={backgroundStyle}
      />
      {/* Content Layer */}
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
}

