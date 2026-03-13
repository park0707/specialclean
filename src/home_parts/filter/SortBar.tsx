import { useSearch, type SortKey, type SortDir } from '../../searchcontext';
import { ArrowsUpDownIcon } from '@heroicons/react/24/outline';

const SORT_OPTIONS: { label: string; key: SortKey; dir: SortDir }[] = [
  { label: '북마크 많은 순', key: 'bookmarkCount', dir: 'desc' },
  { label: '북마크 적은 순', key: 'bookmarkCount', dir: 'asc' },
  { label: '리뷰 많은 순', key: 'reviewCount', dir: 'desc' },
  { label: '리뷰 적은 순', key: 'reviewCount', dir: 'asc' },
];

export default function SortBar() {
  const { filter, setFilter } = useSearch();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const idx = Number(e.target.value);
    const opt = SORT_OPTIONS[idx];
    setFilter((prev) => ({ ...prev, sortKey: opt.key, sortDir: opt.dir }));
  }

  const currentIdx = SORT_OPTIONS.findIndex(
    (o) => o.key === filter.sortKey && o.dir === filter.sortDir,
  );

  return (
    <div className="flex items-center gap-2">
      <ArrowsUpDownIcon className="h-4 w-4 text-gray-500" />
      <select
        value={currentIdx >= 0 ? currentIdx : 0}
        onChange={handleChange}
        className="rounded-md border border-gray-300 bg-white py-1.5 px-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {SORT_OPTIONS.map((opt, i) => (
          <option key={i} value={i}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
