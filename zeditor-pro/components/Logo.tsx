
import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`relative flex items-center justify-center rounded-[28%] bg-black shadow-2xl overflow-hidden border border-white/10 group ${className}`}>
    <img
      src="./public_logo.png"
      alt="ZEditor PRO Logo"
      className="w-full h-full object-cover scale-[1.3] -translate-y-[10%]"
    />

    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[luminousSweep_5s_infinite_ease-in-out]" />

    <style dangerouslySetInnerHTML={{
      __html: `
      @keyframes luminousSweep {
        0% { transform: translateX(-150%) skewX(-30deg); }
        40%, 100% { transform: translateX(250%) skewX(-30deg); }
      }
    `}} />
  </div>
);
