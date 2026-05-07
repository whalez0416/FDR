import React from 'react';
import { Bookmark, Sparkles } from 'lucide-react';

export default function SavedPage() {
  return (
    <main className="min-h-screen bg-[#FDF8F4] pt-16 px-8 flex flex-col items-center text-center">
      <div className="w-20 h-20 bg-[#FFEFE6] rounded-full flex items-center justify-center mb-6">
        <Bookmark size={32} className="text-[#FF8A5B]" />
      </div>
      <h1 className="text-2xl font-bold text-[#2D241E] mb-3">저장한 식당</h1>
      <p className="text-[#8D7B6D] text-sm leading-relaxed mb-8">
        아직 저장한 식당이 없습니다.<br />
        가고 싶은 식당을 발견하면 하트를 눌러보세요!
      </p>
      
      <div className="w-full bg-white p-6 rounded-3xl shadow-sm border border-[#F3E9E0]">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles size={16} className="text-[#FFB800]" />
          <span className="text-sm font-bold text-[#2D241E]">준비 중인 기능입니다</span>
        </div>
        <p className="text-xs text-[#8D7B6D]">
          로그인 및 저장 기능은 다음 업데이트에 추가됩니다.
        </p>
      </div>
    </main>
  );
}
