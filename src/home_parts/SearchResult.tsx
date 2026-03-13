import { useSearch } from '../searchcontext';
import { useBusinessSearch } from '../hooks/useBusinessSearch';
import BusinessCard from './BusinessCard';
import SortBar from './filter/SortBar';

export default function SearchResult() {
  const { text, filter } = useSearch();
  const { results, loading, error } = useBusinessSearch(text, filter);

  // 필터가 전혀 적용되지 않은 초기 상태면 결과 영역을 표시하지 않음
  const hasAnyFilter =
    text.trim() !== '' ||
    filter.regionWide !== '' ||
    filter.categories.length > 0 ||
    filter.timeStart !== null ||
    filter.timeEnd !== null ||
    filter.only24h ||
    filter.priceMin !== null ||
    filter.priceMax !== null;

  if (!hasAnyFilter) return null;

  return (
    <div className="w-full max-w-2xl mt-6 space-y-4">
      {/* 정렬 바 + 결과 수 */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">
          {loading ? '검색 중...' : `${results.length}개 업체`}
        </span>
        <SortBar />
      </div>

      {/* 에러 */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 로딩 */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      )}

      {/* 결과 목록 */}
      {!loading && results.length > 0 && (
        <div className="grid gap-3">
          {results.map((biz) => (
            <BusinessCard key={biz.id} business={biz} />
          ))}
        </div>
      )}

      {/* 결과 없음 */}
      {!loading && !error && results.length === 0 && (
        <div className="py-8 text-center text-sm text-gray-500">
          조건에 맞는 업체가 없습니다.
        </div>
      )}
    </div>
  );
}
