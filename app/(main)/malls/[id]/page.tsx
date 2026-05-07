'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { RestaurantItem } from '@/components/restaurant/RestaurantItem';
import { ReviewSection } from '@/components/restaurant/ReviewSection';
import { ChevronLeft, Info, Map as MapIcon, Share2, Sparkles, X, Star, Baby, Footprints, MapPin, Phone, Heart } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function MallDetail({ params }: { params: { id: string } }) {
  const [mall, setMall] = useState<any>(null);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [activeFloor, setActiveFloor] = useState<string>('');

  useEffect(() => {
    async function fetchData() {
      const { data: mallData } = await supabase
        .from('malls')
        .select('*')
        .eq('id', params.id)
        .single();
      setMall(mallData);

      const { data: restData } = await supabase
        .from('restaurants')
        .select('*')
        .eq('mall_id', params.id)
        .order('floor');
      setRestaurants(restData || []);
    }
    fetchData();
  }, [params.id]);

  const mallName = mall?.name || "백화점 정보 로딩 중...";
  
  const groupedByFloor = (restaurants || []).reduce((acc, rest) => {
    if (!acc[rest.floor]) acc[rest.floor] = [];
    acc[rest.floor].push(rest);
    return acc;
  }, {} as Record<string, any[]>);

  const floors = Object.keys(groupedByFloor).sort().reverse();

  const scrollToFloor = (floorId: string) => {
    const element = document.getElementById(`floor-${floorId}`);
    if (element) {
      const offset = 140; 
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      setActiveFloor(floorId);
    }
  };

  return (
    <main className="min-h-screen bg-[#FDF8F4] pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 glass-effect px-6 py-4 flex items-center justify-between border-b border-[#F3E9E0]">
        <Link href="/" className="p-2 -ml-2 text-[#2D241E] active:scale-90 transition-transform">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-lg font-bold text-[#2D241E] truncate max-w-[200px]">{mallName}</h1>
        <div className="flex items-center gap-2">
           <button className="p-2 text-[#2D241E] active:scale-90 transition-transform"><Share2 size={20} /></button>
        </div>
      </div>

      {/* Floor Nav */}
      <div className="sticky top-[68px] z-30 bg-[#FDF8F4]/80 backdrop-blur-md px-6 py-3 border-b border-[#F3E9E0] flex gap-2 overflow-x-auto no-scrollbar">
        {floors.map((floor) => (
          <button
            key={floor}
            onClick={() => scrollToFloor(floor)}
            className={`flex-shrink-0 px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 active:scale-95 ${
              activeFloor === floor 
                ? 'bg-[#FF8A5B] text-white shadow-lg shadow-[#FF8A5B]/20' 
                : 'bg-white text-[#8D7B6D] border border-[#F3E9E0]'
            }`}
          >
            {floor}
          </button>
        ))}
      </div>

      {/* Hero */}
      <div className="px-8 pt-8 pb-10">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} className="text-[#FF8A5B]" />
          <span className="text-[10px] font-bold text-[#FF8A5B] tracking-wider uppercase">Pangyo Guide</span>
        </div>
        <h2 className="text-3xl font-bold text-[#2D241E] leading-tight mb-4">식당가 가이드</h2>
        <div className="flex gap-3">
           <button onClick={() => setIsMapOpen(true)} className="flex-1 btn-primary text-sm py-3.5">
             <MapIcon size={16} /> 몰 지도 보기
           </button>
           <button className="w-14 h-14 bg-white rounded-2xl border border-[#F3E9E0] flex items-center justify-center text-[#8D7B6D] active:scale-95">
             <Info size={20} />
           </button>
        </div>
      </div>

      {/* List */}
      <div className="px-8 space-y-12">
        {floors.map((floor) => (
          <section key={floor} id={`floor-${floor}`} className="animate-fade-up scroll-mt-40">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 bg-[#2D241E] text-white rounded-xl flex items-center justify-center font-bold text-sm">{floor}</div>
               <div className="h-[1px] flex-1 bg-[#F3E9E0]" />
            </div>
            <div className="grid grid-cols-1 gap-5">
              {groupedByFloor[floor].map((rest) => (
                <div key={rest.id} onClick={() => setSelectedRestaurant(rest)}>
                  <RestaurantItem 
                    name={rest.name}
                    category={rest.category || '기타'}
                    rating={4.8}
                    stroller={rest.stroller_accessible}
                    highchair={rest.highchair_available}
                    nursingDist={rest.nursing_room_distance || 0}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Reviews */}
      <div className="mt-20 px-8">
        <ReviewSection restaurantId={params.id} initialScore={4.7} />
      </div>

      {/* Map Modal */}
      {isMapOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#2D241E]/95 backdrop-blur-xl p-6 animate-fade-in">
          <button onClick={() => setIsMapOpen(false)} className="absolute top-8 right-8 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white"><X size={24} /></button>
          <div className="w-full max-w-lg aspect-[4/5] relative rounded-[40px] overflow-hidden shadow-2xl animate-fade-up">
            <img src="/mall_map_pangyo.png" alt="Map" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* Restaurant Detail Bottom Sheet */}
      {selectedRestaurant && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="absolute inset-0" onClick={() => setSelectedRestaurant(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-t-[40px] shadow-2xl animate-slide-up p-8 pb-12">
            <div className="w-12 h-1.5 bg-[#F3E9E0] rounded-full mx-auto mb-8" />
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="inline-block px-3 py-1 bg-[#FFEFE6] text-[#FF8A5B] text-[10px] font-bold rounded-lg mb-2">{selectedRestaurant.category}</span>
                <h3 className="text-2xl font-bold text-[#2D241E]">{selectedRestaurant.name}</h3>
              </div>
              <div className="flex items-center gap-1 text-[#FFB800]"><Star size={20} fill="currentColor" /><span className="text-lg font-bold text-[#2D241E]">4.8</span></div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-8">
               <div className="bg-[#FDF8F4] p-4 rounded-2xl text-center"><Baby size={18} className="mx-auto text-[#FF8A5B] mb-1" /><p className="text-[10px] text-[#8D7B6D]">아기의자</p><p className="text-xs font-bold">{selectedRestaurant.highchair_available ? '있음' : '없음'}</p></div>
               <div className="bg-[#FDF8F4] p-4 rounded-2xl text-center"><Footprints size={18} className="mx-auto text-[#FF8A5B] mb-1" /><p className="text-[10px] text-[#8D7B6D]">유모차</p><p className="text-xs font-bold">진입가능</p></div>
               <div className="bg-[#FDF8F4] p-4 rounded-2xl text-center"><MapPin size={18} className="mx-auto text-[#FF8A5B] mb-1" /><p className="text-[10px] text-[#8D7B6D]">수유실</p><p className="text-xs font-bold">{selectedRestaurant.nursing_room_distance}m</p></div>
            </div>
            <div className="space-y-6">
               <div>
                  <h4 className="text-sm font-bold text-[#2D241E] mb-3">추천 메뉴</h4>
                  <div className="space-y-2">
                     <div className="flex justify-between p-3 bg-[#FDF8F4] rounded-xl text-sm"><span>어린이 추천 세트</span><span className="font-bold text-[#FF8A5B]">12,000원</span></div>
                  </div>
               </div>
               <div className="flex gap-3 pt-4">
                  <button className="flex-1 bg-[#2D241E] text-white h-14 rounded-2xl font-bold active:scale-95 flex items-center justify-center gap-2"><Phone size={18} /> 전화 문의하기</button>
                  <button className="w-14 h-14 border border-[#F3E9E0] rounded-2xl flex items-center justify-center active:scale-95"><Heart size={20} /></button>
               </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
