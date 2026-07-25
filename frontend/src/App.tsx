import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Database, LayoutDashboard, Settings, Search, PanelLeft, PanelLeftClose } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
    </svg>
  );
}

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
        "h-screen border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 ease-out",
        isCollapsed ? "w-[72px]" : "w-[248px]"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-[var(--sidebar-border)] px-4 shrink-0">
        <div className="grid size-9 shrink-0 place-items-center border border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] rounded-sm overflow-hidden">
          <img src="/logo.png" alt="W" className="size-full object-cover" />
        </div>
        {!isCollapsed && (
          <div className="min-w-0 leading-tight">
            <p className="truncate font-serif text-base font-semibold tracking-tight text-[var(--foreground)]">
              WebIntel
            </p>
            <p className="truncate text-[10px] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
              Intelligence Console
            </p>
          </div>
        )}
      </div>

      {/* Quick Command Trigger */}
      <div className="p-3">
        <button
          onClick={onCmdClick}
          className={cn(
            "w-full flex items-center justify-between border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--foreground)] transition-colors rounded-sm",
            isCollapsed && "justify-center px-0"
          )}
        >
          <Search className="size-3.5" strokeWidth={1.75} />
          {!isCollapsed && (
            <>
              <span className="text-xs font-mono">Search...</span>
              <kbd className="border border-[var(--border)] bg-[var(--muted)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--muted-foreground)]">⌘K</kbd>
            </>
          )}
        </button>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 pt-2">
        {!isCollapsed && (
          <p className="px-2 pb-2 text-[10px] uppercase tracking-[0.22em] text-[var(--muted-foreground)] font-mono">
            Sections
          </p>
        )}
        <ul className="flex flex-col space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={() => {
                  if (!isCollapsed) {
                    onToggle();
                  }
                }}
                className={({ isActive }) => cn(
                  "group relative flex items-center gap-3 border-l-2 py-2.5 pl-4 pr-3 text-sm transition-colors cursor-pointer rounded-r-sm font-mono",
                  isCollapsed && "justify-center px-0 pl-0 border-l-0",
                  isActive
                    ? "border-[var(--primary)] bg-[var(--sidebar-accent)] font-medium text-[var(--foreground)]"
                    : "border-transparent text-[var(--muted-foreground)] hover:border-[var(--border)] hover:text-[var(--foreground)]"
                )}
                title={item.label}
              >
                <item.icon className="size-[17px] shrink-0" strokeWidth={1.75} />
                {!isCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Status & Developer Links Footer */}
      <div className="border-t border-[var(--sidebar-border)] px-4 py-3 shrink-0 font-mono">
        {!isCollapsed ? (
          <div className="space-y-3">
            <dl className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <dt className="text-[var(--muted-foreground)]">Status</dt>
                <dd className="flex items-center gap-1.5 font-medium text-[var(--foreground)]">
                  <span className="size-1.5 rounded-full bg-[var(--ok)]" />
                  Ready
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[var(--muted-foreground)]">AI Model</dt>
                <dd className="tabular-nums text-[var(--primary)] font-medium">Gemini 2.5</dd>
              </div>
            </dl>

            <div className="pt-2 border-t border-[var(--sidebar-border)] flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
              <a
                href="https://www.linkedin.com/in/ramyabdelamalak"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-[var(--primary)] transition-colors"
                title="Ramy Abdelamalak on LinkedIn"
              >
                <LinkedinIcon className="size-3.5" />
                <span className="text-[11px]">LinkedIn</span>
              </a>
              <span className="text-[var(--sidebar-border)]">•</span>
              <a
                href="https://github.com/Ramyprojs"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-[var(--primary)] transition-colors"
                title="Ramyprojs on GitHub"
              >
                <GithubIcon className="size-3.5" />
                <span className="text-[11px]">GitHub</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <span className="size-2 rounded-full bg-[var(--ok)]" />
            <a
              href="https://github.com/Ramyprojs"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
              title="GitHub: Ramyprojs"
            >
              <GithubIcon className="size-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* Collapse Toggle Button */}
      <button
        type="button"
        onClick={onToggle}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-[68px] hidden size-6 place-items-center border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)] md:grid shadow-sm rounded-sm z-50"
      >
        {isCollapsed ? (
          <PanelLeft className="size-3.5" strokeWidth={1.75} />
        ) : (
          <PanelLeftClose className="size-3.5" strokeWidth={1.75} />
        )}
      </button>
    </aside>
  );
}

function MainLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const location = useLocation();

  const pageTitleMap: Record<string, string> = {
    '/': 'Active Jobs',
    '/jobs': 'Active Jobs',
    '/results': 'Results Database',
    '/settings': 'Console Settings',
  };

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
    <div className="flex min-h-screen relative bg-[var(--background)] text-[var(--foreground)]">
      {/* Command Palette Modal */}
      <CommandPalette isOpen={isCmdOpen} onClose={() => setIsCmdOpen(false)} />

      {/* Collapsible Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed((prev) => !prev)}
        onCmdClick={() => setIsCmdOpen(true)}
      />

      {/* Main Content Container */}
      <div
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-out",
          isCollapsed ? "ml-[72px] scale-[1.008] origin-top" : "ml-[248px] scale-100"
        )}
      >
        {/* Ledger Top Bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              aria-label="Toggle sidebar"
              className="grid size-8 place-items-center border border-transparent text-[var(--muted-foreground)] transition-colors hover:border-[var(--border)] hover:text-[var(--foreground)] rounded-sm"
            >
              <PanelLeft className="size-[18px]" strokeWidth={1.75} />
            </button>
            <nav
              aria-label="Breadcrumb"
              className="hidden items-center gap-2 text-xs font-mono text-[var(--muted-foreground)] sm:flex"
            >
              <span>Engine</span>
              <span aria-hidden className="text-[var(--border)]">
                —
              </span>
              <span className="text-[var(--foreground)] font-medium">
                {pageTitleMap[location.pathname] || 'Dashboard'}
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-4 font-mono">
            <span className="hidden text-[11px] tabular-nums text-[var(--muted-foreground)] md:inline">
              {new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
              })}
            </span>
            <button
              type="button"
              onClick={() => setIsCmdOpen(true)}
              className="flex items-center gap-2 border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-xs text-[var(--muted-foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--foreground)] rounded-sm"
            >
              <Search className="size-3.5" strokeWidth={1.75} />
              <span className="hidden sm:inline">Search</span>
              <kbd className="border border-[var(--border)] bg-[var(--muted)] px-1.5 py-0.5 text-[10px]">⌘K</kbd>
            </button>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <Routes>
            <Route path="/" element={<JobsPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<div className="p-8 text-[var(--muted-foreground)] font-mono">404 — Not Found</div>} />
          </Routes>
        </main>
      </div>
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
