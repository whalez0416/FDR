'use client';

import React, { useState } from 'react';
import { Star, Camera, X, Send, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';

interface ReviewCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantName: string;
  onSubmit: (review: any) => void;
}

const FACT_CHECK_OPTIONS = [
  { id: 'space', label: '좌석 간격 넓음', icon: '↔️' },
  { id: 'nursing', label: '수유실 가까움', icon: '🍼' },
];

export function ReviewCreateModal({ isOpen, onClose, restaurantName, onSubmit }: ReviewCreateModalProps) {
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [selectedFacts, setSelectedFacts] = useState<string[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  if (!isOpen) return null;

  const toggleFact = (id: string) => {
    setSelectedFacts(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPreviews = Array.from(files).map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const handleSubmit = () => {
    if (rating === 0) {
      alert('별점을 선택해주세요!');
      return;
    }
    onSubmit({
      rating,
      content,
      facts: selectedFacts,
      photos: previews
    });
    // Reset and close
    setRating(0);
    setContent('');
    setSelectedFacts([]);
    setPreviews([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-t-[40px] shadow-2xl animate-slide-up p-8 pb-12 overflow-y-auto max-h-[90vh] no-scrollbar">
        <div className="w-12 h-1.5 bg-[#F3E9E0] rounded-full mx-auto mb-8" />
        
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-[#FF8A5B]" />
              <span className="text-xs font-bold text-[#FF8A5B]">솔직한 리뷰 남기기</span>
            </div>
            <h3 className="text-2xl font-bold text-[#2D241E]">{restaurantName}</h3>
          </div>
          <button onClick={onClose} className="p-2 bg-[#FDF8F4] rounded-full text-[#C4B5A9]">
            <X size={20} />
          </button>
        </div>

        {/* Rating Section */}
        <div className="mb-10 text-center">
          <p className="text-sm font-bold text-[#4A3728] mb-4">식사는 어떠셨나요?</p>
          <div className="flex justify-center gap-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <button 
                key={s} 
                onClick={() => setRating(s)}
                className={`transition-all duration-300 transform active:scale-75 ${s <= rating ? 'scale-110' : 'scale-100'}`}
              >
                <Star 
                  size={40} 
                  className={s <= rating ? 'text-[#FFB800] fill-[#FFB800]' : 'text-[#E5DACE]'} 
                />
              </button>
            ))}
          </div>
        </div>

        {/* Fact Check */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={18} className="text-[#1E7E34]" />
            <p className="text-sm font-bold text-[#4A3728]">육아 편의성 팩트체크 (중복 가능)</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {FACT_CHECK_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => toggleFact(option.id)}
                className={`flex items-center gap-2.5 p-4 rounded-2xl border text-[13px] font-bold transition-all ${
                  selectedFacts.includes(option.id)
                    ? 'bg-[#E6F4EA] border-[#1E7E34] text-[#1E7E34] shadow-sm'
                    : 'bg-[#FDF8F4] border-[#F3E9E0] text-[#8D7B6D]'
                }`}
              >
                <span>{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="mb-10">
          <p className="text-sm font-bold text-[#4A3728] mb-4">상세 후기</p>
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="아이와 함께 방문했을 때 좋았던 점이나 아쉬웠던 점을 다른 부모님들께 공유해주세요."
            className="w-full h-36 p-5 bg-[#FDF8F4] rounded-3xl border border-[#F3E9E0] outline-none text-sm placeholder-[#C4B5A9] focus:border-[#FF8A5B] transition-all resize-none"
          />
        </div>

        {/* Photo Upload */}
        <div className="mb-10">
          <p className="text-sm font-bold text-[#4A3728] mb-4">사진 등록</p>
          <div className="flex flex-wrap gap-3">
            <label className="w-24 h-24 bg-white border-2 border-dashed border-[#F3E9E0] rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-[#FF8A5B] transition-all group">
              <Camera size={24} className="text-[#C4B5A9] group-hover:text-[#FF8A5B] mb-1" />
              <span className="text-[10px] font-bold text-[#C4B5A9] group-hover:text-[#FF8A5B]">사진 추가</span>
              <input type="file" multiple className="hidden" onChange={handleFileChange} />
            </label>
            {previews.map((src, i) => (
              <div key={i} className="w-24 h-24 rounded-3xl overflow-hidden relative group border border-[#F3E9E0] animate-fade-up">
                <img src={src} alt="preview" className="w-full h-full object-cover" />
                <button 
                  onClick={() => setPreviews(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button 
          onClick={handleSubmit}
          className="w-full btn-primary h-16 rounded-[24px] shadow-xl shadow-[#FF8A5B]/20 text-base"
        >
          <Send size={20} />
          리뷰 등록 완료
        </button>
        
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[#C4B5A9]">
          <AlertCircle size={14} />
          <span className="text-[10px] font-medium">부적절한 리뷰는 예고 없이 삭제될 수 있습니다.</span>
        </div>
      </div>
    </div>
  );
}
