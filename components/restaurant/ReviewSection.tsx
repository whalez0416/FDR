'use client';

import React, { useState } from 'react';
import { Star, MessageSquare, Heart } from 'lucide-react';
import { ReviewCreateModal } from './ReviewCreateModal';

export const ReviewSection: React.FC<{ restaurantId: string; initialScore: number; restaurantName?: string }> = ({ 
  restaurantId, 
  initialScore,
  restaurantName = "이 식당"
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [avgScore, setAvgScore] = useState(initialScore);

  const handleReviewSubmit = (review: any) => {
    // Mock submit success
    const newScore = (avgScore + review.rating) / 2;
    setAvgScore(newScore);
    alert("소중한 리뷰가 등록되었습니다! ✨");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-10 pointer-events-auto">
      {/* Score Header */}
      <div className="flex flex-col items-center text-center">
        <div className="flex items-center gap-1.5 mb-2">
          <Heart size={16} className="text-[#FF8A5B] fill-[#FF8A5B]" />
          <span className="text-xs font-bold text-[#FF8A5B] tracking-widest uppercase">Parents Rating</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-black text-[#2D241E] tracking-tighter">{avgScore.toFixed(1)}</span>
          <span className="text-xl font-bold text-[#C4B5A9]">/5.0</span>
        </div>
        <div className="flex gap-1 mt-3 text-[#FFB800]">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} size={20} fill={s <= Math.round(avgScore) ? "currentColor" : "none"} />
          ))}
        </div>
      </div>

      <button 
        onClick={() => setIsModalOpen(true)}
        className="w-full btn-primary h-16 shadow-xl shadow-[#FF8A5B]/10"
      >
        <MessageSquare size={20} />
        리뷰 작성하고 꿀팁 공유하기
      </button>

      <ReviewCreateModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        restaurantName={restaurantName}
        onSubmit={handleReviewSubmit}
      />

      {/* Existing Reviews List (Mock) */}
      <div className="mt-12 space-y-6">
        <h5 className="text-sm font-bold text-[#2D241E] flex items-center gap-2">
          최근 작성된 리뷰 <span className="text-[#FF8A5B]">12</span>
        </h5>
        <div className="card-premium p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FFD8C2] rounded-full flex items-center justify-center text-[#FF8A5B] font-bold text-xs">
                JM
              </div>
              <div>
                <span className="text-sm font-bold text-[#2D241E]">지안맘</span>
                <p className="text-[10px] text-[#C4B5A9]">2024.05.06</p>
              </div>
            </div>
            <div className="flex items-center gap-0.5 text-[#FFB800]">
               <Star size={12} fill="currentColor" />
               <span className="text-xs font-bold">5.0</span>
            </div>
          </div>
          <p className="text-sm text-[#4A3728] leading-relaxed">
            텍사스 로드하우스는 항상 믿고 가요! 유모차 통로가 넓어서 너무 편했고, 서버분들도 아이를 너무 예뻐해주셔서 기분 좋은 식사였습니다.
          </p>
          <div className="flex gap-2 mt-4">
             <div className="px-2.5 py-1 bg-[#E6F4EA] rounded-lg text-[10px] text-[#1E7E34] font-bold">#유모차통로</div>
             <div className="px-2.5 py-1 bg-[#FFF9F0] rounded-lg text-[10px] text-[#B45309] font-bold">#아기의자</div>
          </div>
        </div>
      </div>
    </div>
  );
};
