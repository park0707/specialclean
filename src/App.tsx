import { Outlet } from '@tanstack/react-router'
import { AuthProvider } from './logincontext'
function App() {
  

  return (
    <div className="p-0 m-0">
      <AuthProvider>
        <Outlet/>
      </AuthProvider>
      
    </div>
  )
}

export default App
