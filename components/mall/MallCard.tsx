import React from 'react';
import Link from 'next/link';
import { nursingFloorFromText, floorToText, nursingText } from '@/lib/utils/floor';

interface MallCardProps {
  id: string;
  name: string;
  city: string;
  /** Dedicated nursing-room location (new column). Preferred source. */
  nursingRoom?: string;
  /** Legacy district text — only used as a fallback when it clearly describes a
   *  nursing room (some rows historically stored a location like "성남시 분당구"
   *  here, which must NOT be shown as nursing info). */
  district?: string;
  image: string;
}

export const MallCard: React.FC<MallCardProps> = ({ id, name, city, nursingRoom, district, image }) => {
  const nursingSource = nursingText(nursingRoom, district);

  const nursingFloor = nursingFloorFromText(nursingSource);
  const nursingInfo = nursingFloor !== null
    ? `수유실 ${floorToText(nursingFloor)}`
    : (nursingSource.trim() || '유아휴게실 정보 준비중');

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
