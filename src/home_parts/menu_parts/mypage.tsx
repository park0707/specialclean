//ai돌려서 만든 초안, 내가 직접 수정할 필요 있음. (2026-02-21)
// 회원 탈퇴 버튼 동작 구현해야 함, 우선 북마크, 리뷰 등을 저장할 firestore 만든 후 회원 탈퇴시 해당 정보도 삭제 되도록 해야 되서 나중에 하기로
import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { useAuth } from "../../logincontext"
import { PencilIcon } from "@heroicons/react/24/outline"
import { updateProfile } from "firebase/auth"
import ChangePasswordDialog from "./ChangePasswordDialog"
import { Mymenu } from "../mymenu"

// 더미 데이터 (나중에 Firebase 연동 시 교체)
const dummyBookmarks = [
  { id: 1, name: '클린케어 특수청소', region: '서울 강남구', rating: 4.8, tags: ['특수청소', '쓰레기집'], },
  { id: 2, name: '새빛 청소 서비스', region: '경기 수원시', rating: 4.5, tags: ['유품정리', '폐기물'], },
  { id: 3, name: '프로클린 특수', region: '서울 마포구', rating: 4.2, tags: ['화재복구', '곰팡이'], },
]

const dummyReviews = [
  { id: 1, companyName: '클린케어 특수청소', rating: 5, content: '정말 깔끔하게 해주셨어요. 다음에도 이용할게요!', date: '2026-02-20', },
  { id: 2, companyName: '새빛 청소 서비스', rating: 4, content: '시간 약속을 잘 지켜주셔서 좋았습니다.', date: '2026-02-18', },
]

const dummyRecentViewed = [
  { id: 10, name: '해피클린', region: '인천 남동구' },
  { id: 11, name: '원스톱 청소', region: '서울 송파구' },
  { id: 12, name: '그린특수청소', region: '경기 성남시' },
]

type Tab = '북마크' | '내 리뷰' | '프로필'

