import type { User } from "firebase/auth";

interface ProfileTabProps {
  user: User | null;
  isAdmin: boolean;
  isManager: boolean;
  onPwChange: () => void;
  onDeleteAccount: () => void;
  onStartTour: () => void;
}

export default function ProfileTab({
  user,
  isAdmin,
  isManager,
  onPwChange,
  onDeleteAccount,
  onStartTour,
}: ProfileTabProps) {
  const isGoogleUser = !!user?.providerData?.find((p) => p.providerId === "google.com");

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold">계정 관리</h3>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">닉네임</label>
          <div className="w-full max-w-sm rounded border bg-gray-100 px-3 py-2 text-sm">
            {user?.displayName || "사용자"}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">이메일</label>
          <div className="w-full max-w-sm rounded border bg-gray-100 px-3 py-2 text-sm">
            {user?.email || "이메일 없음"}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">계정 유형</label>
          {isAdmin ? (
            <span className="inline-block rounded bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
              관리자 계정
            </span>
          ) : isManager ? (
            <span className="inline-block rounded bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
              업체 관리자
            </span>
          ) : (
            <span className="inline-block rounded bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
              일반 사용자
            </span>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">로그인 방식</label>
          {isGoogleUser ? (
            <span className="inline-block rounded bg-green-100 px-2 py-1 text-sm font-medium text-green-700">
              구글 로그인
            </span>
          ) : (
            <span className="inline-block rounded bg-blue-100 px-2 py-1 text-sm font-medium text-blue-700">
              이메일 로그인
            </span>
          )}
        </div>
        {!isGoogleUser && (
          <button
            className="rounded border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer"
            onClick={onPwChange}
          >
            비밀번호 변경
          </button>
        )}
        <div className="border-t pt-4 flex items-center gap-4">
          <button
            id="mypage-withdraw-btn"
            type="button"
            onClick={onDeleteAccount}
            className="text-sm text-red-400 hover:text-red-600 border-red-600 hover:border-b cursor-pointer"
          >
            회원 탈퇴
          </button>
          <button
            type="button"
            onClick={onStartTour}
            className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            서비스 튜토리얼 시작
          </button>
        </div>
      </div>
    </div>
  );
}
