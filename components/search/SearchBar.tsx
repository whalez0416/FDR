'use client';

import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  // Debounced search update
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (query) {
        params.set('q', query);
      } else {
        params.delete('q');
      }
      router.push(`/?${params.toString()}`, { scroll: false });
    }, 300);

    return () => clearTimeout(timer);
  }, [query, router, searchParams]);

  return (
    <div className="px-6 -mt-8 sticky top-4 z-20">
      <div className="w-full h-16 bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl shadow-[#FF8A5B]/5 border border-white flex items-center px-6 transition-all focus-within:ring-2 focus-within:ring-[#FF8A5B]/20 active:scale-[0.98]">
        <Search size={20} className="text-[#FF8A5B] mr-4" />
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="가고 싶은 백화점이나 몰을 찾아보세요"
          className="bg-transparent border-none outline-none text-sm w-full text-[#4A3728] placeholder-[#C4B5A9] font-medium"
        />
        {query && (
          <button 
            onClick={() => setQuery('')}
            className="p-1 bg-[#FDF8F4] rounded-full text-[#C4B5A9]"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
