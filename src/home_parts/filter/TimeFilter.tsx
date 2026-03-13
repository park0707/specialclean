import { useSearch } from '../../searchcontext';
import { ClockIcon } from '@heroicons/react/24/outline';

/**
 * 작업 시간 필터 — 시작/종료 시간 입력 + 24시간 운영 체크박스.
 * openingHours.weekday.open <= start AND openingHours.weekday.close >= end 조건으로 필터.
 * 24시간 운영: open === 0 && (close === 0 || close === 24)
 */
export default function TimeFilter() {
  const { filter, setFilter } = useSearch();

  function handleStart(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value === '' ? null : Number(e.target.value);
    setFilter((prev) => ({ ...prev, timeStart: v }));
  }

  function handleEnd(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value === '' ? null : Number(e.target.value);
    setFilter((prev) => ({ ...prev, timeEnd: v }));
  }

  function toggle24h() {
    setFilter((prev) => ({
      ...prev,
      only24h: !prev.only24h,
      // 24시간 선택 시 시간 입력 초기화
      ...(prev.only24h ? {} : { timeStart: null, timeEnd: null }),
    }));
  }

  function clearTime() {
    setFilter((prev) => ({
      ...prev,
      timeStart: null,
      timeEnd: null,
      only24h: false,
    }));
  }

  return (
    <div className="w-full max-w-md space-y-3">
      <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
        <ClockIcon className="h-4 w-4 text-blue-500" />
        작업 시간
      </label>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          max={23}
          disabled={filter.only24h}
          value={filter.timeStart ?? ''}
          onChange={handleStart}
          placeholder="시작"
          className="w-20 rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
        />
        <span className="text-sm text-gray-500">시 ~</span>
        <input
          type="number"
          min={0}
          max={24}
          disabled={filter.only24h}
          value={filter.timeEnd ?? ''}
          onChange={handleEnd}
          placeholder="종료"
          className="w-20 rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
        />
        <span className="text-sm text-gray-500">시</span>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={filter.only24h}
          onChange={toggle24h}
          className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">24시간 운영 업체만</span>
      </label>

      {(filter.timeStart !== null || filter.timeEnd !== null || filter.only24h) && (
        <button
          onClick={clearTime}
          className="text-xs text-gray-400 hover:text-red-500"
        >
          초기화
        </button>
      )}
    </div>
  );
}
