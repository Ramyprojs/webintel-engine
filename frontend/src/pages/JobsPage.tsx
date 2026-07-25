import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Play, Search, Globe, AlertCircle, RefreshCw, FileText } from 'lucide-react';
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
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 relative z-10">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b border-white/[0.06] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              Command Dispatcher
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Active Jobs</h1>
          <p className="text-slate-400 text-sm mt-1">Submit and monitor autonomous background extraction tasks.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-400 font-mono">TOTAL TASKS</div>
            <div className="text-lg font-bold font-mono text-white">{jobs.length}</div>
          </div>
        </div>
      </div>

      {/* Mercury Command Input Palette */}
      <div className="glass-panel p-6 overflow-hidden relative group border-white/[0.1] hover:border-indigo-500/40">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 rounded-full blur-3xl -z-10 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
        
        {!hasKey && (
          <div className="absolute inset-0 z-20 bg-[#07080b]/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-300">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3 text-amber-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">API Key Required</h3>
            <p className="text-sm text-slate-400 max-w-sm mt-1 mb-5">
              You must configure a valid Gemini API key before dispatching any background scraping jobs.
            </p>
            <a href="/settings" className="glow-button text-sm flex items-center gap-2">
              Configure Settings &rarr;
            </a>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Play className="w-3.5 h-3.5 fill-current" />
            </div>
            Dispatch Command
          </h2>

          {/* Mode Selector Toggle Pills */}
          <div className="flex bg-white/[0.04] p-1 rounded-xl border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setInputType('domain')}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer select-none active:scale-95 active:translate-y-0.5",
                inputType === 'domain'
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] tab-active-glow"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              )}
            >
              <Globe className={cn("w-3.5 h-3.5 transition-transform duration-200", inputType === 'domain' && "scale-110 text-indigo-200")} /> Domain Crawl
            </button>
            <button
              type="button"
              onClick={() => setInputType('keyword')}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer select-none active:scale-95 active:translate-y-0.5",
                inputType === 'keyword'
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] tab-active-glow"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              )}
            >
              <Search className={cn("w-3.5 h-3.5 transition-transform duration-200", inputType === 'keyword' && "scale-110 text-purple-200")} /> Keyword Search
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <div className="absolute left-4 top-3.5 text-slate-500 pointer-events-none">
              {inputType === 'domain' ? <Globe className="w-4 h-4 text-indigo-400" /> : <Search className="w-4 h-4 text-purple-400" />}
            </div>
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={inputType === 'domain' ? "Enter target domain (e.g. books.toscrape.com)" : "Enter search topic (e.g. AI startups in san francisco)"}
              className="glass-input w-full pl-11 pr-24 py-3 text-sm font-sans"
              disabled={isSubmitting}
            />
            <div className="absolute right-3 top-3 flex items-center gap-1.5 pointer-events-none">
              <span className="command-pill">↵ ENTER</span>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={isSubmitting || !inputValue.trim()}
            className="glow-button flex items-center gap-2 py-3 px-6 text-sm shrink-0"
          >
            {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            <span>Execute</span>
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2.5 text-sm animate-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
      </div>

      {/* Active Jobs Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <span>Recent Activity</span>
            {jobs.length > 0 && (
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-400 border border-white/[0.08]">
                {jobs.length}
              </span>
            )}
          </h2>
          {loading && <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />}
        </div>
        
        {jobs.length === 0 && !loading ? (
          <div className="glass-panel p-16 text-center text-slate-500 flex flex-col items-center border-dashed border-white/10">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-3">
              <FileText className="w-6 h-6 opacity-40 text-slate-400" />
            </div>
            <p className="text-slate-300 font-medium">No active commands found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">Dispatch a new background scraping task using the command bar above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function JobCard({ job }: { job: Job }) {
  const isRunning = job.status === 'scraping' || job.status === 'cleaning' || job.status === 'queued';
  
  const statusColors = {
    queued: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
    scraping: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    cleaning: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    done: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    failed: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    partial: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  };

  return (
    <div className="glass-panel p-5 relative overflow-hidden group hover:-translate-y-0.5 transition-all duration-300">
      {/* Animated Glowing Header line for running jobs */}
      {isRunning && (
        <div 
          className="absolute left-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-400 transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(99,102,241,0.6)]"
          style={{ width: `${job.progress_percent}%` }}
        />
      )}
      
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-indigo-400 shrink-0">
            {job.input_type === 'domain' ? <Globe className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-slate-100 text-sm truncate max-w-[200px]" title={job.input_value}>
              {job.input_value}
            </h4>
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mt-0.5">
              {job.input_type} command
            </span>
          </div>
        </div>
        <span className={cn(
          "text-[10px] px-2.5 py-1 rounded-full border uppercase tracking-wider font-semibold font-mono flex items-center gap-1.5 shrink-0",
          statusColors[job.status] || statusColors.queued
        )}>
          {isRunning && <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />}
          {job.status}
        </span>
      </div>
      
      <div className="space-y-2.5 pt-2 border-t border-white/[0.04]">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500 font-medium">Stage</span>
          <span className="text-slate-300 font-mono truncate max-w-[210px]">{job.stage_detail || 'Waiting in queue...'}</span>
        </div>
        
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-500 font-medium">Execution Progress</span>
            <span className="text-indigo-300 font-mono font-semibold">{job.progress_percent}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden p-[1px] border border-white/[0.05]">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-400 transition-all duration-700"
              style={{ width: `${job.progress_percent}%` }}
            />
          </div>
        </div>
        
        {job.error_message && (
          <div className="mt-3 p-2.5 bg-rose-500/10 text-rose-300 text-xs rounded-xl border border-rose-500/20 font-mono truncate" title={job.error_message}>
            {job.error_message}
          </div>
        )}
      </div>
    </div>
  );
}
