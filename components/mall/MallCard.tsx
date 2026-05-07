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
  return (
    <Link href={`/malls/${id}`} className="block active:scale-[0.96] transition-transform duration-200">
      <div className="group relative h-64 rounded-[32px] overflow-hidden shadow-sm transition-all duration-500 hover:shadow-xl">
        <img 
          src={image} 
          alt={name} 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30">
          <span className="text-[10px] text-white font-bold">{city}</span>
        </div>

        <div className="absolute bottom-6 left-6 text-white">
          <div className="flex gap-2 mb-2">
            <span className="text-[10px] font-bold bg-black/40 backdrop-blur-md px-2 py-1 rounded-md border border-white/20">#유아휴게실</span>
            <span className="text-[10px] font-bold bg-black/40 backdrop-blur-md px-2 py-1 rounded-md border border-white/20">#프리미엄식당가</span>
          </div>
          <h3 className="text-2xl font-bold tracking-tight">{name}</h3>
          <div className="mt-3 flex items-center gap-1">
             <div className="h-1 w-8 bg-[#FF8A5B] rounded-full" />
             <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-1">상세 보기</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
