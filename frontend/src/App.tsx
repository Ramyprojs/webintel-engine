import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Activity, Database, LayoutDashboard, Settings, ChevronLeft, ChevronRight, Search, Command, Sparkles, SlidersHorizontal } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import JobsPage from './pages/JobsPage';
import ResultsPage from './pages/ResultsPage';
import SettingsPage from './pages/SettingsPage';
import InteractiveBackground from './components/InteractiveBackground';
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
        "h-screen border-r border-white/[0.08] bg-[#07080b]/90 backdrop-blur-2xl flex flex-col fixed left-0 top-0 z-50 transition-all duration-500 ease-out shadow-[10px_0_40px_rgba(0,0,0,0.6)]",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-white/[0.06] relative overflow-hidden group flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-sky-400 p-[1px] shadow-[0_0_20px_rgba(99,102,241,0.4)] shrink-0">
            <div className="w-full h-full bg-[#0c0e17] rounded-[11px] flex items-center justify-center">
              <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
          </div>
          {!isCollapsed && (
            <div className="min-w-0 animate-in fade-in duration-300">
              <h2 className="text-base font-semibold tracking-tight text-white flex items-center gap-1.5 truncate">
                WebIntel <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">AI</span>
              </h2>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider">MERCURY ENGINE</p>
            </div>
          )}
        </div>

        {/* Collapse Toggle Button */}
        <button
          onClick={onToggle}
          title={isCollapsed ? "Expand Sidebar (⌘B)" : "Collapse Sidebar & Zoom Center (⌘B)"}
          className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-white transition-all shrink-0"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Quick Command Trigger */}
      <div className="p-3">
        <button
          onClick={onCmdClick}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-500/20 hover:border-indigo-500/50 text-slate-300 hover:text-white transition-all duration-300 shadow-sm group",
            isCollapsed && "justify-center px-0"
          )}
        >
          <Search className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          {!isCollapsed && (
            <div className="flex-1 flex justify-between items-center">
              <span className="text-xs font-medium">Quick Command...</span>
              <kbd className="text-[10px] font-mono text-slate-400 bg-white/10 px-1.5 py-0.5 rounded">⌘K</kbd>
            </div>
          )}
        </button>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 space-y-1.5 mt-2">
        {!isCollapsed && (
          <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-medium">Navigation</div>
        )}
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => {
              // Auto-collapse sidebar when tab is selected to expand/zoom center view
              if (!isCollapsed) {
                onToggle();
              }
            }}
            className={({ isActive }) => cn(
              "flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-300 group text-sm font-medium",
              isCollapsed && "justify-center px-0",
              isActive 
                ? "bg-gradient-to-r from-indigo-600/25 via-purple-600/20 to-transparent text-white border border-indigo-500/40 shadow-[0_4px_20px_rgba(99,102,241,0.2)]" 
                : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] border border-transparent"
            )}
            title={item.label}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-4.5 h-4.5 transition-transform duration-300 group-hover:scale-110" />
              {!isCollapsed && <span>{item.label}</span>}
            </div>
            {!isCollapsed && (
              <span className="text-[10px] font-mono text-slate-500 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06] group-hover:border-white/[0.12] transition-colors">
                {item.shortcut}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer System Status */}
      <div className="p-3 mx-2 mb-4 rounded-xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md">
        <div className={cn("flex items-center justify-between text-xs", isCollapsed && "justify-center")}>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            {!isCollapsed && <span className="font-mono text-slate-300 text-[11px]">ENGINE ONLINE</span>}
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

  // Keyboard shortcut ⌘B to toggle sidebar collapse
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
    <div className="flex min-h-screen relative overflow-hidden bg-[#07080b]">
      {/* Interactive 3D Canvas Mesh Background */}
      <InteractiveBackground />

      {/* Command Palette Modal */}
      <CommandPalette isOpen={isCmdOpen} onClose={() => setIsCmdOpen(false)} />

      {/* Collapsible Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed((prev) => !prev)}
        onCmdClick={() => setIsCmdOpen(true)}
      />

      {/* Main Content Area — Smooth Zoom & Scale Transformation when sidebar collapses */}
      <main
        className={cn(
          "flex-1 relative min-h-screen transition-all duration-500 ease-out z-10",
          isCollapsed ? "ml-20 scale-[1.015] origin-top" : "ml-64 scale-100"
        )}
      >
        {/* Top Navbar Header */}
        <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#07080b]/70 backdrop-blur-xl px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-white transition-all text-xs font-mono flex items-center gap-1.5"
            >
              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
              <span>{isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsCmdOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-slate-300 text-xs font-mono transition-all shadow-sm"
            >
              <Command className="w-3.5 h-3.5 text-indigo-400" />
              <span>Cmd Palette</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-slate-400">⌘K</kbd>
            </button>

            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>Mercury Engine Active</span>
            </div>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<JobsPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<div className="p-8 text-slate-400 font-mono">404 — Command Not Found</div>} />
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


export default App;
