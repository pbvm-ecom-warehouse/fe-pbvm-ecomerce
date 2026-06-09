import * as React from "react";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export function Logo({ size = 40, className, ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Circular Emblem Frame */}
      <circle cx="100" cy="100" r="94" fill="#FAF8F6" stroke="#1C1C1C" strokeWidth="6" />

      {/* Isometric 3D Cube (scaled down & centered inside the circle) */}
      <g transform="translate(15, 12) scale(0.85)">
        {/* 3D Open Box Interior (Top Face) */}
        {/* Left Interior Wall */}
        <polygon points="100,22 32,60 100,100" fill="#E4D0C0" />
        {/* Right Interior Wall */}
        <polygon points="100,22 168,60 100,100" fill="#C29F84" />
        {/* Center interior spine */}
        <line x1="100" y1="22" x2="100" y2="100" stroke="#FAF8F6" strokeWidth="1.5" />

        {/* Left Face - Brown stylized Letter "E" */}
        <polygon points="100,100 30,60 30,140 100,180" fill="#6E4724" stroke="#1C1C1C" strokeWidth="1.5" strokeLinejoin="round" />
        {/* Slots of Letter E (filled with circular background color) */}
        <polygon points="56,80 94,102 94,113 56,91" fill="#FAF8F6" />
        <polygon points="56,108 94,130 94,141 56,119" fill="#FAF8F6" />

        {/* Right Face - Beige background with brown leaf */}
        <polygon points="100,100 170,60 170,140 100,180" fill="#D0B49F" stroke="#1C1C1C" strokeWidth="1.5" strokeLinejoin="round" />
        {/* Leaf outline and base leaf (styled path) */}
        <path
          d="M 112,163 C 114,133 126,113 158,86 C 146,113 132,143 112,163 Z"
          fill="#6E4724"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Leaf center vein */}
        <path
          d="M 113,161 Q 131,126 155,90"
          stroke="#FFFFFF"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Outer borders of the box */}
        {/* Top outer back edges (Black) */}
        <line x1="30" y1="60" x2="100" y2="20" stroke="#1C1C1C" strokeWidth="4" strokeLinecap="round" />
        <line x1="100" y1="20" x2="170" y2="60" stroke="#1C1C1C" strokeWidth="4" strokeLinecap="round" />
        {/* Front outer top rims (White highlight) */}
        <line x1="30" y1="60" x2="100" y2="100" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        <line x1="100" y1="100" x2="170" y2="60" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}
