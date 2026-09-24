'use client';

import React from 'react';

interface EmblemProps {
  className?: string;
  size?: number;
  invert?: boolean;
}

export default function EmblemOfIndia({
  className = '',
  size = 36,
}: EmblemProps) {
  return (
    <div
      className={`inline-flex items-center justify-center flex-shrink-0 overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        position: 'relative',
        background: '#ffffff',
        borderRadius: Math.max(4, Math.round(size * 0.16)),
        padding: Math.max(1, Math.round(size * 0.05)),
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}
    >
      <img
        src="/Pradarshak_logo_only.jpeg"
        alt="PradarshakAI Logo"
        width={size}
        height={size}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
    </div>
  );
}

export { EmblemOfIndia as PradarshakLogo };
