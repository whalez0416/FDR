import React from 'react';
import { MallCard } from '../components/mall/MallCard';
import { Search, MapPin, Sparkles } from 'lucide-react';

// Mock Data for Malls
const MALLS = [
  { id: '1', name: '더현대 서울', city: '서울', district: '영등포구', image: 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&q=80&w=800' },
  { id: '2', name: '롯데월드몰', city: '서울', district: '송파구', image: 'https://images.unsplash.com/photo-1562280963-8a5475740a10?auto=format&fit=crop&q=80&w=800' },
  { id: '3', name: '신세계 하남 스타필드', city: '경기', district: '하남시', image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800' },
  { id: '4', name: '현대백화점 판교점', city: '경기', district: '성남시', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800' },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FDF8F4] pb-32">
      {/* Premium Header */}
      <header className="px-8 pt-16 pb-10 bg-gradient-to-b from-[#FFEFE6] to-[#FDF8F4]">
        <div className="flex items-center gap-2 mb-4 animate-fade-up">
          <Sparkles size={18} className="text-[#FF8A5B]" />
          <span className="text-xs font-bold text-[#FF8A5B] tracking-widest uppercase">Premium Curation</span>
        </div>
        <h1 className="text-4xl font-bold text-[#2D241E] leading-[1.1] tracking-tight animate-fade-up" style={{ animationDelay: '0.1s' }}>
          아이와 함께하는<br />
          <span className="text-[#FF8A5B]">즐거운 외식 시간</span>
        </h1>
        <p className="mt-4 text-[#8D7B6D] text-base leading-relaxed animate-fade-up" style={{ animationDelay: '0.2s' }}>
          부모님들이 직접 검증한 몰별 맛집 정보를<br />가장 스마트하게 확인하세요.
        </p>
      </header>

      {/* Floating Search Bar (Glassmorphism) */}
      <div className="px-6 -mt-8 sticky top-4 z-20 animate-fade-up" style={{ animationDelay: '0.3s' }}>
        <div className="w-full h-16 bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl shadow-[#FF8A5B]/5 border border-white flex items-center px-6 transition-all focus-within:ring-2 focus-within:ring-[#FF8A5B]/20">
          <Search size={20} className="text-[#FF8A5B] mr-4" />
          <input 
            type="text"
            placeholder="가고 싶은 백화점이나 몰을 찾아보세요"
            className="bg-transparent border-none outline-none text-sm w-full text-[#4A3728] placeholder-[#C4B5A9] font-medium"
          />
        </div>
      </div>

      {/* Mall List */}
      <div className="px-8 mt-12 space-y-8 animate-fade-up" style={{ animationDelay: '0.4s' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#2D241E]">인기 몰 & 백화점</h2>
          <button className="text-xs font-bold text-[#FF8A5B]">전체 보기</button>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {MALLS.map((mall) => (
            <MallCard 
              key={mall.id} 
              id={mall.id}
              name={mall.name}
              city={mall.city}
              district={mall.district}
              image={mall.image}
            />
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-8 left-6 right-6 h-20 bg-[#2D241E] rounded-[32px] shadow-2xl flex items-center justify-around px-8 z-50">
         <div className="flex flex-col items-center text-[#FF8A5B]">
           <div className="p-2 bg-[#FF8A5B]/10 rounded-xl mb-1">
             <div className="w-5 h-5 bg-[#FF8A5B] rounded-sm" />
           </div>
           <span className="text-[10px] font-bold">홈</span>
         </div>
         <div className="flex flex-col items-center text-[#8D7B6D]">
           <div className="p-2 mb-1">
             <div className="w-5 h-5 border-2 border-[#8D7B6D] rounded-sm" />
           </div>
           <span className="text-[10px] font-bold">저장됨</span>
         </div>
         <div className="flex flex-col items-center text-[#8D7B6D]">
           <div className="p-2 mb-1">
             <div className="w-5 h-5 border-2 border-[#8D7B6D] rounded-full" />
           </div>
           <span className="text-[10px] font-bold">마이</span>
         </div>
      </nav>
    </main>
  );
}
