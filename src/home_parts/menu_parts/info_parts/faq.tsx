// src/home_parts/menu_parts/info_parts/faq.tsx
import { useState } from 'react';
import { ChevronDownIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    id: 'use-1',
    category: '이용 안내 (고객)',
    question: '클린 매칭 서비스는 어떤 서비스인가요?',
    answer: '특수 청소, 입주 청소 등 전문적인 청소 서비스가 필요한 고객님과 검증된 청소 전문 업체를 간편하게 연결해 드리는 매칭 플랫폼 서비스입니다.'
  },
  {
    id: 'use-2',
    category: '이용 안내 (고객)',
    question: '매칭 신청 및 업체 조회는 어떻게 하나요?',
    answer: '홈 화면에서 원하시는 지역, 청소 서비스 종류, 그리고 상세 검색 태그를 선택하여 필터링하시면 조건에 꼭 맞는 전문 업체를 한눈에 조회할 수 있으며, 제공되는 연락처를 통해 직접 문의하고 신청하실 수 있습니다.'
  },
  {
    id: 'use-3',
    category: '이용 안내 (고객)',
    question: '매칭 서비스 이용료는 얼마인가요?',
    answer: '고객님께서 클린 매칭 플랫폼을 통해 전문 청소 업체를 검색하고 정보를 조회하는 서비스 이용료는 완전히 무료입니다. 실제 청소 서비스 진행에 따른 비용은 조율 완료 후 해당 업체에 직접 지불하시면 됩니다.'
  },
  {
    id: 'use-4',
    category: '이용 안내 (고객)',
    question: '주변 이웃이 모르게 진행하고 싶습니다. 비밀 보장이 철저히 되나요?',
    answer: '네, 대다수의 전문 파트너 업체들은 고객님의 사생활 보호를 최우선으로 생각합니다. 작업 시 회사 로고가 없는 무로고 탑차나 작업복을 사용하며, 폐기물은 밖에서 보이지 않도록 불투명 박스나 밀폐 용기에 담아 은밀하게 반출합니다. 또한, 이웃 소음을 최소화하기 위해 비대면 진행, 야간/새벽 시간대 작업 등 맞춤형 비밀 보장 서비스를 요청하실 수 있습니다.'
  },
  {
    id: 'use-5',
    category: '이용 안내 (고객)',
    question: '플랫폼에 등록된 특수 청소 업체들은 믿을 수 있나요?',
    answer: '클린매칭은 고객님의 안심을 위해 철저한 파트너 검증 시스템을 운영하고 있습니다. 파트너 등록 신청 시 제출된 사업자등록 정보는 진위 여부를 철저히 확인하며, 바이오방역 및 특수폐기물 수거를 위해 필요한 법적 자격(소독업 정식 신고증, 폐기물 수집·운반 허가증 등) 보유 여부를 관리자가 검토한 후 최종 승인을 내어 유령 업체나 무면허 업체를 걸러내고 있습니다.'
  },
  {
    id: 'partner-1',
    category: '업체 파트너 안내',
    question: '청소 업체 파트너 등록은 어떻게 신청하나요?',
    answer: '고객센터의 \'문의하기\' 탭을 이용하시거나 파트너 제휴 신청 채널을 통해 사업자 등록증 및 보유한 장비/기술 정보를 접수해 주시면 담당자 검토 및 승인을 거쳐 파트너 업체로 등록됩니다.'
  },
  {
    id: 'partner-2',
    category: '업체 파트너 안내',
    question: '파트너 승인까지 소요 시간은 얼마나 걸리나요?',
    answer: '신청 서류 접수 후 영업일 기준 보통 2~3일 내에 담당자 검토 및 기재 사항 확인이 완료되며, 최종 승인 시 가입하신 이메일 혹은 등록된 연락처로 안내를 드립니다.'
  },
  {
    id: 'partner-3',
    category: '업체 파트너 안내',
    question: '등록 수수료나 플랫폼 이용료가 있나요?',
    answer: '현재 클린 매칭 서비스는 파트너 업체의 초기 비즈니스 활성화를 위해 등록 수수료 및 매칭 수수료를 전액 무료로 제공하고 있습니다.'
  },
  {
    id: 'partner-4',
    category: '업체 파트너 안내',
    question: '업체 신청 시 사업자등록번호를 수집하는 이유가 무엇인가요?',
    answer: '클린매칭은 허위 및 유령 업체의 무단 등록을 차단하고, 실제 합법적으로 가동 중인 안심 사업자 정보만을 유저에게 제공하기 위해 사업자등록번호 입력을 의무화하고 있습니다. 수집된 정보는 국세청 개폐업 상태 진위 확인 등 실재성 조회를 위한 검증 도구로만 안전하게 활용됩니다.'
  },
  {
    id: 'partner-5',
    category: '업체 파트너 안내',
    question: '특수 청소 업체로 등록할 때 어떤 인허가 자격이 권장되나요?',
    answer: '클린매칭은 신뢰성 확보를 위해 인허가 자격을 꼼꼼히 확인합니다. 특히 소독 및 방역 서비스를 정식 제공하기 위한 \'소독업 신고증\'(감염병예방법 제52조)과 대량의 쓰레기 반출 시 수반되는 \'폐기물 수집·운반업 허가증\'을 갖추신 업체를 우대하며, 관련 증빙 자료가 확인된 파트너에 한해 검색 태그 상의 검증된 뱃지와 인허가 혜택(태그 노출 등)을 부여하고 있습니다.'
  },
  {
    id: 'refund-1',
    category: '예약 및 환불',
    question: '예약 일정 변경이나 취소는 어떻게 해야 하나요?',
    answer: '예약 확정 이후 일정 변경 및 예약 취소는 매칭된 청소 업체의 고객센터 혹은 담당자 연락처로 직접 연락하셔서 상호 조율해 주셔야 합니다. 업체별 스케줄 관리가 상이하므로 변경 사항이 있을 시 빠른 연락을 권장합니다.'
  },
  {
    id: 'refund-2',
    category: '예약 및 환불',
    question: '청소 서비스 취소 시 환불 및 위약금 기준은 어떻게 되나요?',
    answer: '클린 매칭은 업체를 중개해 드리는 플랫폼으로 직접 결제 수납이나 위약금 징수를 하지 않으며, 환불 규정 및 취소 위약금 기준은 매칭 및 계약된 개별 업체의 약관에 따릅니다. 서비스 신청 전에 꼭 해당 업체의 환불 및 예약 규정을 충분히 확인하시기 바랍니다.'
  },
  {
    id: 'refund-3',
    category: '예약 및 환불',
    question: '청소 견적 비용 산정 방식과 현장 추가금 관련 정책은 어떻게 되나요?',
    answer: '특수 청소는 현장의 오염 심각도, 악취 분해 필요성, 특수 폐기물의 톤수, 작업 층수 등 다양한 변수에 따라 견적이 산출됩니다. 가견적 확인 후 업체와 사진/영상 교환 또는 방문 견적을 통해 계약 금액을 명확히 확정하는 것을 권장합니다. 클린매칭은 사전에 약정되지 않은 불공정하고 과도한 당일 추가금 요구나 횡포가 확인된 파트너에 대해서는 검토 절차를 거쳐 경고 조치 및 입점 취소 처리를 하고 있습니다.'
  }
];

