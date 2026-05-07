'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Mall = { id: string; name: string };
type Restaurant = {
  id: string;
  mall_id: string;
  name: string;
  category: string;
  floor: string;
  status: string;
  stroller_accessible: boolean;
  highchair_available: boolean;
};

export default function AdminDashboard() {
  const [malls, setMalls] = useState<Mall[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedMallId, setSelectedMallId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/data')
      .then(res => res.json())
      .then(data => {
        setMalls(data.malls || []);
        setRestaurants(data.restaurants || []);
        if (data.malls?.length > 0) {
          setSelectedMallId(data.malls[0].id);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load admin data', err);
        setIsLoading(false);
      });
  }, []);

  const handleUpdate = async (id: string, field: keyof Restaurant, value: string | boolean) => {
    // Optimistic UI update
    setRestaurants(prev => 
      prev.map(r => r.id === id ? { ...r, [field]: value } : r)
    );
    
    setSavingId(id);
    try {
      await fetch('/api/admin/data', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates: { [field]: value } })
      });
    } catch (error) {
      console.error('Failed to update', error);
      alert('업데이트 실패! 다시 시도해주세요.');
    } finally {
      setSavingId(null);
    }
  };

  if (isLoading) return <div className="p-10 text-center text-gray-500">데이터를 불러오는 중입니다...</div>;

  const currentRestaurants = restaurants.filter(r => r.mall_id === selectedMallId);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">맘편한 외식 관리자</h1>
            <p className="text-gray-500 mt-2">식당의 층수와 편의 정보를 빠르게 수정하세요.</p>
          </div>
          <Link href="/" className="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition">
            앱으로 돌아가기
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Mall Selector */}
          <div className="border-b border-gray-100 bg-gray-50 p-4 flex flex-wrap gap-2">
            {malls.map(mall => (
              <button
                key={mall.id}
                onClick={() => setSelectedMallId(mall.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedMallId === mall.id 
                    ? 'bg-orange-500 text-white shadow-md' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {mall.name}
              </button>
            ))}
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 text-sm font-semibold text-gray-600">식당 이름</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">카테고리</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 w-32">층수 (클릭하여 수정)</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 text-center">유모차 진입</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 text-center">아기의자</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 text-center">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentRestaurants.map(restaurant => (
                  <tr key={restaurant.id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="p-4 font-medium text-gray-900">
                      {restaurant.name}
                      {savingId === restaurant.id && <span className="ml-2 text-xs text-orange-500 animate-pulse">저장 중...</span>}
                    </td>
                    <td className="p-4 text-sm text-gray-500">{restaurant.category}</td>
                    
                    {/* Floor Edit */}
                    <td className="p-4">
                      <input
                        type="text"
                        value={restaurant.floor}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRestaurants(prev => prev.map(r => r.id === restaurant.id ? { ...r, floor: val } : r));
                        }}
                        onBlur={(e) => handleUpdate(restaurant.id, 'floor', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                        placeholder="예: 9F, B1"
                      />
                    </td>

                    {/* Stroller Toggle */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleUpdate(restaurant.id, 'stroller_accessible', !restaurant.stroller_accessible)}
                        className={`w-12 h-6 rounded-full relative transition-colors ${restaurant.stroller_accessible ? 'bg-orange-500' : 'bg-gray-300'}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${restaurant.stroller_accessible ? 'left-7' : 'left-1'}`} />
                      </button>
                    </td>

                    {/* Highchair Toggle */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleUpdate(restaurant.id, 'highchair_available', !restaurant.highchair_available)}
                        className={`w-12 h-6 rounded-full relative transition-colors ${restaurant.highchair_available ? 'bg-orange-500' : 'bg-gray-300'}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${restaurant.highchair_available ? 'left-7' : 'left-1'}`} />
                      </button>
                    </td>

                    <td className="p-4 text-center text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        restaurant.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {restaurant.status === 'OPEN' ? '영업중' : '폐업/이전'}
                      </span>
                    </td>
                  </tr>
                ))}
                {currentRestaurants.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      이 지점에는 아직 등록된 식당이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
