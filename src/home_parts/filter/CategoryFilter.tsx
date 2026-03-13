import { useSearch } from '../../searchcontext';
import { TagIcon } from '@heroicons/react/24/outline';

/**
 * 분류 필터 — 태그/서비스 항목을 체크박스 버튼으로 선택.
 * 선택된 항목은 Firestore tags OR services에 매칭됩니다.
 *
 * Firestore array-contains-any는 최대 10개까지 서버 필터 가능.
 * 10개 초과 시 useBusinessSearch에서 클라이언트 필터로 폴백합니다.
 */

// 자주 사용되는 태그/서비스 목록 (필요에 따라 Firestore에서 동적 로드 가능)
const PRESET_TAGS = [
  '유품정리',
  '쓰레기집',
  '화재복구',
  '고독사',
  '특수청소',
  '이사청소',
  '사무실청소',
  '에어컨청소',
  '바이러스방역',
  '곰팡이제거',
  '긴급출동',
  '24시간',
  '여성팀',
  '폐기물처리',
];

export default function CategoryFilter() {
  const { filter, setFilter } = useSearch();

  function toggle(tag: string) {
    setFilter((prev) => {
      const next = prev.categories.includes(tag)
        ? prev.categories.filter((c) => c !== tag)
        : [...prev.categories, tag];
      return { ...prev, categories: next };
    });
  }

  function clearAll() {
    setFilter((prev) => ({ ...prev, categories: [] }));
  }

  return (
    <div className="w-full max-w-md space-y-3">
      <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
        <TagIcon className="h-4 w-4 text-blue-500" />
        분류 선택
      </label>

      <div className="flex flex-wrap gap-2">
        {PRESET_TAGS.map((tag) => {
          const selected = filter.categories.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => toggle(tag)}
              className={`rounded-full px-3 py-1 text-sm border-2 transition-colors ${
                selected
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-500'
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {filter.categories.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {filter.categories.length}개 선택
          </span>
          <button
            onClick={clearAll}
            className="text-xs text-gray-400 hover:text-red-500"
          >
            전체 해제
          </button>
        </div>
      )}
    </div>
  );
}
