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
        
        {/* 통신판매중개 면책 고지 문구 */}
        <p className="text-[10px] sm:text-[11px] text-gray-400 max-w-3xl mx-auto leading-normal mt-2">
          클린매칭은 특수 청소 업체의 정보를 소개하고 연결하는 통신판매중개자이며, 거래의 직접 당사자가 아닙니다. 파트너 업체가 등록한 정보 및 제공하는 청소 서비스, 계약, 작업 결과에 대한 모든 법적 책임은 개별 파트너 업체에 있습니다.
        </p>

        {/* 저작권 문구: 아래 단독 층 배치 */}
        <p className="text-xs sm:text-sm text-gray-400 mt-1">© 2026 클린 매칭 서비스. All rights reserved.</p>
      </div>
    </footer>
  );
}

