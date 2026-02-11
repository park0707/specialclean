import { Menu,Transition } from "@headlessui/react";
import { Fragment } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useAuth } from "../logincontext";
import { useState } from "react";
import LoginDialog from "./menu_parts/login";
import {
  HomeIcon,
  InformationCircleIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  UserIcon  
} from '@heroicons/react/24/outline';

export function Mymenu(){
    const {id} = useAuth()
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const itemclass = (active:boolean) => `${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
        } block px-4 py-2 text-[15px] w-full`;
    return(
        

        <Menu as="div" className="relative inline-block text-left">
            <Menu.Button className="inline-flex items-center gap-1 rounded-md bg-white 
            px-1 py-1 text-sm font-medium text-gray-700 shadow hover:bg-gray-50 cursor-pointer">
                <img src="/images/메뉴.png" alt="메뉴" className="w-[50px] h-auto text-black"/>
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
                            ({active}) => (
                                <Link to="/" className={itemclass(active)}>
                                    <HomeIcon className="w-5 h-5 inline-block mr-3  text-blue-500"/>
                                    홈으로
                                </Link>
                            )
                        }
                    </Menu.Item>
                    <Menu.Item>
                        {
                            ({active}) => (
                                <div className={itemclass(active)}>
                                    <InformationCircleIcon className="w-5 h-5 inline-block mr-3 text-blue-500"/>
                                    정보
                                </div>
                            )
                        }
                    </Menu.Item>
                    <Menu.Item>
                        {
                            id ?
                            ({active}) => (
                                <div className={itemclass(active)}>
                                    <ArrowLeftOnRectangleIcon className="w-5 h-5 inline-block mr-3  text-blue-500"/>
                                    로그아웃    
                                </div>
                            ) :
                            ({active}) => (
                                <div className={itemclass(active)} onClick={()=>setIsLoginOpen(true)}>
                                    <ArrowRightOnRectangleIcon className="w-5 h-5 inline-block mr-3  text-blue-500"/>
                                    로그인 / 회원 가입
                                </div>
                            )
                            
                        }
                    </Menu.Item>
                    {
                        id &&
                        <Menu.Item>
                        {
                                ({active}) => (
                                    <div className={itemclass(active)}>
                                        <UserIcon className="w-5 h-5 inline-block mr-3 text-blue-500"/>
                                        마이페이지
                                    </div>
                                )
                                //마이페이지 나중에 만들고 Link로 바꾸기
                        }
                        </Menu.Item>
                    }
                </Menu.Items>
            </Transition>
            <LoginDialog isOpen={isLoginOpen} closeModal={()=>setIsLoginOpen(false)}/>
        </Menu>
    )
}