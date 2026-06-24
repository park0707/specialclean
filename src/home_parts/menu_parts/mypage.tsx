import { useState, useEffect } from "react"
import { Link } from "@tanstack/react-router"
import { useAuth } from "../../logincontext"
import { useTutorial } from "../../tutorialcontext"
import { PencilIcon } from "@heroicons/react/24/outline"
import { updateProfile } from "firebase/auth"
import { doc, getDoc, updateDoc, arrayRemove, collection, getDocs, query, where, orderBy, serverTimestamp, deleteDoc, runTransaction, writeBatch } from "firebase/firestore"
import { db } from "../../lib/firebase"
import ChangePasswordDialog from "./ChangePasswordDialog"
import DeleteAccountDialog from "./DeleteAccountDialog"
import { Mymenu } from "../mymenu"
import MyPageTour from "../../tutorial/MyPageTour"

interface BookmarkedBusiness {
  id: string;
  name: string;
  region: string;
  ratingAvg: number;
  tags: string[];
}


interface RecentViewedItem {
  id: string;
  name: string;
  region: string;
}

interface BusinessApplication {
  id: string;
  name: string;
  phone: string;
  businessRegNumber: string;
  ownerEmail: string;
  ownerUid?: string;
  shortDescription: string;
  description: string;
  services: string[];
  tags: string[];
  website?: string;
  coverageType: 'nationwide' | 'regional' | 'radius';
  coverageSido?: string[];
  baseAddress?: string;
  geoPoint?: { lat: number; lng: number };
  serviceRadiusKm?: number;
  openingHours?: {
    weekday: { open: number; close: number; closed: boolean };
    weekend: { open: number; close: number; closed: boolean };
  };
  ratingAvg?: number;
  ratingCount?: number;
  reviewCount?: number;
  bookmarkCount?: number;
  status: 'submitted' | 'approved' | string;
  createdAt: any;
  updatedAt: any;
}

interface UserReview {
  id: string;
  businessId: string;
  businessName: string;
  rating: number;
  content: string;
  date: string;
  createdAt: any;
}

interface ReviewDeleteLog {
  id: string;
  reviewId: string;
  reviewUid: string;
  reviewUserEmail: string;
  businessId: string;
  businessName: string;
  reviewContent: string;
  reviewRating: number;
  deletedByUid: string;
  deletedByEmail: string;
  deletedByRole: string;
  deletedAt: any;
}

type Tab = '북마크' | '내 리뷰' | '프로필' | '업체 신청 목록' | '내 업체' | '리뷰 로그'

