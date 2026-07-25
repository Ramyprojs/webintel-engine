import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Activity, Database, LayoutDashboard, Settings, Search, Command } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import JobsPage from './pages/JobsPage';
import ResultsPage from './pages/ResultsPage';
import SettingsPage from './pages/SettingsPage';
import CommandPalette from './components/CommandPalette';

// Utility for merging tailwind classes safely
export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

function Sidebar({ onCmdClick }: { onCmdClick: () => void }) {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', shortcut: '⌘1' },
    { to: '/results', icon: Database, label: 'Results Database', shortcut: '⌘2' },
    { to: '/settings', icon: Settings, label: 'Settings', shortcut: '⌘3' },
  ];

  return (
    <aside className="w-64 h-screen border-r border-white/[0.07] bg-[#090a0f] flex flex-col fixed left-0 top-0 z-50">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/[0.06] flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <Activity className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
            WebIntel Engine
          </h2>
          <p className="text-[10px] text-slate-400 font-mono">Data Extraction Suite</p>
        </div>
      </div>

      {/* Quick Command Trigger */}
      <div className="p-3">
        <button
          onClick={onCmdClick}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] text-slate-300 transition-colors text-xs"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search commands...</span>
          </div>
          <kbd className="text-[10px] font-mono text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">⌘K</kbd>
        </button>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 space-y-1 mt-2">
        <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-medium">Navigation</div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex items-center justify-between px-3 py-2 rounded-xl transition-colors duration-150 group text-sm font-medium",
              isActive 
                ? "bg-indigo-600/15 text-white border border-indigo-500/30 font-medium" 
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] border border-transparent"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              {item.shortcut}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Footer System Status */}
      <div className="p-4 border-t border-white/[0.06]">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
            <span className="text-slate-400 text-xs">System Online</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">v2.5</span>
        </div>
      </div>
    </aside>
  );
}

function MainLayout() {
  const [isCmdOpen, setIsCmdOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCmdOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen relative bg-[#090a0f]">
      {/* Command Palette Modal */}
      <CommandPalette isOpen={isCmdOpen} onClose={() => setIsCmdOpen(false)} />

      {/* Sidebar */}
      <Sidebar onCmdClick={() => setIsCmdOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 ml-64 min-h-screen">
        <Routes>
          <Route path="/" element={<JobsPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<div className="p-8 text-slate-400 font-mono">404 — Not Found</div>} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <MainLayout />
    </Router>
  );
}
