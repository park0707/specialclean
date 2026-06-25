// src/home_parts/menu_parts/BusinessDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import {
  doc, getDoc, collection, query, where, getDocs,
  runTransaction, arrayUnion, arrayRemove, updateDoc, serverTimestamp, setDoc, addDoc
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../logincontext';
import Header from '../header';
import LoginDialog from './login';

import {
  BookmarkIcon as BookmarkOutline,
  GlobeAltIcon,
  MapPinIcon,
  StarIcon as StarOutline,
  TrashIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolid, StarIcon as StarSolid } from '@heroicons/react/24/solid';

interface Business {
  id: string;
  name: string;
  shortDescription: string;
  phone: string;
  businessRegNumber: string;
  ownerEmail: string;
  ownerUid?: string;
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
  website?: string;
}

interface Review {
  id: string;
  uid: string;
  userEmail: string;
  userNickname?: string;
  businessName?: string;
  businessId: string;
  rating: number;
  content: string;
  createdAt: any;
}

// 방문 후 리뷰 가능까지 필요한 시간 (밀리초)
const VISIT_COOLDOWN_MS = 60 * 60 * 1000; // 1시간

export default function BusinessDetail() {
  const { businessId } = useParams({ from: '/business/$businessId' });
  const navigate = useNavigate();
  const { user, isAdmin, isManager } = useAuth();

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
  // 수정 중인 리뷰 ID
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  // 방문 이력 상태
  const [visitedAt, setVisitedAt] = useState<Date | null>(null);
  const [visitLoading, setVisitLoading] = useState(false);

  // 로그인 모달 상태
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const dynamicRatingAvg = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

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
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const userData = snap.data();
        const bookmarks = userData.bookmarks || [];
        setIsBookmarked(bookmarks.includes(businessId));
      } else {
        setIsBookmarked(false);
      }
    } catch (e) {
      console.error('Failed to check bookmark status:', e);
    }
  };

  // 방문 이력 로드
  const fetchVisitLog = async () => {
    if (!user) {
      setVisitedAt(null);
      return;
    }
    try {
      const visitRef = doc(db, 'visitLogs', `${user.uid}_${businessId}`);
      const snap = await getDoc(visitRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.visitedAt) {
          setVisitedAt(new Date(data.visitedAt.seconds * 1000));
        }
      } else {
        setVisitedAt(null);
      }
    } catch (e) {
      console.error('Failed to fetch visit log:', e);
    }
  };

  // 리뷰 목록 로드
  const fetchReviews = async () => {
    try {
      const q = query(
        collection(db, 'reviews'),
        where('businessId', '==', businessId)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(d => {
        const data = d.data();
        let dateObj: Date;
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
          dateObj = data.createdAt.toDate();
        } else if (data.createdAt) {
          dateObj = new Date(data.createdAt);
        } else {
          dateObj = new Date();
        }
        return {
          id: d.id,
          ...data,
          createdAt: dateObj
        } as unknown as Review;
      });

      // 메모리에서 내림차순 정렬 (최신순)
      list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
    fetchVisitLog();
  }, [user, businessId]);

  useEffect(() => {
    if (biz) {
      try {
        const recent = localStorage.getItem('recentViewed');
        let list: { id: string; name: string; region: string }[] = recent ? JSON.parse(recent) : [];
        if (!Array.isArray(list)) list = [];

        const regionText = biz.coverageType === 'nationwide'
          ? '전국'
          : biz.coverageSido && biz.coverageSido.length > 0
            ? biz.coverageSido[0]
            : '지역';

        const newItem = {
          id: biz.id,
          name: biz.name,
          region: regionText
        };

        // 중복 제거
        list = list.filter((item) => item.id !== biz.id);

        // 맨 앞에 삽입
        list.unshift(newItem);

        // 최근 3개만 유지
        list = list.slice(0, 3);

        localStorage.setItem('recentViewed', JSON.stringify(list));
      } catch (e) {
        console.error('Failed to update recentViewed in localStorage:', e);
      }
    }
  }, [biz]);

  // 북마크 토글 처리
  const handleBookmarkToggle = async () => {
    if (!user) {
      alert('로그인이 필요한 서비스입니다.');
      setIsLoginOpen(true);
      return;
    }

    setBookmarkLoading(true);
    const userRef = doc(db, 'users', user.uid);
    const bizRef = doc(db, 'businessApplications', businessId);

    try {
      if (isBookmarked) {
        // 북마크 해제 (배열에서 제거)
        await updateDoc(userRef, {
          bookmarks: arrayRemove(businessId)
        });
        setIsBookmarked(false);
        if (biz) {
          setBiz(prev => prev ? { ...prev, bookmarkCount: Math.max(0, prev.bookmarkCount - 1) } : null);
        }

        // Firestore bookmarkCount 차감 (권한 오류 격리)
        try {
          await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(bizRef);
            if (snap.exists()) {
              const count = snap.data().bookmarkCount || 0;
              transaction.update(bizRef, { bookmarkCount: Math.max(0, count - 1) });
            }
          });
        } catch (transactionErr) {
          console.warn('Failed to update bookmarkCount on businessApplication due to Firestore rules:', transactionErr);
        }
      } else {
        // 북마크 설정 (배열에 추가)
        await updateDoc(userRef, {
          bookmarks: arrayUnion(businessId)
        });
        setIsBookmarked(true);
        if (biz) {
          setBiz(prev => prev ? { ...prev, bookmarkCount: prev.bookmarkCount + 1 } : null);
        }

        // Firestore bookmarkCount 가산 (권한 오류 격리)
        try {
          await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(bizRef);
            if (snap.exists()) {
              const count = snap.data().bookmarkCount || 0;
              transaction.update(bizRef, { bookmarkCount: count + 1 });
            }
          });
        } catch (transactionErr) {
          console.warn('Failed to update bookmarkCount on businessApplication due to Firestore rules:', transactionErr);
        }
      }
    } catch (e) {
      console.error(e);
      alert('북마크 처리 중 오류가 발생했습니다.');
    } finally {
      setBookmarkLoading(false);
    }
  };

  // 방문하기 클릭 처리 (visitLogs 기록)
  const handleVisitClick = async () => {
    if (!user) {
      // 비로그인은 그냥 링크만 열기
      return;
    }
    setVisitLoading(true);
    try {
      const visitRef = doc(db, 'visitLogs', `${user.uid}_${businessId}`);
      await setDoc(visitRef, {
        uid: user.uid,
        businessId,
        visitedAt: serverTimestamp()
      }, { merge: true });
      // 로컬 상태 즉시 반영
      setVisitedAt(new Date());
    } catch (e) {
      console.error('Failed to log visit:', e);
    } finally {
      setVisitLoading(false);
    }
  };

  // 리뷰 작성 가능 여부 계산
  const getReviewEligibility = (): {
    canWrite: boolean;
    reason: string;
    minutesLeft: number;
  } => {
    if (!user) return { canWrite: false, reason: 'login', minutesLeft: 0 };
    // 사이트가 없는 업체의 경우 방문 이력/쿨다운 제한 없이 즉시 리뷰 작성 허용
    if (!biz?.website || !biz.website.trim()) {
      return { canWrite: true, reason: '', minutesLeft: 0 };
    }
    if (!visitedAt) return { canWrite: false, reason: 'no_visit', minutesLeft: 0 };
    const elapsed = Date.now() - visitedAt.getTime();
    if (elapsed < VISIT_COOLDOWN_MS) {
      const minutesLeft = Math.ceil((VISIT_COOLDOWN_MS - elapsed) / 60000);
      return { canWrite: false, reason: 'cooldown', minutesLeft };
    }
    return { canWrite: true, reason: '', minutesLeft: 0 };
  };

  const eligibility = getReviewEligibility();

  // 리뷰 등록/수정 처리
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !biz) {
      alert('로그인이 필요한 서비스입니다.');
      setIsLoginOpen(true);
      return;
    }

    // 수정 모드가 아니고 이미 등록한 리뷰가 존재하는 상태인데 등록을 시도하는 경우 차단
    const existingReview = reviews.find(r => r.uid === user.uid);
    if (existingReview && !editingReviewId) {
      alert('이미 후기를 작성하셨습니다.');
      return;
    }

    // 수정 모드가 아닐 때만 일반 작성 권한 검사 (쿨다운 등)
    if (!editingReviewId && !eligibility.canWrite) {
      alert('리뷰 작성 조건을 충족하지 않습니다.');
      return;
    }

    if (!newContent.trim()) {
      alert('리뷰 내용을 입력해주세요.');
      return;
    }

    setReviewSubmitLoading(true);

    const bizRef = doc(db, 'businessApplications', businessId);

    try {
      if (editingReviewId) {
        // [수정 모드]
        const reviewRef = doc(db, 'reviews', editingReviewId);

        // 기존 rating을 상태(reviews)에서 미리 가져오기
        const oldReview = reviews.find(r => r.id === editingReviewId);
        const oldRating = oldReview ? oldReview.rating : 0;

        // 1. 리뷰 문서 수정 (보안 규칙 준수를 위해 uid 포함)
        await updateDoc(reviewRef, {
          uid: user.uid,
          rating: newRating,
          content: newContent,
          userNickname: user.displayName || user.email?.split('@')[0] || '익명',
          updatedAt: serverTimestamp()
        });

        // 2. 평점 정보 업데이트 시도 (보안 규칙에 따른 에러 대비 예외 처리)
        try {
          await runTransaction(db, async (transaction) => {
            const bizSnap = await transaction.get(bizRef);
            if (!bizSnap.exists()) {
              throw new Error('업체가 존재하지 않습니다.');
            }

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
        setEditingReviewId(null);
        setNewContent('');
        setNewRating(5);
        await fetchReviews();

      } else {
        // [신규 등록 모드]
        const newReviewRef = doc(collection(db, 'reviews'));

        // 1. 리뷰 문서 직접 등록 (우선순위 1순위)
        await setDoc(newReviewRef, {
          uid: user.uid,
          userEmail: user.email || '익명',
          userNickname: user.displayName || user.email?.split('@')[0] || '익명',
          businessId,
          businessName: biz.name,
          rating: newRating,
          content: newContent,
          createdAt: serverTimestamp()
        });

        // 2. 업체 평점 정보 업데이트 시도 (보안 규칙에 따른 에러 대비 예외 처리)
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

            transaction.update(bizRef, {
              ratingAvg: newRatingAvg,
              ratingCount: newRatingCount,
              reviewCount: newReviewCount
            });
          });
        } catch (bizErr) {
          console.warn('Failed to update business rating due to permissions/rules, ignoring:', bizErr);
        }

        alert('리뷰가 정상적으로 등록되었습니다.');
      }

      // 등록/수정 성공 시 폼 초기화 및 새로고침
      setNewContent('');
      setNewRating(5);
      await fetchBusinessData(); // 업체 평점 업데이트 갱신
      await fetchReviews();     // 리뷰 리스트 갱신
    } catch (e) {
      console.error(e);
      alert('리뷰를 등록하는 중에 실패했습니다.');
    } finally {
      setReviewSubmitLoading(false);
    }
  };

  // 리뷰 삭제 처리 (업체주 또는 Admin)
  const handleDeleteReview = async (review: Review) => {
    if (!user || !biz) return;
    if (!window.confirm('이 리뷰를 삭제하시겠습니까?')) return;

    const reviewRef = doc(db, 'reviews', review.id);
    const bizRef = doc(db, 'businessApplications', businessId);

    try {
      await runTransaction(db, async (transaction) => {
        const bizSnap = await transaction.get(bizRef);
        if (!bizSnap.exists()) throw new Error('업체가 존재하지 않습니다.');

        const bizData = bizSnap.data();
        const currentRatingCount = bizData.ratingCount || 0;
        const currentRatingSum = (bizData.ratingAvg || 0) * currentRatingCount;

        const newRatingCount = Math.max(0, currentRatingCount - 1);
        const newRatingSum = currentRatingSum - review.rating;
        const newRatingAvg = newRatingCount > 0 ? newRatingSum / newRatingCount : 0;
        const newReviewCount = Math.max(0, (bizData.reviewCount || 0) - 1);

        // 리뷰 삭제
        transaction.delete(reviewRef);

        // 업체 평점 재계산
        transaction.update(bizRef, {
          ratingAvg: newRatingAvg,
          ratingCount: newRatingCount,
          reviewCount: newReviewCount
        });
      });

      // 삭제 로그 기록 (트랜잭션 외부에서 addDoc 사용)
      try {
        await addDoc(collection(db, 'reviewDeleteLogs'), {
          reviewId: review.id,
          reviewUid: review.uid,
          reviewUserEmail: review.userEmail,
          businessId: biz.id,
          businessName: biz.name,
          reviewContent: review.content,
          reviewRating: review.rating,
          deletedByUid: user.uid,
          deletedByEmail: user.email || '알 수 없음',
          deletedByRole: isAdmin ? 'admin' : 'manager',
          deletedAt: serverTimestamp()
        });
      } catch (logErr) {
        console.warn('Failed to write review delete log:', logErr);
      }

      alert('리뷰가 삭제되었습니다.');
      await fetchBusinessData();
      await fetchReviews();
    } catch (e) {
      console.error(e);
      alert('리뷰 삭제 중 오류가 발생했습니다.');
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

  const formatDate = (dateInput: any) => {
    if (!dateInput) return '';
    let date: Date;
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (dateInput.seconds !== undefined) {
      date = new Date(dateInput.seconds * 1000);
    } else if (typeof dateInput.toDate === 'function') {
      date = dateInput.toDate();
    } else {
      date = new Date(dateInput);
    }
    // 유효한 날짜가 아닌 경우 대비
    if (isNaN(date.getTime())) return '';
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  // 해당 리뷰에 대한 삭제 권한 확인
  const canDeleteReview = (review: Review): boolean => {
    if (!user || !biz) return false;
    if (isAdmin) return true;
    // 리뷰 작성자 본인 삭제 허용
    if (review.uid === user.uid) return true;
    // 업체주: 자신의 업체(ownerUid 일치)에 달린 리뷰만 삭제 가능
    if (isManager && biz.ownerUid === user.uid) return true;
    return false;
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
          onClick={() => {
            if (window.history.length > 1) {
              window.history.back();
            } else {
              navigate({ to: '/' });
            }
          }}
          className="text-sm font-semibold text-gray-500 hover:text-blue-500 flex items-center gap-1.5 transition duration-200 cursor-pointer"
        >
          ← 이전으로
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

            {/* 별점 정보 및 북마크 수 */}
            <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
              <div className="flex items-center gap-1.5">
                <StarSolid className="w-5 h-5 text-yellow-500" />
                <span className="font-bold text-gray-800">{dynamicRatingAvg > 0 ? dynamicRatingAvg.toFixed(1) : '평점 없음'}</span>
                <span>({reviews.length}개의 후기)</span>
              </div>
              <span className="text-gray-200">|</span>
              <span>북마크 {biz.bookmarkCount}회</span>
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
                  ? 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {isBookmarked ? (
                <BookmarkSolid className="w-5 h-5 text-blue-500" />
              ) : (
                <BookmarkOutline className="w-5 h-5" />
              )}
              {isBookmarked ? '북마크 완료' : '북마크'}
            </button>

            {biz.website && biz.website.trim() ? (
              <a
                href={biz.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleVisitClick}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm transition duration-200"
              >
                <GlobeAltIcon className="w-5 h-5" />
                {visitLoading ? '기록 중...' : '방문하기'}
              </a>
            ) : (
              <button
                disabled
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-200 text-gray-400 text-sm font-semibold rounded-lg shadow-sm border border-gray-300 cursor-not-allowed"
              >
                <GlobeAltIcon className="w-5 h-5 text-gray-400" />
                방문하기 (사이트 없음)
              </button>
            )}
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

            {/* 연락처 정보 섹션 */}
            <section className="rounded-xl bg-white p-5 border border-gray-200 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">연락처</h3>
              <div className="space-y-2 text-sm">
                {biz.phone && (
                  <div className="flex items-center gap-2.5">
                    <PhoneIcon className="w-4 h-4 text-gray-400 shrink-0" />
                    <a
                      href={`tel:${biz.phone}`}
                      className="text-gray-700 hover:text-blue-500 transition-colors font-medium"
                    >
                      {biz.phone}
                    </a>
                  </div>
                )}
                {biz.ownerEmail && (
                  <div className="flex items-center gap-2.5">
                    <EnvelopeIcon className="w-4 h-4 text-gray-400 shrink-0" />
                    <a
                      href={`mailto:${biz.ownerEmail}`}
                      className="text-gray-700 hover:text-blue-500 transition-colors break-all"
                    >
                      {biz.ownerEmail}
                    </a>
                  </div>
                )}
              </div>
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

            {/* 리뷰 작성/수정 폼 */}
            <section id="review-form-section" className="rounded-xl bg-white p-5 border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
                {editingReviewId ? '이용 후기 수정' : '이용 후기 작성'}
              </h3>

              {/* 1계정당 1회 리뷰 작성 제한 배너 */}
              {user && reviews.some(r => r.uid === user.uid) && !editingReviewId ? (
                <div className="rounded-lg p-4 text-sm bg-blue-50 border border-blue-200 text-blue-700">
                  ℹ️ 이미 후기를 작성한 업체입니다. 아래 본인의 후기에서 <strong>수정</strong> 또는 <strong>삭제</strong>를 진행하실 수 있습니다.
                </div>
              ) : (
                <>
                  {/* 리뷰 자격 안내 배너 (신규 작성 시에만 노출) */}
                  {!editingReviewId && !eligibility.canWrite && (
                    <div className={`rounded-lg p-3 text-sm ${
                      !user
                        ? 'bg-gray-50 border border-gray-200 text-gray-500'
                        : eligibility.reason === 'no_visit'
                        ? 'bg-amber-50 border border-amber-200 text-amber-700'
                        : 'bg-blue-50 border border-blue-200 text-blue-700'
                    }`}>
                      {!user && (
                        <span>리뷰를 작성하려면 <button onClick={() => setIsLoginOpen(true)} className="font-semibold underline cursor-pointer">로그인</button>이 필요합니다.</span>
                      )}
                      {user && eligibility.reason === 'no_visit' && (
                        <span>
                          ℹ️ <strong>방문하기</strong> 버튼을 클릭하고 1시간 후에 리뷰를 작성할 수 있습니다.
                          실제 업체를 이용한 고객만 후기를 남길 수 있도록 안내드립니다.
                        </span>
                      )}
                      {user && eligibility.reason === 'cooldown' && (
                        <span>
                          ⏳ 방문 확인 후 <strong>{eligibility.minutesLeft}분</strong>이 지나면 리뷰를 작성할 수 있습니다.
                        </span>
                      )}
                    </div>
                  )}

                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    {/* 별점 선택 */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 font-medium">평가 별점</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(ratingValue => (
                          <button
                            type="button"
                            key={ratingValue}
                            onClick={() => (editingReviewId || eligibility.canWrite) ? setNewRating(ratingValue) : undefined}
                            className={`p-0.5 transition-colors ${(editingReviewId || eligibility.canWrite) ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                            disabled={!editingReviewId && !eligibility.canWrite}
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
                        placeholder={
                          !user
                            ? '리뷰를 작성하려면 로그인이 필요합니다.'
                            : editingReviewId
                            ? '수정할 후기 내용을 입력해주세요.'
                            : eligibility.reason === 'no_visit'
                            ? '방문하기 버튼을 클릭하고 1시간 후에 리뷰를 작성할 수 있습니다.'
                            : eligibility.reason === 'cooldown'
                            ? `방문 후 ${eligibility.minutesLeft}분이 지나야 리뷰를 작성할 수 있습니다.`
                            : '해당 업체와의 서비스 경험을 후기로 남겨주세요.'
                        }
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                        disabled={!editingReviewId && !eligibility.canWrite}
                      />
                    </div>

                    {/* 등록/수정/취소 버튼 */}
                    <div className="flex justify-end gap-2">
                      {editingReviewId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingReviewId(null);
                            setNewContent('');
                            setNewRating(5);
                          }}
                          className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg shadow-sm transition duration-200 cursor-pointer"
                        >
                          수정 취소
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={reviewSubmitLoading || (!editingReviewId && !eligibility.canWrite)}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white text-sm font-semibold rounded-lg shadow-sm transition duration-200 cursor-pointer disabled:cursor-not-allowed"
                      >
                        {reviewSubmitLoading ? '저장 중...' : editingReviewId ? '수정 완료' : '리뷰 등록'}
                      </button>
                    </div>
                  </form>
                </>
              )}
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
                          <p className="text-sm font-semibold text-gray-800">{rev.userNickname || maskEmail(rev.userEmail)}</p>
                          <p className="text-xs text-gray-400">{formatDate(rev.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* 별점 */}
                          <div className="flex items-center gap-0.5 mr-2">
                            {[1, 2, 3, 4, 5].map(v => (
                              v <= rev.rating ? (
                                <StarSolid key={v} className="w-4 h-4 text-yellow-500" />
                              ) : (
                                <StarOutline key={v} className="w-4 h-4 text-gray-200" />
                              )
                            ))}
                          </div>
                          {/* 수정 버튼 (리뷰 작성자 본인) */}
                          {user && rev.uid === user.uid && (
                            <button
                              onClick={() => {
                                setEditingReviewId(rev.id);
                                setNewRating(rev.rating);
                                setNewContent(rev.content);
                                document.getElementById('review-form-section')?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50 transition duration-150 cursor-pointer"
                            >
                              수정
                            </button>
                          )}
                          {/* 삭제 버튼 (작성자 본인 또는 업체주 또는 Admin) */}
                          {canDeleteReview(rev) && (
                            <button
                              onClick={() => handleDeleteReview(rev)}
                              title="리뷰 삭제"
                              className="p-1 text-gray-300 hover:text-red-500 transition-colors cursor-pointer rounded"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
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
