// src/home_parts/menu_parts/info_parts/notice.tsx
import { useEffect, useState, Fragment } from 'react';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../logincontext';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { PlusIcon, MegaphoneIcon } from '@heroicons/react/24/outline';
import { useNavigate } from '@tanstack/react-router';

interface Notice {
  id: string;
  title: string;
  content: string;
  createdAt: any;
  author: string;
  important: boolean;
}

export default function NoticePage({ noticeId }: { activeSection?: string; noticeId?: string }) {
  const { isAdmin, appUser, checkUnreadNotice } = useAuth();
  const navigate = useNavigate({ from: '/info' });
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [readIds, setReadIds] = useState<string[]>([]);

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // 공지사항 로드
  const fetchNotices = async () => {
    setLoading(true);
    setError('');
    try {
      const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notice));
      
      // 중요 공지가 상단에 위치하고, 그 내부 및 일반 공지 내부에서는 작성시간 기준 내림차순 정렬
      const sorted = [...list].sort((a, b) => {
        if (a.important && !b.important) return -1;
        if (!a.important && b.important) return 1;
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setNotices(sorted);
    } catch (err) {
      console.error('Error fetching notices:', err);
      setError('공지사항을 불러오는 중에 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 로컬 스토리지에서 읽은 공지 ID 리스트 로드
  const loadReadIds = () => {
    try {
      const stored = localStorage.getItem('read_notice_ids');
      if (stored) {
        setReadIds(JSON.parse(stored));
      } else {
        setReadIds([]);
      }
    } catch (e) {
      console.error('Failed to load read_notice_ids from localStorage', e);
    }
  };

  useEffect(() => {
    fetchNotices();
    loadReadIds();
  }, [noticeId]);

  // 상세 페이지 진입 시 읽음 처리
  useEffect(() => {
    if (noticeId) {
      try {
        const stored = localStorage.getItem('read_notice_ids');
        let currentIds: string[] = stored ? JSON.parse(stored) : [];
        if (!currentIds.includes(noticeId)) {
          const updated = [...currentIds, noticeId];
          localStorage.setItem('read_notice_ids', JSON.stringify(updated));
          setReadIds(updated);
          checkUnreadNotice();
        }
      } catch (e) {
        console.error('Failed to mark notice as read:', e);
      }
    }
  }, [noticeId, checkUnreadNotice]);

  // 공지사항 저장/수정
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim() || !contentInput.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    setSubmitLoading(true);
    try {
      if (editId) {
        // 수정 모드
        await updateDoc(doc(db, 'notices', editId), {
          title: titleInput,
          content: contentInput,
          important: isImportant,
          updatedAt: serverTimestamp(),
          author: appUser?.email?.split('@')[0] || '관리자',
        });
      } else {
        // 등록 모드
        await addDoc(collection(db, 'notices'), {
          title: titleInput,
          content: contentInput,
          important: isImportant,
          createdAt: serverTimestamp(),
          author: appUser?.email?.split('@')[0] || '관리자',
        });
      }

      // 상태 리셋 및 모달 닫기
      handleCloseModal();

      // 데이터 다시 로드
      await fetchNotices();
    } catch (err: any) {
      console.error('Error saving notice:', err);
      alert(`공지사항을 저장하는 데 실패했습니다. 에러: ${err.message || err.code || err}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  // 공지사항 삭제
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 클릭 이벤트 버블링 방지 (상세 페이지 이동 등 차단)
    if (!window.confirm('정말 이 공지사항을 삭제하시겠습니까?')) return;

    try {
      await deleteDoc(doc(db, 'notices', id));
      alert('공지사항이 삭제되었습니다.');
      
      // 상세 뷰 상태에서 삭제된 경우 목록으로 돌아감
      if (noticeId === id) {
        handleBackToList();
      }
      await fetchNotices();
    } catch (err: any) {
      console.error('Error deleting notice:', err);
      alert(`공지사항 삭제에 실패했습니다. 에러: ${err.message || err.code || err}`);
    }
  };

  // 수정 모달 열기
  const handleOpenEdit = (notice: Notice, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditId(notice.id);
    setTitleInput(notice.title);
    setContentInput(notice.content);
    setIsImportant(notice.important);
    setIsModalOpen(true);
  };

  // 모달 닫기 및 폼 초기화
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTitleInput('');
    setContentInput('');
    setIsImportant(false);
    setEditId(null);
  };

  // 상세 페이지 이동
  const handleNoticeClick = (id: string) => {
    navigate({
      search: (prev) => ({ ...prev, id }),
    });
  };

  // 목록으로 돌아가기
  const handleBackToList = () => {
    navigate({
      search: (prev) => ({ ...prev, id: undefined }),
    });
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = new Date(timestamp.seconds * 1000);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  // ── 상세 페이지 뷰 ──────────────────────────────────
  if (noticeId) {
    const selectedNotice = notices.find((n) => n.id === noticeId);

    if (loading) {
      return (
        <div className="w-full flex justify-center py-16 text-sm text-gray-400">
          공지사항 불러오는 중...
        </div>
      );
    }

    if (!selectedNotice) {
      return (
        <div className="w-full flex flex-col items-center justify-center py-16 text-gray-400 gap-4">
          <MegaphoneIcon className="w-10 h-10 text-gray-300" />
          <p className="text-sm">존재하지 않는 공지사항입니다.</p>
          <button
            onClick={handleBackToList}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm transition duration-200 cursor-pointer"
          >
            목록으로
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* 목록으로 버튼 */}
        <div className="border-b border-gray-100 pb-4">
          <button
            onClick={handleBackToList}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-500 font-semibold mb-4 transition duration-200 cursor-pointer"
          >
            ← 목록으로
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {selectedNotice.important && (
                  <span className="shrink-0 rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    중요
                  </span>
                )}
                <h2 className="text-2xl font-bold text-gray-900">{selectedNotice.title}</h2>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>{formatDate(selectedNotice.createdAt)}</span>
              </div>
            </div>

            {/* 어드민 수정 및 삭제 버튼 */}
            {isAdmin && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => handleOpenEdit(selectedNotice, e)}
                  className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 text-sm font-semibold rounded-lg shadow-sm transition duration-200 cursor-pointer"
                >
                  수정
                </button>
                <button
                  onClick={(e) => handleDelete(selectedNotice.id, e)}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-sm font-semibold rounded-lg shadow-sm transition duration-200 cursor-pointer"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 공지 내용 본문 */}
        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed min-h-[300px] py-4">
          {selectedNotice.content}
        </div>
      </div>
    );
  }

  // ── 목록 페이지 뷰 ──────────────────────────────────
  return (
    <div className="space-y-6">
      {/* 타이틀 및 관리자 글쓰기 버튼 */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">공지사항</h2>
          <p className="text-xs text-gray-400 mt-1">클린 매칭의 최신 소식과 중요 안내를 전해드립니다.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm transition duration-200 cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            공지 등록
          </button>
        )}
      </div>

      {/* 로딩 및 에러 처리 */}
      {loading ? (
        <div className="w-full flex justify-center py-16 text-sm text-gray-400">
          공지사항 불러오는 중...
        </div>
      ) : error ? (
        <div className="w-full flex justify-center py-16 text-sm text-red-500">
          {error}
        </div>
      ) : notices.length === 0 ? (
        <div className="w-full flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
          <MegaphoneIcon className="w-10 h-10 text-gray-300" />
          <p className="text-sm">등록된 공지사항이 없습니다.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {notices.map((notice) => {
            return (
              <li
                key={notice.id}
                onClick={() => handleNoticeClick(notice.id)}
                className={`border rounded-xl bg-white p-5 hover:border-blue-300 cursor-pointer transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  notice.important ? 'border-blue-200 bg-blue-50/10 shadow-sm' : 'border-gray-200'
                }`}
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {notice.important && (
                      <span className="shrink-0 rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                        중요
                      </span>
                    )}
                    <h3 className={`text-base font-semibold ${notice.important ? 'text-gray-900' : 'text-gray-800'} hover:text-blue-600 transition-colors flex items-center gap-1.5`}>
                      {notice.title}
                      {!isAdmin && !readIds.includes(notice.id) && (
                        <span className="relative flex h-1.5 w-1.5 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                        </span>
                      )}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{formatDate(notice.createdAt)}</span>
                  </div>
                </div>

                {/* 어드민 수정 및 삭제 버튼 */}
                {isAdmin && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => handleOpenEdit(notice, e)}
                      className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 text-xs font-medium rounded transition duration-200 cursor-pointer"
                    >
                      수정
                    </button>
                    <button
                      onClick={(e) => handleDelete(notice.id, e)}
                      className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-medium rounded transition duration-200 cursor-pointer"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* 공지사항 등록 및 수정 모달 (Admin 전용) */}
      <Transition show={isModalOpen} as={Fragment}>
        <Dialog onClose={handleCloseModal} className="fixed inset-0 z-50">
          {/* 배경 오버레이 */}
          <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
          
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 scale-95 translate-y-2"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-2"
            >
              <DialogPanel className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl border border-gray-100">
                <DialogTitle className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MegaphoneIcon className="w-5 h-5 text-blue-500" />
                  {editId ? '공지사항 수정' : '새 공지사항 등록'}
                </DialogTitle>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">제목</label>
                    <input
                      type="text"
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      placeholder="공지사항 제목을 입력하세요"
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="important-checkbox"
                      checked={isImportant}
                      onChange={(e) => setIsImportant(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="important-checkbox" className="text-sm text-gray-700 font-medium cursor-pointer select-none">
                      중요 공지로 지정 (최상단 고정)
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">내용</label>
                    <textarea
                      value={contentInput}
                      onChange={(e) => setContentInput(e.target.value)}
                      placeholder="공지사항 내용을 상세히 작성하세요"
                      rows={8}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-medium cursor-pointer"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={submitLoading}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-sm font-semibold rounded-lg shadow-sm transition duration-200 flex items-center gap-1 cursor-pointer"
                    >
                      {submitLoading ? '저장 중...' : editId ? '수정 완료' : '등록'}
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
