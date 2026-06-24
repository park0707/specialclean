import { Link } from "@tanstack/react-router";
import type { BusinessApplication } from "../mypage";

interface MyBusinessesTabProps {
  myBusinesses: BusinessApplication[];
  loading: boolean;
}

export default function MyBusinessesTab({
  myBusinesses,
  loading,
}: MyBusinessesTabProps) {
  if (loading) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-gray-500 text-sm font-medium">업체 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (myBusinesses.length === 0) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-gray-500 text-sm font-medium">등록된 업체가 없습니다.</p>
        <p className="text-gray-400 text-xs mt-1">업체 신청 후 승인이 완료되면 여기서 확인할 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-700 text-sm">내 등록 업체 ({myBusinesses.length}개)</h4>
      </div>
      <div className="space-y-3">
        {myBusinesses.map((biz) => (
          <div key={biz.id} className="rounded-xl bg-white p-5 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-gray-800 text-base">{biz.name}</h4>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      biz.status === "approved"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        : "bg-amber-50 text-amber-600 border border-amber-100"
                    }`}
                  >
                    {biz.status === "approved" ? "✓ 승인 완료" : "⏳ 승인 대기 중"}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">{biz.shortDescription}</p>
                <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                  <span>⭐ {biz.ratingAvg && biz.ratingAvg > 0 ? biz.ratingAvg.toFixed(1) : "평점 없음"}</span>
                  <span>💬 후기 {biz.reviewCount ?? 0}개</span>
                  <span>🔖 북마크 {biz.bookmarkCount ?? 0}회</span>
                </div>
              </div>
              {biz.status === "approved" && (
                <Link
                  to="/business/$businessId"
                  params={{ businessId: biz.id }}
                  className="shrink-0 rounded-lg bg-blue-500 hover:bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition cursor-pointer"
                >
                  상세 페이지로 →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
