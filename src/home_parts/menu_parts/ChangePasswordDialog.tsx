// ChangePasswordDialog.tsx
import { Dialog, DialogPanel, DialogTitle, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import { useAuth } from '../../logincontext';
import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

interface ChangePasswordDialogProps {
  isOpen: boolean;
  closeModal: () => void;
}

export default function ChangePasswordDialog({
  isOpen,
  closeModal,
}: ChangePasswordDialogProps) {
  const { user,loading } = useAuth();
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [issuccess, setIsSuccess] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      // 로그인 상태가 아니면 홈으로 리다이렉트
      navigate({ to: '/' });
    }}, [user, loading, navigate]);
    if (loading || !user) {
      return null; 
    }

  const handleClose = () => {
    // 닫을 때 입력값/메시지 초기화
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setMessage('');
    setSaving(false);
    closeModal();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsSuccess(false);

    if (!user || !user.email) {
      setMessage('이메일/비밀번호 계정에서만 비밀번호 변경이 가능합니다.');
      return;
    }

    if (!currentPw || !newPw || !confirmPw) {
      setMessage('모든 비밀번호 입력란을 채워 주세요.');
      return;
    }

    if (newPw !== confirmPw) {
      setMessage('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if(currentPw === newPw){
      setMessage('새 비밀번호는 현재 비밀번호와 달라야 합니다.');
      return;
    }

    try {
      setSaving(true);

      // 1) 재인증 [web:161][web:163][web:166]
      const credential = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(user, credential);

      // 2) 비밀번호 변경 [web:68][web:158]
      await updatePassword(user, newPw);

      setMessage('비밀번호가 성공적으로 변경되었습니다.');
      setIsSuccess(true);
      // 성공 시 모달 닫고 싶으면:
      // handleClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setMessage('현재 비밀번호가 올바르지 않습니다.');
      } else if (err.code === 'auth/weak-password') {
        setMessage('새 비밀번호가 너무 약합니다. 더 복잡하게 설정해 주세요.');
      } else if (err.code === 'auth/requires-recent-login') {
        setMessage('보안을 위해 다시 로그인한 후 비밀번호를 변경해 주세요.');
      } else {
        setMessage('비밀번호 변경 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setSaving(false);
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
              <DialogTitle className="text-lg font-semibold mb-4">
                비밀번호 변경
              </DialogTitle>

              <form className="space-y-3" onSubmit={handleChangePassword}>
                <input
                  type="password"
                  className="w-full rounded border px-3 py-2 text-sm"
                  placeholder="현재 비밀번호"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                />
                <input
                  type="password"
                  className="w-full rounded border px-3 py-2 text-sm"
                  placeholder="새 비밀번호"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                />
                <input
                  type="password"
                  className="w-full rounded border px-3 py-2 text-sm"
                  placeholder="새 비밀번호 확인"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                />

                {message && (
                  <p className={`text-sm ${issuccess ? 'text-green-500' : 'text-red-500'}`}>{message}</p>
                )}

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    닫기
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded bg-blue-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
                  >
                    {saving ? '변경 중...' : '변경하기'}
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
