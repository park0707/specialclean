import { Combobox } from '@headlessui/react';
import { useState } from 'react';
import {MagnifyingGlassIcon} from '@heroicons/react/24/solid'
import { useSearch } from '../searchcontext';

const items = [
  { id: 1, name: '청소 업체' },
  { id: 2, name: '이사 청소' },
  { id: 3, name: '사무실 청소' },
  { id: 4, name: '에어컨 청소' },
]; // 검색창 클릭 시 예시로 보이는 데이터, 나중에 수정해야 함

export default function SearchBox() {
  const { setText } = useSearch();
  const [query, setQuery] = useState('');

  const filtered =
    query === ''
      ? items
      : items.filter((item) =>
          item.name.toLowerCase().includes(query.toLowerCase())
        );
    const handleComboboxChange = (value: string | null) => {
      const v = value ?? '';
      setQuery(v);
      setText(v);
    };

    const handleSearch = () => {
      setText(query);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        setText(query);
      }
    };

  return (
    <div className="w-full max-w-md">
      <Combobox value={query} onChange={handleComboboxChange}>
        <div className="relative">
          <Combobox.Input
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="태그를 선택하거나 검색하세요..."
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            onClick={handleSearch}
            className="absolute left-2 top-1/2 -translate-y-1/2"
          >
            <MagnifyingGlassIcon
              className="h-4 w-4 text-blue-500 hover:text-blue-700"
              aria-hidden="true"
            />
          </button>

          <Combobox.Options className="absolute z-40 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none">
            {filtered.length === 0 && query !== '' ? (
              <div className="px-3 py-2 text-gray-500">검색 결과 없음</div>
            ) : (
              filtered.map((item) => (
                <Combobox.Option
                  key={item.id}
                  value={item.name}
                  className={({ active }) =>
                    `${
                      active ? 'bg-blue-500 text-white' : 'text-gray-900'
                    } cursor-pointer select-none px-3 py-2`
                  }
                >
                  {item.name}
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </div>
      </Combobox>
    </div>
  );
}
