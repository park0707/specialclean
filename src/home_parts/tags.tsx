// src/home_parts/tags.tsx
import { useState } from 'react';
import { useSearch } from '../searchcontext';
import { SERVICE_CATEGORIES, TAG_GROUPS } from '../lib/companyFormOptions';
import LocationSearchInput from './LocationSearchInput.tsx';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

type FilterTab = '지역' | '서비스 종류' | '업체 특성';

export default function Tags() {
  const { selectedServices, setSelectedServices, selectedTags, setSelectedTags } =
    useSearch();
  const [activeTab, setActiveTab] = useState<FilterTab>('지역');
  const [isOpen, setIsOpen] = useState<boolean>(true);

  const toggleService = (item: string) => {
    setSelectedServices((prev: string[]) =>
      prev.includes(item) ? prev.filter((s: string) => s !== item) : [...prev, item],
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev: string[]) =>
      prev.includes(tag) ? prev.filter((t: string) => t !== tag) : [...prev, tag],
    );
  };

  const tabs: FilterTab[] = ['지역', '서비스 종류', '업체 특성'];

  return (
    <div id="filter-tabs" className="w-full bg-white flex flex-col items-center">
      {/* 탭 헤더 */}
      <div className="flex items-center border-b border-gray-200">
        <div className="flex flex-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              id={
                tab === '지역' ? 'location-filter-tab' :
                tab === '서비스 종류' ? 'service-filter-tab' :
                'tag-filter-tab'
              }
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-medium transition-colors duration-150 cursor-pointer ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
              {tab === '서비스 종류' && selectedServices.length > 0 && (
                <span className="ml-1.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-xs text-blue-600">
                  {selectedServices.length}
                </span>
              )}
              {tab === '업체 특성' && selectedTags.length > 0 && (
                <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-600">
                  {selectedTags.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 펼치기/접기 버튼 (기존 <div>line</div> 위치) */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center justify-center px-3 py-3 text-gray-400 hover:text-gray-600 transition-colors duration-150 cursor-pointer"
          aria-label={isOpen ? '필터 접기' : '필터 펼치기'}
        >
          {isOpen ? (
            <ChevronUpIcon className="w-5 h-5" />
          ) : (
            <ChevronDownIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* 탭 콘텐츠 — isOpen 상태로 토글 */}
      {isOpen && (
        <div className="p-4">

          {/* 지역 탭 */}
          {activeTab === '지역' && (
            <div>
              <p className="text-sm text-gray-500 mb-3">
                작업을 원하는 주소를 검색하세요
              </p>
              <LocationSearchInput />
            </div>
          )}

          {/* 서비스 종류 탭 */}
          {activeTab === '서비스 종류' && (
            <div id="categories-selection" className="space-y-4">
              {SERVICE_CATEGORIES.map(({ category, items }) => (
                <div key={category}>
                  <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    {category}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleService(item)}
                        className={`rounded-full px-3 py-1 text-sm border transition-colors duration-150 cursor-pointer ${
                          selectedServices.includes(item)
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {selectedServices.length > 0 && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-blue-600">
                    {selectedServices.length}개 선택됨
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedServices([])}
                    className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    초기화
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 업체 특성 탭 */}
          {activeTab === '업체 특성' && (
            <div id="tags-filter" className="space-y-5">
              {TAG_GROUPS.map(({ group, description, tags }) => (
                <div key={group}>
                  <div className="mb-2">
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                      {group}
                    </p>
                    <p className="text-xs text-gray-400">{description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`rounded-full px-3 py-1 text-sm border transition-colors duration-150 cursor-pointer ${
                          selectedTags.includes(tag)
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-400'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {selectedTags.length > 0 && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-emerald-600">
                    {selectedTags.length}개 선택됨
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedTags([])}
                    className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    초기화
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}