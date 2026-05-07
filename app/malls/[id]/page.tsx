import React from 'react';
import Link from 'next/link';
import { RestaurantItem } from '../../../components/restaurant/RestaurantItem';
import { ReviewSection } from '../../../components/restaurant/ReviewSection';
import { ChevronLeft, Info, Map as MapIcon, Share2, Sparkles } from 'lucide-react';

// Mock Data for Restaurants
const RESTAURANTS = [
  { id: '101', name: '텍사스 로드하우스', category: '스테이크', floor: '9F', rating: 4.8, stroller: true, highchair: true, nursingDist: 30 },
  { id: '102', name: 'h_541', category: '이탈리안', floor: '9F', rating: 4.5, stroller: true, highchair: true, nursingDist: 45 },
  { id: '103', name: '정돈 프리미엄', category: '돈카츠', floor: '9F', rating: 4.7, stroller: false, highchair: true, nursingDist: 20 },
  { id: '104', name: '공화춘', category: '중식', floor: '9F', rating: 4.2, stroller: true, highchair: true, nursingDist: 60 },
  { id: '105', name: '이탈리(Eataly)', category: '양식', floor: '6F', stroller: true, highchair: true, nursingDist: 50, rating: 4.8 },
  { id: '106', name: '정육면체', category: '중식', floor: 'B1', stroller: false, highchair: true, nursingDist: 120, rating: 4.5 },
];

export default function MallDetail({ params }: { params: { id: string } }) {
  const mallName = "현대백화점 판교점";
  
  // Group restaurants by floor
  const groupedByFloor = RESTAURANTS.reduce((acc, rest) => {
    if (!acc[rest.floor]) acc[rest.floor] = [];
    acc[rest.floor].push(rest);
    return acc;
  }, {} as Record<string, typeof RESTAURANTS>);

  const floors = Object.keys(groupedByFloor).sort().reverse();

  return (
    <main className="min-h-screen bg-[#FDF8F4] pb-20">
      {/* Sticky Top Header */}
      <div className="sticky top-0 z-30 glass-effect px-6 py-4 flex items-center justify-between">
        <Link href="/" className="p-2 -ml-2 text-[#2D241E]">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-lg font-bold text-[#2D241E] truncate max-w-[200px]">{mallName}</h1>
        <div className="flex items-center gap-2">
           <button className="p-2 text-[#2D241E]"><Share2 size={20} /></button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="px-8 pt-8 pb-10">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} className="text-[#FF8A5B]" />
          <span className="text-[10px] font-bold text-[#FF8A5B] tracking-wider uppercase">Pangyo, Gyeonggi</span>
        </div>
        <h2 className="text-3xl font-bold text-[#2D241E] leading-tight mb-4">
          식당가 &<br />푸드코트 가이드
        </h2>
        <p className="text-[#8D7B6D] text-sm leading-relaxed mb-6">
          총 {RESTAURANTS.length}개의 식당이 등록되어 있습니다.<br />
          수유실 위치와 유모차 접근성을 확인하세요.
        </p>
        
        <div className="flex gap-3">
           <button className="flex-1 btn-primary text-sm py-3.5">
             <MapIcon size={16} />
             몰 지도 보기
           </button>
           <button className="w-14 h-14 bg-white rounded-2xl border border-[#F3E9E0] flex items-center justify-center text-[#8D7B6D]">
             <Info size={20} />
           </button>
        </div>
      </div>

      {/* Restaurant List Grouped by Floor */}
      <div className="px-8 space-y-12">
        {floors.map((floor) => (
          <section key={floor} className="animate-fade-up">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 bg-[#2D241E] text-white rounded-xl flex items-center justify-center font-bold text-sm">
                 {floor}
               </div>
               <div className="h-[1px] flex-1 bg-[#F3E9E0]" />
            </div>
            <div className="grid grid-cols-1 gap-5">
              {groupedByFloor[floor].map((rest) => (
                <RestaurantItem 
                  key={rest.id}
                  name={rest.name}
                  category={rest.category}
                  rating={rest.rating}
                  stroller={rest.stroller}
                  highchair={rest.highchair}
                  nursingDist={rest.nursingDist}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Review Section Area */}
      <div className="mt-20 px-8">
        <div className="h-[1px] w-full bg-[#F3E9E0] mb-12" />
        <ReviewSection restaurantId={params.id} initialScore={4.7} />
      </div>
    </main>
  );
}
