import React from 'react';
import { User, Settings, ShieldAlert } from 'lucide-react';

export default function MyPage() {
  return (
    <main className="min-h-screen bg-[#FDF8F4] pt-16 px-8 flex flex-col items-center">
      <div className="w-24 h-24 bg-[#FFEFE6] rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm">
        <User size={40} className="text-[#FF8A5B]" />
      </div>
      <h1 className="text-xl font-bold text-[#2D241E] mb-1">로그인 해주세요</h1>
      <p className="text-[#8D7B6D] text-xs mb-8">
        리뷰를 작성하고 식당을 저장하려면 로그인이 필요합니다.
      </p>

      <button className="w-full bg-[#FEE500] text-[#000000] font-bold py-4 rounded-2xl mb-8 active:scale-[0.98] transition-transform">
        카카오로 시작하기
      </button>
      
      <div className="w-full space-y-3">
        <button className="w-full bg-white p-4 rounded-2xl flex items-center justify-between text-sm font-bold text-[#2D241E] shadow-sm">
          <div className="flex items-center gap-3">
            <Settings size={18} className="text-[#C4B5A9]" />
            앱 설정
          </div>
        </button>
        <button className="w-full bg-white p-4 rounded-2xl flex items-center justify-between text-sm font-bold text-[#2D241E] shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldAlert size={18} className="text-[#C4B5A9]" />
            고객센터
          </div>
        </button>
      </div>
    </main>
  );
}
