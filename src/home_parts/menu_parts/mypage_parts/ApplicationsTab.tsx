import { useState } from "react";
import type { BusinessApplication } from "../mypage";

interface ApplicationsTabProps {
  applications: BusinessApplication[];
  loading: boolean;
  onSelectApp: (app: BusinessApplication) => void;
}

export default function ApplicationsTab({
  applications,
  loading,
  onSelectApp,
}: ApplicationsTabProps) {
  const [appFilter, setAppFilter] = useState<"submitted" | "approved">("submitted");

  const filteredApps = applications.filter((app) => {
    if (appFilter === "submitted") {
      return app.status === "submitted";
    }
    return app.status === "approved";
  });

  const submittedCount = applications.filter((a) => a.status === "submitted").length;
  const approvedCount = applications.filter((a) => a.status === "approved").length;

  return (
    <div className="space-y-4">
      {/* 상태 필터 탭 */}
      <div className="flex gap-2 border-b pb-3">
        <button
          onClick={() => setAppFilter("submitted")}
          className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold border transition ${
            appFilter === "submitted"
              ? "bg-blue-500 text-white border-blue-500"
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
          }`}
        >
          승인 대기 중 ({submittedCount})
        </button>
        <button
          onClick={() => setAppFilter("approved")}
          className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold border transition ${
            appFilter === "approved"
              ? "bg-emerald-500 text-white border-emerald-500"
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
          }`}
        >
          승인 완료 ({approvedCount})
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="text-gray-500 text-sm font-medium">신청 목록을 불러오는 중입니다...</p>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="text-gray-500 text-sm font-medium">
            {appFilter === "submitted" ? "승인 대기 중인 업체가 없습니다." : "승인 완료된 업체가 없습니다."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              onClick={() => onSelectApp(app)}
              className="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm hover:shadow-md border border-transparent hover:border-blue-200 transition duration-150 cursor-pointer"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-800">{app.name}</h4>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      app.status === "submitted"
                        ? "bg-blue-50 text-blue-600 border border-blue-100"
                        : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    }`}
                  >
                    {app.status === "submitted" ? "대기 중" : "승인 완료"}
                  </span>
                </div>
                <p className="text-xs text-gray-500">신청자: {app.ownerEmail}</p>
                <p className="text-xs text-gray-400">
                  신청일: {app.createdAt ? new Date(app.createdAt.seconds * 1000).toLocaleString() : "날짜 없음"}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectApp(app);
                }}
                className="rounded border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 hover:border-gray-300 font-medium cursor-pointer"
              >
                신청서 확인
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
