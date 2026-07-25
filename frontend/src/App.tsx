import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Activity, Database, LayoutDashboard, Settings, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onCmdClick: () => void;
}

function Sidebar({ isCollapsed, onToggle, onCmdClick }: SidebarProps) {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', shortcut: '⌘1' },
    { to: '/results', icon: Database, label: 'Results Database', shortcut: '⌘2' },
    { to: '/settings', icon: Settings, label: 'Settings', shortcut: '⌘3' },
  ];

  return (
    <aside
      className={cn(
        "h-screen border-r border-white/[0.07] bg-[#090a0f] flex flex-col fixed left-0 top-0 z-50 transition-all duration-500 ease-out shadow-xl",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 animate-in fade-in duration-200">
              <h2 className="text-sm font-semibold tracking-tight text-white truncate">
                WebIntel Engine
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">Data Suite</p>
            </div>
          )}
        </div>

        <button
          onClick={onToggle}
          title={isCollapsed ? "Expand Sidebar (⌘B)" : "Collapse Sidebar & Zoom Center (⌘B)"}
          className="p-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors shrink-0"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Quick Command Trigger */}
      <div className="p-3">
        <button
          onClick={onCmdClick}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] text-slate-300 transition-colors text-xs",
            isCollapsed && "justify-center px-0"
          )}
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          {!isCollapsed && (
            <>
              <span>Search commands...</span>
              <kbd className="text-[10px] font-mono text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">⌘K</kbd>
            </>
          )}
        </button>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 space-y-1 mt-2">
        {!isCollapsed && (
          <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-medium">Navigation</div>
        )}
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => {
              // Collapse sidebar when clicking a tab so center view zooms in
              if (!isCollapsed) {
                onToggle();
              }
            }}
            className={({ isActive }) => cn(
              "flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 group text-sm font-medium",
              isCollapsed && "justify-center px-0",
              isActive 
                ? "bg-indigo-600/20 text-white border border-indigo-500/40 shadow-sm" 
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] border border-transparent"
            )}
            title={item.label}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4" />
              {!isCollapsed && <span>{item.label}</span>}
            </div>
            {!isCollapsed && (
              <span className="text-[10px] font-mono text-slate-500">
                {item.shortcut}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer System Status */}
      <div className="p-4 border-t border-white/[0.06]">
        <div className={cn("flex items-center justify-between text-xs", isCollapsed && "justify-center")}>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
            {!isCollapsed && <span className="text-slate-400 text-xs">System Online</span>}
          </div>
          {!isCollapsed && <span className="text-[10px] font-mono text-slate-500">v2.5</span>}
        </div>
      </div>
    </aside>
  );
}

function MainLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCmdOpen, setIsCmdOpen] = useState(false);

  // Keyboard shortcut ⌘B to toggle sidebar collapse & ⌘K for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsCollapsed((prev) => !prev);
      }
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

      {/* Collapsible Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed((prev) => !prev)}
        onCmdClick={() => setIsCmdOpen(true)}
      />

      {/* Main Content Area — Smooth Scale Zoom Transformation when sidebar collapses */}
      <main
        className={cn(
          "flex-1 relative min-h-screen transition-all duration-500 ease-out",
          isCollapsed ? "ml-20 scale-[1.015] origin-top" : "ml-64 scale-100"
        )}
      >
        {/* Top Navbar Toggle bar */}
        <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#090a0f]/80 backdrop-blur-md px-8 py-3 flex items-center justify-between">
          <button
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            <span>{isCollapsed ? "Expand Sidebar" : "Collapse Sidebar (⌘B)"}</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono">⌘K</kbd> Palette
          </div>
        </header>

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
