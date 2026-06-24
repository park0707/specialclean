import { useEffect, useState, useRef } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSearch } from '../searchcontext';
import { useAuth } from '../logincontext';
import { applyAllFilters } from '../lib/filterBusinesses';
import type { Business } from '../lib/filterBusinesses';
import { useNavigate } from '@tanstack/react-router';

export default function BusinessList() {
  const { query: textQuery, locationResult, selectedServices, selectedTags } =
    useSearch();
  const { loading: authLoading } = useAuth();

  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [filtered, setFiltered] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // 스크롤 이동을 위한 ref
  const listTopRef = useRef<HTMLDivElement>(null);

  // ── Firestore fetch (authLoading 끝난 후 1회) ─────────
  useEffect(() => {
    if (authLoading) return;

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
  }, [authLoading]);

  // ── 필터 적용 ────────────────────────────────────────
  useEffect(() => {
    const result = applyAllFilters(allBusinesses, {
      loc: locationResult,
      selectedServices,
      selectedTags,
      query: textQuery,
    });
    setFiltered(result);
  }, [allBusinesses, locationResult, selectedServices, selectedTags, textQuery]);

  // ── 필터 조건 변경 시 페이지 번호 리셋 ─────────────────────
  useEffect(() => {
    setCurrentPage(1);
  }, [locationResult, selectedServices, selectedTags, textQuery]);

  // ── 페이지 번호 변경 시 목록 상단으로 스크롤 ──────────────────
  useEffect(() => {
    if (listTopRef.current) {
      listTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage]);

  if (loading) {
    return (
      <div className="w-full flex justify-center py-16 text-sm text-gray-400">
        업체 목록 불러오는 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex justify-center py-16 text-sm text-red-400">
        {error}
      </div>
    );
  }

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

  // 페이지네이션 계산
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedBusinesses = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const blockSize = 5;
  const currentBlock = Math.floor((currentPage - 1) / blockSize);
  const startPage = currentBlock * blockSize + 1;
  const endPage = Math.min(startPage + blockSize - 1, totalPages);

  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div id="business-list" ref={listTopRef} className="w-full max-w-3xl mx-auto flex flex-col gap-4 px-4 pb-10">
      <p className="text-xs text-gray-400 pt-2">
        총 {filtered.length}개 업체 중 {(currentPage - 1) * itemsPerPage + 1}~{Math.min(currentPage * itemsPerPage, filtered.length)}번째 업체 표시
      </p>
      {paginatedBusinesses.map((biz) => (
        <BusinessCard key={biz.id} biz={biz} />
      ))}

      {/* 페이지네이션 컨트롤 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 sm:gap-1.5 mt-8 pb-6 flex-wrap">
          {/* 처음으로 (<<) */}
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white disabled:cursor-not-allowed transition-all duration-200 text-xs sm:text-sm font-medium cursor-pointer"
            title="첫 페이지로"
          >
            &lt;&lt;
          </button>
          
          {/* 이전 블록 (<) */}
          <button
            onClick={() => setCurrentPage(startPage - 1)}
            disabled={startPage === 1}
            className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white disabled:cursor-not-allowed transition-all duration-200 text-xs sm:text-sm font-medium cursor-pointer"
            title="이전 블록으로"
          >
            &lt;
          </button>

          {/* 페이지 번호 */}
          {pageNumbers.map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg border text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                currentPage === page
                  ? 'border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-100'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {page}
            </button>
          ))}

          {/* 다음 블록 (>) */}
          <button
            onClick={() => setCurrentPage(endPage + 1)}
            disabled={endPage === totalPages}
            className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white disabled:cursor-not-allowed transition-all duration-200 text-xs sm:text-sm font-medium cursor-pointer"
            title="다음 블록으로"
          >
            &gt;
          </button>

          {/* 마지막으로 (>>) */}
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white disabled:cursor-not-allowed transition-all duration-200 text-xs sm:text-sm font-medium cursor-pointer"
            title="마지막 페이지로"
          >
            &gt;&gt;
          </button>
        </div>
      )}
    </div>
  );
}

interface BusinessCardProps {
  biz: Business;
}

const BusinessCard = ({ biz }: BusinessCardProps) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate({ to: `/business/${biz.id}` });
  };

  return (
    <div 
      onClick={handleCardClick}
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-150 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3 className="text-base font-semibold text-gray-800">{biz.name}</h3>
        <CoverageBadge type={biz.coverageType} sido={biz.coverageSido} />
      </div>

      <p className="text-sm text-gray-500 mb-3">{biz.shortDescription}</p>

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