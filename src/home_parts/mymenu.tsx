import { Link, useRouter } from "@tanstack/react-router";
import { useAuth } from "../logincontext";
import { useTutorial } from "../tutorialcontext";
import { useState, useRef, useEffect } from "react";
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
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const itemclass = (active: boolean) =>
        `${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}
   flex items-center px-4 py-2 text-[15px] w-full cursor-pointer text-left`;

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    return (
        <div ref={dropdownRef} className="relative inline-block text-left">
            <button
                id="mymenu-button"
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="relative inline-flex items-center gap-1 rounded-md bg-white 
                px-1 py-1 text-sm font-medium text-gray-700 shadow hover:bg-gray-50 cursor-pointer"
            >
                <Bars3Icon className="w-9 h-9 text-black" />
                {hasUnreadNotice && (
                    <span className="absolute top-1 right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-45 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-40">
                    <div className="py-1">
                        <Link 
                            to="/" 
                            className={itemclass(false)}
                            onClick={() => setIsOpen(false)}
                        >
                            <HomeIcon className="w-5 h-5 inline-block mr-3 text-blue-500" />
                            홈으로
                        </Link>
                        
                        <Link 
                            to="/info" 
                            search={{ menu: "about" }} 
                            className={itemclass(false)}
                            onClick={() => setIsOpen(false)}
                        >
                            <InformationCircleIcon className="w-5 h-5 inline-block mr-3 text-blue-500" />
                            정보
                            {hasUnreadNotice && (
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 ml-1.5 align-middle animate-pulse" />
                            )}
                        </Link>
                        
                        <button
                            id="start-tutorial-btn"
                            type="button"
                            className={itemclass(false)}
                            onClick={() => {
                                setIsOpen(false);
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
                        
                        {user ? (
                            <div 
                                className={itemclass(false)} 
                                onClick={() => {
                                    setIsOpen(false);
                                    handleLogout();
                                }}
                            >
                                <ArrowLeftOnRectangleIcon className="w-5 h-5 inline-block mr-3 text-blue-500" />
                                로그아웃
                            </div>
                        ) : (
                            <div 
                                className={itemclass(false)} 
                                onClick={() => {
                                    setIsOpen(false);
                                    setIsLoginOpen(true);
                                }}
                            >
                                <ArrowRightOnRectangleIcon className="w-5 h-5 inline-block mr-3 text-blue-500" />
                                로그인 / 회원 가입
                            </div>
                        )}
                        
                        {user && (
                            <Link 
                                to="/mypage" 
                                className={itemclass(false)}
                                onClick={() => setIsOpen(false)}
                            >
                                <UserIcon className="w-5 h-5 inline-block mr-3 text-blue-500" />
                                마이페이지
                            </Link>
                        )}
                    </div>
                </div>
            )}
            <LoginDialog isOpen={isLoginOpen} closeModal={() => setIsLoginOpen(false)} />
        </div>
    );
}