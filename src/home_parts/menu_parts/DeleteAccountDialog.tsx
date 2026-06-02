// DeleteAccountDialog.tsx
import { Dialog, DialogPanel, DialogTitle, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  deleteUser,
} from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../logincontext';
import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

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
  const navigate = useNavigate();

  const isGoogleUser = user?.providerData.some(
    (p) => p.providerId === 'google.com'
  );

  useEffect(() => {
    if (!loading && !user && isOpen) {
      closeModal();
      navigate({ to: '/' });
    }
  }, [user, loading, navigate, isOpen, closeModal]);

  if (loading || !user) {
    return null;
  }

  const handleClose = () => {
    setPassword('');
    setMessage('');
    setDeleting(false);
    closeModal();
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

    try {
      setDeleting(true);

      // 1) 이메일 로그인 사용자의 경우 수동 재인증 처리
      if (!isGoogleUser) {
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
      }

      // 2) Firestore의 users 컬렉션 사용자 문서 삭제 (인증 삭제 전에 지워야 권한 규칙 위반하지 않음)
      const userRef = doc(db, 'users', user.uid);
      await deleteDoc(userRef);

      // 3) Firebase Auth 계정 삭제
      await deleteUser(user);

      alert('회원 탈퇴가 완료되었습니다. 이용해 주셔서 감사합니다.');
      handleClose();
      navigate({ to: '/' });
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setMessage('비밀번호가 올바르지 않습니다.');
      } else if (err.code === 'auth/requires-recent-login') {
        // 구글 로그인 등에서 재인증 필요 시 팝업 재인증 처리
        if (isGoogleUser) {
          try {
            setMessage('보안을 위해 구글 계정 재인증이 필요합니다. 재인증을 진행합니다...');
            const provider = new GoogleAuthProvider();
            await reauthenticateWithPopup(user, provider);
            
            // 재인증 성공 시 다시 탈퇴 시도
            const userRef = doc(db, 'users', user.uid);
            await deleteDoc(userRef);
            await deleteUser(user);

            alert('회원 탈퇴가 완료되었습니다. 이용해 주셔서 감사합니다.');
            handleClose();
            navigate({ to: '/' });
          } catch (popupErr: any) {
            console.error(popupErr);
            setMessage('재인증에 실패하였습니다. 다시 시도해 주세요.');
          }
        } else {
          setMessage('보안을 위해 로그아웃 후 다시 로그인하여 탈퇴를 진행해 주세요.');
        }
      } else {
        setMessage('회원 탈퇴 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
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

                {message && (
                  <p className="text-sm text-red-500 font-medium pl-1">{message}</p>
                )}

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={deleting}
                    className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={deleting}
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
