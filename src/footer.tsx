import { Link } from '@tanstack/react-router';

const footerLinkClass = "text-gray-500 hover:underline hover:underline-offset-4 text-sm border-gray-500 transition-colors duration-200 cursor-pointer";

export default function Footer() {
  return (
    <footer className="w-full border-t py-6 bg-white text-center">
      <div className="max-w-6xl mx-auto px-4 flex flex-col gap-3">
        {/* 링크 목록: 모바일에서는 flex-wrap을 적용하여 층층이 가로로 배치 */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          <Link to="/info" className={footerLinkClass} search={{menu:'privacy'}}>개인정보 처리방침</Link>
          <Link to="/info" className={footerLinkClass} search={{menu:'terms'}}>이용약관</Link>
          <Link to="/info" className={footerLinkClass} search={{menu:'contact'}}>문의하기</Link>
          <Link to="/info" className={footerLinkClass} search={{menu:'faq'}}>자주 묻는 질문</Link>
          <Link to="/info" className={footerLinkClass} search={{menu:'about'}}>사이트 소개</Link>
          <Link to="/info" className={footerLinkClass} search={{menu:'notice'}}>공지사항</Link>
        </div>
        
        {/* 저작권 문구: 아래 단독 층 배치 */}
        <p className="text-xs sm:text-sm text-gray-400 mt-2">© 2026 클린 매칭 서비스. All rights reserved.</p>
      </div>
    </footer>
  );
}

