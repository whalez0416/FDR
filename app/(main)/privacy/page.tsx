import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const metadata = { title: '개인정보처리방침 | 맘편한 외식' };

const SECTIONS: Array<{ title: string; body: React.ReactNode }> = [
  {
    title: '1. 수집하는 개인정보',
    body: (
      <>
        맘편한 외식(이하 &ldquo;서비스&rdquo;)은 회원가입·로그인 기능이 없으며, 이름·이메일·전화번호
        등 개인을 식별할 수 있는 정보를 수집하거나 서버에 저장하지 않습니다. &ldquo;찜&rdquo;(저장한
        몰) 목록은 이용자의 브라우저(localStorage)에만 보관되며 운영자에게 전송되지 않습니다.
      </>
    ),
  },
  {
    title: '2. 자동으로 수집되는 정보',
    body: (
      <>
        서비스는 Vercel 플랫폼에서 운영되며, 서비스 안정 운영을 위한 접속 기록(IP 주소, 접속 일시,
        브라우저 정보)이 플랫폼 차원에서 일시적으로 기록될 수 있습니다. 이 정보는 개인 식별 목적으로
        사용되지 않습니다.
      </>
    ),
  },
  {
    title: '3. 광고 및 쿠키',
    body: (
      <>
        서비스는 Google AdSense 광고를 게재할 수 있습니다. Google을 포함한 제3자 광고 사업자는
        쿠키를 사용하여 이용자의 이전 방문 기록을 바탕으로 맞춤 광고를 제공할 수 있습니다. 이용자는{' '}
        <a
          href="https://adssettings.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-[#FF8A5B]"
        >
          Google 광고 설정
        </a>
        에서 맞춤 광고를 해제할 수 있습니다.
      </>
    ),
  },
  {
    title: '4. 제3자 제공 및 위탁',
    body: <>서비스는 수집한 정보를 제3자에게 판매·제공하지 않습니다.</>,
  },
  {
    title: '5. 이용자의 권리',
    body: (
      <>
        찜 목록 등 브라우저에 저장된 데이터는 브라우저의 사이트 데이터 삭제 기능으로 언제든지 직접
        삭제할 수 있습니다.
      </>
    ),
  },
  {
    title: '6. 문의처',
    body: (
      <>
        개인정보 관련 문의: <span className="font-bold">chjandhot@gmail.com</span>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#FDF8F4] pt-6 pb-24 px-6">
      <Link href="/mypage" className="inline-flex items-center gap-1 text-sm text-[#8D7B6D] mb-4">
        <ChevronLeft size={16} /> 돌아가기
      </Link>
      <h1 className="text-xl font-bold text-[#2D241E] mb-2">개인정보처리방침</h1>
      <p className="text-xs text-[#C4B5A9] mb-6">시행일: 2026년 7월 7일</p>

      <div className="space-y-5">
        {SECTIONS.map((s) => (
          <section key={s.title} className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[#2D241E] mb-2">{s.title}</h2>
            <p className="text-[13px] leading-relaxed text-[#8D7B6D]">{s.body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
