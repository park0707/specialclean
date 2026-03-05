// Layout.tsx 또는 App.tsx
import { Link } from '@tanstack/react-router';
const footerLinkClass = "text-gray-500 hover:underline hover:underline-offset-4 text-sm border-gray-500 transition-colors duration-200 cursor-pointer";
//나중에 실제 페이지 연결 필요
export default function Footer() {
  return (
    <footer className="w-full border-t py-4 text-center">
      <div className="flex justify-center gap-4">
        <Link to="/info" className={footerLinkClass} search={{menu:'privacy'}}>개인정보 처리방침</Link>
        <Link to="/info" className={footerLinkClass} search={{menu:'terms'}}>이용약관</Link>
        <Link to="/info" className={footerLinkClass} search={{menu:'contact'}}>문의하기</Link>
        <Link to="/info" className={footerLinkClass} search={{menu:'faq'}}>자주 묻는 질문</Link>
        <Link to="/info" className={footerLinkClass} search={{menu:'about'}}>사이트 소개</Link>
        <Link to="/info" className={footerLinkClass} search={{menu:'notice'}}>공지사항</Link>
        <p className="text-sm text-gray-500">© 2026 클린 매칭 서비스. All rights reserved.</p>
      </div>
    </footer>
  );
}
