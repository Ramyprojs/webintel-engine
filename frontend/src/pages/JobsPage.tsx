import { useEffect, useState } from 'react';
import { Play, Search, Globe, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { jobsApi } from '../api/client';
import type { Job, InputType } from '../api/client';
import { cn } from '../App';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [inputType, setInputType] = useState<InputType>('domain');
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchJobs = async () => {
    try {
      const data = await jobsApi.getAll();
      setJobs(data);
    } catch (err) {
      console.error('Failed to fetch jobs', err);
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
    
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
      setError('Missing Gemini API Key. Please configure it in the Settings tab first.');
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
      <div>
        <h1 className="text-3xl font-light tracking-tight">Active Jobs</h1>
        <p className="text-slate-400 mt-2">Submit and monitor background scraping tasks.</p>
      </div>

      {/* Submission Form */}
      <div className="glass-panel p-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
          <Play className="w-5 h-5 text-brand-primary" />
          Dispatch New Job
        </h2>
        
        <form onSubmit={handleSubmit} className="flex gap-4 items-start">
          <div className="w-48">
            <select 
              value={inputType} 
              onChange={(e) => setInputType(e.target.value as InputType)}
              className="glass-input w-full appearance-none cursor-pointer"
            >
              <option value="domain">Domain Crawl</option>
              <option value="keyword">Keyword Search</option>
            </select>
          </div>
          
          <div className="flex-1 relative">
            <div className="absolute left-3 top-3.5 text-slate-500">
              {inputType === 'domain' ? <Globe className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </div>
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={inputType === 'domain' ? "e.g. books.toscrape.com" : "e.g. AI startups in san francisco"}
              className="glass-input w-full pl-10"
              disabled={isSubmitting}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isSubmitting || !inputValue.trim()}
            className="glow-button flex items-center gap-2"
          >
            {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            Start Engine
          </button>
        </form>
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center gap-2 text-sm shadow-inner shadow-red-500/10">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
      </div>

      {/* Active Jobs Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Recent Activity</h2>
          {loading && <RefreshCw className="w-4 h-4 text-slate-500 animate-spin" />}
        </div>
        
        {jobs.length === 0 && !loading ? (
          <div className="glass-panel p-12 text-center text-slate-500 flex flex-col items-center border-dashed">
            <FileText className="w-8 h-8 mb-3 opacity-50" />
            <p>No jobs found.</p>
            <p className="text-sm">Dispatch a new job above to get started.</p>
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
    scraping: 'text-brand-primary bg-brand-primary/10 border-brand-primary/20',
    cleaning: 'text-brand-secondary bg-brand-secondary/10 border-brand-secondary/20',
    done: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    failed: 'text-red-400 bg-red-400/10 border-red-400/20',
    partial: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  };

  return (
    <div className="glass-panel p-5 relative overflow-hidden group hover:border-slate-600 transition-colors">
      {/* Background progress bar for running jobs */}
      {isRunning && (
        <div 
          className="absolute left-0 top-0 h-1 bg-gradient-to-r from-brand-primary to-brand-secondary transition-all duration-1000 ease-out"
          style={{ width: `${job.progress_percent}%` }}
        />
      )}
      
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          {job.input_type === 'domain' ? <Globe className="w-4 h-4 text-slate-400" /> : <Search className="w-4 h-4 text-slate-400" />}
          <span className="font-medium truncate max-w-[200px]" title={job.input_value}>
            {job.input_value}
          </span>
        </div>
        <span className={cn(
          "text-xs px-2 py-1 rounded-full border uppercase tracking-wider font-semibold flex items-center gap-1",
          statusColors[job.status] || statusColors.queued
        )}>
          {isRunning && <RefreshCw className="w-3 h-3 animate-spin" />}
          {job.status}
        </span>
      </div>
      
      <div className="space-y-2 mt-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Stage:</span>
          <span className="text-slate-300 truncate max-w-[200px]">{job.stage_detail || 'Waiting in queue...'}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Progress:</span>
          <span className="text-slate-300 font-mono">{job.progress_percent}%</span>
        </div>
        
        {job.error_message && (
          <div className="mt-3 p-2 bg-red-500/10 text-red-400 text-xs rounded border border-red-500/20 truncate" title={job.error_message}>
            {job.error_message}
          </div>
        )}
      </div>
    </div>
  );
}
