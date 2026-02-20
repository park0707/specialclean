// LoginDialog.tsx
import { Dialog, DialogPanel, DialogTitle, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { useState } from 'react'
import SignUpDialog from './signup'
import {auth} from '../../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
interface loginprops {
  isOpen: boolean
  closeModal: () => void
}

export default function LoginDialog({ isOpen, closeModal }: loginprops) {
    const [isSignUpOpen, setIsSignUpOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const handleLogin = async () => {
      const trimmedEmail = email.trim();
      const trimmedPw = password.trim();
      if (!trimmedEmail || !trimmedPw) return;

      try {
        await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPw);
        // 성공: 모달 닫기 + 입력 초기화
        setEmail('');
        setPassword('');
        closeModal();
      } catch (err: any) {
        console.error(err);
        // TODO: 에러 코드별 메시지 처리 (예: 비밀번호 틀림, 계정 없음 등) 나중에 추가 수정해야 함
      }
    };
    const handleGoogleLogin = async () => {
      try {
        const provider = new GoogleAuthProvider();
        // 구글 계정 선택 팝업 → 로그인
        await signInWithPopup(auth, provider);
        // 성공하면 AuthProvider의 onAuthStateChanged가 user를 채워줌
        closeModal(); // 로그인 모달 닫기
      } catch (err) {
        console.error(err);
        // TODO: 에러 메시지 UI로 보여주고 싶으면 여기서 처리
      }
    };

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
                  placeholder="이메일"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  className="w-full rounded border px-3 py-2 text-sm"
                  type="password"
                  placeholder="비밀번호"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  className="mt-2 w-full rounded bg-blue-500 py-2 text-sm font-semibold text-white hover:bg-blue-600 cursor-pointer"
                  onClick={handleLogin} 
                >
                  로그인
                </button>
                <button className="w-full rounded bg-blue-500 py-2 text-sm font-semibold text-white hover:bg-blue-600 cursor-pointer"
                onClick={()=>setIsSignUpOpen(true)}>
                  회원 가입
                </button>
                <button
                type="button"
                className="w-full flex items-center justify-center gap-2 rounded border border-gray-300 bg-white py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                onClick={handleGoogleLogin}
              >
                
                Google 계정으로 로그인
              </button>

                 <button
                  type="button"
                  className="w-full text-sm text-gray-500 hover:text-gray-700 underline-offset-2 hover:underline cursor-pointer"
                  // onClick={handleFindPassword}  // 나중에 비밀번호 찾기 모달/페이지 연결
                >
                  비밀번호 찾기
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
