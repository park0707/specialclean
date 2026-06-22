// src/home_parts/LocationSearchInput.tsx
import { useState, useEffect, useRef } from 'react';
import { searchAddressWithMeta } from '../lib/geocode';
import type { GeoResult } from '../lib/geocode';
import { useSearch } from '../searchcontext';

export default function LocationSearchInput() {
  const { locationQuery, setLocationQuery, setLocationResult, locationResult } =
    useSearch();
  const [suggestions, setSuggestions] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!locationQuery.trim() || locationResult) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchAddressWithMeta(locationQuery);
        setSuggestions(results);
        setOpen(results.length > 0);
      } catch {
        setSuggestions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [locationQuery, locationResult]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (result: GeoResult) => {
    setLocationQuery(result.displayName ?? result.fullAddress);
    setLocationResult(result);
    setOpen(false);
    setSuggestions([]);
  };

  const handleClear = () => {
    setLocationQuery('');
    setLocationResult(null);
    setSuggestions([]);
    setOpen(false);
  };

  // ↓ 추가: 검색창 포커스 시 기존 suggestions 있으면 드롭박스 재오픈
  const handleFocus = () => {
    if (suggestions.length > 0 && !locationResult) {
      setOpen(true);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">

      <div className="flex items-center gap-2 w-100 h-10">
        <div className="relative flex-1 h-full">
          <input
            id="location-search-input"
            type="text"
            value={locationQuery}
            onFocus={handleFocus} 
            onChange={(e) => {
              setLocationQuery(e.target.value);
              if (locationResult) setLocationResult(null);
            }}
            placeholder="아파트명, 건물명, 도로명 주소 검색..."
            className={`w-full h-full rounded-lg border px-4 py-0 text-sm focus:outline-none ${
              locationResult
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 focus:border-blue-500 bg-white'
            }`}
          />
          {loading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
              검색중...
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleClear}
          disabled={!locationQuery}
          className={`text-xs whitespace-nowrap w-10 text-center transition-opacity duration-150 ${
            locationQuery
              ? 'text-gray-400 hover:text-gray-600 cursor-pointer opacity-100'
              : 'opacity-0 pointer-events-none'
          }`}
        >
          초기화
        </button>
      </div>

      <p className="mt-1.5 text-xs h-4 leading-4 truncate">
        {locationResult ? (
          <span className="text-blue-600">
            📍 {locationResult.fullAddress} ({locationResult.sido}) 기준으로 검색 중
          </span>
        ) : (
          <span className="text-transparent select-none">placeholder</span>
        )}
      </p>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded border border-gray-200 bg-white shadow-lg max-h-52 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li
              key={i}
              onClick={() => handleSelect(s)}
              className="px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
            >
              <div className="font-medium text-gray-800">
                {s.displayName ?? s.fullAddress}
              </div>
              {s.detailAddress && (
                <div className="text-xs text-gray-400 mt-0.5">
                  {s.detailAddress}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}