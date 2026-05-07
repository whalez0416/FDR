'use client';

import React, { useState } from 'react';
import { Star, Camera, CheckCircle2, MessageSquare, Heart, AlertCircle, X, Send } from 'lucide-react';

interface FactCheckOption {
  id: string;
  label: string;
  icon: string;
}

const FACT_CHECK_OPTIONS: FactCheckOption[] = [
  { id: 'stroller', label: '유모차 진입 수월', icon: '👶' },
  { id: 'chair', label: '아기의자 넉넉함', icon: '🪑' },
  { id: 'space', label: '좌석 간격 넓음', icon: '↔️' },
  { id: 'nursing', label: '수유실 가까움', icon: '🍼' },
];

export const ReviewSection: React.FC<{ restaurantId: string; initialScore: number }> = ({ 
  restaurantId, 
  initialScore 
}) => {
  const [isWriting, setIsWriting] = useState(false);
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [selectedFacts, setSelectedFacts] = useState<string[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [avgScore, setAvgScore] = useState(initialScore);

  const toggleFact = (id: string) => {
    setSelectedFacts(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleSubmit = () => {
    if (rating === 0) {
      alert("별점을 선택해주세요!");
      return;
    }
    // Update local score for demo
    const newScore = (avgScore + rating) / 2;
    setAvgScore(newScore);
    alert("소중한 리뷰가 등록되었습니다!");
    setIsWriting(false);
    // Reset form
    setRating(0);
    setContent('');
    setSelectedFacts([]);
    setPhotos([]);
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

      {!isWriting ? (
        <button 
          onClick={() => setIsWriting(true)}
          className="w-full btn-primary h-16 shadow-xl shadow-[#FF8A5B]/10"
        >
          <MessageSquare size={20} />
          리뷰 작성하고 꿀팁 공유하기
        </button>
      ) : (
        <div className="card-premium p-8 shadow-2xl shadow-[#FF8A5B]/10 animate-fade-up relative">
          <button 
            onClick={() => setIsWriting(false)}
            className="absolute top-6 right-6 p-2 text-[#C4B5A9] hover:text-[#2D241E]"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3 mb-8">
             <div className="w-12 h-12 bg-[#FFF2ED] rounded-2xl flex items-center justify-center text-[#FF8A5B]">
               <Sparkles size={24} />
             </div>
             <div>
               <h4 className="text-lg font-bold text-[#2D241E]">직접 다녀오셨나요?</h4>
               <p className="text-xs text-[#8D7B6D]">다른 부모님들께 큰 도움이 됩니다.</p>
             </div>
          </div>

          {/* Rating Selector */}
          <div className="mb-8">
            <p className="text-sm font-bold text-[#4A3728] mb-4">맛과 서비스는 어땠나요?</p>
            <div className="flex justify-between items-center bg-[#FDF8F4] p-4 rounded-2xl border border-[#F3E9E0]">
              {[1, 2, 3, 4, 5].map((s) => (
                <button 
                  key={s} 
                  onClick={() => setRating(s)}
                  className={`transition-all duration-300 transform active:scale-90 ${s <= rating ? 'scale-110' : 'scale-100'}`}
                >
                  <Star 
                    size={32} 
                    className={s <= rating ? 'text-[#FFB800] fill-[#FFB800]' : 'text-[#E5DACE]'} 
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Fact Check Buttons */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={16} className="text-[#1E7E34]" />
              <p className="text-sm font-bold text-[#4A3728]">육아 편의성 팩트체크</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {FACT_CHECK_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => toggleFact(option.id)}
                  className={`flex items-center gap-2.5 p-3.5 rounded-2xl border text-sm font-medium transition-all duration-300 active:scale-95 ${
                    selectedFacts.includes(option.id)
                      ? 'bg-[#E6F4EA] border-[#1E7E34] text-[#1E7E34] shadow-sm'
                      : 'bg-white border-[#F3E9E0] text-[#8D7B6D] hover:border-[#FF8A5B]/30'
                  }`}
                >
                  <span>{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content & Photo */}
          <div className="space-y-4">
            <div className="relative">
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="음식의 맛, 아이와 함께 앉기 좋았던 점 등을 들려주세요."
                className="w-full h-32 p-5 bg-[#FDF8F4] rounded-2xl border border-[#F3E9E0] outline-none text-sm placeholder-[#C4B5A9] focus:border-[#FF8A5B] transition-all resize-none"
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              <label className="w-20 h-20 bg-white border-2 border-dashed border-[#F3E9E0] rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#FF8A5B] transition-all group">
                <Camera size={20} className="text-[#C4B5A9] group-hover:text-[#FF8A5B] mb-1" />
                <span className="text-[10px] font-bold text-[#C4B5A9] group-hover:text-[#FF8A5B]">사진 추가</span>
                <input type="file" multiple className="hidden" onChange={handlePhotoUpload} />
              </label>
              {photos.map((_, i) => (
                <div key={i} className="w-20 h-20 bg-[#FDF8F4] rounded-2xl border border-[#F3E9E0] animate-fade-up flex items-center justify-center">
                   <Star size={12} className="text-[#F3E9E0]" />
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={handleSubmit}
            className="w-full mt-8 btn-primary active:scale-[0.98] transition-transform duration-200"
          >
            <Send size={18} />
            리뷰 등록하기
          </button>
          
          <div className="mt-6 flex items-center justify-center gap-1.5 text-[#C4B5A9]">
             <AlertCircle size={12} />
             <span className="text-[10px] font-medium">허위 리뷰 작성 시 이용이 제한될 수 있습니다.</span>
          </div>
        </div>
      )}

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
