// src/pages/info/InfoLayout.tsx
import { useEffect, useState } from 'react';
import PrivacyPolicy from './privacypolicy';
import TermsOfService from './termsofservice';
import AboutPage from './about';
import ContactPage from './contact';
import { Mymenu } from '../../mymenu';
import { useSearch } from '@tanstack/react-router';
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
    component: () => <div>자주 묻는 질문 콘텐츠</div>, //나중에 추가
    sections: [
      '회원 가입 관련',
      '서비스 이용 관련',
    ],
  },{
    id: 'notice',
    label: '공지사항',
    component: () => <div>공지사항 콘텐츠</div>, //나중에 추가
    sections: ['공지사항'],
  }
];

export default function InfoLayout() {

   
  const search = useSearch({ from: '/info' });

  const initialMenu = (search as any).menu ?? MENUS[0].id;
  const initialSection = MENUS.find((m) => m.id === initialMenu)?.sections[0] ?? MENUS[0].sections[0];
  const [activeMenu, setActiveMenu] = useState(initialMenu);
  const [activeSection, setActiveSection] = useState(initialSection);

  const currentMenu = MENUS.find((m) => m.id === activeMenu)!;
  const CurrentComponent = currentMenu.component;

  const handleMenuChange = (menuId: string) => {
    const menu = MENUS.find((m) => m.id === menuId)!;
    setActiveMenu(menuId);
    setActiveSection(menu.sections[0]); // 메뉴 바뀌면 첫 소항목으로 초기화
  };

  useEffect(() => {
    const menu = (search as any).menu;
    setActiveMenu(menu ?? MENUS[0].id);
     const section =
      MENUS.find((m) => m.id === menu)?.sections[0];
    if (section) setActiveSection(section);
  }, [( search as any).menu]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 큰 항목 탭 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 flex gap-40 items-center justify-center">
        <div className="flex items-center gap-[2px] ">
            <img src="/images/로고.png" alt="로고" className="w-[40px] h-auto"/>
            <div className="logo_text text-[25px] text-[#1d4ed8] pt-1">클린 매칭</div>  
        </div>
        <div className="max-w-5xl flex">
          {MENUS.map((menu) => (
            <button
              key={menu.id}
              onClick={() => handleMenuChange(menu.id)}
              className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                activeMenu === menu.id
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              {menu.label}
            </button>
          ))}
        </div>
        <Mymenu/>
      </div>

      {/* 사이드바 + 본문 */}
      <div className="max-w-5xl mx-auto flex gap-6 px-4 py-8">
        {/* 왼쪽 사이드바 */}
        <aside className="w-52 shrink-0">
          <nav className="sticky top-20 bg-white rounded-xl border border-gray-200 overflow-hidden">
            {currentMenu.sections.map((section) => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`w-full text-left px-4 py-3 text-sm border-b border-gray-100 last:border-none transition-colors ${
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

        {/* 오른쪽 본문 */}
        <main className="flex-1 bg-white rounded-xl border border-gray-200 p-8 min-h-[600px]">
          <CurrentComponent activeSection={activeSection} />
        </main>
      </div>
    </div>
  );
}
