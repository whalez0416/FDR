'use client';

import React, { useEffect, useState } from 'react';
import { Star, MessageSquare, Heart } from 'lucide-react';
import { ReviewCreateModal } from './ReviewCreateModal';
import { supabase } from '@/lib/supabase/client';

type Review = {
  id: string;
  rating: number;
  content: string;
  kid_friendly_score: number;
  created_at: string;
};

export const ReviewSection: React.FC<{ restaurantId: string; initialScore?: number; restaurantName?: string }> = ({
  restaurantId,
  restaurantName = '이 식당',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function fetchReviews() {
      const { data } = await supabase
        .from('reviews')
        .select('id, rating, content, kid_friendly_score, created_at')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });
      if (active) {
        setReviews(data || []);
        setLoading(false);
      }
    }
    fetchReviews();
    return () => {
      active = false;
    };
  }, [restaurantId]);

  const count = reviews.length;
  const avgScore =
    count > 0 ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / count : 0;

  return (
    <div className="space-y-10 pointer-events-auto">
      {/* Score Header */}
      <div className="flex flex-col items-center text-center">
        <div className="flex items-center gap-1.5 mb-2">
          <Heart size={16} className="text-[#FF8A5B] fill-[#FF8A5B]" />
          <span className="text-xs font-bold text-[#FF8A5B] tracking-widest uppercase">Parents Rating</span>
        </div>
        {count > 0 ? (
          <>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-[#2D241E] tracking-tighter">{avgScore.toFixed(1)}</span>
              <span className="text-xl font-bold text-[#C4B5A9]">/5.0</span>
            </div>
            <div className="flex gap-1 mt-3 text-[#FFB800]">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={20} fill={s <= Math.round(avgScore) ? 'currentColor' : 'none'} />
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-[#8D7B6D] mt-1">아직 부모님 평가가 없어요</p>
        )}
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
        onSubmit={() => {
          setIsModalOpen(false);
          // Persisting reviews needs auth (RLS). Until Kakao login ships, be
          // honest rather than faking a successful save.
          alert('소중한 의견 감사합니다! 리뷰 저장 기능은 로그인 출시와 함께 제공될 예정이에요. 🙌');
        }}
      />

      {/* Reviews List */}
      <div className="mt-12 space-y-6">
        <h5 className="text-sm font-bold text-[#2D241E] flex items-center gap-2">
          최근 작성된 리뷰 <span className="text-[#FF8A5B]">{count}</span>
        </h5>

        {loading ? (
          <div className="card-premium p-6 animate-pulse h-24" />
        ) : count === 0 ? (
          <div className="card-premium p-8 text-center">
            <p className="text-sm text-[#8D7B6D] leading-relaxed">
              아직 등록된 리뷰가 없어요.<br />
              {restaurantName}에 다녀오셨다면 첫 리뷰를 남겨주세요!
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="card-premium p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#FFD8C2] rounded-full flex items-center justify-center text-[#FF8A5B] font-bold text-xs">
                    부모
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[#2D241E]">방문 부모님</span>
                    <p className="text-[10px] text-[#C4B5A9]">
                      {new Date(review.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 text-[#FFB800]">
                  <Star size={12} fill="currentColor" />
                  <span className="text-xs font-bold">{(review.rating ?? 0).toFixed(1)}</span>
                </div>
              </div>
              {review.content && (
                <p className="text-sm text-[#4A3728] leading-relaxed">{review.content}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
