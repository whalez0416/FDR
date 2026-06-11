'use client';

import React, { useEffect, useState } from 'react';
import { Bookmark, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { RestaurantItem } from '@/components/restaurant/RestaurantItem';
import { nursingDistance, nursingText } from '@/lib/utils/floor';
import Link from 'next/link';

export default function SavedPage() {
  const [savedRestaurants, setSavedRestaurants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSaved() {
      const saved = localStorage.getItem('fdr_saved');
      if (saved) {
        const ids = JSON.parse(saved);
        if (ids.length > 0) {
          const { data } = await supabase
            .from('restaurants')
            .select('*, malls(name, district, nursing_room)')
            .in('id', ids);
          setSavedRestaurants(data || []);
        }
      }
      setIsLoading(false);
    }
    fetchSaved();
  }, []);

  return (
    <main className="min-h-screen bg-[#FDF8F4] pt-16 px-8 flex flex-col">
      <h1 className="text-2xl font-bold text-[#2D241E] mb-6 flex items-center gap-2">
        <Bookmark className="text-[#FF8A5B]" fill="currentColor" /> 저장한 식당
      </h1>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#FF8A5B]/30 border-t-[#FF8A5B] rounded-full animate-spin" />
        </div>
      ) : savedRestaurants.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center -mt-20">
          <div className="w-20 h-20 bg-[#FFEFE6] rounded-full flex items-center justify-center mb-6">
            <Bookmark size={32} className="text-[#FF8A5B]" />
          </div>
          <p className="text-[#8D7B6D] text-sm leading-relaxed mb-8">
            아직 저장한 식당이 없습니다.<br />
            가고 싶은 식당을 발견하면 하트를 눌러보세요!
          </p>
          <Link href="/" className="px-6 py-3 bg-[#2D241E] text-white font-bold rounded-2xl active:scale-95 transition-transform">
            식당 찾아보기
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="bg-[#FFEFE6] p-4 rounded-2xl mb-2 flex items-start gap-3">
            <Sparkles size={18} className="text-[#FF8A5B] shrink-0 mt-0.5" />
            <p className="text-xs text-[#FF8A5B] font-medium leading-relaxed">
              지금은 기기(브라우저)에만 임시 저장됩니다.<br/>
              곧 카카오 로그인과 함께 영구 저장 기능이 열립니다!
            </p>
          </div>
          {savedRestaurants.map(rest => {
            const nd = nursingDistance(rest.floor, nursingText(rest.malls?.nursing_room, rest.malls?.district));
            return (
              <Link key={rest.id} href={`/malls/${rest.mall_id}`} className="block">
                <RestaurantItem
                  name={rest.name}
                  category={rest.category || '기타'}
                  stroller={rest.stroller_accessible}
                  highchair={rest.highchair_available}
                  nursingFloor={nd.floorText}
                  nursingRelative={nd.relative}
                />
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
