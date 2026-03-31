// src/home_parts/BusinessList.tsx
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSearch } from '../searchcontext';
import { applyAllFilters } from '../lib/filterBusinesses';
import type { Business } from '../lib/filterBusinesses';

export default function BusinessList() {
  const { query: textQuery, locationResult, selectedServices, selectedTags } =
    useSearch();

  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [filtered, setFiltered] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Firestore fetch (최초 1회) ────────────────────────
  useEffect(() => {
    const fetchBusinesses = async () => {
      setLoading(true);
      setError('');
      try {
        const q = query(
          collection(db, 'businessApplications'),
          where('status', '==', 'approved'),
        );
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Business));
        setAllBusinesses(list);
      } catch (e) {
        console.error(e);
        setError('업체 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchBusinesses();
  }, []);

  // ── 필터 적용 (필터값 바뀔 때마다 재계산) ────────────
  useEffect(() => {
    const result = applyAllFilters(allBusinesses, {
      loc: locationResult,
      selectedServices,
      selectedTags,
      query: textQuery,
    });
    setFiltered(result);
  }, [allBusinesses, locationResult, selectedServices, selectedTags, textQuery]);

  // ── 로딩 ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full flex justify-center py-16 text-sm text-gray-400">
        업체 목록 불러오는 중...
      </div>
    );
  }

  // ── 에러 ─────────────────────────────────────────────
  if (error) {
    return (
      <div className="w-full flex justify-center py-16 text-sm text-red-400">
        {error}
      </div>
    );
  }

  // ── 결과 없음 ─────────────────────────────────────────
  if (filtered.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-16 gap-2 text-center">
        <div className="text-3xl">🔍</div>
        <p className="text-sm font-medium text-gray-600">
          조건에 맞는 업체가 없습니다
        </p>
        <p className="text-xs text-gray-400">
          필터 조건을 바꿔서 다시 검색해보세요
        </p>
      </div>
    );
  }

  // ── 업체 카드 목록 ────────────────────────────────────
  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-4 px-4 pb-10">
      <p className="text-xs text-gray-400 pt-2">
        총 {filtered.length}개 업체
      </p>
      {filtered.map((biz) => (
        <BusinessCard key={biz.id} biz={biz} />
      ))}
    </div>
  );
}

// ── 업체 카드 컴포넌트 ─────────────────────────────────
interface BusinessCardProps {
  biz: Business;
}

const BusinessCard = ({ biz }: BusinessCardProps) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-150">
      {/* 업체명 + 커버리지 */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3 className="text-base font-semibold text-gray-800">{biz.name}</h3>
        <CoverageBadge type={biz.coverageType} sido={biz.coverageSido} />
      </div>

      {/* 한 줄 소개 */}
      <p className="text-sm text-gray-500 mb-3">{biz.shortDescription}</p>

      {/* 서비스 태그들 */}
      {biz.services?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {biz.services.slice(0, 4).map((s) => (
            <span
              key={s}
              className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-600 border border-blue-100"
            >
              {s}
            </span>
          ))}
          {biz.services.length > 4 && (
            <span className="rounded-full bg-gray-50 px-2.5 py-0.5 text-xs text-gray-400 border border-gray-100">
              +{biz.services.length - 4}
            </span>
          )}
        </div>
      )}

      {/* 업체 특성 태그들 */}
      {biz.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {biz.tags.slice(0, 4).map((t) => (
            <span
              key={t}
              className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-600 border border-emerald-100"
            >
              #{t}
            </span>
          ))}
          {biz.tags.length > 4 && (
            <span className="rounded-full bg-gray-50 px-2.5 py-0.5 text-xs text-gray-400 border border-gray-100">
              +{biz.tags.length - 4}
            </span>
          )}
        </div>
      )}

      {/* 연락처 */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-sm text-gray-600">{biz.phone}</span>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          {biz.ratingAvg > 0 && (
            <span>⭐ {biz.ratingAvg.toFixed(1)} ({biz.ratingCount})</span>
          )}
          {biz.reviewCount > 0 && <span>리뷰 {biz.reviewCount}</span>}
        </div>
      </div>
    </div>
  );
};

// ── 커버리지 뱃지 ──────────────────────────────────────
interface CoverageBadgeProps {
  type: Business['coverageType'];
  sido?: string[];
}

const CoverageBadge = ({ type, sido }: CoverageBadgeProps) => {
  if (type === 'nationwide') {
    return (
      <span className="shrink-0 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs text-purple-600 border border-purple-100">
        🌐 전국
      </span>
    );
  }
  if (type === 'regional' && sido) {
    return (
      <span className="shrink-0 rounded-full bg-orange-50 px-2.5 py-0.5 text-xs text-orange-600 border border-orange-100">
        📍 {sido.slice(0, 2).join('·')}{sido.length > 2 ? ` 외 ${sido.length - 2}` : ''}
      </span>
    );
  }
  if (type === 'radius') {
    return (
      <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-0.5 text-xs text-green-600 border border-green-100">
        🏠 거점반경
      </span>
    );
  }
  return null;
};
