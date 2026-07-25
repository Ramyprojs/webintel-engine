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
      <div>
        <h1 className="text-3xl font-light tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-brand-secondary" />
          Settings
        </h1>
        <p className="text-slate-400 mt-2">Configure system preferences and API access.</p>
      </div>

      <div className="glass-panel p-8 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        <h2 className="text-xl font-medium mb-6 flex items-center gap-2">
          <Key className="w-5 h-5 text-brand-primary" />
          Gemini API Configuration
        </h2>

        {loadingInitial ? (
          <div className="text-slate-500 animate-pulse">Checking configuration...</div>
        ) : (
          <div className="space-y-4 max-w-2xl relative z-10">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5 flex justify-between">
                <span>Google Gemini API Key</span>
                {hasKey && <span className="text-emerald-400 text-xs flex items-center gap-1"><Lock className="w-3 h-3"/> Secured</span>}
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onFocus={() => {
                  if (hasKey && apiKey === '••••••••••••••••••••••••••••••••••••••••') {
                    setApiKey('');
                  }
                }}
                placeholder="AIzaSy..."
                className={cn(
                  "glass-input w-full font-mono text-sm tracking-widest transition-colors",
                  error && "border-red-500/50 focus:border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]",
                  hasKey && apiKey === '••••••••••••••••••••••••••••••••••••••••' && "text-emerald-500/50 border-emerald-500/20"
                )}
              />
              {error && (
                <p className="text-red-400 text-xs mt-2 flex items-center gap-1.5 animate-in slide-in-from-top-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-2">
                Your API key is securely encrypted and stored exclusively on the server. It will never be exposed to the browser.
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={validating || (!apiKey.trim() || apiKey === '••••••••••••••••••••••••••••••••••••••••')}
              className="glass-button !bg-brand-primary/10 hover:!bg-brand-primary/20 text-brand-primary border-brand-primary/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {validating ? (
                <span className="w-4 h-4 border-2 border-brand-primary/50 border-t-brand-primary rounded-full animate-spin" />
              ) : saved ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Settings className="w-4 h-4" />
              )}
              {validating ? 'Validating against Google...' : saved ? 'Validated & Saved Successfully' : 'Save Configuration'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
