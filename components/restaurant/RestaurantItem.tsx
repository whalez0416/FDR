import React from 'react';

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
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F3E9E0]">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] text-[#FF8A5B] font-bold bg-[#FFF2ED] px-2 py-0.5 rounded-md mb-1 inline-block">
            {category}
          </span>
          <h3 className="text-lg font-bold text-[#4A3728]">{name}</h3>
          <div className="flex items-center mt-1 text-[#FFB800] text-sm">
            <span>★ {rating}</span>
            <span className="text-[#C4B5A9] ml-2 font-normal">(리뷰 42)</span>
          </div>
        </div>
        <div className="w-16 h-16 bg-[#F3E9E0] rounded-xl overflow-hidden">
           <div className="w-full h-full flex items-center justify-center text-[#C4B5A9] text-[10px]">Image</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[#F9F3EE] flex items-center gap-3">
        {/* Convenience Badges */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${stroller ? 'bg-[#E6F4EA] text-[#1E7E34]' : 'bg-[#F8F9FA] text-[#C4B5A9]'}`}>
          <span>👶</span> 유모차 {stroller ? '가능' : '협소'}
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${highchair ? 'bg-[#E6F4EA] text-[#1E7E34]' : 'bg-[#F8F9FA] text-[#C4B5A9]'}`}>
          <span>🪑</span> 아기의자
        </div>
        <div className="ml-auto text-[10px] text-[#8D7B6D] flex items-center">
          <span className="mr-1">🍼 수유실</span>
          <span className="font-bold text-[#FF8A5B]">{nursingDist}m</span>
        </div>
      </div>
    </div>
  );
};
