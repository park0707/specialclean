// src/home_parts/searchbox.tsx
import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useSearch } from '../searchcontext';


export default function SearchBox() {
  const { query: globalQuery, setQuery } = useSearch();
  const [inputValue, setInputValue] = useState(globalQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // 로컬 스토리지에서 최근 검색어 가져오기
  const loadRecentSearches = () => {
    try {
      const stored = localStorage.getItem('recent_searches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      } else {
        setRecentSearches([]);
      }
    } catch (e) {
      console.error('Failed to load recent searches', e);
    }
  };

  useEffect(() => {
    loadRecentSearches();
    setInputValue(globalQuery);
  }, [globalQuery]);

  // 클릭 이벤트 핸들러 (외부 클릭 시 드롭다운 닫기)
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // 최근 검색어 추가
  const addRecentSearch = (keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;

    try {
      const stored = localStorage.getItem('recent_searches');
      let currentList: string[] = stored ? JSON.parse(stored) : [];
      
      // 중복 제거 후 맨 앞에 키워드 삽입
      currentList = [trimmed, ...currentList.filter((item) => item !== trimmed)].slice(0, 5);
      
      localStorage.setItem('recent_searches', JSON.stringify(currentList));
      setRecentSearches(currentList);
    } catch (e) {
      console.error('Failed to save recent search', e);
    }
  };

  // 최근 검색어 삭제
  const deleteRecentSearch = (e: React.MouseEvent, keyword: string) => {
    e.stopPropagation(); // 드롭다운 클릭 이벤트 차단
    try {
      const updated = recentSearches.filter((item) => item !== keyword);
      localStorage.setItem('recent_searches', JSON.stringify(updated));
      setRecentSearches(updated);
    } catch (err) {
      console.error('Failed to delete recent search', err);
    }
  };

  // 검색 최종 확정 실행
  const handleSearchTrigger = (val: string) => {
    setQuery(val);
    addRecentSearch(val);
    setInputValue(val);
    setIsOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchTrigger(inputValue);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="업체 이름을 검색해보세요..."
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-12 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400 transition duration-200"
        />
        
        {/* 인풋 내부 돋보기 아이콘 (장식용) */}
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

        {/* 입력값이 있을 때 지우기(X) 버튼 */}
        {inputValue && (
          <button
            type="button"
            onClick={() => {
              setInputValue('');
              setQuery('');
            }}
            className="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full transition duration-150 cursor-pointer"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}

        {/* 돋보기 검색 실행 버튼 */}
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200 cursor-pointer"
          title="검색"
        >
          <MagnifyingGlassIcon className="h-4 w-4 stroke-[2.5]" />
        </button>
      </form>

      {/* 드롭다운 메뉴 (최근 검색어 + 추천 검색어) */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl bg-white border border-gray-100 shadow-xl divide-y divide-gray-50 animate-in fade-in slide-in-from-top-1 duration-150">
          
          {/* 최근 검색어 섹션 */}
          <div className="flex flex-col">
            <div className="px-4 py-2 text-[11px] font-semibold text-gray-400 bg-gray-50/50 flex justify-between items-center">
              <span>최근 검색어</span>
            </div>
            {recentSearches.length === 0 ? (
              <div className="px-4 py-3 text-xs text-gray-400 text-center">
                최근 검색 내역이 없습니다.
              </div>
            ) : (
              <ul className="flex flex-col divide-y divide-gray-50/40">
                {recentSearches.map((keyword) => (
                  <li
                    key={keyword}
                    onClick={() => handleSearchTrigger(keyword)}
                    className="group flex items-center justify-between px-4 py-2.5 text-xs text-gray-600 hover:bg-blue-50/20 cursor-pointer transition duration-150"
                  >
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-3.5 w-3.5 text-gray-300" />
                      <span className="font-medium text-gray-700">{keyword}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => deleteRecentSearch(e, keyword)}
                      className="p-1 text-gray-300 hover:text-red-500 rounded hover:bg-gray-100 transition duration-150"
                      title="삭제"
                    >
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>


        </div>
      )}
    </div>
  );
}
