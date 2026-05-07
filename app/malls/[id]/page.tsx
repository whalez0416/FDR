import React from 'react';
import Link from 'next/link';
import { RestaurantItem } from '../../../components/restaurant/RestaurantItem';
import { ReviewSection } from '../../../components/restaurant/ReviewSection';

// Mock Data for Restaurants
const RESTAURANTS = [
  { id: '101', name: '이탈리(Eataly)', category: '양식', floor: '6F', stroller: true, highchair: true, nursing_dist: 50, rating: 4.8 },
  { id: '102', name: '정육면체', category: '중식', floor: 'B1', stroller: false, highchair: true, nursing_dist: 120, rating: 4.5 },
  { id: '103', name: '호우섬', category: '중식', floor: '6F', stroller: true, highchair: true, nursing_dist: 40, rating: 4.7 },
  { id: '104', name: '강고집', category: '한식', floor: 'B1', stroller: true, highchair: true, nursing_dist: 150, rating: 4.2 },
  { id: '105', name: '카페 레이어드', category: '카페', floor: 'B1', stroller: false, highchair: false, nursing_dist: 200, rating: 4.6 },
];

export default function MallDetail({ params }: { params: { id: string } }) {
  // In a real app, this would be fetched from Supabase using params.id
  // const { data: mall } = await supabase.from('malls').select('*, restaurants(*)').eq('id', params.id).single();
  
  const mallName = "현대백화점 판교점";
  
  // Grouping by floor
  const groupedByFloor = RESTAURANTS.reduce((acc, rest) => {
    if (!acc[rest.floor]) acc[rest.floor] = [];
    acc[rest.floor].push(rest);
    return acc;
  }, {} as Record<string, typeof RESTAURANTS>);

  const floors = Object.keys(groupedByFloor).sort().reverse();

  return (
    <main className="min-h-screen bg-[#FFF9F5] pb-20">
      {/* Top Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-[#F3E9E0] px-4 h-14 flex items-center justify-between">
        <Link href="/" className="p-2">
          <span className="text-[#4A3728] font-bold">←</span>
        </Link>
        <h1 className="font-bold text-[#4A3728]">{mallName}</h1>
        <div className="w-10" />
      </div>

      {/* Info Banner */}
      <div className="bg-[#FFEFE6] p-4 mx-4 mt-4 rounded-2xl border border-[#FFD8C2]">
        <p className="text-xs text-[#FF8A5B] font-bold mb-1">💡 육아 팁</p>
        <p className="text-sm text-[#8D7B6D]">
          9층 식당가는 유모차 진입이 수월하고 수유실이 가깝습니다. 특히 'h'_Kitchen'은 아기의자가 넉넉하기로 유명해요!
        </p>
      </div>

      {/* Restaurant Directory */}
      <div className="mt-6 px-4 space-y-8">
        {floors.map((floor) => (
          <section key={floor}>
            <div className="flex items-center mb-4">
              <div className="bg-[#4A3728] text-white px-3 py-1 rounded-full text-xs font-bold mr-3">
                {floor}
              </div>
              <div className="h-[1px] flex-1 bg-[#F3E9E0]" />
            </div>

            <div className="space-y-4">
              {groupedByFloor[floor].map((rest) => (
                <RestaurantItem 
                  key={rest.id}
                  name={rest.name}
                  category={rest.category}
                  rating={rest.rating}
                  stroller={rest.stroller}
                  highchair={rest.highchair}
                  nursingDist={rest.nursing_dist}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Community Reviews Section */}
      <ReviewSection restaurantId={params.id} initialScore={4.7} />
    </main>
  );
}
