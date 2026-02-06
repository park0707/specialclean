import './App.css'
import { Outlet } from '@tanstack/react-router'
function App() {
  

  return (
    <div className="p-0 m-0">
      <Outlet/>
    </div>
  )
}

export default App
