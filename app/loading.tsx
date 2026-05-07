import React from 'react';
import { Sparkles } from 'lucide-react';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FDF8F4]">
      <div className="relative">
        {/* Animated Rings */}
        <div className="absolute inset-0 animate-ping rounded-full bg-[#FF8A5B]/20 scale-150" />
        <div className="absolute inset-0 animate-pulse rounded-full bg-[#FF8A5B]/10 scale-[2]" />
        
        {/* Logo/Icon */}
        <div className="relative w-20 h-20 bg-white rounded-[28px] shadow-2xl shadow-[#FF8A5B]/20 flex items-center justify-center text-[#FF8A5B]">
          <Sparkles size={40} className="animate-pulse" />
        </div>
      </div>
      
      {/* Text Feedback */}
      <div className="mt-12 text-center animate-fade-up">
        <h2 className="text-xl font-bold text-[#2D241E] mb-2">맘편한 곳으로 안내할게요</h2>
        <p className="text-sm text-[#C4B5A9] font-medium tracking-wide uppercase">Mom-Comfort Dining</p>
      </div>
      
      {/* Progress Bar */}
      <div className="mt-8 w-48 h-1 bg-[#F3E9E0] rounded-full overflow-hidden">
        <div className="h-full bg-[#FF8A5B] animate-shimmer" style={{ width: '40%' }} />
      </div>
    </div>
  );
}
