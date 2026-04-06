interface NavbarProps {
  onMenuToggle: () => void;
}

const Navbar = ({ onMenuToggle }: NavbarProps) => {
  return (
    <header className="h-16 bg-[#111316] border-b border-white/5 flex items-center justify-between px-4 md:px-8">

      {/* Left - Hamburger (Mobile) + Brand */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuToggle}
          className="lg:hidden p-2 -ml-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>
        
        <h2 className="text-sm font-black uppercase tracking-widest text-primary opacity-80 hidden sm:block lg:hidden">
          SpendSense AI
        </h2>
      </div>

      {/* Right - Profile & Notifications */}
      <div className="flex items-center gap-4 md:gap-8">
        <button className="relative opacity-40 hover:opacity-100 transition-opacity p-2">
          <span className="material-symbols-outlined text-[20px]">
            notifications
          </span>
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-error rounded-full shadow-lg shadow-error/20"/>
        </button>

        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="hidden md:block text-right">
            <p className="font-black text-[10px] text-white tracking-tight uppercase leading-none">
              Raghav
            </p>
            <p className="opacity-30 text-[8px] font-bold uppercase tracking-widest mt-1">
              Premium
            </p>
          </div>
          <div className="w-8 h-8 md:w-9 md:h-9 bg-primary/20 rounded-xl border border-primary/20 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden">
             <div className="w-5 h-5 bg-primary rounded-lg rotate-45" />
          </div>
        </div>
      </div>

    </header>
  )
}

export default Navbar