export default function MyPage() {
  const [activeTab, setActiveTab] = useState<Tab>('북마크')
  const { user, isAdmin, isManager } = useAuth()
  const { startTour } = useTutorial()
  const [isEditing, setIsEditing] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState(user?.displayName ?? '');
  const [saving, setSaving] = useState(false);
  const [pwchagneOpen, setPwChangeOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [recentViewed, setRecentViewed] = useState<RecentViewedItem[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkedBusiness[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);

  const [applications, setApplications] = useState<BusinessApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [selectedApp, setSelectedApp] = useState<BusinessApplication | null>(null);
  const [appFilter, setAppFilter] = useState<'submitted' | 'approved'>('submitted');

  // 내 업체 목록 (업체주용 - 여러 업체 지원)
  const [myBusinesses, setMyBusinesses] = useState<BusinessApplication[]>([]);
  const [myBusinessLoading, setMyBusinessLoading] = useState(false);

  // 내 리뷰 목록 및 수정 관련 상태
  const [myReviews, setMyReviews] = useState<UserReview[]>([]);
  const [myReviewsLoading, setMyReviewsLoading] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState<number>(5);
  const [editContent, setEditContent] = useState<string>('');

  // 리뷰 삭제 로그 (Admin용)
  const [reviewDeleteLogs, setReviewDeleteLogs] = useState<ReviewDeleteLog[]>([]);
  const [reviewDeleteLogsLoading, setReviewDeleteLogsLoading] = useState(false);

  useEffect(() => {
    try {
      const recent = localStorage.getItem('recentViewed');
      if (recent) {
        const parsed = JSON.parse(recent);
        if (Array.isArray(parsed)) {
          setRecentViewed(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load recentViewed from localStorage:', e);
    }
  }, []);

  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!user) return;
      setBookmarksLoading(true);
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const bookmarkIds: string[] = userData.bookmarks || [];
          
          const promises = bookmarkIds.map(async (id) => {
            const bizRef = doc(db, 'businessApplications', id);
            const bizSnap = await getDoc(bizRef);
            if (bizSnap.exists()) {
              const data = bizSnap.data();
              const regionText = data.coverageType === 'nationwide'
                ? '전국'
                : data.coverageSido && data.coverageSido.length > 0
                  ? data.coverageSido[0]
                  : '지역';

              return {
                id: bizSnap.id,
                name: data.name,
                region: regionText,
                ratingAvg: data.ratingAvg || 0,
                tags: data.tags || []
              } as BookmarkedBusiness;
            }
            return null;
          });

          const resolved = await Promise.all(promises);
          setBookmarks(resolved.filter((item): item is BookmarkedBusiness => item !== null));
        }
      } catch (e) {
        console.error('Failed to fetch bookmarks:', e);
      } finally {
        setBookmarksLoading(false);
      }
    };

    void fetchBookmarks();
  }, [user]);

  const handleRemoveBookmark = async (businessId: string) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        bookmarks: arrayRemove(businessId)
      });
      setBookmarks((prev) => prev.filter((b) => b.id !== businessId));
    } catch (e) {
      console.error('Failed to remove bookmark:', e);
      alert('북마크 해제 중 오류가 발생했습니다.');
    }
  };
  useEffect(() => {
    if (!user || !isAdmin) return;
    
    const fetchApplications = async () => {
      setApplicationsLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'businessApplications'));
        const list: BusinessApplication[] = [];
        querySnapshot.forEach((doc) => {
          list.push({
            id: doc.id,
            ...doc.data()
          } as BusinessApplication);
        });
        
        list.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });
        
        setApplications(list);
      } catch (e) {
        console.error('Failed to fetch business applications:', e);
      } finally {
        setApplicationsLoading(false);
      }
    };

    void fetchApplications();
  }, [user, isAdmin, activeTab]);

  // 업체주: 내 업체 목록 로드 (isManager일 때만 실행, 모든 승인 업체)
  useEffect(() => {
    if (!user || !isManager) return;

    const fetchMyBusinesses = async () => {
      setMyBusinessLoading(true);
      try {
        // ownerEmail 기준으로 모든 업체 조회 (복합 인덱스 방지)
        const q = query(
          collection(db, 'businessApplications'),
          where('ownerEmail', '==', user.email)
        );
        const snap = await getDocs(q);
        const list = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as BusinessApplication))
          .filter(biz => biz.status === 'approved'); // 메모리 필터링
        setMyBusinesses(list);
      } catch (e) {
        console.error('Failed to fetch my businesses:', e);
        setMyBusinesses([]);
      } finally {
        setMyBusinessLoading(false);
      }
    };

    void fetchMyBusinesses();
  }, [user, isManager]);

  // Admin: 리뷰 삭제 로그 로드
  useEffect(() => {
    if (!user || !isAdmin || activeTab !== '리뷰 로그') return;

    const fetchReviewDeleteLogs = async () => {
      setReviewDeleteLogsLoading(true);
      try {
        const q = query(
          collection(db, 'reviewDeleteLogs'),
          orderBy('deletedAt', 'desc')
        );
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ReviewDeleteLog));
        setReviewDeleteLogs(list);
      } catch (e) {
        console.error('Failed to fetch review delete logs:', e);
      } finally {
        setReviewDeleteLogsLoading(false);
      }
    };

    void fetchReviewDeleteLogs();
  }, [user, isAdmin, activeTab]);

  // 내 리뷰 목록 로드
  useEffect(() => {
    if (!user) return;

    const fetchMyReviews = async () => {
      setMyReviewsLoading(true);
      try {
        const q = query(
          collection(db, 'reviews'),
          where('uid', '==', user.uid)
        );
        const snap = await getDocs(q);
        const list = await Promise.all(
          snap.docs.map(async (d) => {
            const data = d.data();
            let bizName = data.businessName || '알 수 없는 업체';
            if (!data.businessName && data.businessId) {
              try {
                const bizSnap = await getDoc(doc(db, 'businessApplications', data.businessId));
                if (bizSnap.exists()) {
                  bizName = bizSnap.data().name || '알 수 없는 업체';
                }
              } catch (e) {
                console.error('Failed to fetch business name:', e);
              }
            }

            let dateStr = '';
            if (data.createdAt) {
              const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
              dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
            }

            return {
              id: d.id,
              businessId: data.businessId,
              businessName: bizName,
              rating: data.rating,
              content: data.content,
              date: dateStr,
              createdAt: data.createdAt
            };
          })
        );

        list.sort((a, b) => {
          const t1 = a.createdAt?.seconds || 0;
          const t2 = b.createdAt?.seconds || 0;
          return t2 - t1;
        });

        setMyReviews(list);
      } catch (e) {
        console.error('Failed to fetch my reviews:', e);
      } finally {
        setMyReviewsLoading(false);
      }
    };

    void fetchMyReviews();
  }, [user, activeTab]);

  const handleSaveMyReview = async (review: UserReview) => {
    if (!user) return;
    if (!editContent.trim()) {
      alert('리뷰 내용을 입력해주세요.');
      return;
    }

    try {
      const reviewRef = doc(db, 'reviews', review.id);
      const bizRef = doc(db, 'businessApplications', review.businessId);
      const oldRating = review.rating;

      // 1. 리뷰 문서 업데이트 (보안 규칙 준수를 위해 uid 포함 및 userNickname 갱신)
      await updateDoc(reviewRef, {
        uid: user.uid,
        rating: editRating,
        content: editContent,
        userNickname: user.displayName || user.email?.split('@')[0] || '익명',
        updatedAt: serverTimestamp()
      });

      // 2. 평점 정보 업데이트 시도 (보안 규칙에 의한 롤백 방지용 예외 처리)
      try {
        await runTransaction(db, async (transaction) => {
          const bizSnap = await transaction.get(bizRef);
          if (!bizSnap.exists()) return;

          const ratingDiff = editRating - oldRating;
          const bizData = bizSnap.data();
          const currentRatingCount = bizData.ratingCount || 0;
          const currentRatingSum = (bizData.ratingAvg || 0) * currentRatingCount;

          const newRatingSum = currentRatingSum + ratingDiff;
          const newRatingAvg = currentRatingCount > 0 ? newRatingSum / currentRatingCount : 0;

          transaction.update(bizRef, {
            ratingAvg: newRatingAvg
          });
        });
      } catch (bizErr) {
        console.warn('Failed to update business rating during edit, ignoring:', bizErr);
      }

      alert('리뷰가 수정되었습니다.');
      // 로컬 목록 즉시 갱신
      setMyReviews(prev => prev.map(r => r.id === review.id ? { ...r, rating: editRating, content: editContent } : r));
      setEditingReviewId(null);
    } catch (e) {
      console.error('Failed to update review:', e);
      alert('리뷰 수정 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteMyReview = async (review: UserReview) => {
    if (!user) return;
    if (!window.confirm('이 리뷰를 삭제하시겠습니까?')) return;

    try {
      const reviewRef = doc(db, 'reviews', review.id);
      const bizRef = doc(db, 'businessApplications', review.businessId);

      // 1. 리뷰 문서 삭제
      await deleteDoc(reviewRef);

      // 2. 평점 정보 업데이트 시도 (보안 규칙에 의한 롤백 방지용 예외 처리)
      try {
        await runTransaction(db, async (transaction) => {
          const bizSnap = await transaction.get(bizRef);
          if (!bizSnap.exists()) return;

          const bizData = bizSnap.data();
          const currentRatingCount = bizData.ratingCount || 0;
          const currentRatingSum = (bizData.ratingAvg || 0) * currentRatingCount;

          const newRatingCount = Math.max(0, currentRatingCount - 1);
          const newRatingSum = currentRatingSum - review.rating;
          const newRatingAvg = newRatingCount > 0 ? newRatingSum / newRatingCount : 0;
          const newReviewCount = Math.max(0, (bizData.reviewCount || 0) - 1);

          transaction.update(bizRef, {
            ratingAvg: newRatingAvg,
            ratingCount: newRatingCount,
            reviewCount: newReviewCount
          });
        });
      } catch (bizErr) {
        console.warn('Failed to update business rating during delete, ignoring:', bizErr);
      }

      alert('리뷰가 삭제되었습니다.');
      // 로컬 목록 즉시 갱신
      setMyReviews(prev => prev.filter(r => r.id !== review.id));
    } catch (e) {
      console.error('Failed to delete review:', e);
      alert('리뷰 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleApprove = async (app: BusinessApplication) => {
    if (!user || !isAdmin) return;
    if (!window.confirm(`'${app.name}' 업체를 승인하시겠습니까?`)) return;

    try {
      setSaving(true);
      
      const appRef = doc(db, 'businessApplications', app.id);
      await updateDoc(appRef, {
        status: 'approved',
        updatedAt: serverTimestamp()
      });

      if (app.ownerUid) {
        try {
          const userRef = doc(db, 'users', app.ownerUid);
          await updateDoc(userRef, {
            role: 'manager'
          });
          console.log(`User ${app.ownerUid} promoted to manager.`);
        } catch (userErr) {
          console.warn('Failed to update user role to manager in Firestore:', userErr);
        }
      }

      alert('성공적으로 승인되었습니다.');
      setSelectedApp(null);
      
      setApplications((prev) =>
        prev.map((item) => (item.id === app.id ? { ...item, status: 'approved' } : item))
      );
    } catch (e) {
      console.error('Failed to approve business application:', e);
      alert('승인 처리 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const tabs: Tab[] = ['프로필', '북마크', '내 리뷰']
  if (isManager && !isAdmin) {
    tabs.push('내 업체')
  }
  if (isAdmin) {
    tabs.push('업체 신청 목록')
    tabs.push('리뷰 로그')
  }
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
      // 1. Firebase Auth 프로필 업데이트
      await updateProfile(user, { displayName: trimmed });

      // 2. users 컬렉션 문서 업데이트 (있을 경우)
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          displayName: trimmed
        });
      } catch (err) {
        console.warn('Failed to update displayName in users document:', err);
      }

      // 3. 작성한 모든 리뷰의 userNickname 필드 일괄 업데이트 (writeBatch 사용)
      try {
        const q = query(collection(db, 'reviews'), where('uid', '==', user.uid));
        const snap = await getDocs(q);
        const batch = writeBatch(db);
        snap.docs.forEach((docSnap) => {
          batch.update(doc(db, 'reviews', docSnap.id), {
            uid: user.uid,
            userNickname: trimmed
          });
        });
        await batch.commit();
      } catch (err) {
        console.error('Failed to batch update userNickname in reviews:', err);
      }

      setIsEditing(false);
      window.location.reload();
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

      {/* MyPage 투어 */}
      <MyPageTour />

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* ── 프로필 요약 ── */}
        <section id="mypage-profile" className="flex items-center gap-6 rounded-xl bg-white p-6 shadow-sm">
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
                    id="mypage-edit-btn"
                    className="w-4 h-4 inline-block ml-2 text-gray-400 cursor-pointer hover:text-gray-600"
                    onClick={handleStartEdit}
                    />
                    {
                      isAdmin ? (
                        <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                          관리자
                        </span>
                      ) : isManager ? (
                        <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          업체 관리자
                        </span>
                      ) : null
                    }
                </>
                )}
            </div>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>

          {/* 활동 요약 */}
          <div className="flex gap-8 text-center">
            <div>
              <p className="text-2xl font-bold">{bookmarks.length}</p>
              <p className="text-xs text-gray-500">북마크</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{myReviews.length}</p>
              <p className="text-xs text-gray-500">후기</p>
            </div>
          </div>
        </section>

        {/* ── 탭 내비게이션 ── */}
        <nav className="mt-6 flex gap-1 border-b">
          {tabs.map((tab) => (
            <button
              key={tab}
              id={
                tab === '북마크' ? 'mypage-bookmark-tab' :
                tab === '내 리뷰' ? 'mypage-review-tab' :
                tab === '업체 신청 목록' ? 'mypage-applications-tab' :
                tab === '내 업체' ? 'mypage-my-business-tab' :
                tab === '리뷰 로그' ? 'mypage-review-logs-tab' :
                'mypage-profile-tab'
              }
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
                    {
                        user?.providerData?.find((p) => p.providerId === 'google.com') ? (
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
                        user?.providerData?.find((p) => p.providerId === 'google.com') ? null : (
                            <button className="rounded border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                            onClick={()=>setPwChangeOpen(true)}>
                                비밀번호 변경
                            </button>
                        )
                    }
                  <div className="border-t pt-4 flex items-center gap-4">
                    <button
                      id="mypage-withdraw-btn"
                      type="button"
                      onClick={() => setDeleteOpen(true)}
                      className="text-sm text-red-400 hover:text-red-600 border-red-600 hover:border-b cursor-pointer"
                    >
                      회원 탈퇴
                    </button>
                    <button
                      type="button"
                      onClick={() => startTour('mypage')}
                      className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
                    >
                      서비스 튜토리얼 시작
                    </button>
                  </div>
                </div>
              </div>
            )}
            <ChangePasswordDialog
                isOpen={pwchagneOpen}
                closeModal={() => setPwChangeOpen(false)}
            />
            <DeleteAccountDialog
                isOpen={deleteOpen}
                closeModal={() => setDeleteOpen(false)}
            />
            {/* ── 북마크 탭 ── */}
            {activeTab === '북마크' && (
              <div className="space-y-4">
                {bookmarksLoading ? (
                  <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                    <p className="text-gray-500 text-sm font-medium">북마크를 불러오는 중입니다...</p>
                  </div>
                ) : bookmarks.length === 0 ? (
                  <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                    <p className="text-gray-500 text-sm font-medium">북마크한 업체가 없습니다.</p>
                    <p className="text-gray-400 text-xs mt-1">마음에 드는 청소 업체를 찾아 북마크해 보세요.</p>
                  </div>
                ) : (
                  bookmarks.map((company) => (
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
                          ⭐ {company.ratingAvg > 0 ? company.ratingAvg.toFixed(1) : '평점 없음'}
                        </span>
                        <Link
                          to="/business/$businessId"
                          params={{ businessId: company.id }}
                          className="rounded border px-3 py-1 text-xs text-blue-500 hover:bg-blue-50 cursor-pointer text-center"
                        >
                          상세보기
                        </Link>
                        <button
                          onClick={() => handleRemoveBookmark(company.id)}
                          className="text-xs text-gray-400 hover:text-red-400 cursor-pointer"
                        >
                          북마크 해제
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── 내 리뷰 탭 ── */}
            {activeTab === '내 리뷰' && (
              <div className="space-y-4">
                {myReviewsLoading ? (
                  <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                    <p className="text-gray-500 text-sm font-medium">후기를 불러오는 중입니다...</p>
                  </div>
                ) : myReviews.length === 0 ? (
                  <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                    <p className="text-gray-500 text-sm font-medium">작성한 후기가 없습니다.</p>
                    <p className="text-gray-400 text-xs mt-1">이용한 청소 서비스의 솔직한 후기를 남겨 보세요.</p>
                  </div>
                ) : (
                  myReviews.map((review) => (
                    <div key={review.id} className="rounded-xl bg-white p-5 shadow-sm">
                      {editingReviewId === review.id ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-800">{review.businessName}</h4>
                            <span className="text-xs text-gray-400">{review.date}</span>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">평점 선택</label>
                            <select
                              value={editRating}
                              onChange={(e) => setEditRating(Number(e.target.value))}
                              className="rounded border border-gray-300 p-1 text-sm bg-white focus:border-blue-500 focus:outline-none"
                            >
                              <option value={5}>⭐⭐⭐⭐⭐ (5점)</option>
                              <option value={4}>⭐⭐⭐⭐ (4점)</option>
                              <option value={3}>⭐⭐⭐ (3점)</option>
                              <option value={2}>⭐⭐ (2점)</option>
                              <option value={1}>⭐ (1점)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">리뷰 내용</label>
                            <textarea
                              rows={3}
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full rounded border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                              placeholder="리뷰 내용을 입력하세요..."
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveMyReview(review)}
                              className="rounded bg-blue-500 hover:bg-blue-600 px-3 py-1.5 text-xs text-white font-medium cursor-pointer"
                            >
                              저장
                            </button>
                            <button
                              onClick={() => setEditingReviewId(null)}
                              className="rounded border border-gray-300 hover:bg-gray-50 px-3 py-1.5 text-xs text-gray-600 font-medium cursor-pointer"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{review.businessName}</h4>
                            <span className="text-xs text-gray-400">{review.date}</span>
                          </div>
                          <span className="mt-1 inline-block text-sm text-yellow-500">
                            {'⭐'.repeat(review.rating)}
                          </span>
                          <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{review.content}</p>
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => {
                                setEditingReviewId(review.id);
                                setEditRating(review.rating);
                                setEditContent(review.content);
                              }}
                              className="rounded border px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 cursor-pointer"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDeleteMyReview(review)}
                              className="rounded border px-3 py-1 text-xs text-red-400 hover:bg-red-50 cursor-pointer"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── 내 업체 탭 (manager 전용) ── */}
            {activeTab === '내 업체' && isManager && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-700 text-sm">내 등록 업체 ({myBusinesses.length}개)</h4>
                </div>
                {myBusinessLoading ? (
                  <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                    <p className="text-gray-500 text-sm font-medium">업체 정보를 불러오는 중입니다...</p>
                  </div>
                ) : myBusinesses.length === 0 ? (
                  <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                    <p className="text-gray-500 text-sm font-medium">등록된 업체가 없습니다.</p>
                    <p className="text-gray-400 text-xs mt-1">업체 신청 후 승인이 완료되면 여기서 확인할 수 있습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myBusinesses.map((biz) => (
                      <div key={biz.id} className="rounded-xl bg-white p-5 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between gap-4">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-gray-800 text-base">{biz.name}</h4>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                biz.status === 'approved'
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                  : 'bg-amber-50 text-amber-600 border border-amber-100'
                              }`}>
                                {biz.status === 'approved' ? '✓ 승인 완료' : '⏳ 승인 대기 중'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 truncate">{biz.shortDescription}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                              <span>⭐ {biz.ratingAvg && biz.ratingAvg > 0 ? biz.ratingAvg.toFixed(1) : '평점 없음'}</span>
                              <span>💬 후기 {biz.reviewCount ?? 0}개</span>
                              <span>🔖 북마크 {biz.bookmarkCount ?? 0}회</span>
                            </div>
                          </div>
                          {biz.status === 'approved' && (
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
                )}
              </div>
            )}

            {/* ── 업체 신청 목록 탭 ── */}
            {activeTab === '업체 신청 목록' && isAdmin && (
              <div className="space-y-4">
                {/* 상태 필터 탭 */}
                <div className="flex gap-2 border-b pb-3">
                  <button
                    onClick={() => setAppFilter('submitted')}
                    className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold border transition ${
                      appFilter === 'submitted'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    승인 대기 중 (
                    {applications.filter((a) => a.status === 'submitted').length}
                    )
                  </button>
                  <button
                    onClick={() => setAppFilter('approved')}
                    className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold border transition ${
                      appFilter === 'approved'
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    승인 완료 (
                    {applications.filter((a) => a.status === 'approved').length}
                    )
                  </button>
                </div>

                {applicationsLoading ? (
                  <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                    <p className="text-gray-500 text-sm font-medium">신청 목록을 불러오는 중입니다...</p>
                  </div>
                ) : (
                  (() => {
                    const filteredApps = applications.filter((app) => {
                      if (appFilter === 'submitted') {
                        return app.status === 'submitted';
                      }
                      return app.status === 'approved';
                    });

                    if (filteredApps.length === 0) {
                      return (
                        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                          <p className="text-gray-500 text-sm font-medium">
                            {appFilter === 'submitted' ? '승인 대기 중인 업체가 없습니다.' : '승인 완료된 업체가 없습니다.'}
                          </p>
                        </div>
                      );
                    }

                    return filteredApps.map((app) => (
                      <div
                        key={app.id}
                        onClick={() => setSelectedApp(app)}
                        className="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm hover:shadow-md border border-transparent hover:border-blue-200 transition duration-150 cursor-pointer"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-800">{app.name}</h4>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                app.status === 'submitted'
                                  ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                  : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              }`}
                            >
                              {app.status === 'submitted' ? '대기 중' : '승인 완료'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">신청자: {app.ownerEmail}</p>
                          <p className="text-xs text-gray-400">
                            신청일: {app.createdAt ? new Date(app.createdAt.seconds * 1000).toLocaleString() : '날짜 없음'}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApp(app);
                          }}
                          className="rounded border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 hover:border-gray-300 font-medium cursor-pointer"
                        >
                          신청서 확인
                        </button>
                      </div>
                    ));
                  })()
                )}
              </div>
            )}

            {/* ── 리뷰 로그 탭 (Admin용) ── */}
            {activeTab === '리뷰 로그' && isAdmin && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-700 text-sm">리뷰 삭제 이력 ({reviewDeleteLogs.length}건)</h4>
                </div>
                {reviewDeleteLogsLoading ? (
                  <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                    <p className="text-gray-500 text-sm font-medium">로그를 불러오는 중입니다...</p>
                  </div>
                ) : reviewDeleteLogs.length === 0 ? (
                  <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                    <p className="text-gray-500 text-sm font-medium">리뷰 삭제 이력이 없습니다.</p>
                  </div>
                ) : (
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
                            ? new Date(log.deletedAt.seconds * 1000).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                            : '-';
                          return (
                            <tr key={log.id} className="hover:bg-gray-50 transition">
                              <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{deletedDate}</td>
                              <td className="px-4 py-3 text-xs font-medium text-gray-800 whitespace-nowrap">{log.businessName}</td>
                              <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{log.reviewUserEmail}</td>
                              <td className="px-4 py-3 text-xs text-gray-600 max-w-[200px]">
                                <span className="line-clamp-2">{log.reviewContent}</span>
                              </td>
                              <td className="px-4 py-3 text-xs text-yellow-500 whitespace-nowrap">
                                {'⭐'.repeat(log.reviewRating)}
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{log.deletedByEmail}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  log.deletedByRole === 'admin'
                                    ? 'bg-red-50 text-red-600 border border-red-100'
                                    : 'bg-green-50 text-green-600 border border-green-100'
                                }`}>
                                  {log.deletedByRole === 'admin' ? '관리자' : '업체주'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── 우측 사이드바: 최근 본 업체 ── */}
          <aside id="recent-viewed-list" className="hidden w-64 shrink-0 lg:block">
            <div id="mypage-recent-viewed" className="rounded-xl bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">최근 본 업체</h3>
              {recentViewed.length === 0 ? (
                <p className="text-gray-400 text-xs py-4 text-center">최근 본 업체가 없습니다.</p>
              ) : (
                <ul className="space-y-3">
                  {recentViewed.map((item) => (
                    <li key={item.id}>
                      <Link
                        to="/business/$businessId"
                        params={{ businessId: item.id }}
                        className="block cursor-pointer rounded-lg border p-3 text-sm hover:bg-gray-50"
                      >
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.region}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* ── 업체 신청 상세 보기 모달 ── */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedApp.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">신청자 이메일: {selectedApp.ownerEmail}</p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
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
                  <span className="text-gray-800 font-medium">{selectedApp.phone}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-500 block text-xs mb-0.5">사업자등록번호</span>
                  <span className="text-gray-800 font-medium">{selectedApp.businessRegNumber}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="font-semibold text-gray-500 block text-xs mb-0.5">웹사이트</span>
                  {selectedApp.website ? (
                    <a
                      href={selectedApp.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline font-medium break-all"
                    >
                      {selectedApp.website}
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
                    <span className="font-medium text-gray-500">유형:</span>{' '}
                    <span className="font-semibold text-blue-600">
                      {selectedApp.coverageType === 'nationwide' && '🌐 전국 출장'}
                      {selectedApp.coverageType === 'regional' && '📍 특정 광역권 선택'}
                      {selectedApp.coverageType === 'radius' && '🏠 거점 반경 설정'}
                    </span>
                  </p>
                  {selectedApp.coverageType === 'regional' && selectedApp.coverageSido && (
                    <p>
                      <span className="font-medium text-gray-500">대상 시/도:</span>{' '}
                      <span className="text-gray-800 font-medium">{selectedApp.coverageSido.join(', ')}</span>
                    </p>
                  )}
                  {selectedApp.coverageType === 'radius' && (
                    <>
                      <p>
                        <span className="font-medium text-gray-500">본사 주소:</span>{' '}
                        <span className="text-gray-800 font-medium">{selectedApp.baseAddress}</span>
                      </p>
                      <p>
                        <span className="font-medium text-gray-500">서비스 반경:</span>{' '}
                        <span className="text-gray-800 font-semibold text-blue-600">
                          {selectedApp.serviceRadiusKm}km
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
                    {selectedApp.services && selectedApp.services.length > 0 ? (
                      selectedApp.services.map((service) => (
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
                    {selectedApp.tags && selectedApp.tags.length > 0 ? (
                      selectedApp.tags.map((tag) => (
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
              {selectedApp.openingHours && (
                <div>
                  <h5 className="font-bold text-sm text-gray-700 mb-2">⏰ 운영 시간</h5>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-gray-500 block mb-1">평일</span>
                      {selectedApp.openingHours.weekday.closed ? (
                        <span className="text-red-500 font-semibold">휴무</span>
                      ) : (
                        <span className="text-gray-800 font-semibold">
                          {selectedApp.openingHours.weekday.open}시 ~ {selectedApp.openingHours.weekday.close}시
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="font-medium text-gray-500 block mb-1">주말·공휴일</span>
                      {selectedApp.openingHours.weekend.closed ? (
                        <span className="text-red-500 font-semibold">휴무</span>
                      ) : (
                        <span className="text-gray-800 font-semibold">
                          {selectedApp.openingHours.weekend.open}시 ~ {selectedApp.openingHours.weekend.close}시
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
                    {selectedApp.shortDescription}
                  </p>
                </div>
                <div>
                  <h5 className="font-bold text-sm text-gray-700 mb-1">📋 상세 설명</h5>
                  <p className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 whitespace-pre-wrap leading-relaxed min-h-[100px]">
                    {selectedApp.description}
                  </p>
                </div>
              </div>
            </div>

            {/* 푸터 버튼 */}
            <div className="border-t pt-4 mt-6 flex justify-end gap-2.5">
              <button
                onClick={() => setSelectedApp(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
              >
                닫기
              </button>
              {selectedApp.status === 'submitted' && (
                <button
                  onClick={() => handleApprove(selectedApp)}
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer"
                >
                  {saving ? '승인 중...' : '승인하기'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
