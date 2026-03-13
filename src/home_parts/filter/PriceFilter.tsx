import { useSearch } from '../../searchcontext';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';

/**
 * 가격 필터 UI — 현재 Firestore에 price 필드가 없으므로 UI만 제공합니다.
 * price 필드가 추가되면 useBusinessSearch.ts의 가격 필터 주석을 해제하세요.
 */
export default function PriceFilter() {
  const { filter, setFilter } = useSearch();

  function handleMin(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value === '' ? null : Number(e.target.value);
    setFilter((prev) => ({ ...prev, priceMin: v }));
  }

  function handleMax(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value === '' ? null : Number(e.target.value);
    setFilter((prev) => ({ ...prev, priceMax: v }));
  }

  function clearPrice() {
    setFilter((prev) => ({ ...prev, priceMin: null, priceMax: null }));
  }

  return (
    <div className="w-full max-w-md space-y-2">
      <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
        <CurrencyDollarIcon className="h-4 w-4 text-blue-500" />
        가격 범위
      </label>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          value={filter.priceMin ?? ''}
          onChange={handleMin}
          placeholder="최소"
          className="w-28 rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-500">~</span>
        <input
          type="number"
          min={0}
          value={filter.priceMax ?? ''}
          onChange={handleMax}
          placeholder="최대"
          className="w-28 rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-500">원</span>
      </div>

      {(filter.priceMin !== null || filter.priceMax !== null) && (
        <button
          onClick={clearPrice}
          className="text-xs text-gray-400 hover:text-red-500"
        >
          초기화
        </button>
      )}

      {/* TODO: price 필드가 Firestore에 추가되면 이 안내 제거 */}
      <p className="text-xs text-amber-600">
        현재 가격 정보가 등록되지 않아 필터가 적용되지 않습니다.
      </p>
    </div>
  );
}
