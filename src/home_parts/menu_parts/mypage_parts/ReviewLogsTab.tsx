import type { ReviewDeleteLog } from "../mypage";

interface ReviewLogsTabProps {
  reviewDeleteLogs: ReviewDeleteLog[];
  loading: boolean;
}

export default function ReviewLogsTab({
  reviewDeleteLogs,
  loading,
}: ReviewLogsTabProps) {
  if (loading) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-gray-500 text-sm font-medium">로그를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (reviewDeleteLogs.length === 0) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-gray-500 text-sm font-medium">리뷰 삭제 이력이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-700 text-sm">리뷰 삭제 이력 ({reviewDeleteLogs.length}건)</h4>
      </div>
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">삭제 일시</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">업체명</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">리뷰 작성자</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">리뷰 내용</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">별점</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">삭제자</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">역할</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reviewDeleteLogs.map((log) => {
              const deletedDate = log.deletedAt
                ? new Date(log.deletedAt.seconds * 1000).toLocaleString("ko-KR", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "-";
              return (
                <tr key={log.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{deletedDate}</td>
                  <td className="px-4 py-3 text-xs font-medium text-gray-800 whitespace-nowrap">{log.businessName}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{log.reviewUserEmail}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-[200px]">
                    <span className="line-clamp-2">{log.reviewContent}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-yellow-500 whitespace-nowrap">
                    {"⭐".repeat(log.reviewRating)}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{log.deletedByEmail}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        log.deletedByRole === "admin"
                          ? "bg-red-50 text-red-600 border border-red-100"
                          : "bg-green-50 text-green-600 border border-green-100"
                      }`}
                    >
                      {log.deletedByRole === "admin" ? "관리자" : "업체주"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
