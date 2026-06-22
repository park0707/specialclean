import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react/jsx-runtime";
import { Link, useRouter } from "@tanstack/react-router";
import { useAuth } from "../logincontext";
import { useTutorial } from "../tutorialcontext";
import { useState } from "react";
import LoginDialog from "./menu_parts/login";
import { auth } from '../lib/firebase';
import { signOut } from "firebase/auth";
import {
    HomeIcon,
    InformationCircleIcon,
    ArrowRightOnRectangleIcon,
    ArrowLeftOnRectangleIcon,
    UserIcon,
    Bars3Icon,
    AcademicCapIcon
} from '@heroicons/react/24/outline';
export function Mymenu() {
    const { user, hasUnreadNotice } = useAuth()
    const { startTour } = useTutorial()
    const router = useRouter()
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const itemclass = (active: boolean) =>
        `${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}
   flex items-center px-4 py-2 text-[15px] w-full cursor-pointer text-left`;
    const handleLogout = async () => {
        try {
            await signOut(auth); // 현재 로그인된 사용자 세션 종료
        } catch (err) {
            console.error(err);
        }
    };
    return (


        <Menu as="div" className="relative inline-block text-left">
            <Menu.Button id="mymenu-button" className="relative inline-flex items-center gap-1 rounded-md bg-white 
            px-1 py-1 text-sm font-medium text-gray-700 shadow hover:bg-gray-50 cursor-pointer">
                <Bars3Icon className="w-9 h-9 text-black" />
                {hasUnreadNotice && (
                    <span className="absolute top-1 right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                )}
            </Menu.Button>
            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute right-0 mt-2 w-45 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-40">
                    <Menu.Item>
                        {
                            ({ active }) => (
                                <Link to="/" className={itemclass(active)}>
                                    <HomeIcon className="w-5 h-5 inline-block mr-3  text-blue-500" />
                                    홈으로
                                </Link>
                            )
                        }
                    </Menu.Item>
                    <Menu.Item>
                        {
                            ({ active }) => (
                                <Link to="/info" search={{ menu: "privacy" }} className={itemclass(active)}>
                                    <InformationCircleIcon className="w-5 h-5 inline-block mr-3  text-blue-500" />
                                    정보
                                    {hasUnreadNotice && (
                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 ml-1.5 align-middle animate-pulse" />
                                    )}
                                </Link>
                            )
                        }
                    </Menu.Item>
                    <Menu.Item>
                        {
                            ({ active }) => (
                                <button
                                    type="button"
                                    className={itemclass(active)}
                                    onClick={() => {
                                        const currentPath = router.state.location.pathname;
                                        if (currentPath === '/mypage') {
                                            startTour('mypage');
                                        } else if (currentPath === '/') {
                                            startTour('home');
                                        } else {
                                            router.navigate({ to: '/' });
                                            setTimeout(() => startTour('home'), 300);
                                        }
                                    }}
                                >
                                    <AcademicCapIcon className="w-5 h-5 inline-block mr-3 text-blue-500" />
                                    튜토리얼
                                </button>
                            )
                        }
                    </Menu.Item>
                    <Menu.Item>
                        {
                            user ?
                                ({ active }) => (
                                    <div className={itemclass(active)} onClick={handleLogout}>
                                        <ArrowLeftOnRectangleIcon className="w-5 h-5 inline-block mr-3  text-blue-500" />
                                        로그아웃
                                    </div>
                                ) :
                                ({ active }) => (
                                    <div className={itemclass(active)} onClick={() => setIsLoginOpen(true)}>
                                        <ArrowRightOnRectangleIcon className="w-5 h-5 inline-block mr-3  text-blue-500" />
                                        로그인 / 회원 가입
                                    </div>
                                )

                        }
                    </Menu.Item>
                    {
                        user &&
                        <Menu.Item>
                            {
                                ({ active }) => (
                                    <Link to="/mypage" className={itemclass(active)}>
                                        <UserIcon className="w-5 h-5 inline-block mr-3 text-blue-500" />
                                        마이페이지
                                    </Link>
                                )
                                //마이페이지 나중에 만들고 Link로 바꾸기
                            }
                        </Menu.Item>
                    }
                </Menu.Items>
            </Transition>
            <LoginDialog isOpen={isLoginOpen} closeModal={() => setIsLoginOpen(false)} />
        </Menu>
    )
}