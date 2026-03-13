import { useState, useEffect, useRef } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { useSearch } from '../../searchcontext';

interface KakaoAddress {
  address_name: string;
  region_1depth_name: string; // 시/도 (광역)
  region_2depth_name: string; // 구/군 (세부)
  region_3depth_name: string;
}

/**
 * Kakao Local REST API를 사용한 주소 자동완성 필터.
 * 환경변수: VITE_KAKAO_REST_API_KEY 에 Kakao REST API 키를 설정하세요.
 */
export default function LocationFilter() {
  const { filter, setFilter } = useSearch();
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<KakaoAddress[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const KAKAO_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY as string | undefined;

  // 외부 클릭 시 추천 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Kakao 주소 검색 — debounced
  useEffect(() => {
    if (!KAKAO_KEY || input.trim().length < 2) {
      // 조건 불충분 시 cleanup에서 처리
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(input)}&size=5`,
          { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } },
        );
        if (!res.ok) return;
        const data = await res.json();
        const addresses: KakaoAddress[] = (data.documents ?? []).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (doc: any) => {
            const addr = doc.address ?? doc.road_address ?? {};
            return {
              address_name: doc.address_name ?? '',
              region_1depth_name: addr.region_1depth_name ?? '',
              region_2depth_name: addr.region_2depth_name ?? '',
              region_3depth_name: addr.region_3depth_name ?? '',
            };
          },
        );
        setSuggestions(addresses);
        setShowSuggestions(true);
      } catch {
        // 네트워크 오류 무시
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input, KAKAO_KEY]);

  function selectAddress(addr: KakaoAddress) {
    setFilter((prev) => ({
      ...prev,
      regionWide: addr.region_1depth_name,
      regionDetail: addr.region_2depth_name,
    }));
    setInput(addr.address_name);
    setShowSuggestions(false);
  }

  function clearFilter() {
    setFilter((prev) => ({ ...prev, regionWide: '', regionDetail: '' }));
    setInput('');
    setSuggestions([]);
  }

  const activeLabel =
    filter.regionWide && filter.regionDetail
      ? `${filter.regionWide} ${filter.regionDetail}`
      : filter.regionWide || '';

  return (
    <div className="w-full max-w-md space-y-2" ref={wrapperRef}>
      <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
        <MapPinIcon className="h-4 w-4 text-blue-500" />
        지역 검색
      </label>

      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            const v = e.target.value;
            setInput(v);
            if (v.trim().length < 2) {
              setSuggestions([]);
              setShowSuggestions(false);
            }
          }}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={KAKAO_KEY ? '주소 또는 지역을 입력하세요' : '카카오 API 키가 필요합니다 (VITE_KAKAO_REST_API_KEY)'}
          disabled={!KAKAO_KEY}
          className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
        />

        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black/5">
            {suggestions.map((addr, i) => (
              <li
                key={i}
                onClick={() => selectAddress(addr)}
                className="cursor-pointer px-3 py-2 hover:bg-blue-50"
              >
                <span className="font-medium">{addr.region_1depth_name} {addr.region_2depth_name}</span>
                {addr.region_3depth_name && (
                  <span className="text-gray-500"> {addr.region_3depth_name}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {activeLabel && (
        <div className="flex items-center gap-2 text-sm">
          <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-blue-700">
            {activeLabel}
          </span>
          <button
            onClick={clearFilter}
            className="text-gray-400 hover:text-red-500 text-xs"
          >
            초기화
          </button>
        </div>
      )}

      {!KAKAO_KEY && (
        <p className="text-xs text-amber-600">
          Kakao REST API 키를 .env 파일에 VITE_KAKAO_REST_API_KEY로 설정해 주세요.
        </p>
      )}
    </div>
  );
}
