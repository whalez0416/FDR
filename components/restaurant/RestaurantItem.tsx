import React from 'react';
import { Star, Baby, Footprints, MapPin } from 'lucide-react';

interface RestaurantItemProps {
  name: string;
  category: string;
  rating: number;
  stroller: boolean;
  highchair: boolean;
  nursingDist: number;
}

export const RestaurantItem: React.FC<RestaurantItemProps> = ({ 
  name, 
  category, 
  rating, 
  stroller, 
  highchair, 
  nursingDist 
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
          <h3 className="text-xl font-bold text-[#2D241E] leading-tight mb-2">{name}</h3>
          <div className="flex items-center gap-1 text-[#FFB800]">
            <Star size={14} fill="currentColor" />
            <span className="text-sm font-bold">{rating.toFixed(1)}</span>
            <span className="text-[#C4B5A9] text-xs font-normal ml-1">리뷰 42+</span>
          </div>
        </div>
        <div className="w-20 h-20 bg-[#FDF8F4] rounded-2xl overflow-hidden border border-[#F3E9E0] flex-shrink-0 relative">
           <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] text-[#C4B5A9] font-medium uppercase tracking-wider">Image</span>
           </div>
        </div>
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
        <div className="ml-auto flex items-center gap-1.5 text-[#8D7B6D]">
          <MapPin size={12} className="text-[#FF8A5B]" />
          <span className="text-[11px] font-medium">수유실</span>
          <span className="text-sm font-bold text-[#FF8A5B] tracking-tighter">{nursingDist}m</span>
        </div>
      </div>
    </div>
  );
};
