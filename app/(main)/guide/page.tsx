import React from 'react';
import Link from 'next/link';
import { BookOpen, Clock } from 'lucide-react';
import { ARTICLES } from '@/lib/guide/articles';

export const metadata = {
  title: '육아 외식 가이드 | 맘편한 외식',
  description:
    '아기와의 외식이 처음인 부모를 위한 실전 가이드. 수유실 이용법, 아기의자 있는 식당 고르는 법, 유모차 외출 팁을 정리했습니다.',
};

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-[#FDF8F4] pb-32">
      <header className="px-8 pt-16 pb-8 bg-gradient-to-b from-[#FFEFE6] to-[#FDF8F4]">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={18} className="text-[#FF8A5B]" />
          <span className="text-xs font-bold text-[#FF8A5B] tracking-widest uppercase">Guide</span>
        </div>
        <h1 className="text-3xl font-bold text-[#2D241E] leading-tight">육아 외식 가이드</h1>
        <p className="mt-3 text-[#8D7B6D] text-sm leading-relaxed">
          아기와의 외식, 준비부터 타이밍까지<br />직접 겪으며 정리한 실전 노하우
        </p>
      </header>

      <div className="px-6 space-y-4">
        {ARTICLES.map((a) => (
          <Link
            key={a.slug}
            href={`/guide/${a.slug}`}
            className="block bg-white rounded-2xl p-5 shadow-sm active:scale-[0.98] transition-transform"
          >
            <h2 className="text-base font-bold text-[#2D241E] leading-snug mb-2">{a.title}</h2>
            <p className="text-[13px] text-[#8D7B6D] leading-relaxed mb-3">{a.description}</p>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#C4B5A9]">
              <Clock size={12} /> {a.readMinutes}분 읽기
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
