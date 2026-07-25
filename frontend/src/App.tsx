import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Activity, Database, LayoutDashboard, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import JobsPage from './pages/JobsPage';
import ResultsPage from './pages/ResultsPage';
import SettingsPage from './pages/SettingsPage';

// Utility for merging tailwind classes safely
export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

function Sidebar() {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', shortcut: '⌘1' },
    { to: '/results', icon: Database, label: 'Results Database', shortcut: '⌘2' },
    { to: '/settings', icon: Settings, label: 'Settings', shortcut: '⌘3' },
  ];

  return (
    <aside className="w-64 h-screen border-r border-white/[0.08] bg-[#07080b]/90 backdrop-blur-2xl flex flex-col fixed left-0 top-0 z-50 shadow-[5px_0_30px_rgba(0,0,0,0.5)]">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/[0.06] relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-500 pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-sky-400 p-[1px] shadow-[0_0_15px_rgba(99,102,241,0.4)]">
            <div className="w-full h-full bg-[#0c0e17] rounded-[11px] flex items-center justify-center">
              <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-white flex items-center gap-1.5">
              WebIntel <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">AI</span>
            </h2>
            <p className="text-[11px] text-slate-400 font-mono tracking-wider">COMMAND OS</p>
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 space-y-1.5 mt-6">
        <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-medium">Navigation</div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-300 group text-sm font-medium",
              isActive 
                ? "bg-gradient-to-r from-indigo-600/20 via-purple-600/15 to-transparent text-white border border-indigo-500/30 shadow-[0_4px_20px_rgba(99,102,241,0.15)]" 
                : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] border border-transparent"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
              <span>{item.label}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06] group-hover:border-white/[0.12] transition-colors">
              {item.shortcut}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Footer System Status */}
      <div className="p-4 mx-3 mb-4 rounded-xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-mono text-slate-300 text-[11px]">ENGINE READY</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">v2.5</span>
        </div>
      </div>
    </aside>
  );
}

function App() {
  return (
    <Router>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 relative min-h-screen">
          {/* Ambient Mercury Command Background Glow Lights */}
          <div className="fixed top-[-10%] left-[20%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] -z-10 pointer-events-none animate-pulse-glow" />
          <div className="fixed bottom-[-10%] right-[10%] w-[700px] h-[700px] bg-purple-600/10 rounded-full blur-[160px] -z-10 pointer-events-none animate-pulse-glow" style={{ animationDelay: '3s' }} />
          <div className="fixed top-[40%] right-[30%] w-[400px] h-[400px] bg-sky-500/5 rounded-full blur-[130px] -z-10 pointer-events-none" />

          <Routes>
            <Route path="/" element={<JobsPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<div className="p-8 text-slate-400 font-mono">404 — Command Not Found</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
