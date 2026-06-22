import { Outlet } from '@tanstack/react-router'
import { AuthProvider } from './logincontext'
import { SearchProvider } from './searchcontext'
import Footer from './footer'
import { useState, useEffect } from 'react'
import { ArrowUpIcon } from '@heroicons/react/24/outline'

function App() {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowButton(true);
      } else {
        setShowButton(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className="flex flex-col p-0 m-0 min-h-screen relative">
      <main className="flex-1">
        <AuthProvider>
          <SearchProvider>
            <Outlet />
          </SearchProvider>
        </AuthProvider>
      </main>
      <Footer/>

      {/* 맨 위로 가기 (Top) 버튼 */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-600 shadow-md border border-gray-200 hover:bg-gray-50 hover:text-blue-500 transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 ${
          showButton ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        aria-label="맨 위로 이동"
      >
        <ArrowUpIcon className="h-5 w-5 stroke-[2.5]" />
      </button>
    </div>
  )
}

export default App
