import type { BusinessApplication } from "../mypage";

interface ApplicationDetailModalProps {
  app: BusinessApplication | null;
  onClose: () => void;
  onApprove: (app: BusinessApplication) => Promise<void>;
  saving: boolean;
}

export default function ApplicationDetailModal({
  app,
  onClose,
  onApprove,
  saving,
}: ApplicationDetailModalProps) {
  if (!app) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{app.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">신청자 이메일: {app.ownerEmail}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 space-y-5 overflow-y-auto pr-1">
          {/* 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg text-sm">
            <div>
              <span className="font-semibold text-gray-500 block text-xs mb-0.5">연락처</span>
              <span className="text-gray-800 font-medium">{app.phone}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-500 block text-xs mb-0.5">사업자등록번호</span>
              <span className="text-gray-800 font-medium">{app.businessRegNumber}</span>
            </div>
            <div className="md:col-span-2">
              <span className="font-semibold text-gray-500 block text-xs mb-0.5">웹사이트</span>
              {app.website ? (
                <a
                  href={app.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline font-medium break-all"
                >
                  {app.website}
                </a>
              ) : (
                <span className="text-gray-400 font-normal">등록되지 않음</span>
              )}
            </div>
          </div>

          {/* 서비스 범위 */}
          <div>
            <h5 className="font-bold text-sm text-gray-700 mb-2">📍 서비스 범위</h5>
            <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-1">
              <p>
                <span className="font-medium text-gray-500">유형:</span>{" "}
                <span className="font-semibold text-blue-600">
                  {app.coverageType === "nationwide" && "🌐 전국 출장"}
                  {app.coverageType === "regional" && "📍 특정 광역권 선택"}
                  {app.coverageType === "radius" && "🏠 거점 반경 설정"}
                </span>
              </p>
              {app.coverageType === "regional" && app.coverageSido && (
                <p>
                  <span className="font-medium text-gray-500">대상 시/도:</span>{" "}
                  <span className="text-gray-800 font-medium">{app.coverageSido.join(", ")}</span>
                </p>
              )}
              {app.coverageType === "radius" && (
                <>
                  <p>
                    <span className="font-medium text-gray-500">본사 주소:</span>{" "}
                    <span className="text-gray-800 font-medium">{app.baseAddress}</span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-500">서비스 반경:</span>{" "}
                    <span className="text-gray-800 font-semibold text-blue-600">
                      {app.serviceRadiusKm}km
                    </span>
                  </p>
                </>
              )}
            </div>
          </div>

          {/* 제공 서비스 및 태그 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-bold text-sm text-gray-700 mb-2">🛠️ 제공 서비스</h5>
              <div className="flex flex-wrap gap-1.5">
                {app.services && app.services.length > 0 ? (
                  app.services.map((service) => (
                    <span
                      key={service}
                      className="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-600 font-medium border border-blue-100"
                    >
                      {service}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">등록된 서비스 없음</span>
                )}
              </div>
            </div>

            <div>
              <h5 className="font-bold text-sm text-gray-700 mb-2">🏷️ 태그 목록</h5>
              <div className="flex flex-wrap gap-1.5">
                {app.tags && app.tags.length > 0 ? (
                  app.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-600 font-medium border border-emerald-100"
                    >
                      #{tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">등록된 태그 없음</span>
                )}
              </div>
            </div>
          </div>

          {/* 운영 시간 */}
          {app.openingHours && (
            <div>
              <h5 className="font-bold text-sm text-gray-700 mb-2">⏰ 운영 시간</h5>
              <div className="bg-gray-50 p-4 rounded-lg text-sm grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-500 block mb-1">평일</span>
                  {app.openingHours.weekday.closed ? (
                    <span className="text-red-500 font-semibold">휴무</span>
                  ) : (
                    <span className="text-gray-800 font-semibold">
                      {app.openingHours.weekday.open}시 ~ {app.openingHours.weekday.close}시
                    </span>
                  )}
                </div>
                <div>
                  <span className="font-medium text-gray-500 block mb-1">주말·공휴일</span>
                  {app.openingHours.weekend.closed ? (
                    <span className="text-red-500 font-semibold">휴무</span>
                  ) : (
                    <span className="text-gray-800 font-semibold">
                      {app.openingHours.weekend.open}시 ~ {app.openingHours.weekend.close}시
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 한 줄 소개 및 상세 설명 */}
          <div className="space-y-3">
            <div>
              <h5 className="font-bold text-sm text-gray-700 mb-1">💬 한 줄 소개</h5>
              <p className="bg-gray-50 p-3 rounded-lg text-sm text-gray-800 font-semibold border-l-4 border-blue-400">
                {app.shortDescription}
              </p>
            </div>
            <div>
              <h5 className="font-bold text-sm text-gray-700 mb-1">📋 상세 설명</h5>
              <p className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 whitespace-pre-wrap leading-relaxed min-h-[100px]">
                {app.description}
              </p>
            </div>
          </div>
        </div>

        {/* 푸터 버튼 */}
        <div className="border-t pt-4 mt-6 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
          >
            닫기
          </button>
          {app.status === "submitted" && (
            <button
              onClick={() => void onApprove(app)}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer"
            >
              {saving ? "승인 중..." : "승인하기"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
