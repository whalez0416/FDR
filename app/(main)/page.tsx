import { SearchBar } from '@/components/search/SearchBar';
import { Suspense } from 'react';
import { Sparkles } from 'lucide-react';
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
      <Suspense fallback={<div className="px-6 -mt-8 h-16 bg-white/50 rounded-3xl animate-pulse" />}>
        <SearchBar />
      </Suspense>

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
