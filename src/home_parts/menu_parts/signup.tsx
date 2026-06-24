//id,pw의 변화에 따라 보이는 문자들 다르게 보이도록 수정해야 함
import { Dialog, DialogPanel, DialogTitle, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { useState, useEffect } from 'react'
import { useSignUpLogic } from './signuplogic';
import {auth} from '../../lib/firebase';
import { createUserWithEmailAndPassword,sendEmailVerification, signOut } from 'firebase/auth';
import { syncUserDocument } from '../../lib/firebaseuser';


interface signupprops {
  isOpen: boolean
  closeModal: () => void
}

export default function SignUpDialog({ isOpen, closeModal }: signupprops) {
    const [id, setId] = useState('');
    const [pw, setPw] = useState('');
    const [pwcon, setPwcon] = useState('')
    const [idok, setIdok] = useState(0) //0은 초기값, 1은 이미 사용 중, 2는 이메일 형식 불일치 3은 사용 가능
    const [pwok, setPwok] = useState(0) //0은 초기값 1이면 pw 미입력, 2이면 pw 미입력, 3이면 불일치
    const [msg, setMsg] = useState(''); // 이메일 인증이나 기타 사용자에게 표시하고 싶은 메시지

    const [termsAgree, setTermsAgree] = useState(false);
    const [privacyAgree, setPrivacyAgree] = useState(false);
    const [ageAgree, setAgeAgree] = useState(false);

    // 모달이 닫히거나 열릴 때 기존 상태들을 리셋하여 이전 메시지/입력값이 잔존하지 않도록 방지
    useEffect(() => {
      if (!isOpen) {
        setId('');
        setPw('');
        setPwcon('');
        setIdok(0);
        setPwok(0);
        setMsg('');
        setTermsAgree(false);
        setPrivacyAgree(false);
        setAgeAgree(false);
      }
    }, [isOpen]);

    const handleSignUp = async () => {
      const email = id.trim();
      const password = pw.trim();

      // 약관 및 개인정보 동의 여부 검사
      if (!termsAgree || !privacyAgree || !ageAgree) {
        alert('회원가입을 위해 필수 약관 및 동의 항목에 모두 동의해 주세요.');
        return;
      }

      // 간단 검증: 비어 있으면 그냥 리턴
      if (!email || !password) {
        return;
      }

      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);

        if (cred.user) {
          await sendEmailVerification(cred.user); // [web:41][web:45]
          await syncUserDocument(cred.user);
        }
        await signOut(auth);

        setId('');
        setPw('');
        setPwcon('');
        alert('회원 가입이 완료되었습니다. 이메일 인증 후 로그인해주세요.');
        closeModal();
      } catch (err: any) {
        if (err.code === 'auth/email-already-in-use') {
          setIdok(1); // 이미 사용 중인 이메일
        }
         else if (err.code === 'auth/invalid-email') {
          setIdok(2); // 이메일 형식이 올바르지 않음
        }
      
    
      }
  };

    
    const idchangehandler = (e:any) => {
        setId(e.target.value);
    }
    const pwchangehandler = (e:any) => {
        setPw(e.target.value);
    }
    const pwconchangehandler = (e:any) => {
        setPwcon(e.target.value);
    }
    useSignUpLogic(id,pw,pwcon,setPwok);
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={closeModal} className="fixed inset-0 z-60">
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
                회원 가입
              </DialogTitle>
              <div className="space-y-3">
                <input
                  className="w-full rounded border px-3 py-2 text-sm"
                  placeholder="이메일"
                  value={id}
                  onChange={idchangehandler}
                />
                {
                    idok === 1 ? <div className="text-red-500 text-sm pl-1">이미 사용 중인 이메일입니다.</div> :
                    idok === 2 ? <div className="text-red-500 text-sm pl-1">이메일 형식이 올바르지 않습니다.</div> :
                    idok === 3 ? <div className="text-green-500 text-sm pl-1">사용 가능한 이메일입니다.</div> :
                    <div className="text-sm pl-1">이메일을 입력해주세요.</div>
                }
                <input
                  className="w-full rounded border px-3 py-2 text-sm"
                  type="password"
                  placeholder="비밀번호"
                  value={pw}
                  onChange={pwchangehandler}
                />
                <input
                  className="w-full rounded border px-3 py-2 text-sm"
                  type="password"
                  placeholder="비밀번호 확인"
                  value={pwcon}
                  onChange={pwconchangehandler}
                />
                {
                    pwok === 1 ? <div className="text-red-500 text-sm pl-1">비밀번호를 입력해주세요.</div> :
                    pwok === 2 ? <div className="text-red-500 text-sm pl-1">비밀번호 확인을 입력해주세요.</div> :
                    pwok === 3 ? <div className="text-red-500 text-sm pl-1">비밀번호가 일치하지 않습니다.</div> :
                    null
                }

                <div className="space-y-2 py-2 border-t border-gray-100 mt-2 text-[11px] sm:text-xs text-gray-600">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="termsAgree"
                      checked={termsAgree}
                      onChange={(e) => setTermsAgree(e.target.checked)}
                      className="mt-0.5 accent-blue-500"
                    />
                    <label htmlFor="termsAgree" className="cursor-pointer select-none">
                      <span className="font-semibold text-blue-600">[필수]</span>{' '}
                      <a href="/info?menu=terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-500">
                        서비스 이용약관
                      </a>{' '}
                      동의
                    </label>
                  </div>
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="privacyAgree"
                      checked={privacyAgree}
                      onChange={(e) => setPrivacyAgree(e.target.checked)}
                      className="mt-0.5 accent-blue-500"
                    />
                    <label htmlFor="privacyAgree" className="cursor-pointer select-none">
                      <span className="font-semibold text-blue-600">[필수]</span>{' '}
                      <a href="/info?menu=privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-500">
                        개인정보 수집 및 이용
                      </a>{' '}
                      동의
                    </label>
                  </div>
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="ageAgree"
                      checked={ageAgree}
                      onChange={(e) => setAgeAgree(e.target.checked)}
                      className="mt-0.5 accent-blue-500"
                    />
                    <label htmlFor="ageAgree" className="cursor-pointer select-none">
                      <span className="font-semibold text-blue-600">[필수]</span> 본인은 만 14세 이상입니다.
                    </label>
                  </div>
                </div>

                <button className="w-full rounded bg-blue-500 py-2 text-sm font-semibold text-white hover:bg-blue-600 cursor-pointer"
                onClick={handleSignUp}>
                  회원 가입
                </button>
                {
                  msg && <div className="text-green-500 text-sm pl-1">{msg}</div>
                }
              </div>
            </DialogPanel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}
