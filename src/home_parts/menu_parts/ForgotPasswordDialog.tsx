// src/home_parts/menu_parts/ForgotPasswordDialog.tsx
import { Dialog, DialogPanel, DialogTitle, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';

export interface ForgotPasswordDialogProps {
  isOpen: boolean;
  closeModal: () => void;
}

const ForgotPasswordDialog = ({ isOpen, closeModal }: ForgotPasswordDialogProps) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleClose = () => {
    setEmail('');
    setMessage('');
    setIsError(false);
    closeModal();
  };

  const handleSendReset = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setIsError(true);
      setMessage('이메일을 입력해 주세요.');
      return;
    }

    setIsSending(true);
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setIsError(false);
      setMessage('비밀번호 재설정 메일을 전송했어요. 메일함(스팸함 포함)을 확인해 주세요.');
    } catch (err: any) {
      setIsError(true);
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/invalid-email' ||
        err.code === 'auth/invalid-credential'
      ) {
        setMessage('등록되지 않은 이메일이거나 형식이 올바르지 않습니다.');
      } else {
        setMessage('메일 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={handleClose} className="fixed inset-0 z-[60]">
        {/* 배경 오버레이 - z-index를 로그인 모달보다 높게 */}
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
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
              <DialogTitle className="text-lg font-semibold mb-1">
                비밀번호 찾기
              </DialogTitle>
              <p className="text-sm text-gray-500 mb-4">
                가입한 이메일 주소를 입력하면 비밀번호 재설정 링크를 보내드려요.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendReset();
                }}
                className="space-y-3"
              >
                <input
                  className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  type="email"
                  placeholder="이메일"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSending}
                />

                {message && (
                  <div
                    className={`text-sm pl-1 ${
                      isError ? 'text-red-500' : 'text-green-600'
                    }`}
                  >
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSending}
                  className="mt-2 w-full rounded bg-blue-500 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:bg-blue-300 cursor-pointer transition-colors duration-200"
                >
                  {isSending ? '전송 중...' : '비밀번호 재설정 메일 보내기'}
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 underline-offset-2 hover:underline cursor-pointer"
                >
                  돌아가기
                </button>
              </form>
            </DialogPanel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ForgotPasswordDialog;
