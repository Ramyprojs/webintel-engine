import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Activity, Database, LayoutDashboard, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import JobsPage from './pages/JobsPage';
import ResultsPage from './pages/ResultsPage';

// Utility for merging tailwind classes safely
export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

function Sidebar() {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/jobs', icon: Activity, label: 'Active Jobs' },
    { to: '/results', icon: Database, label: 'Results Database' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="w-64 h-screen border-r border-slate-800/50 bg-slate-950/50 backdrop-blur-xl flex flex-col fixed left-0 top-0">
      <div className="p-6">
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-primary to-brand-secondary tracking-tight">
          WebIntel Engine
        </h2>
        <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Data Extraction Suite</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
              isActive 
                ? "bg-brand-primary/10 text-brand-primary font-medium border border-brand-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          <span className="text-sm text-slate-400">System Online</span>
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
        <main className="flex-1 ml-64 relative">
          {/* Subtle background glow effects */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-primary/10 rounded-full blur-[128px] -z-10 pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-secondary/10 rounded-full blur-[128px] -z-10 pointer-events-none" />
          
          <Routes>
            <Route path="/" element={<JobsPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="*" element={<div className="p-8">Not Found</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
