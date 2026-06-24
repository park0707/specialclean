// src/pages/info/InfoLayout.tsx
import { useEffect, useState } from 'react';
import PrivacyPolicy from './privacypolicy';
import TermsOfService from './termsofservice';
import AboutPage from './about';
import ContactPage from './contact';
import NoticePage from './notice';
import FaqPage from './faq';
import { useSearch, useNavigate } from '@tanstack/react-router';
import { Link } from '@tanstack/react-router';
import { useAuth } from '../../../logincontext';
import { Mymenu } from '../../mymenu';
// 상단 큰 항목 정의
const MENUS = [
  {
    id: 'privacy',
    label: '개인정보처리방침',
    component: PrivacyPolicy,
    sections: [
      '수집하는 개인정보 항목',
      '수집 및 이용 목적',
      '보유 및 이용 기간',
      '제3자 제공 여부',
      '쿠키 수집 고지',
      '처리 위탁 안내',
      '이용자 권리',
      '보호책임자 연락처',
      
    ],
  },
  {
    id: 'terms',
    label: '서비스 이용약관',
    component: TermsOfService,
    sections: [
      '서비스 목적 및 이용 조건',
      '회원 가입 및 탈퇴',
      '금지 행위',
      '면책 조항',
      '콘텐츠 저작권',
      '서비스 변경·중단 안내',
    ],
  },
  {
    id: 'about',
    label: '사이트 소개',
    component: AboutPage,
    sections: [
      '서비스 소개',
      '운영자 소개',
      '서비스 방향성',
    ],
  },
  {
    id: 'contact',
    label: '문의하기',
    component: ContactPage,
    sections: [
      '문의 안내',
      '문의 양식',
      '업체 신청',
    ],
  },
  {
    id: 'faq',
    label: '자주 묻는 질문',
    component: FaqPage,
    sections: [
      '이용 안내 (고객)',
      '업체 파트너 안내',
      '예약 및 환불',
    ],
  },{
    id: 'notice',
    label: '공지사항',
    component: NoticePage,
    sections: ['공지사항'],
  }
];

export default function InfoLayout() {

   
  const search = useSearch({ from: '/info' });
  const { hasUnreadNotice } = useAuth();

  const initialMenu = (search as any).menu ?? MENUS[0].id;
  const initialSection = MENUS.find((m) => m.id === initialMenu)?.sections[0] ?? MENUS[0].sections[0];
  const [activeMenu, setActiveMenu] = useState(initialMenu);
  const [activeSection, setActiveSection] = useState(initialSection);

  const currentMenu = MENUS.find((m) => m.id === activeMenu)!;
  const CurrentComponent = currentMenu.component;

  const navigate = useNavigate({ from: '/info' });

  const handleMenuChange = (menuId: string) => {
    navigate({
      search: (prev: any) => ({
        ...prev,
        menu: menuId,
        id: undefined
      })
    });
  };

  useEffect(() => {
    const menu = (search as any).menu ?? MENUS[0].id;
    setActiveMenu(menu);
    const section = MENUS.find((m) => m.id === menu)?.sections[0];
    if (section) setActiveSection(section);
  }, [(search as any).menu]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 큰 항목 탭 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 w-full">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
          <Link
            to="/"
            className="flex items-center gap-[2px] cursor-pointer shrink-0"
          >
            <img src="/images/로고.png" alt="로고" className="w-[35px] sm:w-[40px] h-auto"/>
            <div className="logo_text text-[18px] sm:text-[22px] text-[#1d4ed8] pt-1 hidden sm:block">클린 매칭</div>
          </Link>
          <div className="flex-1 max-w-5xl flex justify-start sm:justify-center overflow-x-auto scrollbar-hide whitespace-nowrap mx-2 sm:mx-4">
            {MENUS.map((menu) => (
              <button
                key={menu.id}
                onClick={() => handleMenuChange(menu.id)}
                className={`px-4 py-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                  activeMenu === menu.id
                    ? 'border-blue-500 text-blue-500'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                }`}
              >
                {menu.label}
                {menu.id === 'notice' && hasUnreadNotice && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="shrink-0">
            <Mymenu/>
          </div>
        </div>
      </div>

      {/* 사이드바 + 본문 */}
      <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-6 px-4 py-8">
        {/* 왼쪽 사이드바 (데스크톱 전용) */}
        <aside className="hidden lg:block w-52 shrink-0">
          <nav className="sticky top-20 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
            {currentMenu.sections.map((section) => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`text-left px-4 py-3 text-sm border-b border-gray-100 last:border-none transition-colors ${
                  activeSection === section
                    ? 'bg-blue-50 text-blue-500 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {section}
              </button>
            ))}
          </nav>
        </aside>

        {/* 모바일 하위 탭 슬라이드 */}
        {currentMenu.sections.length > 1 && (
          <div className="lg:hidden w-full overflow-x-auto scrollbar-hide bg-white border border-gray-200 rounded-xl flex gap-1 whitespace-nowrap p-1.5 mb-3">
            {currentMenu.sections.map((section) => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
                  activeSection === section
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {section}
              </button>
            ))}
          </div>
        )}

        {/* 오른쪽 본문 */}
        <main className="flex-1 bg-white rounded-xl border border-gray-200 p-4 sm:p-8 min-h-[600px] min-w-0">
          <CurrentComponent activeSection={activeSection} noticeId={(search as any).id} />
        </main>
      </div>
    </div>
  );
}
