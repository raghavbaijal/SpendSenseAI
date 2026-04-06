import { useState } from "react"
import Sidebar from "./Sidebar"
import Navbar from "./Navbar"

interface Props {
  children: React.ReactNode
}

const DashboardLayout = ({ children }: Props) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-[#08090a] text-on-surface overflow-hidden">
      
      {/* Sidebar - Controlled by State */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        
        {/* Navbar - Pass Toggle Handler */}
        <Navbar onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10">
          {children}
        </main>

        {/* Mobile Backdrop Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>

    </div>
  )
}

export default DashboardLayout