'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Navigation, ChevronRight, Compass } from 'lucide-react';

interface NearbyMallProps {
  malls: any[];
}

const MALL_COORDS: Record<string, { lat: number; lng: number }> = {
  // 서울 & 수도권
  "현대백화점 판교점": { lat: 37.3927, lng: 127.1120 },
  "판교점": { lat: 37.3927, lng: 127.1120 },
  "더현대 서울": { lat: 37.5258, lng: 126.9284 },
  "현대백화점 더현대서울점": { lat: 37.5258, lng: 126.9284 },
  "현대백화점 압구정본점": { lat: 37.5273, lng: 127.0274 },
  "압구정본점": { lat: 37.5273, lng: 127.0274 },
  "현대백화점 무역센터점": { lat: 37.5086, lng: 127.0597 },
  "무역센터점": { lat: 37.5086, lng: 127.0597 },
  "현대백화점 천호점": { lat: 37.5387, lng: 127.1235 },
  "천호점": { lat: 37.5387, lng: 127.1235 },
  "현대백화점 신촌점": { lat: 37.5562, lng: 126.9360 },
  "신촌점": { lat: 37.5562, lng: 126.9360 },
  "현대백화점 미아점": { lat: 37.6083, lng: 127.0286 },
  "미아점": { lat: 37.6083, lng: 127.0286 },
  "현대백화점 목동점": { lat: 37.5273, lng: 126.8753 },
  "목동점": { lat: 37.5273, lng: 126.8753 },
  "현대백화점 중동점": { lat: 37.5042, lng: 126.7616 },
  "중동점": { lat: 37.5042, lng: 126.7616 },
  "현대백화점 킨텍스점": { lat: 37.6677, lng: 126.7516 },
  "킨텍스점": { lat: 37.6677, lng: 126.7516 },
  "현대백화점 디큐브시티": { lat: 37.5085, lng: 126.8887 },
  "디큐브시티": { lat: 37.5085, lng: 126.8887 },
  // 지방
  "현대백화점 울산점": { lat: 35.5395, lng: 129.3364 },
  "울산점": { lat: 35.5395, lng: 129.3364 },
  "현대백화점 부산점": { lat: 35.1362, lng: 129.0592 },
  "커넥트현대 부산": { lat: 35.1362, lng: 129.0592 },
  "더현대 대구": { lat: 35.8660, lng: 128.5910 },
};

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function NearbyMall({ malls }: NearbyMallProps) {
  const [closest, setClosest] = useState<{ mall: any, distance: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const findNearby = () => {
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('위치 권한을 지원하지 않는 브라우저입니다.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        let minDistance = Infinity;
        let nearest = null;

        for (const mall of malls) {
          const coords = MALL_COORDS[mall.name];
          if (coords) {
            const dist = getDistance(latitude, longitude, coords.lat, coords.lng);
            if (dist < minDistance) {
              minDistance = dist;
              nearest = mall;
            }
          }
        }

        if (nearest) {
          setClosest({ mall: nearest, distance: minDistance });
        } else {
          setError('근처에 등록된 몰이 없습니다.');
        }
        setLoading(false);
      },
      (err) => {
        setError('위치 정보 제공에 동의해주세요.');
        setLoading(false);
      },
      { timeout: 5000, maximumAge: 60000 }
    );
  };

  if (closest) {
    return (
      <Link href={`/malls/${closest.mall.id}`} className="block mb-10 animate-fade-in active:scale-[0.98] transition-transform">
        <div className="bg-gradient-to-r from-[#2D241E] to-[#4A3728] p-5 rounded-[28px] shadow-lg relative overflow-hidden flex items-center justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          
          <div className="relative z-10 text-white">
             <div className="flex items-center gap-1.5 mb-1.5 opacity-90">
               <Navigation size={12} className="text-[#FF8A5B] animate-pulse" />
               <span className="text-[10px] font-bold text-[#FF8A5B] tracking-wide">내 주변 가장 가까운 곳</span>
             </div>
             <h3 className="text-xl font-bold tracking-tight mb-1">{closest.mall.name}</h3>
             <p className="text-xs text-white/70 font-medium">현재 위치에서 {closest.distance.toFixed(1)}km</p>
          </div>
          <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 relative z-10">
            <ChevronRight size={24} className="text-white" />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="mb-10 animate-fade-in">
      <button 
        onClick={findNearby}
        disabled={loading}
        className="w-full bg-[#FFEFE6] hover:bg-[#FF8A5B]/20 p-5 rounded-[28px] border border-[#FF8A5B]/20 flex items-center justify-between transition-all active:scale-[0.98]"
      >
        <div className="flex items-center gap-3 text-left">
           <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center shrink-0">
             {loading ? (
               <div className="w-5 h-5 border-2 border-[#FF8A5B]/30 border-t-[#FF8A5B] rounded-full animate-spin" />
             ) : (
               <Compass size={24} className="text-[#FF8A5B]" />
             )}
           </div>
           <div>
             <h3 className="text-sm font-bold text-[#2D241E] mb-0.5">내 주변 백화점 찾기</h3>
             <p className="text-[11px] text-[#8D7B6D]">{error || '클릭하여 위치 정보 제공에 동의해주세요'}</p>
           </div>
        </div>
        {!loading && <ChevronRight size={20} className="text-[#C4B5A9]" />}
      </button>
    </div>
  );
}
