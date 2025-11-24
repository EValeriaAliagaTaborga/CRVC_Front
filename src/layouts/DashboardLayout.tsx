import { useState } from "react";
import Sidebar from "../components/Sidebar";

interface Props {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: Props) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Topbar */}
      <header className="w-full bg-orange-600 text-white px-4 py-3 flex items-center justify-between md:justify-end gap-3">
        {/* Left area: hamburger + brand on mobile */}
        <div className="flex items-center gap-3">
          <button
            aria-label="Abrir menú"
            onClick={() => setSidebarOpen(true)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
          >
            {/* simple hamburger icon */}
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold hidden md:inline">🧱 Cerámica Roja Virgen de Copacabana</span>
            <span className="text-lg font-semibold md:hidden">🧱 CRVC</span>
          </div>
        </div>

        {/* Right area: keep empty or add top-right actions */}
        <div className="flex items-center gap-2">
          {/* placeholder for future topbar actions (notifications, user menu...) */}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: receives open state + onClose */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
