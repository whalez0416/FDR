import React, { useState } from 'react';

interface FactCheckOption {
  id: string;
  label: string;
  icon: string;
}

const FACT_CHECK_OPTIONS: FactCheckOption[] = [
  { id: 'stroller', label: '유모차 통로', icon: '👶' },
  { id: 'highchair', label: '아기의자', icon: '🪑' },
  { id: 'kindness', label: '아이 배려', icon: '❤️' },
  { id: 'space', label: '여유 공간', icon: '↔️' },
];

export const ReviewSection: React.FC<{ restaurantId: string; initialScore: number }> = ({ restaurantId, initialScore }) => {
  const [isWriting, setIsWriting] = useState(false);
  const [rating, setRating] = useState(5);
  const [factChecks, setFactChecks] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [avgScore, setAvgScore] = useState(initialScore);

  const toggleFactCheck = (id: string) => {
    setFactChecks(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleSubmit = async () => {
    // 1. In a real app, upload photos to Supabase Storage first
    // 2. Insert review into 'reviews' table
    // 3. Trigger score recalculation (or do it via DB Function)
    
    console.log("Submitting review:", { restaurantId, rating, factChecks, content, photoCount: photos.length });
    
    // Simulate real-time score update (e.g., simplistic average for demo)
    const newScore = (avgScore + rating) / 2;
    setAvgScore(newScore);
    
    alert("리뷰가 소중하게 등록되었습니다!");
    setIsWriting(false);
    resetForm();
  };

  const resetForm = () => {
    setRating(5);
    setFactChecks([]);
    setContent('');
    setPhotos([]);
  };

  return (
    <div className="mt-8 px-4 pb-12">
      {/* Header with Average Score */}
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-2xl shadow-sm border border-[#F3E9E0]">
        <div>
          <h2 className="text-lg font-bold text-[#4A3728]">부모님들의 리뷰</h2>
          <p className="text-xs text-[#8D7B6D]">실제 방문객의 정보를 확인하세요</p>
        </div>
        <div className="text-center">
          <span className="text-3xl font-black text-[#FF8A5B]">{avgScore.toFixed(1)}</span>
          <div className="text-[#FFB800] text-[10px]">★★★★★</div>
        </div>
      </div>

      {!isWriting ? (
        <button 
          onClick={() => setIsWriting(true)}
          className="w-full h-16 bg-[#FF8A5B] text-white rounded-2xl font-bold shadow-lg shadow-[#FF8A5B]/20 flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <span>✏️</span> 리뷰 작성하고 정보 공유하기
        </button>
      ) : (
        <div className="bg-[#FFEFE6] p-5 rounded-3xl border border-[#FFD8C2] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-[#4A3728]">식당은 어떠셨나요?</h3>
            <button onClick={() => setIsWriting(false)} className="text-[#C4B5A9]">✕</button>
          </div>

          {/* Fact Check Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {FACT_CHECK_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => toggleFactCheck(opt.id)}
                className={`h-14 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${
                  factChecks.includes(opt.id) 
                  ? 'bg-white border-2 border-[#FF8A5B] text-[#FF8A5B] shadow-sm' 
                  : 'bg-white/50 border border-[#F3E9E0] text-[#8D7B6D]'
                }`}
              >
                <span>{opt.icon}</span> {opt.label}
              </button>
            ))}
          </div>

          {/* Content Input */}
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="부모님들에게 도움이 될 만한 팁을 적어주세요 (예: 유아 식기가 있어요, 의자가 깨끗해요)"
            className="w-full h-32 bg-white rounded-xl p-3 text-sm border border-[#F3E9E0] focus:ring-2 focus:ring-[#FF8A5B] focus:outline-none mb-4"
          />

          {/* Photo Upload */}
          <div className="mb-4">
            <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-[#FFD8C2] rounded-xl bg-white/50 cursor-pointer hover:bg-white transition-colors">
              <input type="file" multiple className="hidden" onChange={handlePhotoUpload} />
              <div className="text-center">
                <span className="text-2xl mb-1 block">📸</span>
                <span className="text-xs text-[#8D7B6D]">내부/아기의자 사진 (최대 5장)</span>
              </div>
            </label>
            {photos.length > 0 && (
              <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                {photos.map((p, i) => (
                  <div key={i} className="w-12 h-12 bg-[#F3E9E0] rounded-lg flex-shrink-0" />
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button 
            onClick={handleSubmit}
            className="w-full h-14 bg-[#4A3728] text-white rounded-xl font-bold active:scale-95 transition-transform"
          >
            리뷰 등록하기
          </button>
        </div>
      )}

      {/* Existing Reviews List (Mock) */}
      <div className="mt-8 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F3E9E0]">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 bg-[#FFD8C2] rounded-full mr-2" />
            <span className="text-sm font-bold text-[#4A3728]">지안맘</span>
          </div>
          <p className="text-sm text-[#8D7B6D]">유모차 통로가 넓어서 너무 편했어요! 아기의자도 넉넉합니다.</p>
          <div className="flex gap-2 mt-3">
             <div className="px-2 py-1 bg-[#F9F3EE] rounded-md text-[10px] text-[#FF8A5B]">#유모차통로</div>
             <div className="px-2 py-1 bg-[#F9F3EE] rounded-md text-[10px] text-[#FF8A5B]">#아기의자</div>
          </div>
        </div>
      </div>
    </div>
  );
};
