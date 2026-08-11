import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10", size = 40 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Glow filter for neon purple outline */}
        <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="purple-neon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d8b4fe" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#7e22ce" />
        </linearGradient>
        <linearGradient id="cyan-glow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#00f5d4" />
        </linearGradient>
      </defs>

      {/* Top Handle / Notch */}
      <path
        d="M 75 22 C 75 16 80 12 88 12 H 112 C 120 12 125 16 125 22 V 32 H 75 V 22 Z"
        fill="#2a3342"
        stroke="#a855f7"
        strokeWidth="5"
        strokeLinejoin="round"
      />

      {/* Main Outer Phone Body Frame with Purple Neon Outline */}
      <rect
        x="32"
        y="30"
        width="136"
        height="146"
        rx="32"
        fill="#1e2634"
        stroke="url(#purple-neon)"
        strokeWidth="6"
        filter="url(#neon-glow)"
      />

      {/* Stylized Dark Grey 'G' Frame Structure */}
      {/* Outer G shape */}
      <path
        d="M 52 50 H 148 V 74 H 122 V 88 H 148 V 152 H 52 Z"
        fill="#374357"
        rx="16"
      />

      {/* Inner Cutout inside G */}
      <rect x="68" y="66" width="58" height="70" rx="12" fill="#1e2634" />

      {/* G Middle Bar */}
      <path
        d="M 122 100 H 148 V 118 H 122 Z"
        fill="#374357"
      />

      {/* Bright Cyan APK Text */}
      <text
        x="97"
        y="110"
        fill="url(#cyan-glow)"
        fontSize="31"
        fontWeight="900"
        fontFamily="system-ui, -apple-system, sans-serif"
        textAnchor="middle"
        letterSpacing="2"
      >
        APK
      </text>
    </svg>
  );
};
