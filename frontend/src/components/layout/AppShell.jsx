import { useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useTheme } from '../../hooks/useTheme';

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isDark, toggleTheme } = useTheme();

  const contentClass = useMemo(
    () => 'mx-auto w-full max-w-7xl px-4 pb-8 pt-4 md:px-6',
    []
  );

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.20),_transparent_45%),radial-gradient(circle_at_80%_20%,_rgba(6,182,212,0.16),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.18),_transparent_40%)]" />

      <div className="relative flex min-h-screen">
        <Sidebar open={sidebarOpen} />

        <div className="flex min-h-screen flex-1 flex-col">
          <Navbar
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen((current) => !current)}
            isDark={isDark}
            onToggleTheme={toggleTheme}
          />

          <main className={contentClass}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
