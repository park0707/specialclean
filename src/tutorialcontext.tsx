// src/tutorialcontext.tsx
import { createContext, useContext, useState, type ReactNode } from 'react';

export type TourPage = 'home' | 'mypage';

interface TutorialContextType {
  /** 현재 실행 중인 투어 페이지 (null이면 비활성) */
  activeTour: TourPage | null;
  startTour: (page: TourPage) => void;
  stopTour: () => void;
  /** 첫 방문 여부 안내 모달 표시 여부 */
  showWelcomeModal: boolean;
  closeWelcomeModal: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

const STORAGE_KEY = 'tutorial_shown';

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [activeTour, setActiveTour] = useState<TourPage | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(
    () => !localStorage.getItem(STORAGE_KEY)
  );

  const startTour = (page: TourPage) => {
    setActiveTour(page);
  };

  const stopTour = () => {
    setActiveTour(null);
  };

  const closeWelcomeModal = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowWelcomeModal(false);
  };

  return (
    <TutorialContext.Provider value={{ activeTour, startTour, stopTour, showWelcomeModal, closeWelcomeModal }}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error('useTutorial must be used within TutorialProvider');
  return ctx;
}
