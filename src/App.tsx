import { Outlet } from '@tanstack/react-router'
import { AuthProvider } from './logincontext'
import { SearchProvider } from './searchcontext'
function App() {
  

  return (
    <div className="p-0 m-0">
      <SearchProvider>
        <AuthProvider>
          <Outlet/>
        </AuthProvider>
      </SearchProvider>
      
    </div>
  )
}

export default App
