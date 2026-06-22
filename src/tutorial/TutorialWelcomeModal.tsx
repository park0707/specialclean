// src/tutorial/TutorialWelcomeModal.tsx
import { useTutorial } from '../tutorialcontext';
import { useRouter } from '@tanstack/react-router';
import { SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function TutorialWelcomeModal() {
  const { showWelcomeModal, closeWelcomeModal, startTour } = useTutorial();
  const router = useRouter();

  if (!showWelcomeModal) return null;

  const handleStart = () => {
    closeWelcomeModal();
    // 홈 화면으로 이동 후 투어 시작
    router.navigate({ to: '/' });
    // 약간의 딜레이로 DOM이 그려진 후 투어 시작
    setTimeout(() => startTour('home'), 300);
  };

  const handleSkip = () => {
    closeWelcomeModal();
    alert("메인 메뉴 또는 마이페이지 하단 등에서 언제든지 다시 튜토리얼을 보실 수 있습니다");
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* 상단 그라디언트 배너 */}
        <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

        {/* 닫기 버튼 */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          aria-label="닫기"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        <div className="px-8 py-8">
          {/* 아이콘 */}
          <div className="flex justify-center mb-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
              <SparklesIcon className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* 제목 */}
          <h2 className="text-center text-xl font-bold text-gray-900 mb-2">
            클린 매칭 서비스에 오신 것을 환영합니다!
          </h2>
          <p className="text-center text-sm text-gray-500 mb-7 leading-relaxed">
            쉽고 빠른 특수 청소 업체 매칭 서비스입니다.
            <br />
            주요 기능을 안내하는 짧은 투어를 시작하시겠습니까?
          </p>

          {/* 버튼 */}
          <div className="flex flex-col gap-3">
            <button
              id="tutorial-start-btn"
              onClick={handleStart}
              className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 py-3 text-sm font-semibold text-white hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
            >
              ✨ 투어 시작하기
            </button>
            <button
              id="tutorial-skip-btn"
              onClick={handleSkip}
              className="w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              나중에 볼게요
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-gray-400">
            메뉴 → '서비스 튜토리얼 시작'에서 언제든지 다시 시작할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
