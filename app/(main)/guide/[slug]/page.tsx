import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Clock } from 'lucide-react';
import { ARTICLES, getArticle } from '@/lib/guide/articles';

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const article = getArticle(params.slug);
  if (!article) return {};
  return {
    title: `${article.title} | 맘편한 외식`,
    description: article.description,
    openGraph: { title: article.title, description: article.description, type: 'article' },
  };
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = getArticle(params.slug);
  if (!article) notFound();

  return (
    <main className="min-h-screen bg-[#FDF8F4] pb-32 px-6 pt-6">
      <Link href="/guide" className="inline-flex items-center gap-1 text-sm text-[#8D7B6D] mb-5">
        <ChevronLeft size={16} /> 가이드 목록
      </Link>

      <article>
        <h1 className="text-2xl font-bold text-[#2D241E] leading-snug mb-3">{article.title}</h1>
        <div className="flex items-center gap-3 text-[11px] text-[#C4B5A9] mb-8">
          <span>{article.date}</span>
          <span className="inline-flex items-center gap-1">
            <Clock size={12} /> {article.readMinutes}분 읽기
          </span>
        </div>

        <div className="space-y-8">
          {article.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-lg font-bold text-[#2D241E] mb-3">{s.heading}</h2>
              {s.paragraphs?.map((p, i) => (
                <p key={i} className="text-[15px] leading-[1.8] text-[#5C4F44] mb-3">
                  {p}
                </p>
              ))}
              {s.list && (
                <ul className="space-y-2 mt-2">
                  {s.list.map((item, i) => (
                    <li key={i} className="flex gap-2 text-[15px] leading-[1.7] text-[#5C4F44]">
                      <span className="text-[#FF8A5B] font-bold shrink-0">·</span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <Link
          href="/"
          className="mt-12 block bg-[#FF8A5B] text-white text-center font-bold py-4 rounded-2xl active:scale-[0.98] transition-transform"
        >
          수유실·식당 정보 몰별로 찾아보기
        </Link>
      </article>
    </main>
  );
}
