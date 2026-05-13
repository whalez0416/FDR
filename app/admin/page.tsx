'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Mall = { id: string; name: string; source_url?: string; district?: string };
type Restaurant = {
  id: string;
  mall_id: string;
  name: string;
  category: string;
  floor: string;
  status: string;
  stroller_accessible: boolean;
  highchair_available: boolean;
  tags: string[];
  description: string;
};

export default function AdminDashboard() {
  const [malls, setMalls] = useState<Mall[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedMallId, setSelectedMallId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [isAIFilling, setIsAIFilling] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredRests, setDiscoveredRests] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/data')
      .then(r => r.json())
      .then(data => {
        setMalls(data.malls || []);
        setRestaurants(data.restaurants || []);
        if (data.malls && data.malls.length > 0) {
          setSelectedMallId(data.malls[0].id);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load admin data', err);
        setIsLoading(false);
      });
  }, []);

  const handleAIFill = async () => {
    if (!selectedMallId) return;
    const mall = malls.find(m => m.id === selectedMallId);
    if (!mall) return;

    const currentRests = restaurants.filter(r => r.mall_id === selectedMallId);
    
    if (!confirm(`'${mall.name}'의 ${currentRests.length}개 식당 정보를 AI로 자동 완성하시겠습니까? 약 10초 정도 소요됩니다.`)) return;

    setIsAIFilling(true);
    try {
      const res = await fetch('/api/admin/ai-fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mallId: mall.id,
          mallName: mall.name,
          restaurants: currentRests
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('✨ AI 자동 완성이 완료되었습니다! 새로고침하여 결과를 확인하세요.');
        window.location.reload();
      } else {
        alert('오류 발생: ' + (data.error || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error(error);
      alert('AI 요청 중 문제가 발생했습니다.');
    } finally {
      setIsAIFilling(false);
    }
  };

  const handleJsonSync = async () => {
    if (!confirm('data/restaurants 폴더의 모든 JSON 파일을 읽어 현재 데이터베이스에 동기화하시겠습니까?')) return;
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/sync-json', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`🎉 총 ${data.count}개의 식당 정보가 동기화되었습니다!`);
        window.location.reload();
      } else {
        alert('오류 발생: ' + (data.error || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error(error);
      alert('동기화 중 문제가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleMallUpdate = async (id: string, updates: Partial<Mall>) => {
    setMalls(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    setSavingId('mall_' + id);
    try {
      await fetch('/api/admin/data', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates, type: 'mall' })
      });
    } catch (error) {
      console.error('Failed to update mall data', error);
      alert('저장 실패!');
    } finally {
      setSavingId(null);
    }
  };

  const handleDiscover = async () => {
    if (!selectedMallId) return;
    const mall = malls.find(m => m.id === selectedMallId);
    if (!mall) return;

    setIsDiscovering(true);
    setDiscoveredRests([]);
    try {
      const res = await fetch('/api/admin/discover-restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mallId: mall.id, mallName: mall.name })
      });
      const data = await res.json();
      if (data.restaurants) {
        setDiscoveredRests(data.restaurants);
      } else {
        alert('발굴 실패: ' + (data.error || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error(error);
      alert('AI 발굴 중 문제가 발생했습니다.');
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleAddDiscovered = async () => {
    const newOnes = discoveredRests.filter(r => r.is_new);
    if (newOnes.length === 0) {
      alert('새로 추가할 식당이 없습니다.');
      return;
    }

    if (!confirm(`${newOnes.length}개의 새로운 식당을 한꺼번에 등록하시겠습니까?`)) return;

    setIsLoading(true);
    try {
      // We reuse the sync-json logic or directly upsert via a new simple loop
      // For simplicity here, we'll use the existing sync-json pattern via a temporary JSON or just direct batch
      for (const rest of newOnes) {
        await fetch('/api/admin/data', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id: null, // New record
            updates: {
              mall_id: selectedMallId,
              name: rest.name,
              category: rest.category,
              floor: rest.floor,
              status: 'OPEN'
            }
          })
        });
      }
      alert('등록 완료! 이제 AI 채우기로 상세 정보를 완성해 보세요.');
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert('등록 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
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
          <div className="flex gap-2">
            <button 
              onClick={async () => {
                if(!confirm('전체 기본 데이터를 복구하시겠습니까?')) return;
                const res = await fetch('/api/admin/restore-backup');
                if(res.ok) {
                  alert('데이터 복구 완료!');
                  window.location.reload();
                }
              }}
              className="px-4 py-2 bg-orange-100 text-orange-700 border border-orange-200 rounded-lg shadow-sm hover:bg-orange-200 transition text-sm font-bold"
            >
              🔄 기본 데이터 전체 복구
            </button>
            <button 
              onClick={handleJsonSync}
              className="px-4 py-2 bg-blue-100 text-blue-700 border border-blue-200 rounded-lg shadow-sm hover:bg-blue-200 transition text-sm font-bold"
            >
              📂 JSON 데이터 동기화
            </button>
            <Link href="/" className="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition text-sm">
              앱으로 돌아가기
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Mall Selector Header */}
          <div className="border-b border-gray-100 bg-gray-50 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-wrap gap-2">
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
            
            <div className="w-full mt-4 flex flex-col md:flex-row gap-4">
              <div className="flex-1 bg-white p-3 rounded border border-gray-200">
                <label className="block text-xs font-bold text-gray-700 mb-1">선택된 지점의 공식 식당 안내 URL (크롤링용)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={malls.find(m => m.id === selectedMallId)?.source_url || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMalls(prev => prev.map(m => m.id === selectedMallId ? { ...m, source_url: val } : m));
                    }}
                    onBlur={(e) => selectedMallId && handleMallUpdate(selectedMallId, { source_url: e.target.value })}
                    placeholder="https://... (입력 후 바깥을 클릭하면 자동 저장됩니다)"
                    className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex-1 bg-white p-3 rounded border border-gray-200">
                <label className="block text-xs font-bold text-gray-700 mb-1">유아휴게실(수유실) 위치 정보 (DB의 district 컬럼 사용)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={malls.find(m => m.id === selectedMallId)?.district || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMalls(prev => prev.map(m => m.id === selectedMallId ? { ...m, district: val } : m));
                    }}
                    onBlur={(e) => selectedMallId && handleMallUpdate(selectedMallId, { district: e.target.value })}
                    placeholder="예: 6층 서비스라운지 옆, 본관 4층 유아휴게실"
                    className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                  {savingId === 'mall_' + selectedMallId && <span className="text-xs text-blue-500 animate-pulse w-16">저장 중...</span>}
                </div>
              </div>
            </div>

            <div className="w-full mt-4 flex flex-col md:flex-row justify-end gap-2">
              <button
                onClick={handleAIFill}
              disabled={isAIFilling || currentRestaurants.length === 0}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all ${
                isAIFilling 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-md'
              }`}
            >
              {isAIFilling ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  AI 분석 중...
                </>
              ) : '✨ AI로 층수/정보 싹 채우기'}
            </button>
            
            <button
              onClick={handleDiscover}
              disabled={isDiscovering}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all ${
                isDiscovering 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md'
              }`}
            >
              {isDiscovering ? '🔍 검색 중...' : '🔍 누락된 식당 찾기'}
            </button>
            </div>
          </div>

          {/* Discovery Results */}
          {discoveredRests.length > 0 && (
            <div className="p-4 bg-indigo-50 border-b border-indigo-100">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-indigo-900">AI가 찾은 식당 목록 ({discoveredRests.length}개)</h3>
                <div className="flex gap-2">
                  <button onClick={() => setDiscoveredRests([])} className="text-xs text-indigo-600 hover:underline">닫기</button>
                  <button 
                    onClick={handleAddDiscovered}
                    className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700"
                  >
                    신규 {discoveredRests.filter(r => r.is_new).length}개 한꺼번에 등록하기
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2">
                {discoveredRests.map((r, i) => (
                  <span key={i} className={`px-2 py-1 rounded text-[10px] ${r.is_new ? 'bg-indigo-200 text-indigo-800 font-bold' : 'bg-gray-200 text-gray-500'}`}>
                    {r.name} ({r.floor})
                  </span>
                ))}
              </div>
            </div>
          )}

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
                  <th className="p-4 text-sm font-semibold text-gray-600">해시태그 (콤마로 구분)</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">상세 설명</th>
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

                    {/* Tags Edit */}
                    <td className="p-4 min-w-[200px]">
                      <input
                        type="text"
                        value={(restaurant.tags || []).join(', ')}
                        onChange={(e) => {
                          const val = e.target.value.split(',').map(s => s.trim().startsWith('#') ? s.trim() : '#' + s.trim());
                          setRestaurants(prev => prev.map(r => r.id === restaurant.id ? { ...r, tags: val } : r));
                        }}
                        onBlur={(e) => {
                          const val = e.target.value.split(',').map(s => s.trim().startsWith('#') ? s.trim() : '#' + s.trim()).filter(s => s !== '#');
                          handleUpdate(restaurant.id, 'tags', val);
                        }}
                        className="w-full px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded focus:bg-white outline-none"
                        placeholder="#태그1, #태그2"
                      />
                    </td>

                    {/* Description Edit */}
                    <td className="p-4 min-w-[250px]">
                      <textarea
                        value={restaurant.description || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRestaurants(prev => prev.map(r => r.id === restaurant.id ? { ...r, description: val } : r));
                        }}
                        onBlur={(e) => handleUpdate(restaurant.id, 'description', e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded focus:bg-white outline-none h-12"
                        placeholder="아이와 가기 좋은 이유를 적어주세요."
                      />
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
