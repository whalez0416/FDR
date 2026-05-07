import React from 'react';
import { MallCard } from '../components/mall/MallCard';

// Mock Data for Malls
const MALLS = [
  { id: '1', name: '더현대 서울', city: '서울', district: '영등포구', image: 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&q=80&w=800' },
  { id: '2', name: '롯데월드몰', city: '서울', district: '송파구', image: 'https://images.unsplash.com/photo-1562280963-8a5475740a10?auto=format&fit=crop&q=80&w=800' },
  { id: '3', name: '신세계 하남 스타필드', city: '경기', district: '하남시', image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800' },
  { id: '4', name: '현대백화점 판교점', city: '경기', district: '성남시', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800' },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FFF9F5] pb-20">
      {/* Header */}
      <header className="px-6 pt-12 pb-6">
        <h1 className="text-3xl font-bold text-[#4A3728] leading-tight">
          아이와 함께하는<br />
          <span className="text-[#FF8A5B]">즐거운 외식 시간</span>
        </h1>
        <p className="mt-2 text-[#8D7B6D] text-sm">
          부모님들이 직접 검증한 몰별 맛집 정보를 확인하세요.
        </p>
      </header>

      {/* Search Bar Placeholder */}
      <div className="px-6 mb-8">
        <div className="w-full h-12 bg-white rounded-2xl shadow-sm border border-[#F3E9E0] flex items-center px-4">
          <span className="text-[#C4B5A9] text-sm">가고 싶은 백화점이나 몰을 찾아보세요</span>
        </div>
      </div>

      {/* Mall List */}
      <div className="px-6 space-y-6">
        <h2 className="text-lg font-semibold text-[#4A3728]">주요 몰 & 백화점</h2>
        <div className="grid grid-cols-1 gap-4">
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

      {/* Bottom Nav Placeholder */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#F3E9E0] flex items-center justify-around px-6 max-w-md mx-auto rounded-t-3xl shadow-lg">
         <div className="flex flex-col items-center text-[#FF8A5B]">
           <div className="w-6 h-6 bg-[#FF8A5B] rounded-md mb-1" />
           <span className="text-[10px] font-bold">홈</span>
         </div>
         <div className="flex flex-col items-center text-[#C4B5A9]">
           <div className="w-6 h-6 bg-[#F3E9E0] rounded-md mb-1" />
           <span className="text-[10px]">즐겨찾기</span>
         </div>
         <div className="flex flex-col items-center text-[#C4B5A9]">
           <div className="w-6 h-6 bg-[#F3E9E0] rounded-md mb-1" />
           <span className="text-[10px]">커뮤니티</span>
         </div>
         <div className="flex flex-col items-center text-[#C4B5A9]">
           <div className="w-6 h-6 bg-[#F3E9E0] rounded-md mb-1" />
           <span className="text-[10px]">마이</span>
         </div>
      </nav>
    </main>
  );
}
