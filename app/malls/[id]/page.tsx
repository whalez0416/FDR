'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { RestaurantItem } from '../../../components/restaurant/RestaurantItem';
import { ReviewSection } from '../../../components/restaurant/ReviewSection';
import { ChevronLeft, Info, Map as MapIcon, Share2, Sparkles, X } from 'lucide-react';
import { supabase } from '../../../lib/supabase/client';

export default function MallDetail({ params }: { params: { id: string } }) {
  const [mall, setMall] = useState<any>(null);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [activeFloor, setActiveFloor] = useState<string>('');

  useEffect(() => {
    async function fetchData() {
      // 1. Fetch Mall Info
      const { data: mallData } = await supabase
        .from('malls')
        .select('*')
        .eq('id', params.id)
        .single();
      setMall(mallData);

      // 2. Fetch Restaurants for this Mall
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
  
  // Group restaurants by floor
  const groupedByFloor = (restaurants || []).reduce((acc, rest) => {
    if (!acc[rest.floor]) acc[rest.floor] = [];
    acc[rest.floor].push(rest);
    return acc;
  }, {} as Record<string, any[]>);

  const floors = Object.keys(groupedByFloor).sort().reverse();

  const scrollToFloor = (floorId: string) => {
    const element = document.getElementById(`floor-${floorId}`);
    if (element) {
      const offset = 140; // sticky header + floor nav height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveFloor(floorId);
    }
  };

  return (
    <main className="min-h-screen bg-[#FDF8F4] pb-20">
      {/* Sticky Top Header */}
      <div className="sticky top-0 z-40 glass-effect px-6 py-4 flex items-center justify-between border-b border-[#F3E9E0]">
        <Link href="/" className="p-2 -ml-2 text-[#2D241E] active:scale-90 transition-transform">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-lg font-bold text-[#2D241E] truncate max-w-[200px]">{mallName}</h1>
        <div className="flex items-center gap-2">
           <button className="p-2 text-[#2D241E] active:scale-90 transition-transform"><Share2 size={20} /></button>
        </div>
      </div>

      {/* Sticky Floor Nav */}
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

      {/* Hero Section */}
      <div className="px-8 pt-8 pb-10">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} className="text-[#FF8A5B]" />
          <span className="text-[10px] font-bold text-[#FF8A5B] tracking-wider uppercase">Real-time Guide</span>
        </div>
        <h2 className="text-3xl font-bold text-[#2D241E] leading-tight mb-4">
          식당가 &<br />푸드코트 가이드
        </h2>
        <p className="text-[#8D7B6D] text-sm leading-relaxed mb-6">
          총 {restaurants.length}개의 식당 정보가 있습니다.<br />
          층별 버튼을 눌러 빠르게 이동해 보세요.
        </p>
        
        <div className="flex gap-3">
           <button 
             onClick={() => setIsMapOpen(true)}
             className="flex-1 btn-primary text-sm py-3.5 active:scale-[0.98] transition-transform shadow-xl shadow-[#FF8A5B]/10"
           >
             <MapIcon size={16} />
             몰 지도 보기
           </button>
           <button className="w-14 h-14 bg-white rounded-2xl border border-[#F3E9E0] flex items-center justify-center text-[#8D7B6D] active:scale-95 transition-transform">
             <Info size={20} />
           </button>
        </div>
      </div>

      {/* Restaurant List Grouped by Floor */}
      <div className="px-8 space-y-12">
        {floors.map((floor) => (
          <section key={floor} id={`floor-${floor}`} className="animate-fade-up scroll-mt-40">
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
                  category={rest.category || '기타'}
                  rating={4.8}
                  stroller={rest.stroller_accessible}
                  highchair={rest.highchair_available}
                  nursingDist={rest.nursing_room_distance || 0}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Review Section */}
      <div className="mt-20 px-8">
        <div className="h-[1px] w-full bg-[#F3E9E0] mb-12" />
        <ReviewSection restaurantId={params.id} initialScore={4.7} />
      </div>

      {/* Map Modal */}
      {isMapOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#2D241E]/95 backdrop-blur-xl p-6 animate-fade-in">
          <button 
            onClick={() => setIsMapOpen(false)}
            className="absolute top-8 right-8 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white active:scale-90 transition-all hover:bg-white/20"
          >
            <X size={24} />
          </button>
          <div className="w-full max-w-lg aspect-[4/5] relative rounded-[40px] overflow-hidden shadow-2xl animate-fade-up">
            <img 
              src="/mall_map_pangyo.png" 
              alt="Hyundai Pangyo Map"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-10">
               <h3 className="text-2xl font-bold text-white mb-2">현대백화점 판교점 지도</h3>
               <p className="text-white/70 text-sm">9F 식당가, 5F 키즈, B1 식품관 안내</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
