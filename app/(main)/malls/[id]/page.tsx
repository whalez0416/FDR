'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { RestaurantItem } from '@/components/restaurant/RestaurantItem';
import { ReviewSection } from '@/components/restaurant/ReviewSection';
import { ChevronLeft, Info, Map as MapIcon, Share2, Sparkles, X, Baby, Footprints, MapPin, Phone, Heart, Search } from 'lucide-react';
import { Restaurant } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { nursingDistance } from '@/lib/utils/floor';

export default function MallDetail({ params }: { params: { id: string } }) {
  const [mall, setMall] = useState<any>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [activeFloor, setActiveFloor] = useState<string>('');

  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('fdr_saved');
    if (saved) {
      setSavedIds(JSON.parse(saved));
    }
    
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

  const toggleSave = (id: string) => {
    setSavedIds(prev => {
      const isSaved = prev.includes(id);
      const newSaved = isSaved ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('fdr_saved', JSON.stringify(newSaved));
      return newSaved;
    });
  };

  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState('');

  const mallName = mall?.name || "백화점 정보 로딩 중...";
  // We only ship a floor map for Pangyo; don't show a misleading map for others.
  const hasMallMap = (mall?.name || '').includes('판교');

  // Normalize floor names to handle inconsistent spacing (e.g., '본관지하1층' -> '본관 지하 1층')
  const normalizeFloor = (floor: string): string => {
    if (!floor) return '';
    const clean = floor.replace(/\s+/g, '').trim();
    return clean
      .replace(/본관/g, '본관 ')
      .replace(/신관/g, '신관 ')
      .replace(/지하/g, '지하 ')
      .replace(/지상/g, '지상 ')
      .replace(/([0-9]+)층/g, '$1층')
      .replace(/\s+/g, ' ')
      .trim();
  };
  
  // Extract categories
  const categories = ['전체', ...Array.from(new Set((restaurants || []).flatMap((r: Restaurant) => (r.category || '기타').split(',').map((c: string) => c.trim()))))];

  const filteredRestaurants = restaurants.filter(r => {
    const matchesCategory = selectedCategory === '전체' || (r.category || '').includes(selectedCategory);
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (r.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const groupedByFloor = (filteredRestaurants || []).reduce((acc, rest: Restaurant) => {
    const normFloor = normalizeFloor(rest.floor);
    if (!acc[normFloor]) acc[normFloor] = [];
    acc[normFloor].push(rest);
    return acc;
  }, {} as Record<string, Restaurant[]>);

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
          <span className="text-[10px] font-bold text-[#FF8A5B] tracking-wider uppercase truncate max-w-[260px]">{mallName} Guide</span>
        </div>
        <h2 className="text-3xl font-bold text-[#2D241E] leading-tight mb-6">식당가 가이드</h2>
        {hasMallMap && (
          <div className="flex gap-3 mb-8">
             <button onClick={() => setIsMapOpen(true)} className="flex-1 btn-primary text-sm py-3.5">
               <MapIcon size={16} /> 몰 지도 보기
             </button>
             <button className="w-14 h-14 bg-white rounded-2xl border border-[#F3E9E0] flex items-center justify-center text-[#8D7B6D] active:scale-95">
               <Info size={20} />
             </button>
          </div>
        )}

        {/* Search & Category Filter */}
        <div className="space-y-6">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C4B5A9]" />
            <input 
              type="text"
              placeholder="식당 이름이나 종류를 입력하세요..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white rounded-2xl border border-[#F3E9E0] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A5B]/20 transition-all shadow-sm"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 px-4 py-2.5 rounded-2xl text-[13px] font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#2D241E] text-white shadow-lg'
                    : 'bg-[#F3E9E0]/30 text-[#8D7B6D] hover:bg-[#F3E9E0]/50'
                }`}
              >
                #{cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="px-8 space-y-12">
        {floors.length > 0 ? (
          floors.map((floor) => (
            <section key={floor} id={`floor-${floor}`} className="animate-fade-up scroll-mt-40">
              <div className="flex items-center gap-3 mb-6">
                 <div className="px-4 h-9 bg-[#2D241E] text-white rounded-full flex items-center justify-center font-bold text-xs whitespace-nowrap shadow-sm">{floor}</div>
                 <div className="h-[1px] flex-1 bg-[#F3E9E0]" />
              </div>
              <div className="grid grid-cols-1 gap-5">
                {groupedByFloor[floor].map((rest) => {
                  const nd = nursingDistance(rest.floor, mall?.district);
                  return (
                    <div key={rest.id} onClick={() => setSelectedRestaurant(rest)}>
                      <RestaurantItem
                        name={rest.name}
                        category={rest.category || '기타'}
                        stroller={rest.stroller_accessible}
                        highchair={rest.highchair_available}
                        nursingFloor={nd.floorText}
                        nursingRelative={nd.relative}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        ) : (
          <div className="py-20 text-center">
            <p className="text-[#8D7B6D] font-medium">선택하신 카테고리의 식당이 없습니다.</p>
          </div>
        )}
      </div>

      {/* Reviews */}
      <div className="mt-20 px-8">
        <ReviewSection restaurantId={params.id} />
      </div>

      {/* Map Modal */}
      {isMapOpen && hasMallMap && (
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
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  {(selectedRestaurant.category || '기타').split(',').map((cat: string) => (
                    <span key={cat} className="text-[12px] text-[#FF8A5B] font-bold bg-[#FF8A5B]/10 px-2.5 py-1 rounded-md">
                      #{cat.trim()}
                    </span>
                  ))}
                  {selectedRestaurant.highchair_available && (
                    <span className="text-[12px] text-[#FFB800] font-bold bg-[#FFB800]/10 px-2.5 py-1 rounded-md">
                      #예스키즈존
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-[#2D241E]">{selectedRestaurant.name}</h3>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-8">
               <div className="bg-[#FDF8F4] p-4 rounded-2xl text-center"><Baby size={18} className="mx-auto text-[#FF8A5B] mb-1" /><p className="text-[10px] text-[#8D7B6D]">아기의자</p><p className="text-xs font-bold">{selectedRestaurant.highchair_available ? '있음' : '없음'}</p></div>
               <div className="bg-[#FDF8F4] p-4 rounded-2xl text-center"><Footprints size={18} className="mx-auto text-[#FF8A5B] mb-1" /><p className="text-[10px] text-[#8D7B6D]">유모차</p><p className="text-xs font-bold">진입가능</p></div>
               <div className="bg-[#FDF8F4] p-4 rounded-2xl text-center"><MapPin size={18} className="mx-auto text-[#FF8A5B] mb-1" /><p className="text-[10px] text-[#8D7B6D]">수유실</p><p className="text-xs font-bold">{nursingDistance(selectedRestaurant.floor, mall?.district).floorText || '정보 없음'}</p>{(() => { const nd = nursingDistance(selectedRestaurant.floor, mall?.district); return nd.relative ? <p className="text-[10px] text-[#FF8A5B] font-medium mt-0.5">{nd.relative}</p> : null; })()}</div>
            </div>
            <div className="space-y-6">
               {selectedRestaurant.description && (
                 <div>
                    <h4 className="text-sm font-bold text-[#2D241E] mb-3">아이와 함께라면</h4>
                    <p className="text-sm text-[#8D7B6D] leading-relaxed bg-[#FDF8F4] p-4 rounded-2xl">
                      {selectedRestaurant.description}
                    </p>
                 </div>
               )}
               <div className="flex gap-3 pt-4">
                  <button className="flex-1 bg-[#2D241E] text-white h-14 rounded-2xl font-bold active:scale-95 flex items-center justify-center gap-2 transition-transform"><Phone size={18} /> 전화 문의하기</button>
                  <button 
                    onClick={() => toggleSave(selectedRestaurant.id)}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center active:scale-95 transition-all ${
                      savedIds.includes(selectedRestaurant.id) 
                        ? 'bg-[#FFEFE6] border border-[#FF8A5B] text-[#FF8A5B]' 
                        : 'bg-white border border-[#F3E9E0] text-[#8D7B6D]'
                    }`}
                  >
                    <Heart size={20} className={savedIds.includes(selectedRestaurant.id) ? 'fill-current' : ''} />
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
