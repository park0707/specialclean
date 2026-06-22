// src/tutorial/MyPageTour.tsx
// react-joyride v3 API
import { Joyride, STATUS, type EventData, type Step } from 'react-joyride';
import { useTutorial } from '../tutorialcontext';

const steps: Step[] = [
  {
    target: '#mypage-profile',
    title: '👤 내 프로필',
    content: '이름, 이메일 등 내 계정 정보를 확인하고 수정할 수 있습니다.',
    placement: 'bottom',
  },
  {
    target: '#mypage-edit-btn',
    title: '✏️ 프로필 수정',
    content: '이 버튼을 클릭하면 닉네임 등 개인 정보를 수정할 수 있습니다.',
    placement: 'bottom',
  },
  {
    target: '#mypage-bookmark-tab',
    title: '🔖 북마크',
    content: '관심 업체를 북마크해두면 여기서 빠르게 다시 찾아볼 수 있습니다.',
    placement: 'bottom',
  },
  {
    target: '#mypage-review-tab',
    title: '⭐ 내 리뷰',
    content: '내가 작성한 리뷰 목록을 확인하고 관리할 수 있습니다.',
    placement: 'bottom',
  },
  {
    target: '#mypage-recent-viewed',
    title: '👀 최근 본 업체',
    content: '최근에 상세 정보를 확인했던 업체 목록을 여기서 빠르게 확인해 보세요.',
    placement: 'top',
  },
  {
    target: '#mypage-withdraw-btn',
    title: '⚠️ 회원 탈퇴',
    content: '계정을 삭제하려면 이 버튼을 사용하세요. 탈퇴 전 재인증이 필요합니다.',
    placement: 'top',
  },
];

export default function MyPageTour() {
  const { activeTour, stopTour } = useTutorial();

  const handleEvent = (data: EventData) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      stopTour();
    }
  };

  if (activeTour !== 'mypage') return null;

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
