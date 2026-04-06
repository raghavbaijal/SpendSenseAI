import { Link, useLocation } from "react-router-dom"

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation()

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: "dashboard" },
    { name: "Upload", path: "/upload", icon: "upload_file" },
    { name: "Transactions", path: "/transactions", icon: "receipt_long" },
    { name: "AI Insights", path: "/ai-insights", icon: "insights" },
    { name: "AI Chat", path: "/ai-chat", icon: "forum" },
    { name: "Budgets", path: "/budgets", icon: "account_balance_wallet" },
    { name: "Goals", path: "/goals", icon: "target" },
    { name: "Settings", path: "/settings", icon: "settings" },
  ]

  return (
    <>
      <aside 
        className={`w-72 bg-[#111316] min-h-screen p-6 fixed lg:relative left-0 top-0 z-50 transition-transform duration-300 transform 
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          border-r border-white/5`}
      >
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-xl font-black text-primary tracking-tighter uppercase italic">
            SpendSense AI
          </h2>
          {/* Close button for mobile */}
          <button 
            onClick={onClose}
            className="lg:hidden p-2 text-white/50 hover:text-white"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
              ${
                location.pathname === item.path
                  ? "bg-primary text-black font-black"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className={`material-symbols-outlined text-[22px] ${location.pathname === item.path ? '' : 'group-hover:scale-110 transition-transform'}`}>
                {item.icon}
              </span>
              <span className="text-sm tracking-tight">{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Pro Badge at Bottom */}
        <div className="absolute bottom-8 left-6 right-6 p-5 bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-2xl">
           <p className="text-[10px] font-black uppercase text-primary mb-1">Status: Active</p>
           <p className="text-white text-xs font-bold leading-tight">Quantum Shield v4.1 Enabled</p>
        </div>
      </aside>
    </>
  )
}

export default Sidebar