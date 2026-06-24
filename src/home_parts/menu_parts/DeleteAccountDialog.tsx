// DeleteAccountDialog.tsx
import { Dialog, DialogPanel, DialogTitle, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect, useCallback } from 'react';
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  deleteUser,
} from 'firebase/auth';
import { doc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../logincontext';
import { useNavigate } from '@tanstack/react-router';

interface DeleteAccountDialogProps {
  isOpen: boolean;
  closeModal: () => void;
}

export default function DeleteAccountDialog({
  isOpen,
  closeModal,
}: DeleteAccountDialogProps) {
  const { user, loading } = useAuth();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [googleReauthenticated, setGoogleReauthenticated] = useState(false);
  const [reauthenticating, setReauthenticating] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const navigate = useNavigate();

  const isGoogleUser = user?.providerData?.some(
    (p) => p.providerId === 'google.com'
  ) ?? false;

  const handleClose = useCallback(() => {
    setPassword('');
    setMessage('');
    setDeleting(false);
    setGoogleReauthenticated(false);
    setReauthenticating(false);
    closeModal();
  }, [closeModal]);

  useEffect(() => {
    if (isDeleted) {
      alert('회원 탈퇴가 완료되었습니다. 이용해 주셔서 감사합니다.');
      handleClose();
      navigate({ to: '/' });
    } else if (!loading && !user && isOpen) {
      closeModal();
      navigate({ to: '/' });
    }
  }, [user, loading, navigate, isOpen, closeModal, isDeleted, handleClose]);

  if (loading || !user) {
    return null;
  }

  const handleGoogleReauthenticate = async () => {
    if (!user) return;
    setMessage('');
    setReauthenticating(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await reauthenticateWithPopup(user, provider);
      setGoogleReauthenticated(true);
      setMessage('Google 계정 재인증에 성공했습니다. [탈퇴하기] 버튼을 눌러 완료해 주세요.');
    } catch (err) {
      const error = err as { message?: string };
      console.error(error);
      setMessage(`Google 계정 재인증에 실패했습니다: ${error.message || String(err)}`);
    } finally {
      setReauthenticating(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!user || !user.email) {
      setMessage('사용자 정보를 찾을 수 없습니다.');
      return;
    }

    if (!isGoogleUser && !password.trim()) {
      setMessage('비밀번호를 입력해 주세요.');
      return;
    }

    if (isGoogleUser && !googleReauthenticated) {
      setMessage('보안을 위해 Google 계정 재인증을 먼저 진행해 주세요.');
      return;
    }

    try {
      setDeleting(true);

      // 1) 이메일 로그인 사용자의 경우 수동 재인증 처리
      if (!isGoogleUser) {
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
      }

      // 2) Firestore의 users 컬렉션에서 동일한 이메일을 가진 문서들을 모두 조회하여 일괄 삭제 시도
      const userRef = doc(db, 'users', user.uid);
      try {
        const usersCollRef = collection(db, 'users');
        const q = query(usersCollRef, where('email', '==', user.email));
        const querySnapshot = await getDocs(q);
        
        const batch = writeBatch(db);
        const targetIds = new Set<string>();
        
        querySnapshot.forEach((docSnap) => {
          batch.delete(docSnap.ref);
          targetIds.add(docSnap.id);
        });
        
        // 본인의 UID 문서가 쿼리에 누락되어 있다면 확실히 포함해서 일괄 삭제 (중복 요청 방지)
        if (!targetIds.has(user.uid)) {
          batch.delete(userRef);
        }
        
        await batch.commit();
        console.log('All matching user documents deleted successfully via email query batch.');
      } catch (firestoreErr) {
        console.warn('Firestore bulk deletion via email query failed (likely rules restriction). Falling back to direct single document deletion...', firestoreErr);
        
        // 이메일 기반 전체 조회가 규칙에 막힐 시, 본인의 UID 문서 단건 직접 삭제로 우회 진행
        try {
          await deleteDoc(userRef);
          console.log('Direct single user document deleted successfully.');
        } catch (singleErr) {
          console.error('Direct single user document deletion failed as well:', singleErr);
          // 최종 사용자에게는 시스템 내부 설정(Rules 등) 대신 정제된 안내 문구를 출력합니다.
          throw new Error('회원 탈퇴 처리 중 권한 오류가 발생했습니다. 지속해서 문제가 발생할 경우 고객센터로 문의해 주세요.');
        }
      }

      // 3) Firebase Auth 계정 삭제
      await deleteUser(user);

      setIsDeleted(true);
    } catch (err) {
      const error = err as { code?: string; message?: string };
      console.error(error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setMessage('비밀번호가 올바르지 않습니다.');
      } else if (error.code === 'auth/requires-recent-login') {
        setMessage('보안을 위해 재인증이 필요합니다. 재인증 후 다시 시도해 주세요.');
        if (isGoogleUser) {
          setGoogleReauthenticated(false);
        }
      } else {
        setMessage(error.message || '회원 탈퇴 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={handleClose} className="fixed inset-0 z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center">
          <Transition.Child
            as={Fragment}
            enter="transition ease-out duration-150"
            enterFrom="opacity-0 scale-95 translate-y-2"
            enterTo="opacity-100 scale-100 translate-y-0"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100 scale-100 translate-y-0"
            leaveTo="opacity-0 scale-95 translate-y-2"
          >
            <DialogPanel className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
              <DialogTitle className="text-lg font-semibold mb-2 text-gray-900">
                회원 탈퇴
              </DialogTitle>

              <div className="text-sm text-gray-500 mb-4 space-y-2">
                <p>정말로 탈퇴하시겠습니까?</p>
                <p className="text-red-500 font-medium bg-red-50 p-2.5 rounded-lg text-xs leading-relaxed">
                  ⚠️ 탈퇴 후에는 회원님의 모든 개인정보 및 서비스 이용 내역이 영구 삭제되며, 복구할 수 없습니다.
                </p>
              </div>

              <form className="space-y-3" onSubmit={handleDeleteAccount}>
                {!isGoogleUser && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                      본인 확인을 위해 비밀번호를 입력해 주세요.
                    </label>
                    <input
                      type="password"
                      className="w-full rounded border px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="비밀번호"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={deleting}
                    />
                  </div>
                )}

                {isGoogleUser && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                      보안을 위해 Google 계정 재인증이 필요합니다.
                    </label>
                    <button
                      type="button"
                      onClick={handleGoogleReauthenticate}
                      disabled={reauthenticating || deleting || googleReauthenticated}
                      className={`w-full flex items-center justify-center gap-2 rounded border py-2 text-sm font-semibold cursor-pointer transition-colors ${
                        googleReauthenticated
                          ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50'
                      }`}
                    >
                      {googleReauthenticated ? '✓ Google 계정 재인증 완료' : reauthenticating ? '재인증 진행 중...' : 'Google 계정 재인증하기'}
                    </button>
                  </div>
                )}

                {message && (
                  <p className="text-sm text-red-500 font-medium pl-1 leading-relaxed">{message}</p>
                )}

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={deleting || reauthenticating}
                    className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={deleting || reauthenticating || (isGoogleUser && !googleReauthenticated)}
                    className="rounded bg-red-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-600 cursor-pointer disabled:opacity-50"
                  >
                    {deleting ? '탈퇴 중...' : '탈퇴하기'}
                  </button>
                </div>
              </form>
            </DialogPanel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
