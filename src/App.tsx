import { Outlet } from '@tanstack/react-router'
import { AuthProvider } from './logincontext'
import { SearchProvider } from './searchcontext'
import Footer from './footer'
function App() {
  

  return (
    <div className="flex flex-col p-0 m-0 min-h-screen">
      <main className="flex-1">
        <AuthProvider>
          <SearchProvider>
            <Outlet />
          </SearchProvider>
        </AuthProvider>
      </main>
      <Footer/>
    </div>
  )
}

export default App
