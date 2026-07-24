import { useState, useEffect } from 'react';
import { Settings, Key, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiClient } from '../api/client';
import { cn } from '../App';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('gemini_api_key');
    if (stored) setApiKey(stored);
  }, []);

  const handleSave = async () => {
    setError(null);
    setSaved(false);

    if (!apiKey.trim()) {
      localStorage.removeItem('gemini_api_key');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return;
    }

    setValidating(true);
    try {
      // Validate the key by sending a test request to the backend
      // We send it in the header explicitly just in case it's not saved yet
      const response = await apiClient.post('/jobs/validate-key', null, {
        headers: { 'x-gemini-api-key': apiKey }
      });
      
      if (response.data.valid) {
        localStorage.setItem('gemini_api_key', apiKey.trim());
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError(response.data.error || 'Invalid API Key');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to validate API key');
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-light tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-brand-secondary" />
          Settings
        </h1>
        <p className="text-slate-400 mt-2">Configure system preferences and API access.</p>
      </div>

      <div className="glass-panel p-8 relative overflow-hidden">
        {/* Decorative background flare */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        <h2 className="text-xl font-medium mb-6 flex items-center gap-2">
          <Key className="w-5 h-5 text-brand-primary" />
          Gemini API Configuration
        </h2>

        <div className="space-y-4 max-w-2xl relative z-10">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">
              Google Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className={cn(
                "glass-input w-full font-mono text-sm tracking-widest",
                error && "border-red-500/50 focus:border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]"
              )}
            />
            {error && (
              <p className="text-red-400 text-xs mt-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}
            <p className="text-xs text-slate-500 mt-2">
              Your API key is stored securely in your browser's local storage and is sent to the backend only when dispatching jobs. Get one from Google AI Studio.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={validating}
            className="glass-button !bg-brand-primary/10 hover:!bg-brand-primary/20 text-brand-primary border-brand-primary/30 flex items-center gap-2"
          >
            {validating ? (
              <span className="w-4 h-4 border-2 border-brand-primary/50 border-t-brand-primary rounded-full animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Settings className="w-4 h-4" />
            )}
            {validating ? 'Validating...' : saved ? 'Saved successfully' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
