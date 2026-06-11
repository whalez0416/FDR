import React from 'react';
import { Baby, Footprints, MapPin } from 'lucide-react';

interface RestaurantItemProps {
  name: string;
  category: string;
  rating?: number;
  stroller: boolean;
  highchair: boolean;
  /** Absolute nursing-room floor, e.g. "6층". Empty when unknown. */
  nursingFloor?: string;
  /** Relative distance, e.g. "같은 층", "2개 층 위". Empty when unknown. */
  nursingRelative?: string;
}

export const RestaurantItem: React.FC<RestaurantItemProps> = ({
  name,
  category,
  stroller,
  highchair,
  nursingFloor,
  nursingRelative,
}) => {
  return (
    <div className="card-premium p-5 animate-fade-up active:scale-[0.98] transition-transform duration-200 cursor-pointer">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {category.split(',').map(cat => (
              <span key={cat} className="text-[11px] text-[#FF8A5B] font-bold bg-[#FF8A5B]/10 px-2 py-0.5 rounded-md">
                #{cat.trim()}
              </span>
            ))}
            {highchair && (
              <span className="text-[11px] text-[#FFB800] font-bold bg-[#FFB800]/10 px-2 py-0.5 rounded-md">
                #예스키즈존
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-[#2D241E] leading-tight">{name}</h3>
        </div>
        {/* Image removed for premium text-only design */}
      </div>

      <div className="mt-5 pt-4 border-t border-[#F9F3EE] flex flex-wrap items-center gap-2">
        <div className={`badge-convenience ${stroller ? 'bg-[#E6F4EA] text-[#1E7E34]' : 'bg-[#F8F9FA] text-[#C4B5A9]'}`}>
          <Footprints size={14} />
          유모차 {stroller ? '가능' : '협소'}
        </div>
        <div className={`badge-convenience ${highchair ? 'bg-[#FFF9F0] text-[#B45309]' : 'bg-[#F8F9FA] text-[#C4B5A9]'}`}>
          <Baby size={14} />
          아기의자
        </div>
        {nursingFloor && (
          <div className="ml-auto flex items-center gap-1.5 text-[#8D7B6D]">
            <MapPin size={12} className="text-[#FF8A5B]" />
            <span className="text-[11px] font-medium">수유실</span>
            <span className="text-sm font-bold text-[#FF8A5B] tracking-tighter">{nursingFloor}</span>
            {nursingRelative && (
              <span className="text-[11px] font-medium text-[#C4B5A9]">· {nursingRelative}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
