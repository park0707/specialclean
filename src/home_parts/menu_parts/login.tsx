// LoginDialog.tsx
import { Dialog, DialogPanel, DialogTitle, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { useState } from 'react'
import SignUpDialog from './signup'
import {auth} from '../../lib/firebase';
import { signInWithEmailAndPassword,sendEmailVerification } from 'firebase/auth';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import ForgotPasswordDialog from './ForgotPasswordDialog';
interface loginprops {
  isOpen: boolean
  closeModal: () => void
}

export default function LoginDialog({ isOpen, closeModal }: loginprops) {
    const [isSignUpOpen, setIsSignUpOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState(''); // 로그인 관련 안내/에러
    const [isresend, setisresend] = useState(false); // 인증메일 재전송 버튼 활성화 여부
    const [isForgotOpen, setIsForgotOpen] = useState(false); // 비밀번호 찾기 모달 열림 여부
    const [lastuser, setLastUser] = useState<null|import('firebase/auth').User>(null); // 마지막 로그인 시도한 이메일 주소 (인증메일 재전송용)


    const handleclose = () => {      
      setEmail('');
      setPassword('');
      setMessage('');
      closeModal();
    }

    const handleLogin = async () => {
      const trimmedEmail = email.trim();
      const trimmedPw = password.trim();
      if (!trimmedEmail || !trimmedPw) {
        setMessage('이메일과 비밀번호를 모두 입력해 주세요.');
        return;
      }

      try {
        const cred = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPw);
        
           // 이메일 인증 여부 체크 (로컬 개발 환경에서는 테스트 편의를 위해 우회 가능)
        if (!cred.user.emailVerified && !import.meta.env.DEV) {
          setLastUser(cred.user); // 인증메일 재전송 위해 마지막 로그인 시도한 사용자 저장
          await auth.signOut(); // or signOut(auth)
          setMessage('이메일 인증 후에만 로그인할 수 있습니다. 메일함을 확인해 주세요.');
          return;
        }
        
        setEmail('');
        setPassword('');
        setMessage('');
        setLastUser(null);
        closeModal();
      } catch (err: any) {
         if (
            err.code === 'auth/user-not-found' ||
            err.code === 'auth/wrong-password' ||
            err.code === 'auth/invalid-credential' ||        // 일부 SDK
            err.code === 'auth/invalid-login-credentials'    // 일부 SDK
          ) {
            setMessage('이메일 또는 비밀번호를 확인해 주세요.');
          } else if (err.code === 'auth/invalid-email') {
            setMessage('이메일 형식이 올바르지 않습니다.');
          } else {
            setMessage('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
          }
      }
    };
    const handleGoogleLogin = async () => {
      setMessage('');
      try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        
        try {
          // 모바일/데스크톱 구분 없이 우선 팝업(새 탭) 로그인 시도
          // (Safari/Chrome 모바일 등에서 서드파티 쿠키 차단으로 인한 리디렉션 로그인 실패 우회)
          await signInWithPopup(auth, provider);
          closeModal();
        } catch (popupErr: any) {
          // 팝업이 차단되었거나 취소된 경우 리디렉션으로 폴백
          if (
            popupErr.code === 'auth/popup-blocked' ||
            popupErr.code === 'auth/cancelled-popup-request' ||
            popupErr.code === 'auth/popup-closed-by-user'
          ) {
            await signInWithRedirect(auth, provider);
          } else {
            throw popupErr;
          }
        }
      } catch (err: any) {
        console.error(err);
        setMessage('Google 로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      }
    };
    const handleResendVerification = async () => {
      if (!lastuser) {
        setMessage('먼저 이메일과 비밀번호로 로그인 시도해 주세요.');
        return;
      }

      try {
        setisresend(true);
        await sendEmailVerification(lastuser); // 재전송 [web:64][web:66][web:68]
        setMessage('인증 메일을 다시 보냈어요. 메일함(스팸함 포함)을 확인해 주세요.');
      } catch (err: any) {
        console.error(err);
        setMessage('인증 메일 재전송 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      } finally {
        setisresend(false);
      }
    };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={handleclose} className="fixed inset-0 z-50">
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
              <form onSubmit={(e)=>{
                e.preventDefault();
                handleLogin();
              }}
              className="space-y-3">
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
                {
                  message && <div className="text-red-500 text-sm pl-1">{message}</div>
                }
                <button
                  className="mt-2 w-full rounded bg-blue-500 py-2 text-sm font-semibold text-white hover:bg-blue-600 cursor-pointer"
                  onClick={handleLogin} type='submit'
                >
                  로그인
                </button>
                <button className="w-full rounded bg-blue-500 py-2 text-sm font-semibold text-white hover:bg-blue-600 cursor-pointer"
                type='button'
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
                  onClick={() => setIsForgotOpen(true)}
                >
                  비밀번호 찾기
                </button>
                {
                  lastuser && (
                    <button
                      type="button"
                      className="w-full text-sm text-gray-500 hover:text-gray-700 underline-offset-2 hover:underline cursor-pointer"
                      onClick={handleResendVerification}
                      disabled={isresend}
                    >
                      {isresend ? '인증 메일 재전송 중...' : '인증 메일 재전송'}
                    </button>
                  )
                }

              </form>
            </DialogPanel>
          </Transition.Child>
        </div>
      </Dialog>
        <SignUpDialog isOpen={isSignUpOpen} closeModal={()=>{setIsSignUpOpen(false)}}/>
        <ForgotPasswordDialog isOpen={isForgotOpen} closeModal={()=>{setIsForgotOpen(false)}}/>
    </Transition>
  )
}
