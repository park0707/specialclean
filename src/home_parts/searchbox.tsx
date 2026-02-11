import { Combobox } from '@headlessui/react';
import { useState } from 'react';
import {MagnifyingGlassIcon} from '@heroicons/react/24/solid'

const items = [
  { id: 1, name: '청소 업체' },
  { id: 2, name: '이사 청소' },
  { id: 3, name: '사무실 청소' },
  { id: 4, name: '에어컨 청소' },
]; // 검색창 클릭 시 예시로 보이는 데이터, 나중에 수정해야 함, 아예 다른 파일에서 복잡하게 구현하고 여기서 호출하는 방법도 고려

export default function SearchBox() {
  const [query, setQuery] = useState('');

  const filtered =
    query === ''
      ? items
      : items.filter((item) =>
          item.name.toLowerCase().includes(query.toLowerCase())
        );
    const handleComboboxChange = (value: string | null) => {
      setQuery(value ?? '');
    };
  return (
    <div className="w-full max-w-md">
      <Combobox value={query} onChange={handleComboboxChange}>
        <div className="relative">
          <Combobox.Input
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="태그를 선택하거나 검색하세요..."
            onChange={(e) => setQuery(e.target.value)}
          />
          <MagnifyingGlassIcon
            className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2  text-blue-500"
            aria-hidden="true"
          />
          {/*돋보기 모양 아이콘에 나중에 button으로 감싸고 클릭 시 검색 되도록, 그리고 엔터 눌러도 검색 되도록 해야 함 */}

          <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none">
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
