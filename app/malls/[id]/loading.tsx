import React from 'react';
import { Loader2 } from 'lucide-react';

export default function MallDetailLoading() {
  return (
    <div className="min-h-screen bg-[#FDF8F4] flex flex-col items-center justify-center px-10">
      <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center text-[#FF8A5B] mb-6 animate-bounce">
        <Loader2 size={32} className="animate-spin" />
      </div>
      <div className="space-y-3 text-center">
        <div className="h-6 w-40 bg-[#F3E9E0] rounded-full mx-auto animate-pulse" />
        <div className="h-4 w-56 bg-[#F3E9E0] rounded-full mx-auto animate-pulse opacity-60" />
      </div>
      
      {/* Skeleton Cards */}
      <div className="mt-12 w-full space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 w-full bg-white rounded-3xl border border-[#F3E9E0] p-4 flex items-center gap-4 opacity-40">
             <div className="w-12 h-12 bg-[#F3E9E0] rounded-xl animate-pulse" />
             <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-[#F3E9E0] rounded-full animate-pulse" />
                <div className="h-3 w-40 bg-[#F3E9E0] rounded-full animate-pulse" />
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
