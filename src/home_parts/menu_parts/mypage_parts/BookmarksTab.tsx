import { Link } from "@tanstack/react-router";
import type { BookmarkedBusiness } from "../mypage";

interface BookmarksTabProps {
  bookmarks: BookmarkedBusiness[];
  loading: boolean;
  onRemoveBookmark: (businessId: string) => Promise<void>;
}

export default function BookmarksTab({
  bookmarks,
  loading,
  onRemoveBookmark,
}: BookmarksTabProps) {
  if (loading) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-gray-500 text-sm font-medium">북마크를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-gray-500 text-sm font-medium">북마크한 업체가 없습니다.</p>
        <p className="text-gray-400 text-xs mt-1">마음에 드는 청소 업체를 찾아 북마크해 보세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookmarks.map((company) => (
        <div
          key={company.id}
          className="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm border border-gray-100"
        >
          <div>
            <h4 className="font-semibold text-gray-800">{company.name}</h4>
            <p className="mt-1 text-sm text-gray-500">{company.region}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {company.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="text-sm font-medium text-yellow-500">
              ⭐ {company.ratingAvg > 0 ? company.ratingAvg.toFixed(1) : "평점 없음"}
            </span>
            <Link
              to="/business/$businessId"
              params={{ businessId: company.id }}
              className="rounded border px-3 py-1 text-xs text-blue-500 hover:bg-blue-50 cursor-pointer text-center"
            >
              상세보기
            </Link>
            <button
              onClick={() => void onRemoveBookmark(company.id)}
              className="text-xs text-gray-400 hover:text-red-400 cursor-pointer"
            >
              북마크 해제
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
