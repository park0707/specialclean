import { useState } from "react";
import type { UserReview } from "../mypage";

interface MyReviewsTabProps {
  myReviews: UserReview[];
  loading: boolean;
  onSaveReview: (review: UserReview, rating: number, content: string) => Promise<void>;
  onDeleteReview: (review: UserReview) => Promise<void>;
}

export default function MyReviewsTab({
  myReviews,
  loading,
  onSaveReview,
  onDeleteReview,
}: MyReviewsTabProps) {
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState<number>(5);
  const [editContent, setEditContent] = useState<string>("");

  const handleStartEdit = (review: UserReview) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditContent(review.content);
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setEditContent("");
  };

  const handleSave = async (review: UserReview) => {
    await onSaveReview(review, editRating, editContent);
    setEditingReviewId(null);
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-gray-500 text-sm font-medium">후기를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (myReviews.length === 0) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-gray-500 text-sm font-medium">작성한 후기가 없습니다.</p>
        <p className="text-gray-400 text-xs mt-1">이용한 청소 서비스의 솔직한 후기를 남겨 보세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {myReviews.map((review) => (
        <div key={review.id} className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
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
                  onClick={() => void handleSave(review)}
                  className="rounded bg-blue-500 hover:bg-blue-600 px-3 py-1.5 text-xs text-white font-medium cursor-pointer"
                >
                  저장
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="rounded border border-gray-300 hover:bg-gray-50 px-3 py-1.5 text-xs text-gray-600 font-medium cursor-pointer"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-800">{review.businessName}</h4>
                <span className="text-xs text-gray-400">{review.date}</span>
              </div>
              <span className="mt-1 inline-block text-sm text-yellow-500">
                {"⭐".repeat(review.rating)}
              </span>
              <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{review.content}</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleStartEdit(review)}
                  className="rounded border px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  수정
                </button>
                <button
                  onClick={() => void onDeleteReview(review)}
                  className="rounded border px-3 py-1 text-xs text-red-400 hover:bg-red-50 cursor-pointer"
                >
                  삭제
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
