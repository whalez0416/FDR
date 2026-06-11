'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Mall = { id: string; name: string; source_url?: string; district?: string; nursing_room?: string };
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

  // Batch Sync States
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [batchJsonInput, setBatchJsonInput] = useState('');
  const [batchLogs, setBatchLogs] = useState<string[]>([]);
  const [isBatchSyncing, setIsBatchSyncing] = useState(false);

  const loadBatchTemplate = () => {
    const template = malls.map(m => ({
      mall_name: m.name,
      source_url: m.source_url || "",
      facility_url: (m as any).facility_url || ""
    }));
    setBatchJsonInput(JSON.stringify(template, null, 2));
    setBatchLogs(["[Console] 현재 앱에 등록된 모든 지점 목록을 템플릿으로 로드했습니다. URL을 기입하여 '일괄 등록' 버튼을 누르세요."]);
  };

  const clearBatchInput = () => {
    setBatchJsonInput('');
    setBatchLogs([]);
  };

  const handleBatchSync = async () => {
    try {
      const parsed = JSON.parse(batchJsonInput);
      if (!Array.isArray(parsed)) {
        alert('올바른 JSON 배열 형식이어야 합니다. [ { ... }, { ... } ]');
        return;
      }
      
      if (!confirm(`입력하신 ${parsed.length}개 지점의 일괄 식당 등록을 진행하시겠습니까?`)) return;

      setIsBatchSyncing(true);
      setBatchLogs([`[Console] 일괄 식당 등록 시작... (지점수: ${parsed.length}개)`]);

      const res = await fetch('/api/admin/batch-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: batchJsonInput
      });

      const data = await res.json();
      if (data.success && data.results) {
        const logs: string[] = [`🎉 일괄 식당 등록 성공 완료!`];
        data.results.forEach((r: any) => {
          if (r.success) {
            logs.push(`✅ [${r.mall_name}] 발굴: ${r.scraped_count}개 | 신규 등록: ${r.registered_count}개`);
          } else {
            logs.push(`❌ [${r.mall_name}] 실패: ${r.error}`);
          }
        });
        setBatchLogs(logs);
        alert('🎉 모든 지점의 일괄 식당 등록이 완료되었습니다!');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setBatchLogs([`❌ 등록 중단 오류: ${data.error || '알 수 없는 에러'}`]);
        alert(`등록 실패: ${data.error}`);
      }
    } catch (e: any) {
      setBatchLogs([`❌ JSON 파싱 에러: ${e.message}`]);
      alert(`올바른 JSON 형식이 아닙니다: ${e.message}`);
    } finally {
      setIsBatchSyncing(false);
    }
  };

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

  const handleUpdate = async (id: string, field: keyof Restaurant, value: string | boolean | string[]) => {
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
            <button
              onClick={async () => {
                await fetch('/api/admin/login', { method: 'DELETE' });
                window.location.href = '/admin/login';
              }}
              className="px-4 py-2 bg-white text-gray-500 border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition text-sm"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* Batch Sync Accordion Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <button 
            onClick={() => setIsBatchOpen(!isBatchOpen)}
            type="button"
            className="w-full px-6 py-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100/50 transition-colors border-b border-gray-100"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-800">🚀 일괄 식당 수집 및 등록 (Batch Sync Console)</span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-700 rounded-full">New Automation</span>
            </div>
            <span className="text-sm font-semibold text-gray-500">
              {isBatchOpen ? '접기 ▲' : '펼치기 ▼'}
            </span>
          </button>

          {isBatchOpen && (
            <div className="p-6 space-y-4 animate-fade-in">
              <p className="text-xs text-gray-500 leading-relaxed">
                여러 지점의 식당가 공식 URL을 JSON 리스트로 입력하여 한꺼번에 식당을 크롤링하고 신규 식당 목록을 데이터베이스에 일괄 적재합니다.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* JSON Input Code Editor */}
                <div className="lg:col-span-8 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-700">JSON 데이터 입력</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={loadBatchTemplate}
                        type="button"
                        className="text-xs text-purple-600 hover:text-purple-700 hover:underline font-semibold"
                      >
                        📋 기본 템플릿 로드
                      </button>
                      <button 
                        onClick={clearBatchInput}
                        type="button"
                        className="text-xs text-gray-500 hover:text-gray-600 hover:underline"
                      >
                        비우기
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={batchJsonInput}
                    onChange={(e) => setBatchJsonInput(e.target.value)}
                    placeholder={`[
  {
    "mall_name": "광주신세계",
    "source_url": "https://www.shinsegae.com/store/restaurant.do?storeCd=SC00010"
  }
]`}
                    className="w-full h-48 px-4 py-3 font-mono text-xs bg-gray-900 text-green-400 rounded-xl border border-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-y shadow-inner"
                  />
                </div>

                {/* Sync Controls & Result Console */}
                <div className="lg:col-span-4 flex flex-col justify-between space-y-4 min-h-[200px]">
                  <div className="flex-1 bg-gray-50 p-4 rounded-xl border border-gray-200 overflow-y-auto max-h-48 shadow-inner">
                    <span className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">실행 콘솔 로그</span>
                    <div className="text-[11px] font-mono text-gray-600 space-y-1">
                      {batchLogs.length > 0 ? (
                        batchLogs.map((log, i) => (
                          <div key={i} className={log.startsWith('▼') || log.startsWith('▲') || log.startsWith('🎉') || log.startsWith('[Console]') ? 'text-purple-600 font-bold' : (log.startsWith('❌') ? 'text-red-500 font-bold' : 'text-gray-600')}>
                            {log}
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-400 italic">대기 중...</div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleBatchSync}
                    disabled={isBatchSyncing || !batchJsonInput.trim()}
                    type="button"
                    className={`w-full py-3.5 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                      isBatchSyncing || !batchJsonInput.trim()
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-600/20'
                    }`}
                  >
                    {isBatchSyncing ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        일괄 등록 진행 중...
                      </>
                    ) : (
                      '🚀 일괄 식당 수집 및 등록 시작'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Mall Selector Header */}
          <div className="border-b border-gray-100 bg-gray-50 p-6 flex flex-col gap-6">
            {/* Row 1: Mall Buttons in a compact scrollable box */}
            <div className="w-full">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">지점 선택 ({malls.length}개 지점)</h3>
                <span className="text-[10px] text-gray-400">마우스 휠로 스크롤하여 더 많은 지점을 볼 수 있습니다</span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-3 bg-white rounded-xl border border-gray-200 shadow-inner">
                {malls.map(mall => (
                  <button
                    key={mall.id}
                    onClick={() => setSelectedMallId(mall.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95 ${
                      selectedMallId === mall.id 
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
                        : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {mall.name}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Row 2: Inputs & Actions in a balanced Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
              {/* Input 1: Crawler URL */}
              <div className="lg:col-span-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">선택된 지점의 공식 식당 안내 URL (크롤링용)</label>
                <input
                  type="text"
                  value={malls.find(m => m.id === selectedMallId)?.source_url || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMalls(prev => prev.map(m => m.id === selectedMallId ? { ...m, source_url: val } : m));
                  }}
                  onBlur={(e) => selectedMallId && handleMallUpdate(selectedMallId, { source_url: e.target.value })}
                  placeholder="https://... (입력 후 바깥을 클릭하면 자동 저장됩니다)"
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Input 2: Nursing room location */}
              <div className="lg:col-span-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm relative">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  유아휴게실(수유실) 위치 정보 <span className="text-[10px] text-purple-500 font-medium">(nursing_room 컬럼)</span>
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={malls.find(m => m.id === selectedMallId)?.nursing_room || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMalls(prev => prev.map(m => m.id === selectedMallId ? { ...m, nursing_room: val } : m));
                    }}
                    onBlur={(e) => selectedMallId && handleMallUpdate(selectedMallId, { nursing_room: e.target.value })}
                    placeholder="예: 6층 서비스라운지 옆, 본관 4층 유아휴게실"
                    className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  />
                  {savingId === 'mall_' + selectedMallId && (
                    <span className="absolute right-4 top-1 text-[10px] text-purple-600 animate-pulse font-bold">저장 중...</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="lg:col-span-4 flex gap-2 h-[46px]">
                <button
                  onClick={handleAIFill}
                  disabled={isAIFilling || currentRestaurants.length === 0}
                  className={`flex-1 flex items-center justify-center px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 ${
                    isAIFilling 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-md shadow-purple-600/10'
                  }`}
                >
                  {isAIFilling ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      AI 채우는 중...
                    </>
                  ) : '✨ AI 싹 채우기'}
                </button>
                
                <button
                  onClick={handleDiscover}
                  disabled={isDiscovering}
                  className={`flex-1 flex items-center justify-center px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 ${
                    isDiscovering 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md shadow-indigo-600/10'
                  }`}
                >
                  {isDiscovering ? '🔍 검색 중...' : '🔍 누락 식당 찾기'}
                </button>
              </div>
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
