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
    <Link href={`/malls/${id}`}>
      <div className="group relative h-48 rounded-3xl overflow-hidden shadow-md transition-transform active:scale-[0.98]">
        <img 
          src={image} 
          alt={name} 
          className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-5 text-white">
          <p className="text-xs font-medium opacity-80">{city} · {district}</p>
          <h3 className="text-xl font-bold">{name}</h3>
        </div>
      </div>
    </Link>
  );
};
