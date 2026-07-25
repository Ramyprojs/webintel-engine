import { useState, useEffect } from 'react';
import { Settings, Key, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { configApi } from '../api/client';
import { cn } from '../App';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  
  const [saved, setSaved] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { has_valid_key } = await configApi.getStatus();
        setHasKey(has_valid_key);
        if (has_valid_key) {
          setApiKey('••••••••••••••••••••••••••••••••••••••••');
        }
      } catch (err) {
        console.error('Failed to get config status', err);
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchStatus();
  }, []);

  const handleSave = async () => {
    if (!apiKey.trim() || apiKey === '••••••••••••••••••••••••••••••••••••••••') {
      return;
    }

    setError(null);
    setSaved(false);
    setValidating(true);
    
    try {
      await configApi.setKey(apiKey.trim());
      setSaved(true);
      setHasKey(true);
      setApiKey('••••••••••••••••••••••••••••••••••••••••');
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to validate API key');
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 relative z-10">
      <div className="border-b border-white/[0.06] pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-mono text-purple-400 uppercase tracking-widest bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
            System Configuration
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-white flex items-center gap-3">
          Settings
        </h1>
        <p className="text-slate-400 text-sm mt-1">Manage system security credentials, engine parameters, and API keys.</p>
      </div>

      <div className="glass-panel p-8 relative overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />
        
        <div className="flex items-center justify-between mb-6 border-b border-white/[0.06] pb-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-indigo-400">
              <Key className="w-4 h-4" />
            </div>
            Gemini API Security Credentials
          </h2>
          {hasKey && (
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <Lock className="w-3 h-3" /> Encrypted & Active
            </span>
          )}
        </div>

        {loadingInitial ? (
          <div className="text-slate-500 font-mono text-sm animate-pulse flex items-center gap-2 py-4">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            Connecting to PostgreSQL configuration vault...
          </div>
        ) : (
          <div className="space-y-6 max-w-2xl relative z-10">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 flex justify-between">
                <span>Google Gemini API Key</span>
                <span className="text-slate-500">PostgreSQL Vault</span>
              </label>
              
              <div className="relative">
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  onFocus={() => {
                    if (hasKey && apiKey === '••••••••••••••••••••••••••••••••••••••••') {
                      setApiKey('');
                    }
                  }}
                  placeholder="Paste your Gemini API key (AIzaSy...)"
                  className={cn(
                    "glass-input w-full font-mono text-sm tracking-wider transition-all pr-24 py-3",
                    error && "border-rose-500/50 focus:border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.15)]",
                    hasKey && apiKey === '••••••••••••••••••••••••••••••••••••••••' && "text-emerald-400/80 border-emerald-500/20 bg-emerald-500/[0.02]"
                  )}
                />
                
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={validating || !apiKey.trim() || apiKey === '••••••••••••••••••••••••••••••••••••••••'}
                  className="absolute right-2 top-2 glow-button !py-1.5 !px-3.5 text-xs flex items-center gap-1.5"
                >
                  {validating ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Checking...
                    </>
                  ) : saved ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                      Saved
                    </>
                  ) : (
                    'Verify & Save'
                  )}
                </button>
              </div>

              {error && (
                <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2 font-mono animate-in slide-in-from-top-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  {error}
                </div>
              )}

              {saved && (
                <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-xl flex items-center gap-2 font-mono animate-in slide-in-from-top-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  API key verified against Google Gemini service and saved to database.
                </div>
              )}
            </div>

            {/* Architecture Info Banner */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2 text-xs text-slate-400">
              <div className="font-semibold text-slate-200 font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Secure Vault Architecture
              </div>
              <p className="leading-relaxed text-slate-400">
                Your key is validated via a lightweight pre-flight call before saving to PostgreSQL. Celery workers dynamically consume the key with automatic Redis caching.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
