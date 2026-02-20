//id,pw의 변화에 따라 보이는 문자들 다르게 보이도록 수정해야 함
import { Dialog, DialogPanel, DialogTitle, Transition } from '@headlessui/react'
import { Fragment, useEffect } from 'react'
import { useState } from 'react'
import { useSignUpLogic } from './signuplogic';
import {auth} from '../../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';


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
    const handleSignUp = async () => {
      const email = id.trim();
      const password = pw.trim();

      

      // 간단 검증: 비어 있으면 그냥 리턴
      if (!email || !password) {
        return;
      }

      try {
        await createUserWithEmailAndPassword(auth, email, password);
        setId('');
        setPw('');
        setPwcon('');
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
                <button className="w-full rounded bg-blue-500 py-2 text-sm font-semibold text-white hover:bg-blue-600 cursor-pointer"
                onClick={handleSignUp}>
                  회원 가입
                </button>
                
              </div>
            </DialogPanel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}
