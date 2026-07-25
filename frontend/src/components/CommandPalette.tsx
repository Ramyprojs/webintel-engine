import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutDashboard, Database, Settings, Terminal, X, ArrowRight, Play, Globe } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled externally or here
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'dashboard',
      label: 'Go to Dashboard',
      subtitle: 'Dispatch jobs & view active background tasks',
      icon: LayoutDashboard,
      shortcut: '⌘1',
      run: () => {
        navigate('/');
        onClose();
      },
    },
    {
      id: 'results',
      label: 'View Results Database',
      subtitle: 'Browse extracted company intelligence & export CSV',
      icon: Database,
      shortcut: '⌘2',
      run: () => {
        navigate('/results');
        onClose();
      },
    },
    {
      id: 'settings',
      label: 'System Settings',
      subtitle: 'Manage Gemini API Key & DB settings',
      icon: Settings,
      shortcut: '⌘3',
      run: () => {
        navigate('/settings');
        onClose();
      },
    },
    {
      id: 'crawl-awwwards',
      label: 'Sample Command: Crawl awwwards.com',
      subtitle: 'Instant shortcut to extract site showcase data',
      icon: Globe,
      shortcut: '↵',
      run: () => {
        navigate('/?input=awwwards.com');
        onClose();
      },
    },
  ];

  const filteredActions = actions.filter((action) =>
    action.label.toLowerCase().includes(query.toLowerCase()) ||
    action.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] bg-[#07080b]/80 backdrop-blur-xl flex items-start justify-center pt-24 px-4 animate-in fade-in duration-200">
      {/* Backdrop overlay click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Command Palette Card */}
      <div className="relative w-full max-w-2xl bg-[#0c0e17] border border-white/[0.12] rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.8),0_0_40px_rgba(99,102,241,0.15)] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Search Header */}
        <div className="p-4 border-b border-white/[0.08] flex items-center gap-3 bg-white/[0.02]">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search actions... (ESC to close)"
            className="w-full bg-transparent text-white placeholder:text-slate-500 font-sans text-base focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Actions List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filteredActions.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-mono text-sm">
              No matching commands found.
            </div>
          ) : (
            filteredActions.map((action) => (
              <button
                key={action.id}
                onClick={action.run}
                className="w-full text-left p-3 rounded-xl flex items-center justify-between gap-3 hover:bg-gradient-to-r hover:from-indigo-500/15 hover:to-purple-500/10 border border-transparent hover:border-indigo-500/30 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-400 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-colors shrink-0">
                    <action.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-medium text-slate-200 group-hover:text-white truncate">
                      {action.label}
                    </h4>
                    <p className="text-xs text-slate-500 group-hover:text-slate-400 truncate">
                      {action.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono text-slate-500 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.08] group-hover:border-indigo-500/30 group-hover:text-indigo-300">
                    {action.shortcut}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Palette Footer */}
        <div className="p-3 border-t border-white/[0.06] bg-[#07080b]/90 text-xs font-mono text-slate-500 flex justify-between items-center px-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px]">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px]">↓</kbd> Navigate</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px]">↵</kbd> Select</span>
          </div>
          <span className="text-indigo-400">WebIntel Command OS</span>
        </div>
      </div>
    </div>
  );
}