export default function MyPage() {
  const [activeTab, setActiveTab] = useState<Tab>('북마크')
  const { user,isAdmin } = useAuth()
  const [isEditing, setIsEditing] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState(user?.displayName ?? '');
  const [saving, setSaving] = useState(false);
  const [pwchagneOpen, setPwChangeOpen] = useState(false);


  const tabs: Tab[] = ['프로필', '북마크', '내 리뷰']

  const handleStartEdit = () => {
    if (!user) return;
    setDisplayNameInput(user.displayName ?? '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setDisplayNameInput(user?.displayName ?? '');
  };

  const handleSave = async () => {
    if (!user) return;
    const trimmed = displayNameInput.trim();
    if (!trimmed) {
      // 빈 문자열은 막고 싶다면 여기서 return
      return;
    }

    try {
      setSaving(true);
      await updateProfile(user, { displayName: trimmed }); // Firebase에 닉네임 저장 [web:68][web:118]
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleSave();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── 헤더 ── */}
      <header className="border-b bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link
            to="/"
            className="flex items-center gap-[2px] cursor-pointer"
          >
            <img src="/images/로고.png" alt="로고" className="w-[40px] h-auto"/>
            <div className="logo_text text-[25px] text-[#1d4ed8] pt-1">클린 매칭</div>
          </Link>
          <div className="flex items-center ">
            <Mymenu/>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* ── 프로필 요약 ── */}
        <section className="flex items-center gap-6 rounded-xl bg-white p-6 shadow-sm">
          {/* 아바타 */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gray-200 text-3xl">
            👤
          </div>

          {/* 유저 정보 */}
          <div className="flex-1">
            <div className="flex items-center gap-1">
                {isEditing ? (
                <input
                    className="border-b border-gray-400 focus:outline-none text-xl font-semibold"
                    autoFocus
                    value={displayNameInput}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    onBlur={handleCancel}        // 포커스 벗어나면 취소 (원하면 삭제)
                    onKeyDown={handleKeyDown}
                    disabled={saving}
                />
                ) : (
                <>
                    <h2 className="text-xl font-semibold">
                    {user?.displayName || '사용자'}
                    </h2>
                    <PencilIcon
                    className="w-4 h-4 inline-block ml-2 text-gray-400 cursor-pointer hover:text-gray-600"
                    onClick={handleStartEdit}
                    />
                    {
                      isAdmin && (
                        <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                          관리자
                        </span>
                      )
                    }
                </>
                )}
            </div>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>

          {/* 활동 요약 */}
          <div className="flex gap-8 text-center">
            <div>
              <p className="text-2xl font-bold">{dummyBookmarks.length}</p>
              <p className="text-xs text-gray-500">북마크</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{dummyReviews.length}</p>
              <p className="text-xs text-gray-500">후기</p>
            </div>
          </div>
        </section>

        {/* ── 탭 내비게이션 ── */}
        <nav className="mt-6 flex gap-1 border-b">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`cursor-pointer px-5 py-2.5 text-sm font-medium transition ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        {/* ── 메인 콘텐츠 + 사이드바 ── */}
        <div className="mt-6 flex gap-6">
          {/* 좌측 메인 영역 */}
          <div className="flex-1 space-y-4">
            {/* ── 프로필 탭 ── */}
            {activeTab === '프로필' && (
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold">계정 관리</h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">닉네임</label>
                    <div className="w-full max-w-sm rounded border bg-gray-100 px-3 py-2 text-sm">
                      {user?.displayName || '사용자'}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">이메일</label>
                    <div className="w-full max-w-sm rounded border bg-gray-100 px-3 py-2 text-sm">
                      {user?.email || '이메일 없음'}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">계정 유형</label>
                    {isAdmin ? (
                      <span className="inline-block rounded bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                        관리자 계정
                      </span>
                    ) : (
                      <span className="inline-block rounded bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                        일반 사용자
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">로그인 방식</label>
                    {
                        user?.providerData.find((p) => p.providerId === 'google.com') ? (
                            <span className="inline-block rounded bg-green-100 px-2 py-1 text-sm font-medium text-green-700">
                              구글 로그인
                            </span>
                        ) : (
                            <span className="inline-block rounded bg-blue-100 px-2 py-1 text-sm font-medium text-blue-700">
                              이메일 로그인
                            </span>
                        )
                    }
                  </div>
                    {
                        user?.providerData.find((p) => p.providerId === 'google.com') ? null : (
                            <button className="rounded border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                            onClick={()=>setPwChangeOpen(true)}>
                                비밀번호 변경
                            </button>
                        )
                    }
                  <div className="border-t pt-4">
                    <button className="text-sm text-red-400 hover:text-red-600 border-red-600 hover:border-b">회원 탈퇴</button>
                  </div>
                </div>
              </div>
            )}
            <ChangePasswordDialog
                isOpen={pwchagneOpen}
                closeModal={() => setPwChangeOpen(false)}
            />
            {/* ── 북마크 탭 ── */}
            {activeTab === '북마크' && (
              <>
                {dummyBookmarks.map((company) => (
                  <div
                    key={company.id}
                    className="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm"
                  >
                    <div>
                      <h4 className="font-semibold">{company.name}</h4>
                      <p className="mt-1 text-sm text-gray-500">{company.region}</p>
                      <div className="mt-2 flex gap-2">
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
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-sm font-medium text-yellow-500">
                        ⭐ {company.rating}
                      </span>
                      <button className="rounded border px-3 py-1 text-xs text-blue-500 hover:bg-blue-50">
                        상세보기
                      </button>
                      <button className="text-xs text-gray-400 hover:text-red-400">
                        북마크 해제
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* ── 내 리뷰 탭 ── */}
            {activeTab === '내 리뷰' && (
              <>
                {dummyReviews.map((review) => (
                  <div key={review.id} className="rounded-xl bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{review.companyName}</h4>
                      <span className="text-xs text-gray-400">{review.date}</span>
                    </div>
                    <span className="mt-1 inline-block text-sm text-yellow-500">
                      {'⭐'.repeat(review.rating)}
                    </span>
                    <p className="mt-2 text-sm text-gray-700">{review.content}</p>
                    <div className="mt-3 flex gap-2">
                      <button className="rounded border px-3 py-1 text-xs text-gray-600 hover:bg-gray-50">
                        수정
                      </button>
                      <button className="rounded border px-3 py-1 text-xs text-red-400 hover:bg-red-50">
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* ── 우측 사이드바: 최근 본 업체 ── */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">최근 본 업체</h3>
              <ul className="space-y-3">
                {dummyRecentViewed.map((item) => (
                  <li
                    key={item.id}
                    className="cursor-pointer rounded-lg border p-3 text-sm hover:bg-gray-50"
                  >
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.region}</p>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
