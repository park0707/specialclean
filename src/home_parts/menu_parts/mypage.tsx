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

// Subcomponents
import ProfileTab from "./mypage_parts/ProfileTab"
import BookmarksTab from "./mypage_parts/BookmarksTab"
import MyReviewsTab from "./mypage_parts/MyReviewsTab"
import MyBusinessesTab from "./mypage_parts/MyBusinessesTab"
import ApplicationsTab from "./mypage_parts/ApplicationsTab"
import ReviewLogsTab from "./mypage_parts/ReviewLogsTab"
import ApplicationDetailModal from "./mypage_parts/ApplicationDetailModal"

export interface BookmarkedBusiness {
  id: string;
  name: string;
  region: string;
  ratingAvg: number;
  tags: string[];
}

export interface RecentViewedItem {
  id: string;
  name: string;
  region: string;
}

export interface BusinessApplication {
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
  isPartner?: boolean;
  partnerRank?: number;
  partnerConsentDate?: any;
}

export interface UserReview {
  id: string;
  businessId: string;
  businessName: string;
  rating: number;
  content: string;
  date: string;
  createdAt: any;
}

export interface ReviewDeleteLog {
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

  // 내 업체 목록 (업체주용 - 여러 업체 지원)
  const [myBusinesses, setMyBusinesses] = useState<BusinessApplication[]>([]);
  const [myBusinessLoading, setMyBusinessLoading] = useState(false);

  // 내 리뷰 목록
  const [myReviews, setMyReviews] = useState<UserReview[]>([]);
  const [myReviewsLoading, setMyReviewsLoading] = useState(false);

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

  const handleSaveMyReview = async (review: UserReview, newRating: number, newContent: string) => {
    if (!user) return;
    if (!newContent.trim()) {
      alert('리뷰 내용을 입력해주세요.');
      return;
    }

    try {
      const reviewRef = doc(db, 'reviews', review.id);
      const bizRef = doc(db, 'businessApplications', review.businessId);
      const oldRating = review.rating;

      // 1. 리뷰 문서 업데이트
      await updateDoc(reviewRef, {
        uid: user.uid,
        rating: newRating,
        content: newContent,
        userNickname: user.displayName || user.email?.split('@')[0] || '익명',
        updatedAt: serverTimestamp()
      });

      // 2. 평점 정보 업데이트 시도
      try {
        await runTransaction(db, async (transaction) => {
          const bizSnap = await transaction.get(bizRef);
          if (!bizSnap.exists()) return;

          const ratingDiff = newRating - oldRating;
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
      setMyReviews(prev => prev.map(r => r.id === review.id ? { ...r, rating: newRating, content: newContent } : r));
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

      // 2. 평점 정보 업데이트 시도
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
      setMyReviews(prev => prev.filter(r => r.id !== review.id));
    } catch (e) {
      console.error('Failed to delete review:', e);
      alert('리뷰 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleApprove = async (app: BusinessApplication, isPartnerSelected: boolean) => {
    if (!user || !isAdmin) return;
    const partnerMsg = isPartnerSelected ? " (협력 업체 등록 포함)" : "";
    if (!window.confirm(`'${app.name}' 업체를 승인하시겠습니까?${partnerMsg}`)) return;

    try {
      setSaving(true);
      
      const appRef = doc(db, 'businessApplications', app.id);
      const updateFields: any = {
        status: 'approved',
        updatedAt: serverTimestamp()
      };

      if (isPartnerSelected) {
        // 기존 협력업체 개수 n 구하기
        const q = query(
          collection(db, 'businessApplications'),
          where('status', '==', 'approved'),
          where('isPartner', '==', true)
        );
        const snap = await getDocs(q);
        const count = snap.size;
        
        updateFields.isPartner = true;
        updateFields.partnerRank = count + 1;
        updateFields.partnerConsentDate = serverTimestamp();
      } else {
        updateFields.isPartner = false;
        updateFields.partnerRank = 0;
      }

      await updateDoc(appRef, updateFields);

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
        prev.map((item) => (item.id === app.id ? { 
          ...item, 
          status: 'approved',
          isPartner: updateFields.isPartner,
          partnerRank: updateFields.partnerRank,
          partnerConsentDate: updateFields.partnerConsentDate
        } : item))
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
      return;
    }

    try {
      setSaving(true);
      await updateProfile(user, { displayName: trimmed });

      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          displayName: trimmed
        });
      } catch (err) {
        console.warn('Failed to update displayName in users document:', err);
      }

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
          <div className="flex items-center">
            <Mymenu/>
          </div>
        </div>
      </header>

      {/* MyPage 투어 */}
      <MyPageTour />

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* ── 프로필 요약 ── */}
        <section id="mypage-profile" className="flex flex-col sm:flex-row items-center gap-6 rounded-xl bg-white p-6 shadow-sm">
          {/* 아바타 */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gray-200 text-3xl">
            👤
          </div>

          {/* 유저 정보 */}
          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1">
                {isEditing ? (
                <input
                    className="border-b border-gray-400 focus:outline-none text-xl font-semibold"
                    autoFocus
                    value={displayNameInput}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    onBlur={handleCancel}
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
          <div className="flex gap-8 text-center justify-center">
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
        <nav className="mt-6 flex overflow-x-auto scrollbar-hide whitespace-nowrap gap-1 border-b">
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
              className={`cursor-pointer px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-medium transition shrink-0 ${
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
        <div className="mt-6 flex flex-col lg:flex-row gap-6">
          {/* 좌측 메인 영역 */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* ── 프로필 탭 ── */}
            {activeTab === '프로필' && (
              <ProfileTab
                user={user}
                isAdmin={isAdmin}
                isManager={isManager}
                onPwChange={() => setPwChangeOpen(true)}
                onDeleteAccount={() => setDeleteOpen(true)}
                onStartTour={() => startTour('mypage')}
              />
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
              <BookmarksTab
                bookmarks={bookmarks}
                loading={bookmarksLoading}
                onRemoveBookmark={handleRemoveBookmark}
              />
            )}

            {/* ── 내 리뷰 탭 ── */}
            {activeTab === '내 리뷰' && (
              <MyReviewsTab
                myReviews={myReviews}
                loading={myReviewsLoading}
                onSaveReview={handleSaveMyReview}
                onDeleteReview={handleDeleteMyReview}
              />
            )}

            {/* ── 내 업체 탭 (manager 전용) ── */}
            {activeTab === '내 업체' && isManager && (
              <MyBusinessesTab
                myBusinesses={myBusinesses}
                loading={myBusinessLoading}
              />
            )}

            {/* ── 업체 신청 목록 탭 ── */}
            {activeTab === '업체 신청 목록' && isAdmin && (
              <ApplicationsTab
                applications={applications}
                loading={applicationsLoading}
                onSelectApp={setSelectedApp}
              />
            )}

            {/* ── 리뷰 로그 탭 (Admin용) ── */}
            {activeTab === '리뷰 로그' && isAdmin && (
              <ReviewLogsTab
                reviewDeleteLogs={reviewDeleteLogs}
                loading={reviewDeleteLogsLoading}
              />
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
      <ApplicationDetailModal
        app={selectedApp}
        onClose={() => setSelectedApp(null)}
        onApprove={handleApprove}
        saving={saving}
      />
    </div>
  );
}
