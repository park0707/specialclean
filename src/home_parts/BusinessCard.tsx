import { MapPinIcon, StarIcon, BookmarkIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import type { Business } from '../hooks/useBusinessSearch';

interface Props {
  business: Business;
}

export default function BusinessCard({ business }: Props) {
  const b = business;
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* 상단: 이름 + 지역 */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-gray-900 leading-tight">
          {b.name}
        </h3>
        <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
          <MapPinIcon className="h-3.5 w-3.5" />
          <span>{b.regionWide} {b.regionDetail}</span>
        </div>
      </div>

      {/* 한 줄 소개 */}
      {b.shortDescription && (
        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
          {b.shortDescription}
        </p>
      )}

      {/* 태그 */}
      {b.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {b.tags.slice(0, 5).map((tag) => (
            <span
              key={tag}
              className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
            >
              {tag}
            </span>
          ))}
          {b.tags.length > 5 && (
            <span className="text-xs text-gray-400">+{b.tags.length - 5}</span>
          )}
        </div>
      )}

      {/* 하단: 평점, 리뷰, 북마크 */}
      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-0.5">
          <StarIcon className="h-3.5 w-3.5 text-yellow-500" />
          {b.ratingAvg.toFixed(1)}
        </span>
        <span className="flex items-center gap-0.5">
          <ChatBubbleLeftIcon className="h-3.5 w-3.5" />
          리뷰 {b.reviewCount}
        </span>
        <span className="flex items-center gap-0.5">
          <BookmarkIcon className="h-3.5 w-3.5" />
          북마크 {b.bookmarkCount}
        </span>
      </div>
    </div>
  );
}
