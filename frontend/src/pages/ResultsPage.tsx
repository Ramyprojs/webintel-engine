import { useEffect, useState } from 'react';
import { Database, Filter, Download, AlertTriangle, CheckCircle, ExternalLink, RefreshCw, Globe, Search } from 'lucide-react';
import { jobsApi, resultsApi } from '../api/client';
import type { Job, StructuredResult } from '../api/client';
import { cn } from '../App';

export default function ResultsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [results, setResults] = useState<StructuredResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Load jobs initially
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await jobsApi.getAll();
        const myJobIds = JSON.parse(localStorage.getItem('my_job_ids') || '[]');
        const myJobs = data.filter(job => myJobIds.includes(job.id));
        setJobs(myJobs);
        if (myJobs.length > 0 && !selectedJobId) {
          setSelectedJobId(myJobs[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch jobs for results sidebar', err);
      } finally {
        setLoadingJobs(false);
      }
    };
    fetchJobs();
  }, []);

  // Load results when a job is selected
  useEffect(() => {
    if (selectedJobId) {
      fetchResultsForJob(selectedJobId);
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [selectedJobId]);

  const fetchResultsForJob = async (jobId: string) => {
    setLoading(true);
    setExpandedId(null);
    try {
      const data = await resultsApi.getAll(jobId);
      setResults(data);
    } catch (err) {
      console.error('Failed to fetch results', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = () => {
    if (selectedJobId) {
      fetchResultsForJob(selectedJobId);
    }
  };

  const handleExport = async (customJobId?: string, customTitle?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const targetJobId = typeof customJobId === 'string' ? customJobId : selectedJobId;
    if (!targetJobId && typeof customJobId !== 'string' && !selectedJobId) return;

    try {
      const url = targetJobId 
        ? `/results/export?format=csv&job_id=${targetJobId}` 
        : `/results/export?format=csv`;
      const response = await fetch(`/api${url}`);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      
      let filename = 'webintel_export.csv';
      if (targetJobId) {
        const jobObj = jobs.find(j => j.id === targetJobId);
        const name = customTitle || (jobObj ? jobObj.input_value : targetJobId.slice(0, 8));
        const cleanName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        filename = `webintel_${cleanName}.csv`;
      } else {
        filename = 'webintel_all_searches.csv';
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 relative z-10 flex flex-col h-[calc(100vh-4rem)]">
      
      {/* Header */}
      <div className="flex justify-between items-end shrink-0 border-b border-white/[0.06] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono text-purple-400 uppercase tracking-widest bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
              Intelligence Warehouse
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white flex items-center gap-3">
            Results Database
          </h1>
          <p className="text-slate-400 text-sm mt-1">Select a search job to view and export its structured extracted intelligence.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleManualRefresh} 
            disabled={!selectedJobId || loading}
            className="glass-button flex items-center gap-2 border-white/10 disabled:opacity-40"
            title="Refresh database results"
          >
            <RefreshCw className={cn("w-4 h-4 text-indigo-400", loading && "animate-spin")} />
          </button>
          <button 
            onClick={() => handleExport()} 
            disabled={!selectedJobId || results.length === 0}
            className="glow-button flex items-center gap-2 text-sm !from-emerald-600 !to-teal-600 hover:!from-emerald-500 hover:!to-teal-500 disabled:opacity-40"
            title="Export CSV for selected search"
          >
            <Download className="w-4 h-4" />
            {selectedJobId ? 'Export Site CSV' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        
        {/* Left Sidebar: Jobs List */}
        <div className="w-1/3 max-w-sm glass-panel flex flex-col overflow-hidden shrink-0 border-white/[0.08]">
          <div className="p-4 border-b border-white/[0.06] bg-white/[0.02] text-xs font-mono uppercase tracking-wider text-slate-400 flex justify-between items-center font-medium">
            <span>Your Searches</span>
            <span className="bg-white/[0.06] text-slate-300 py-0.5 px-2 rounded-full text-[10px] font-mono border border-white/[0.08]">{jobs.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingJobs ? (
              <div className="p-8 text-center text-slate-500 font-mono text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                Loading searches...
              </div>
            ) : jobs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs font-mono">
                No searches found.<br/>Go to the Dashboard to dispatch a job.
              </div>
            ) : (
              jobs.map(job => (
                <div
                  key={job.id}
                  role="button"
                  onClick={() => setSelectedJobId(job.id)}
                  className={cn(
                    "w-full text-left p-3.5 rounded-xl flex items-center justify-between gap-3 transition-all duration-200 group cursor-pointer border active:scale-[0.97] active:translate-y-0.5 select-none relative overflow-hidden",
                    selectedJobId === job.id 
                      ? "bg-gradient-to-r from-indigo-500/20 via-purple-500/10 to-transparent border-indigo-500/40 shadow-[0_4px_25px_rgba(99,102,241,0.2)] tab-active-glow" 
                      : "hover:bg-white/[0.03] border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn(
                      "p-2 rounded-lg shrink-0 border transition-colors",
                      selectedJobId === job.id ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300" : "bg-white/[0.04] border-white/[0.06] text-slate-400 group-hover:text-slate-200"
                    )}>
                      {job.input_type === 'domain' ? <Globe className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-medium text-sm truncate",
                        selectedJobId === job.id ? "text-white" : "text-slate-300 group-hover:text-white"
                      )} title={job.input_value}>
                        {job.input_value}
                      </p>
                      <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase tracking-wider flex justify-between">
                        <span>{new Date(job.created_at).toLocaleDateString()}</span>
                        <span className={cn(
                          job.status === 'done' ? "text-emerald-400" :
                          job.status === 'failed' ? "text-rose-400" : "text-indigo-400"
                        )}>{job.status}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleExport(job.id, job.input_value, e)}
                    title={`Export CSV for ${job.input_value} independently`}
                    className="p-2 rounded-lg bg-white/[0.04] hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-300 border border-white/[0.08] hover:border-emerald-500/40 transition-all shrink-0 ml-1 opacity-80 hover:opacity-100"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Area: Results Data Table */}
        <div className="flex-1 glass-panel overflow-hidden shadow-2xl flex flex-col">
          <div className="p-4 border-b border-slate-800/50 flex gap-4 items-center bg-slate-900/30 relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-1/4 w-64 h-64 bg-brand-secondary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
            <Filter className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter by company name or industry..." 
              className="glass-input flex-1 !py-1.5 bg-slate-950/30"
              disabled
            />
            <select className="glass-input !py-1.5 w-48 bg-slate-950/30" disabled>
              <option>All Statuses</option>
              <option>Cleaned</option>
              <option>Needs Review</option>
            </select>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-900/80 text-slate-400 font-medium uppercase tracking-wider text-xs border-b border-slate-800 sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Industry</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4 text-right">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {!selectedJobId ? (
                   <tr>
                     <td colSpan={5} className="px-6 py-24 text-center text-slate-400">
                       <Database className="w-12 h-12 mx-auto mb-4 opacity-20" />
                       <p className="font-medium text-lg text-slate-300">Select a Search</p>
                       <p className="text-sm mt-2 max-w-sm mx-auto text-slate-500">
                         Click on a job from the left sidebar to view its extracted results here.
                       </p>
                     </td>
                   </tr>
                ) : loading && results.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-24 text-center text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 opacity-50" />
                      <span className="animate-pulse">Loading intelligence...</span>
                    </td>
                  </tr>
                ) : results.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-24 text-center text-slate-400">
                      <Database className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="font-medium text-lg text-slate-300">No Data Extracted</p>
                      <p className="text-sm mt-2 max-w-sm mx-auto text-slate-500">
                        If the job completed successfully, the scraper likely found 0 valid pages (e.g. rate-limited by DuckDuckGo).
                      </p>
                    </td>
                  </tr>
                ) : (
                  results.map((result) => (
                    <ResultRow 
                      key={result.id} 
                      result={result} 
                      isExpanded={expandedId === result.id}
                      onToggle={() => setExpandedId(expandedId === result.id ? null : result.id)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultRow({ result, isExpanded, onToggle }: { result: StructuredResult, isExpanded: boolean, onToggle: () => void }) {
  const isWarning = result.status === 'needs_review' || result.status === 'failed';
  
  return (
    <>
      <tr 
        onClick={onToggle}
        className={cn(
          "hover:bg-slate-800/30 cursor-pointer transition-colors",
          isExpanded && "bg-slate-800/20"
        )}
      >
        <td className="px-6 py-4">
          {isWarning ? (
            <span className="flex items-center gap-1.5 text-amber-400 bg-amber-400/10 px-2 py-1 rounded w-max text-xs uppercase font-semibold">
              <AlertTriangle className="w-3 h-3" /> Review
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded w-max text-xs uppercase font-semibold">
              <CheckCircle className="w-3 h-3" /> Cleaned
            </span>
          )}
        </td>
        <td className="px-6 py-4">
          <div className="font-medium text-slate-200">
            {result.company_name || <span className="text-slate-600">Unknown</span>}
          </div>
          {result.source_url && (
            <a
              href={result.source_url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              title={`Source Page: ${result.source_url}`}
              className="text-[11px] text-slate-500 hover:text-brand-secondary flex items-center gap-1 mt-0.5 truncate max-w-[240px]"
            >
              <Globe className="w-2.5 h-2.5 shrink-0" /> {result.source_url.replace(/^https?:\/\//, '')}
            </a>
          )}
        </td>
        <td className="px-6 py-4 text-slate-400">
          {result.industry || '-'}
        </td>
        <td className="px-6 py-4">
          <div className="flex flex-col text-slate-400 gap-0.5">
            {result.contact_email ? <span>{result.contact_email}</span> : null}
            {result.website ? (
              <a 
                href={result.website.startsWith('http') ? result.website : `https://${result.website}`}
                target="_blank" 
                rel="noreferrer"
                className="text-brand-primary hover:underline flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                {result.website} <ExternalLink className="w-3 h-3" />
              </a>
            ) : null}
            {!result.contact_email && !result.website && '-'}
          </div>
        </td>
        <td className="px-6 py-4 text-right">
          {result.confidence_score ? (
            <div className="flex items-center justify-end gap-2">
              <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full", 
                    result.confidence_score > 0.8 ? "bg-emerald-500" : "bg-amber-500"
                  )}
                  style={{ width: `${result.confidence_score * 100}%` }}
                />
              </div>
              <span className="text-slate-400 font-mono">{(result.confidence_score * 100).toFixed(0)}%</span>
            </div>
          ) : (
            <span className="text-slate-600">-</span>
          )}
        </td>
      </tr>
      
      {/* Expanded Detail View */}
      {isExpanded && (
        <tr>
          <td colSpan={5} className="px-0 py-0 border-b-0">
            <div className="bg-slate-900/50 p-6 shadow-inner border-y border-slate-800">
              <div className="grid grid-cols-2 gap-8 whitespace-normal">
                
                {/* Left Column: Context */}
                <div className="space-y-4">
                  {result.source_url && (
                    <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/40 flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5 font-medium shrink-0">
                        <Globe className="w-3.5 h-3.5 text-brand-secondary" /> Source Page URL:
                      </span>
                      <a 
                        href={result.source_url}
                        target="_blank" 
                        rel="noreferrer"
                        title={result.source_url}
                        className="text-brand-primary hover:underline font-mono truncate max-w-[320px] ml-2"
                      >
                        {result.source_url} <ExternalLink className="w-3 h-3 inline ml-1" />
                      </a>
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">AI Summary</h4>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {result.summary || 'No summary generated.'}
                    </p>
                  </div>
                  
                  {isWarning && result.review_notes && (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                      <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Review Diagnostics
                      </h4>
                      <code className="text-xs text-red-300 font-mono break-words whitespace-pre-wrap block mt-2">
                        {result.review_notes}
                      </code>
                    </div>
                  )}
                </div>

                {/* Right Column: Key Data Points */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Extracted Metadata</h4>
                  {result.key_data_points && Object.keys(result.key_data_points).length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(result.key_data_points).map(([key, val]) => (
                        <div key={key} className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">
                          <div className="text-xs text-slate-500 mb-1 font-mono truncate" title={key}>{key}</div>
                          <div className="text-sm text-slate-200 font-medium truncate" title={String(val)}>
                            {String(val)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No additional metadata extracted.</p>
                  )}
                </div>
                
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
