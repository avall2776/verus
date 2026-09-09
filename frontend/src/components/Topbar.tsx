import { Bell, Search, Menu } from "lucide-react";

export default function Topbar() {
  return (
    <header className="h-16 border-b border-gray-800 bg-panel/50 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 w-full">
      {/* Mobile Menu Button & Search */}
      <div className="flex items-center gap-4 w-full md:w-auto">
        <button className="md:hidden text-text-secondary hover:text-white transition-colors">
          <Menu size={24} />
        </button>
        
        <div className="relative w-full md:w-80 group hidden md:block">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-accent transition-colors" />
          <input 
            type="text"
            placeholder="Buscar leads, conversas..."
            className="w-full bg-background border border-gray-800/60 rounded-full pl-10 pr-4 py-2 text-sm text-text-primary outline-none transition-all focus:border-accent/50 focus:shadow-[0_0_10px_rgba(0,210,255,0.15)] placeholder:text-gray-600"
          />
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        {/* Status Bot */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-background border border-gray-800 rounded-full">
          <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
          <span className="text-xs font-semibold text-text-secondary">IA Vitor Online</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-text-secondary hover:text-white transition-colors rounded-full hover:bg-gray-800/50">
          <Bell size={20} />
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
        </button>
      </div>
    </header>
  );
}
