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
