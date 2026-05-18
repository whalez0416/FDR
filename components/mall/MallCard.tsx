import React from 'react';
import Link from 'next/link';

interface MallCardProps {
  id: string;
  name: string;
  city: string;
  district: string;
  image: string;
}

export const MallCard: React.FC<MallCardProps> = ({ id, name, city, district, image }) => {
  const nursingRoomMap: Record<string, string> = {
    "현대백화점 판교점": "5층 유아휴게실",
    "더현대 서울": "5층 유아휴게실",
    "현대백화점 더현대서울점": "5층 유아휴게실",
    "현대백화점 무역센터점": "4층 유아휴게실",
    "현대백화점 압구정본점": "5층 유아휴게실",
    "현대백화점 목동점": "5층 유아휴게실",
    "현대백화점 신촌점": "6층 유아휴게실",
    "현대백화점 미아점": "6층 유아휴게실",
    "현대백화점 천호점": "8층 유아휴게실",
    "현대백화점 중동점": "6층 유아휴게실",
    "현대백화점 킨텍스점": "6층 유아휴게실",
    "현대백화점 부산점": "6층 유아휴게실",
    "현대백화점 울산점": "7층 유아휴게실",
    "더현대 대구": "6층 유아휴게실",
    "현대백화점 충청점": "6층 유아휴게실",
    "커넥트현대 부산": "6층 유아휴게실",
    "현대프리미엄아울렛 김포점": "3층 유아휴게실",
    "현대프리미엄아울렛 송도점": "2층 유아휴게실",
    "현대프리미엄아울렛 대전점": "3층 유아휴게실",
    "현대프리미엄아울렛 SPACE 1": "3층 유아휴게실",
  };

  // 가공된 이름으로 매칭 시도 (불필요한 공백 제거 등)
  const cleanName = name.trim();
  const nursingInfo = district ||
    nursingRoomMap[cleanName] ||
    Object.entries(nursingRoomMap).find(([key]) => cleanName.includes(key))?.[1] ||
    "유아휴게실 완비";

  return (
    <Link
      href={`/malls/${id}`}
      className="group relative block overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 active:scale-[0.99] transform"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-orange-50 opacity-50" />

      <div className="relative p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center gap-4">
          <div className="px-3 py-1 bg-white/80 backdrop-blur-sm border border-gray-100 rounded-full shadow-sm shrink-0">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{city}</span>
          </div>

          <span className="text-[11px] font-bold bg-orange-50 text-orange-600 px-2.5 py-1 rounded-lg border border-orange-100 flex items-center gap-1 max-w-[200px] truncate shrink-0">
            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse shrink-0" />
            {nursingInfo}
          </span>
        </div>

        <div className="text-gray-900">
          <h3 className="text-xl font-extrabold tracking-tight text-[#2D241E] group-hover:text-purple-600 transition-colors duration-300">
            {name}
          </h3>
        </div>
      </div>
    </Link>
  );
};
