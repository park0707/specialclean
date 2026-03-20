// src/lib/companyFormOptions.ts

export interface ServiceCategory {
  category: string;
  items: string[];
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    category: '고독사·사망 관련',
    items: [
      '고독사 현장 청소',
      '변사·부패 현장 복구',
      '혈흔 제거',
      '극단적 선택 현장 처리',
      '범죄 현장 청소',
    ],
  },
  {
    category: '유품 정리',
    items: [
      '유품 정리',
      '유품 선별 및 보존 처리',
      '유품 기증·기탁 연계',
      '유품 폐기 처리',
      '귀중품 분류 및 인계',
    ],
  },
  {
    category: '쓰레기집·저장강박',
    items: [
      '쓰레기집(저장강박) 청소',
      '대량 폐기물 수거·처리',
      '오물·분변 처리',
      '동물 사체 처리',
    ],
  },
  {
    category: '화재·재해 복구',
    items: [
      '화재 현장 청소',
      '그을음·연기 냄새 제거',
      '수해·침수 복구 청소',
      '공사 후 분진·폐기물 청소',
    ],
  },
  {
    category: '입주·이사 청소',
    items: [
      '이사 후 빈집 청소',
      '신규 입주 청소',
      '공실 청소',
      '폐업 점포 청소',
    ],
  },
  {
    category: '방역·소독',
    items: [
      '바이오해저드 방역',
      '바이러스·세균 방역',
      '해충 방제',
      '곰팡이 제거',
      '악취 원인 제거 및 탈취',
    ],
  },
  {
    category: '특수 환경',
    items: [
      '의료·병원 청소',
      '차량 내부 특수청소',
      '고시원·원룸 공용공간 청소',
    ],
  },
];

export interface TagGroup {
  group: string;
  description: string;
  tags: string[];
}

export const TAG_GROUPS: TagGroup[] = [
  {
    group: '긴급성·출동',
    description: '얼마나 빨리 오나요?',
    tags: [
      '24시간 출동',
      '긴급 당일 처리',
      '야간 출동',
      '주말·공휴일 운영',
      '365일 연중무휴',
      '2시간 이내 출동',
    ],
  },
  {
    group: '신뢰·자격',
    description: '믿을 수 있는 업체인가요?',
    tags: [
      '폐기물처리업 허가',
      '소독업 신고 업체',
      '배상책임보험 가입',
      '작업자 상해보험 가입',
      '특수청소관리사 자격 보유',
      '방문 견적 무료',
      '사진·영상 작업 기록 제공',
      'AS 보장',
      '비밀 보장',
    ],
  },
  {
    group: '서비스 방식·팀 특성',
    description: '어떻게 일하나요?',
    tags: [
      '여성 팀 구성',
      '남성 팀 구성',
      '전담 매니저 배정',
      '원스톱 처리 (청소+방역+폐기)',
      '유족 심리 배려 서비스',
      '친환경 약품 사용',
      '정찰제 운영',
      '후불 결제 가능',
      '카드 결제 가능',
      '외국어 상담 가능',
    ],
  },
];

export const TAG_OPTIONS: string[] = TAG_GROUPS.flatMap((g) => g.tags);