interface FaqPageProps {
  activeSection: string;
}

export default function FaqPage({ activeSection }: FaqPageProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredFaqs = FAQ_DATA.filter((faq) => faq.category === activeSection);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* 상단 타이틀 */}
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-xl font-semibold text-gray-900">{activeSection}</h2>
        <p className="text-xs text-gray-400 mt-1">자주 묻는 질문과 답변을 확인하실 수 있습니다.</p>
      </div>

      {/* FAQ 리스트 */}
      {filteredFaqs.length === 0 ? (
        <div className="w-full flex justify-center py-16 text-sm text-gray-400">
          해당 카테고리에 등록된 질문이 없습니다.
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredFaqs.map((faq) => {
            const isExpanded = expandedId === faq.id;
            return (
              <li
                key={faq.id}
                className="border border-gray-200 rounded-xl bg-white p-4 hover:border-gray-300 transition-all duration-200"
              >
                {/* 질문 클릭 시 답변 토글 */}
                <div
                  onClick={() => toggleExpand(faq.id)}
                  className="flex items-start justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-start gap-2.5">
                    <QuestionMarkCircleIcon className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <h3 className="text-base font-semibold text-gray-800 leading-snug">
                      {faq.question}
                    </h3>
                  </div>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-gray-400 shrink-0 transform transition-transform duration-300 ${
                      isExpanded ? 'rotate-180 text-blue-500' : ''
                    }`}
                  />
                </div>

                {/* 답변 아코디언 */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isExpanded ? 'max-h-[500px] opacity-100 mt-4 pt-4 border-t border-gray-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed pl-7">
                    {faq.answer}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
