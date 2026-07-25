import { useState, useEffect } from 'react';
import { Key, CheckCircle2, AlertCircle, Lock, RefreshCw } from 'lucide-react';
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
    <div className="max-w-4xl mx-auto space-y-6 wi-enter">
      
      {/* Settings Security Card */}
      <section className="border border-[var(--border)] bg-[var(--card)] rounded-sm shadow-sm">
        {/* Caption */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 md:px-5">
          <div className="flex items-baseline gap-3">
            <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted-foreground)] font-mono">
              Security Console
            </span>
            <h2 className="font-serif text-lg font-medium tracking-tight text-[var(--foreground)]">
              Gemini API Configuration
            </h2>
          </div>
          {hasKey && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ok)]/30 bg-[var(--ok)]/10 px-2.5 py-0.5 text-[11px] font-mono font-medium text-[var(--ok)]">
              <Lock className="size-3" /> Configured / Active
            </span>
          )}
        </div>

        <div className="p-4 md:p-6 space-y-6 font-mono">
          {loadingInitial ? (
            <div className="text-[var(--muted-foreground)] text-xs animate-pulse flex items-center gap-2 py-4 font-mono">
              <RefreshCw className="size-4 animate-spin text-[var(--primary)]" />
              Loading security configuration...
            </div>
          ) : (
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)] mb-2 flex justify-between font-mono">
                  <span>Google Gemini API Key</span>
                  <span className="text-[var(--muted-foreground)]/70">Encrypted Storage</span>
                </label>
                
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      onFocus={() => {
                        if (hasKey && apiKey === '••••••••••••••••••••••••••••••••••••••••') {
                          setApiKey('');
                        }
                      }}
                      placeholder="Paste your Gemini API key (e.g. AIzaSy...)"
                      className={cn(
                        "h-11 w-full border border-[var(--input)] bg-[var(--background)] px-3 font-mono text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--primary)] rounded-sm",
                        error && "border-destructive focus:border-destructive",
                        hasKey && apiKey === '••••••••••••••••••••••••••••••••••••••••' && "text-[var(--ok)] border-[var(--ok)]/30"
                      )}
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={validating || !apiKey.trim() || apiKey === '••••••••••••••••••••••••••••••••••••••••'}
                    className="flex h-11 shrink-0 items-center justify-center gap-1.5 border border-[var(--primary)] bg-[var(--primary)] px-5 text-xs font-mono font-medium uppercase tracking-[0.12em] text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary)]/90 disabled:cursor-not-allowed disabled:border-[var(--border)] disabled:bg-[var(--muted)] disabled:text-[var(--muted-foreground)] cursor-pointer rounded-sm"
                  >
                    {validating ? (
                      <>
                        <RefreshCw className="size-3.5 animate-spin" />
                        Validating...
                      </>
                    ) : saved ? (
                      <>
                        <CheckCircle2 className="size-3.5 text-[var(--primary-foreground)]" />
                        Saved
                      </>
                    ) : (
                      'Save Key'
                    )}
                  </button>
                </div>

                {error && (
                  <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-700 text-xs rounded-sm flex items-center gap-2 font-mono">
                    <AlertCircle className="size-4 shrink-0 text-rose-600" />
                    {error}
                  </div>
                )}

                {saved && (
                  <div className="mt-3 p-3 bg-[var(--ok)]/10 border border-[var(--ok)]/20 text-[var(--ok)] text-xs rounded-sm flex items-center gap-2 font-mono">
                    <CheckCircle2 className="size-4 shrink-0 text-[var(--ok)]" />
                    Your Gemini API key has been verified and saved securely.
                  </div>
                )}
              </div>

              {/* Clean Professional Info Banner */}
              <div className="p-4 border border-[var(--border)] bg-[var(--muted)]/40 space-y-2 text-xs rounded-sm">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--foreground)] font-semibold flex items-center gap-2">
                  <Key className="size-3.5 text-[var(--primary)]" /> API Key Security & Setup
                </div>
                <p className="leading-relaxed text-[var(--muted-foreground)] font-sans text-xs">
                  Provide your Google Gemini API key to enable AI-driven web scraping and data extraction. Your key is stored securely and is used strictly for processing your extraction jobs.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
