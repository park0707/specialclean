// src/home_parts/menu_parts/BusinessDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { doc, getDoc, collection, query, where, orderBy, getDocs, runTransaction, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../logincontext';
import Header from '../header';
import LoginDialog from './login';
import { 
  HeartIcon as HeartOutline, 
  PhoneIcon, 
  MapPinIcon, 
  StarIcon as StarOutline 
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid, StarIcon as StarSolid } from '@heroicons/react/24/solid';

interface Business {
  id: string;
  name: string;
  shortDescription: string;
  phone: string;
  businessRegNumber: string;
  ownerEmail: string;
  coverageType: 'nationwide' | 'regional' | 'radius';
  coverageSido?: string[];
  geoPoint?: { lat: number; lng: number };
  serviceRadiusKm?: number;
  services: string[];
  tags: string[];
  openingHours?: {
    weekday: { open: number; close: number; closed: boolean };
    weekend: { open: number; close: number; closed: boolean };
  };
  ratingAvg: number;
  ratingCount: number;
  reviewCount: number;
  bookmarkCount: number;
  status: string;
}

interface Review {
  id: string;
  uid: string;
  userEmail: string;
  businessId: string;
  rating: number;
  content: string;
  createdAt: any;
}

export default function BusinessDetail() {
  const { businessId } = useParams({ from: '/business/$businessId' });
  const navigate = useNavigate();
  const { user } = useAuth();

  const [biz, setBiz] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 북마크 상태
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  // 리뷰 작성 상태
  const [newRating, setNewRating] = useState(5);
  const [newContent, setNewContent] = useState('');
  const [reviewSubmitLoading, setReviewSubmitLoading] = useState(false);

  // 로그인 모달 상태
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // 업체 상세 정보 로드
  const fetchBusinessData = async () => {
    setLoading(true);
    setError('');
    try {
      const docRef = doc(db, 'businessApplications', businessId);
      const snap = await getDoc(docRef);

      if (!snap.exists()) {
        setError('존재하지 않는 업체입니다.');
        return;
      }

      setBiz({ id: snap.id, ...snap.data() } as Business);
    } catch (e) {
      console.error(e);
      setError('업체 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 북마크 여부 확인
  const checkBookmarkStatus = async () => {
    if (!user) {
      setIsBookmarked(false);
      return;
    }
    try {
      const bookmarkRef = doc(db, 'users', user.uid, 'bookmarks', businessId);
      const snap = await getDoc(bookmarkRef);
      setIsBookmarked(snap.exists());
    } catch (e) {
      console.error('Failed to check bookmark status:', e);
    }
  };

  // 리뷰 목록 로드
  const fetchReviews = async () => {
    try {
      const q = query(
        collection(db, 'reviews'),
        where('businessId', '==', businessId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Review));
      setReviews(list);
    } catch (e) {
      console.error('Failed to fetch reviews:', e);
    }
  };

  useEffect(() => {
    fetchBusinessData();
    fetchReviews();
  }, [businessId]);

  useEffect(() => {
    checkBookmarkStatus();
  }, [user, businessId]);

  // 북마크 토글 처리
  const handleBookmarkToggle = async () => {
    if (!user) {
      alert('로그인이 필요한 서비스입니다.');
      setIsLoginOpen(true);
      return;
    }

    setBookmarkLoading(true);
    const bookmarkRef = doc(db, 'users', user.uid, 'bookmarks', businessId);
    const bizRef = doc(db, 'businessApplications', businessId);

    try {
      if (isBookmarked) {
        // 북마크 해제
        await deleteDoc(bookmarkRef);
        setIsBookmarked(false);
        if (biz) {
          setBiz(prev => prev ? { ...prev, bookmarkCount: Math.max(0, prev.bookmarkCount - 1) } : null);
        }
        // Firestore bookmarkCount 차감 (트랜잭션 대신 단순 업데이트)
        await runTransaction(db, async (transaction) => {
          const snap = await transaction.get(bizRef);
          if (snap.exists()) {
            const count = snap.data().bookmarkCount || 0;
            transaction.update(bizRef, { bookmarkCount: Math.max(0, count - 1) });
          }
        });
      } else {
        // 북마크 설정
        await setDoc(bookmarkRef, {
          businessId,
          createdAt: serverTimestamp()
        });
        setIsBookmarked(true);
        if (biz) {
          setBiz(prev => prev ? { ...prev, bookmarkCount: prev.bookmarkCount + 1 } : null);
        }
        // Firestore bookmarkCount 가산
        await runTransaction(db, async (transaction) => {
          const snap = await transaction.get(bizRef);
          if (snap.exists()) {
            const count = snap.data().bookmarkCount || 0;
            transaction.update(bizRef, { bookmarkCount: count + 1 });
          }
        });
      }
    } catch (e) {
      console.error(e);
      alert('즐겨찾기 처리 중 오류가 발생했습니다.');
    } finally {
      setBookmarkLoading(false);
    }
  };

  // 리뷰 등록 처리
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('로그인이 필요한 서비스입니다.');
      setIsLoginOpen(true);
      return;
    }

    if (!newContent.trim()) {
      alert('리뷰 내용을 입력해주세요.');
      return;
    }

    setReviewSubmitLoading(true);

    const newReviewRef = doc(collection(db, 'reviews'));
    const bizRef = doc(db, 'businessApplications', businessId);

    try {
      await runTransaction(db, async (transaction) => {
        const bizSnap = await transaction.get(bizRef);
        if (!bizSnap.exists()) {
          throw new Error('업체가 존재하지 않습니다.');
        }

        const bizData = bizSnap.data();
        const currentRatingCount = bizData.ratingCount || 0;
        const currentRatingSum = (bizData.ratingAvg || 0) * currentRatingCount;

        const newRatingCount = currentRatingCount + 1;
        const newRatingSum = currentRatingSum + newRating;
        const newRatingAvg = newRatingSum / newRatingCount;
        const newReviewCount = (bizData.reviewCount || 0) + 1;

        // 리뷰 저장
        transaction.set(newReviewRef, {
          uid: user.uid,
          userEmail: user.email || '익명',
          businessId,
          rating: newRating,
          content: newContent,
          createdAt: serverTimestamp()
        });

        // 업체 평점 정보 업데이트
        transaction.update(bizRef, {
          ratingAvg: newRatingAvg,
          ratingCount: newRatingCount,
          reviewCount: newReviewCount
        });
      });

      // 등록 성공 시 폼 초기화 및 새로고침
      setNewContent('');
      setNewRating(5);
      alert('리뷰가 정상적으로 등록되었습니다.');
      await fetchBusinessData(); // 업체 평점 업데이트 갱신
      await fetchReviews();     // 리뷰 리스트 갱신
    } catch (e) {
      console.error(e);
      alert('리뷰를 등록하는 중에 실패했습니다.');
    } finally {
      setReviewSubmitLoading(false);
    }
  };

  const formatTime = (time: number | undefined) => {
    if (time === undefined) return '';
    const hour = Math.floor(time);
    const min = Math.round((time - hour) * 60);
    return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  };

  const getCoverageLabel = (type: string, sido?: string[]) => {
    if (type === 'nationwide') return '전국 서비스 가능';
    if (type === 'regional' && sido) return `지역 제한: ${sido.join(', ')}`;
    return '특정 반경 내 서비스 제공';
  };

  const maskEmail = (email: string) => {
    if (!email) return '익명';
    const [local, domain] = email.split('@');
    if (!domain) return email;
    if (local.length <= 3) return `${local[0]}***@${domain}`;
    return `${local.slice(0, 3)}***@${domain}`;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = new Date(timestamp.seconds * 1000);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex justify-center py-24 text-sm text-gray-400">
          업체 정보를 불러오는 중...
        </div>
      </div>
    );
  }

  if (error || !biz) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-24 text-gray-500">
          <p className="text-base">{error || '업체 정보를 찾을 수 없습니다.'}</p>
          <button
            onClick={() => navigate({ to: '/' })}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm transition duration-200 cursor-pointer"
          >
            홈으로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-16">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 space-y-6">
        {/* 뒤로가기 링크 */}
        <button
          onClick={() => navigate({ to: '/' })}
          className="text-sm font-semibold text-gray-500 hover:text-blue-500 flex items-center gap-1.5 transition duration-200 cursor-pointer"
        >
          ← 업체 목록으로
        </button>

        {/* 업체 탑 서머리 영역 */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{biz.name}</h1>
              {biz.coverageType === 'nationwide' && (
                <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs text-purple-600 border border-purple-100 font-medium">
                  🌐 전국 서비스
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">{biz.shortDescription}</p>
            
            {/* 별점 정보 및 즐겨찾기 수 */}
            <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
              <div className="flex items-center gap-1.5">
                <StarSolid className="w-5 h-5 text-yellow-500" />
                <span className="font-bold text-gray-800">{biz.ratingAvg > 0 ? biz.ratingAvg.toFixed(1) : '평점 없음'}</span>
                <span>({biz.reviewCount}개의 후기)</span>
              </div>
              <span className="text-gray-200">|</span>
              <span>즐겨찾기 {biz.bookmarkCount}회</span>
            </div>

            {/* 서비스 칩 */}
            <div className="flex flex-wrap gap-1.5">
              {biz.services.map(s => (
                <span key={s} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-600 border border-blue-100 font-medium">
                  {s}
                </span>
              ))}
              {biz.tags.map(t => (
                <span key={t} className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-600 border border-emerald-100 font-medium">
                  #{t}
                </span>
              ))}
            </div>
          </div>

          {/* 북마크 및 연락처 버튼 */}
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
            <button
              onClick={handleBookmarkToggle}
              disabled={bookmarkLoading}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                isBookmarked 
                  ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100' 
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {isBookmarked ? (
                <HeartSolid className="w-5 h-5 text-red-500" />
              ) : (
                <HeartOutline className="w-5 h-5" />
              )}
              {isBookmarked ? '즐겨찾기 완료' : '즐겨찾기'}
            </button>
            
            <a
              href={`tel:${biz.phone}`}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm transition duration-200"
            >
              <PhoneIcon className="w-5 h-5" />
              전화 걸기
            </a>
          </div>
        </div>

        {/* 바디 상세 2컬럼 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* 왼쪽 컬럼: 업체 상세 가이드 정보 */}
          <div className="lg:col-span-1 space-y-6">
            <section className="rounded-xl bg-white p-5 border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">영업 정보</h3>
              
              {biz.openingHours ? (
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-medium">평일 영업시간</span>
                    <span>
                      {biz.openingHours.weekday.closed 
                        ? '휴무' 
                        : `${formatTime(biz.openingHours.weekday.open)} ~ ${formatTime(biz.openingHours.weekday.close)}`
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-medium">주말 영업시간</span>
                    <span>
                      {biz.openingHours.weekend.closed 
                        ? '휴무' 
                        : `${formatTime(biz.openingHours.weekend.open)} ~ ${formatTime(biz.openingHours.weekend.close)}`
                      }
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">등록된 영업시간 정보가 없습니다.</p>
              )}
            </section>

            <section className="rounded-xl bg-white p-5 border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">서비스 범위</h3>
              <div className="flex items-start gap-2.5 text-sm text-gray-700">
                <MapPinIcon className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{getCoverageLabel(biz.coverageType, biz.coverageSido)}</p>
                  {biz.coverageType === 'radius' && biz.serviceRadiusKm && (
                    <p className="text-xs text-gray-400 mt-0.5">거점 기준 반경 {biz.serviceRadiusKm}km 내외 방문</p>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* 오른쪽 컬럼: 리뷰 섹션 */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 리뷰 작성 폼 */}
            <section className="rounded-xl bg-white p-5 border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">이용 후기 작성</h3>
              
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {/* 별점 선택 */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 font-medium">평가 별점</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(ratingValue => (
                      <button
                        type="button"
                        key={ratingValue}
                        onClick={() => user ? setNewRating(ratingValue) : alert('로그인이 필요합니다.')}
                        className={`p-0.5 transition-colors cursor-pointer disabled:cursor-not-allowed`}
                        disabled={!user}
                      >
                        {ratingValue <= newRating ? (
                          <StarSolid className="w-7 h-7 text-yellow-400" />
                        ) : (
                          <StarOutline className="w-7 h-7 text-gray-300 hover:text-yellow-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 텍스트 영역 */}
                <div>
                  <textarea
                    rows={4}
                    value={newContent}
                    onChange={e => setNewContent(e.target.value)}
                    placeholder={user ? "해당 업체와의 서비스 경험을 후기로 남겨주세요." : "리뷰를 작성하려면 로그인이 필요합니다."}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                    disabled={!user}
                  />
                </div>

                {/* 등록 버튼 */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={reviewSubmitLoading || !user}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white text-sm font-semibold rounded-lg shadow-sm transition duration-200 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {reviewSubmitLoading ? '등록 중...' : '리뷰 등록'}
                  </button>
                </div>
              </form>
            </section>

            {/* 리뷰 목록 리스트 */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">사용자 후기 ({reviews.length})</h3>

              {reviews.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white py-12 text-center text-sm text-gray-400">
                  아직 등록된 후기가 없습니다. 첫 번째 리뷰어가 되어보세요!
                </div>
              ) : (
                <ul className="space-y-3">
                  {reviews.map(rev => (
                    <li key={rev.id} className="rounded-xl bg-white p-5 border border-gray-200 shadow-sm space-y-2.5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-gray-800">{maskEmail(rev.userEmail)}</p>
                          <p className="text-xs text-gray-400">{formatDate(rev.createdAt)}</p>
                        </div>
                        {/* 별점 */}
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(v => (
                            v <= rev.rating ? (
                              <StarSolid key={v} className="w-4 h-4 text-yellow-500" />
                            ) : (
                              <StarOutline key={v} className="w-4 h-4 text-gray-200" />
                            )
                          ))}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {rev.content}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* 비로그인 유저 액션용 로그인 다이얼로그 */}
      <LoginDialog isOpen={isLoginOpen} closeModal={() => setIsLoginOpen(false)} />
    </div>
  );
}
