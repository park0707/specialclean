// LoginDialog.tsx
import { Dialog, DialogPanel, DialogTitle, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { useState } from 'react'
import SignUpDialog from './signup'
interface loginprops {
  isOpen: boolean
  closeModal: () => void
}

export default function LoginDialog({ isOpen, closeModal }: loginprops) {
    const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={closeModal} className="fixed inset-0 z-50">
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
                로그인
              </DialogTitle>
              <div className="space-y-3">
                <input
                  className="w-full rounded border px-3 py-2 text-sm"
                  placeholder="아이디 또는 이메일"
                />
                <input
                  className="w-full rounded border px-3 py-2 text-sm"
                  type="password"
                  placeholder="비밀번호"
                />
                <button
                  className="mt-2 w-full rounded bg-blue-500 py-2 text-sm font-semibold text-white hover:bg-blue-600"
                  onClick={closeModal} // 나중에 로그인 기능 구현 시 수정 필요
                >
                  로그인
                </button>
                <button className="w-full rounded bg-blue-500 py-2 text-sm font-semibold text-white hover:bg-blue-600"
                onClick={()=>setIsSignUpOpen(true)}>
                  회원 가입
                </button>
              </div>
            </DialogPanel>
          </Transition.Child>
        </div>
      </Dialog>
        <SignUpDialog isOpen={isSignUpOpen} closeModal={()=>setIsSignUpOpen(false)}/>
    </Transition>
  )
}
