// src/tutorial/HomeTour.tsx
// react-joyride v3 API
import { Joyride, STATUS, type EventData, type Step } from 'react-joyride';
import { useTutorial } from '../tutorialcontext';

const steps: Step[] = [
  {
    target: '#search-box',
    title: '🔍 업체 검색',
    content: '청소 업체 이름을 입력하여 검색하세요. Enter 또는 돋보기 버튼을 누르면 결과가 나타납니다.',
    placement: 'bottom',
  },
  {
    target: '#filter-tabs',
    title: '📍 지역 · 서비스 · 업체특성 필터',
    content: '원하는 지역, 서비스 종류, 업체 특성을 선택해 업체를 정밀하게 필터링할 수 있습니다.',
    placement: 'bottom',
  },
  {
    target: '#location-filter-tab',
    title: '📍 지역 필터',
    content: '작업 희망 주소를 검색하면 해당 지역에서 운영 중인 업체만 표시됩니다.',
    placement: 'bottom',
  },
  {
    target: '#service-filter-tab',
    title: '🧹 서비스 종류 필터',
    content: '고독사 처리, 화재 복구 등 필요한 특수 청소 서비스를 선택하세요.',
    placement: 'bottom',
  },
  {
    target: '#tag-filter-tab',
    title: '🏷️ 업체 특성 필터',
    content: '24시간 운영, 여성 직원 우선 등 업체 특성으로 추가 필터링할 수 있습니다.',
    placement: 'bottom',
  },
  {
    target: '#business-list',
    title: '🏢 업체 목록',
    content: '검색 및 필터 조건에 맞는 업체가 여기에 표시됩니다. 업체 카드를 클릭하면 상세 정보를 확인할 수 있습니다.',
    placement: 'top',
  },
  {
    target: '#mymenu-button',
    title: '📋 메뉴',
    content: '홈으로 이동, 공지사항 확인, 마이페이지, 로그인/로그아웃 등을 이용할 수 있습니다.',
    placement: 'bottom',
  },
];

export default function HomeTour() {
  const { activeTour, stopTour } = useTutorial();

  const handleEvent = (data: EventData) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      stopTour();
    }
  };

  if (activeTour !== 'home') return null;

  return (
    <Joyride
      steps={steps}
      run={true}
      continuous
      scrollToFirstStep
      onEvent={handleEvent}
      options={{
        primaryColor: '#3b82f6',
        backgroundColor: '#ffffff',
        buttons: ['back', 'primary', 'skip'],
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9000,
        skipBeacon: true,
      }}
      styles={{
        tooltipContainer: { textAlign: 'left' },
        tooltipTitle: { fontSize: '15px', fontWeight: '700', marginBottom: '4px' },
        tooltipContent: { fontSize: '13px', lineHeight: '1.6', padding: '8px 0 0' },
        buttonPrimary: {
          backgroundColor: '#3b82f6',
          borderRadius: '8px',
          padding: '8px 16px',
          fontSize: '13px',
          fontWeight: '600',
        },
        buttonBack: { color: '#6b7280', marginRight: '8px', fontSize: '13px' },
        buttonSkip: { color: '#9ca3af', fontSize: '13px' },
      }}
      locale={{
        back: '이전',
        close: '닫기',
        last: '완료',
        next: '다음',
        skip: '건너뛰기',
      }}
    />
  );
}
