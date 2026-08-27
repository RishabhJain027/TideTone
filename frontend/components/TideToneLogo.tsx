"use client";

import React from "react";

export default function TideToneLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          <linearGradient id="tideGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7B9080" />
            <stop offset="50%" stopColor="#5C6B73" />
            <stop offset="100%" stopColor="#2C3330" />
          </linearGradient>
          <linearGradient id="tideGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C89585" />
            <stop offset="60%" stopColor="#D4A373" />
            <stop offset="100%" stopColor="#E9D8A6" />
          </linearGradient>
          <linearGradient id="coreGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#7B9080" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Celestial Ring */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="url(#tideGrad1)"
          strokeWidth="2.5"
          strokeDasharray="4 6"
          className="opacity-60"
        />

        {/* Dynamic Ocean Harmonic Crest */}
        <path
          d="M20 58 C 28 35, 42 22, 50 22 C 58 22, 72 35, 80 58 C 68 76, 58 80, 50 80 C 42 80, 32 76, 20 58 Z"
          fill="url(#tideGrad1)"
          fillOpacity="0.25"
          stroke="url(#tideGrad1)"
          strokeWidth="2.5"
        />

        {/* Intersecting Acoustic Resonance Wave */}
        <path
          d="M16 50 C 30 25, 45 75, 50 50 C 55 25, 70 75, 84 50"
          stroke="url(#tideGrad2)"
          strokeWidth="3.5"
          strokeLinecap="round"
          filter="url(#glow)"
        />

        {/* Secondary Harmonic Waveform */}
        <path
          d="M26 50 C 36 36, 44 64, 50 50 C 56 36, 64 64, 74 50"
          stroke="#F7F5F0"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.9"
        />

        {/* Central Singularity Pulse */}
        <circle cx="50" cy="50" r="4.5" fill="url(#coreGlow)" filter="url(#glow)" />
        <circle cx="50" cy="50" r="2" fill="#FFFFFF" />
      </svg>
    </div>
  );
}
