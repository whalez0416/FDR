import React from 'react';
import Link from 'next/link';
import { Search, MapPin, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { InfiniteMallList } from '@/components/mall/InfiniteMallList';
import { NearbyMall } from '@/components/mall/NearbyMall';

export default async function Home() {
  // Fetch initial malls from Supabase (first 10)
  const { data: INITIAL_MALLS } = await supabase
    .from('malls')
    .select('*')
    .order('name')
    .range(0, 9);

  return (
    <main className="min-h-screen bg-[#FDF8F4] pb-32">
      {/* Premium Header */}
      <header className="px-8 pt-16 pb-10 bg-gradient-to-b from-[#FFEFE6] to-[#FDF8F4]">
        <div className="flex items-center gap-2 mb-4 animate-fade-up">
          <Sparkles size={18} className="text-[#FF8A5B]" />
          <span className="text-xs font-bold text-[#FF8A5B] tracking-widest uppercase">Premium Curation</span>
        </div>
        <h1 className="text-4xl font-bold text-[#2D241E] leading-[1.1] tracking-tight animate-fade-up" style={{ animationDelay: '0.1s' }}>
          아이와 함께<br />
          <span className="text-[#FF8A5B]">맘편한 외식</span>
        </h1>
        <p className="mt-4 text-[#8D7B6D] text-base leading-relaxed animate-fade-up" style={{ animationDelay: '0.2s' }}>
          백화점부터 대형 몰까지,<br />직접 검증한 아이 맞춤 맛집 가이드
        </p>
      </header>

      {/* Floating Search Bar (Glassmorphism) */}
      <div className="px-6 -mt-8 sticky top-4 z-20 animate-fade-up" style={{ animationDelay: '0.3s' }}>
        <div className="w-full h-16 bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl shadow-[#FF8A5B]/5 border border-white flex items-center px-6 transition-all focus-within:ring-2 focus-within:ring-[#FF8A5B]/20 active:scale-[0.98]">
          <Search size={20} className="text-[#FF8A5B] mr-4" />
          <input 
            type="text"
            placeholder="가고 싶은 백화점이나 몰을 찾아보세요"
            className="bg-transparent border-none outline-none text-sm w-full text-[#4A3728] placeholder-[#C4B5A9] font-medium"
          />
        </div>
      </div>

      {/* Mall List with Infinite Scroll */}
      <div className="px-8 mt-12 space-y-8 animate-fade-up" style={{ animationDelay: '0.4s' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#2D241E]">인기 몰 & 백화점</h2>
          <button className="text-xs font-bold text-[#FF8A5B]">전체 보기</button>
        </div>
        
        <NearbyMall malls={INITIAL_MALLS || []} />

        <InfiniteMallList initialMalls={INITIAL_MALLS || []} />
        
        {(!INITIAL_MALLS || INITIAL_MALLS.length === 0) && (
          <p className="text-center text-[#8D7B6D] py-10">등록된 몰 정보가 없습니다.</p>
        )}
      </div>
    </main>
  );
}
