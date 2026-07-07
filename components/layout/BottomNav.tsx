'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bookmark, BookOpen, User } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/' && pathname !== '/') return false;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return pathname === path;
  };

  return (
    <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-[432px] h-20 bg-[#2D241E] rounded-[32px] shadow-2xl flex items-center justify-around px-8 z-50 pointer-events-auto">
      <Link href="/" className={`flex flex-col items-center transition-all hover:opacity-80 active:scale-90 ${isActive('/') ? 'text-[#FF8A5B]' : 'text-[#8D7B6D]'}`}>
        <div className={`p-2 rounded-xl mb-1 ${isActive('/') ? 'bg-[#FF8A5B]/10' : ''}`}>
          <Home size={20} className={isActive('/') ? 'fill-current' : ''} />
        </div>
        <span className="text-[10px] font-bold">홈</span>
      </Link>
      
      <Link href="/saved" className={`flex flex-col items-center transition-all hover:opacity-80 active:scale-90 ${isActive('/saved') ? 'text-[#FF8A5B]' : 'text-[#8D7B6D]'}`}>
        <div className={`p-2 rounded-xl mb-1 ${isActive('/saved') ? 'bg-[#FF8A5B]/10' : ''}`}>
          <Bookmark size={20} className={isActive('/saved') ? 'fill-current' : ''} />
        </div>
        <span className="text-[10px] font-bold">저장됨</span>
      </Link>

      <Link href="/guide" className={`flex flex-col items-center transition-all hover:opacity-80 active:scale-90 ${isActive('/guide') ? 'text-[#FF8A5B]' : 'text-[#8D7B6D]'}`}>
        <div className={`p-2 rounded-xl mb-1 ${isActive('/guide') ? 'bg-[#FF8A5B]/10' : ''}`}>
          <BookOpen size={20} />
        </div>
        <span className="text-[10px] font-bold">가이드</span>
      </Link>

      <Link href="/mypage" className={`flex flex-col items-center transition-all hover:opacity-80 active:scale-90 ${isActive('/mypage') ? 'text-[#FF8A5B]' : 'text-[#8D7B6D]'}`}>
        <div className={`p-2 rounded-xl mb-1 ${isActive('/mypage') ? 'bg-[#FF8A5B]/10' : ''}`}>
          <User size={20} className={isActive('/mypage') ? 'fill-current' : ''} />
        </div>
        <span className="text-[10px] font-bold">마이</span>
      </Link>
    </nav>
  );
}
