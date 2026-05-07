'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MallCard } from './MallCard';
import { supabase } from '../../lib/supabase/client';
import { Loader2 } from 'lucide-react';

import { useSearchParams } from 'next/navigation';

interface InfiniteMallListProps {
  initialMalls: any[];
}

export const InfiniteMallList: React.FC<InfiniteMallListProps> = ({ initialMalls }) => {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  
  const [malls, setMalls] = useState<any[]>(initialMalls);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  const PAGE_SIZE = 10;

  // Reset list when search query changes
  useEffect(() => {
    const fetchInitialSearch = async () => {
      setIsLoading(true);
      setPage(0);
      
      let query = supabase
        .from('malls')
        .select('*')
        .order('name')
        .range(0, PAGE_SIZE - 1);

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (!error && data) {
        setMalls(data);
        setPage(1);
        setHasMore(data.length === PAGE_SIZE);
      }
      setIsLoading(false);
    };

    if (searchQuery !== undefined) {
      fetchInitialSearch();
    }
  }, [searchQuery]);

  const loadMoreMalls = async () => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    const start = page * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;

    let query = supabase
      .from('malls')
      .select('*')
      .order('name')
      .range(start, end);

    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading more malls:', error);
      setIsLoading(false);
      return;
    }

    if (data && data.length > 0) {
      setMalls(prev => [...prev, ...data]);
      setPage(prev => prev + 1);
      if (data.length < PAGE_SIZE) setHasMore(false);
    } else {
      setHasMore(false);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMoreMalls();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, page, isLoading, searchQuery]);

  return (
    <div className="space-y-6">
      {malls.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {malls.map((mall) => (
            <MallCard 
              key={mall.id} 
              id={mall.id}
              name={mall.name}
              city={mall.city}
              district={mall.district}
              image={mall.image_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800'}
            />
          ))}
        </div>
      ) : !isLoading && (
        <div className="py-20 text-center">
          <p className="text-[#8D7B6D] font-medium">검색 결과가 없습니다.</p>
          <p className="text-xs text-[#C4B5A9] mt-2">다른 검색어로 찾아보세요!</p>
        </div>
      )}

      {/* Loading & Observer Target */}
      <div ref={observerTarget} className="h-20 flex items-center justify-center">
        {isLoading && (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 text-[#FF8A5B] animate-spin" />
            <span className="text-[10px] text-[#C4B5A9] font-bold">맘편한 맛집 찾는 중...</span>
          </div>
        )}
        {!hasMore && malls.length > 0 && !isLoading && (
          <p className="text-[10px] text-[#C4B5A9] font-bold uppercase tracking-widest">모든 정보를 불러왔습니다</p>
        )}
      </div>
    </div>
  );
};
