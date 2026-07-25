import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Play, Search, Globe, AlertCircle, RefreshCw } from 'lucide-react';
import { jobsApi, configApi } from '../api/client';
import type { Job, InputType } from '../api/client';
import { cn } from '../App';

export default function JobsPage() {
  const [searchParams] = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasKey, setHasKey] = useState(true);
  
  // Form state
  const [inputType, setInputType] = useState<InputType>('domain');
  const [inputValue, setInputValue] = useState(searchParams.get('input') || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchJobs = async () => {
    try {
      const data = await jobsApi.getAll();
      const myJobIds = JSON.parse(localStorage.getItem('my_job_ids') || '[]');
      const myJobs = data.filter(job => myJobIds.includes(job.id));
      setJobs(myJobs);
      
      const status = await configApi.getStatus();
      setHasKey(status.has_valid_key);
    } catch (err) {
      console.error('Failed to fetch jobs or config', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // Poll every 3 seconds for live updates
    const interval = setInterval(fetchJobs, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    setError('');
    
    const status = await configApi.getStatus();
    if (!status.has_valid_key) {
      setError('Missing Gemini API Key. Please configure it in the Settings tab first.');
      setHasKey(false);
      return;
    }

    setIsSubmitting(true);
    
    try {
      await jobsApi.create(inputType, inputValue);
      setInputValue('');
      await fetchJobs(); // Immediate refresh
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to dispatch job. Please check the backend connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 wi-enter">
      
      {/* Dispatch Command Card */}
      <section className="border border-[var(--border)] bg-[var(--card)] relative overflow-hidden rounded-sm shadow-sm">
        {!hasKey && (
          <div className="absolute inset-0 z-20 bg-[var(--background)]/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
            <div className="size-10 rounded-sm bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3 text-amber-600">
              <AlertCircle className="size-5" />
            </div>
            <h3 className="font-serif text-lg font-medium text-[var(--foreground)]">API Key Required</h3>
            <p className="text-xs text-[var(--muted-foreground)] max-w-sm mt-1 mb-4 font-mono">
              You must configure a valid Gemini API key before dispatching any background scraping jobs.
            </p>
            <a href="/settings" className="border border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-mono uppercase tracking-[0.12em] px-4 py-2 hover:bg-[var(--primary)]/90 transition-colors">
              Configure Settings &rarr;
            </a>
          </div>
        )}

        {/* Header row */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 md:px-5">
          <div className="flex items-baseline gap-3">
            <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted-foreground)] font-mono">
              Extraction Setup
            </span>
            <h2 className="font-serif text-lg font-medium tracking-tight text-[var(--foreground)]">
              Start Web Extraction
            </h2>
          </div>

          {/* Mode Toggle Pills */}
          <div className="flex items-center font-mono">
            <button
              type="button"
              onClick={() => setInputType('domain')}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-3 py-1.5 text-xs transition-colors cursor-pointer",
                inputType === 'domain'
                  ? "border-[var(--primary)] font-medium text-[var(--foreground)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              <Globe className="size-3.5" strokeWidth={1.75} />
              <span className="hidden sm:inline">Domain Crawl</span>
            </button>
            <button
              type="button"
              onClick={() => setInputType('keyword')}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-3 py-1.5 text-xs transition-colors cursor-pointer",
                inputType === 'keyword'
                  ? "border-[var(--primary)] font-medium text-[var(--foreground)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              <Search className="size-3.5" strokeWidth={1.75} />
              <span className="hidden sm:inline">Keyword Search</span>
            </button>
          </div>
        </div>

        {/* Input Form Row */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-stretch md:p-5">
          <label className="group flex flex-1 items-center border border-[var(--input)] bg-[var(--background)] transition-colors focus-within:border-[var(--primary)] rounded-sm">
            <span className="grid h-full place-items-center border-r border-[var(--input)] px-3 text-[var(--muted-foreground)]">
              {inputType === 'domain' ? <Globe className="size-4" strokeWidth={1.75} /> : <Search className="size-4" strokeWidth={1.75} />}
            </span>
            <span className="pl-3 pr-1 text-xs font-mono text-[var(--muted-foreground)]">
              {inputType === 'domain' ? 'https://' : 'Search:'}
            </span>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={inputType === 'domain' ? "books.toscrape.com" : "fintech startups in europe"}
              disabled={isSubmitting}
              className="h-11 w-full bg-transparent pr-3 text-sm font-mono text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none"
            />
            <kbd className="mr-3 hidden items-center gap-1 border border-[var(--border)] bg-[var(--muted)] px-1.5 py-1 text-[10px] text-[var(--muted-foreground)] font-mono sm:flex">
              Enter ↵
            </kbd>
          </label>

          <button
            type="submit"
            disabled={isSubmitting || !inputValue.trim()}
            className="group flex h-11 shrink-0 items-center justify-center gap-2 border border-[var(--primary)] bg-[var(--primary)] px-6 text-xs font-mono font-medium uppercase tracking-[0.12em] text-[var(--primary-foreground)] transition-all duration-200 hover:bg-[var(--primary)]/90 active:translate-y-px disabled:cursor-not-allowed disabled:border-[var(--border)] disabled:bg-[var(--muted)] disabled:text-[var(--muted-foreground)] cursor-pointer rounded-sm"
          >
            {isSubmitting ? <RefreshCw className="size-3.5 animate-spin" /> : <Play className="size-3.5 fill-current" />}
            Start Extraction
          </button>
        </form>

        {error && (
          <div className="mx-4 mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-700 text-xs font-mono flex items-center gap-2 rounded-sm">
            <AlertCircle className="size-4 shrink-0 text-rose-600" /> {error}
          </div>
        )}
      </section>

      {/* Ledger Activity Table */}
      <section className="border border-[var(--border)] bg-[var(--card)] rounded-sm shadow-sm">
        {/* Caption */}
        <div className="flex items-baseline justify-between border-b border-[var(--border)] px-4 py-3 md:px-5">
          <div className="flex items-baseline gap-3">
            <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted-foreground)] font-mono">
              Ledger
            </span>
            <h2 className="font-serif text-lg font-medium tracking-tight text-[var(--foreground)]">
              Recent activity
            </h2>
          </div>
          <span className="text-[11px] font-mono tabular-nums text-[var(--muted-foreground)]">
            {jobs.length} {jobs.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {jobs.length === 0 && !loading ? (
          <div className="px-5 py-16 text-center">
            <p className="font-serif text-lg italic text-[var(--muted-foreground)]">
              The ledger is empty.
            </p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-[var(--muted-foreground)] font-mono">
              Dispatch a worker above and its progress will be recorded here as it comes online.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left font-mono">
              <thead>
                <tr className="border-b border-[var(--border)] text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  <th className="px-4 py-2.5 font-medium md:px-5">Source</th>
                  <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Type</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Progress</th>
                  <th className="hidden px-4 py-2.5 text-right font-medium md:table-cell md:px-5">Dispatched</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const isRunning = job.status === 'scraping' || job.status === 'cleaning' || job.status === 'queued';
                  
                  return (
                    <tr
                      key={job.id}
                      className="group border-b border-[var(--border)]/60 align-middle transition-colors last:border-b-0 hover:bg-[var(--accent)]/50"
                    >
                      {/* Source */}
                      <td className="px-4 py-3 md:px-5">
                        <div className="flex items-center gap-2.5">
                          <span className="grid size-7 shrink-0 place-items-center border border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] transition-colors duration-200 group-hover:border-[var(--primary)] group-hover:text-[var(--primary)] rounded-sm">
                            {job.input_type === 'domain' ? (
                              <Globe className="size-3.5" strokeWidth={1.75} />
                            ) : (
                              <Search className="size-3.5" strokeWidth={1.75} />
                            )}
                          </span>
                          <div className="min-w-0 leading-tight">
                            <p className="truncate text-sm font-medium text-[var(--foreground)]" title={job.input_value}>{job.input_value}</p>
                            <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                              {job.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="hidden px-4 py-3 text-xs text-[var(--muted-foreground)] sm:table-cell">
                        {job.input_type === 'domain' ? 'Domain Crawl' : 'Keyword Search'}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                          job.status === 'done' && "border-[var(--ok)]/30 bg-[var(--ok)]/10 text-[var(--ok)]",
                          isRunning && "border-[var(--work)]/40 bg-[var(--work)]/10 text-[color:var(--work-foreground)]",
                          job.status === 'failed' && "border-destructive/30 bg-destructive/10 text-destructive"
                        )}>
                          <span className={cn(
                            "size-1.5 rounded-full",
                            job.status === 'done' ? "bg-[var(--ok)]" : isRunning ? "bg-[var(--work)] animate-pulse" : "bg-muted-foreground"
                          )} />
                          <span className="capitalize">{job.status}</span>
                        </span>
                      </td>

                      {/* Progress */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-1.5 w-16 overflow-hidden bg-[var(--muted)] md:w-28 rounded-sm">
                            <div
                              className={cn(
                                "h-full transition-[width] duration-500 ease-out",
                                job.status === 'done' ? "bg-[var(--ok)]" : "bg-[var(--work)]",
                                isRunning && "wi-bar-active"
                              )}
                              style={{ width: `${job.progress_percent}%` }}
                            />
                          </div>
                          <span className="w-9 text-right text-[11px] tabular-nums text-[var(--muted-foreground)] font-mono font-medium">
                            {job.progress_percent}%
                          </span>
                        </div>
                      </td>

                      {/* Dispatched */}
                      <td className="hidden px-4 py-3 text-right text-xs tabular-nums text-[var(--muted-foreground)] md:table-cell md:px-5">
                        {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
