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
    <div className="max-w-[1600px] mx-auto space-y-6 wi-enter flex flex-col h-[calc(100vh-6rem)]">
      
      {/* Header */}
      <div className="flex justify-between items-end shrink-0 border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1 font-mono">
            <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
              Intelligence Warehouse
            </span>
          </div>
          <h1 className="font-serif text-2xl font-medium tracking-tight text-[var(--foreground)] flex items-center gap-3">
            Results Database
          </h1>
          <p className="text-[var(--muted-foreground)] text-xs font-mono mt-1">
            Select a search job to view and export its extracted intelligence.
          </p>
        </div>
        
        <div className="flex items-center gap-3 font-mono">
          <button 
            onClick={handleManualRefresh} 
            disabled={!selectedJobId || loading}
            className="border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs text-[var(--muted-foreground)] hover:border-[var(--foreground)] hover:text-[var(--foreground)] transition-colors rounded-sm disabled:opacity-40"
            title="Refresh database results"
          >
            <RefreshCw className={cn("size-3.5 text-[var(--primary)]", loading && "animate-spin")} />
          </button>
          
          {/* Primary Action: Export CSV for currently selected/filtered view */}
          <button 
            onClick={() => handleExport()} 
            disabled={!selectedJobId || results.length === 0}
            className="border border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] text-xs uppercase tracking-[0.12em] px-4 py-2 hover:bg-[var(--primary)]/90 transition-colors flex items-center gap-2 rounded-sm disabled:opacity-40 disabled:border-[var(--border)] disabled:bg-[var(--muted)] disabled:text-[var(--muted-foreground)]"
            title="Export CSV for selected search"
          >
            <Download className="size-3.5" />
            {selectedJobId ? 'Export Site CSV' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        
        {/* Left Sidebar: Jobs List */}
        <div className="w-1/3 max-w-sm border border-[var(--border)] bg-[var(--card)] flex flex-col overflow-hidden shrink-0 rounded-sm shadow-sm">
          <div className="p-3 border-b border-[var(--border)] bg-[var(--muted)]/50 text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--muted-foreground)] flex justify-between items-center font-medium">
            <span>Your Searches</span>
            <span className="bg-[var(--background)] text-[var(--foreground)] py-0.5 px-2 text-[10px] font-mono border border-[var(--border)] rounded-sm">{jobs.length}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono">
            {loadingJobs ? (
              <div className="p-8 text-center text-[var(--muted-foreground)] text-xs">
                <RefreshCw className="size-4 animate-spin mx-auto mb-2 text-[var(--primary)]" />
                Loading searches...
              </div>
            ) : jobs.length === 0 ? (
              <div className="p-8 text-center text-[var(--muted-foreground)] text-xs">
                No searches found.<br/>Go to the Dashboard to dispatch a job.
              </div>
            ) : (
              jobs.map(job => (
                <div
                  key={job.id}
                  role="button"
                  onClick={() => setSelectedJobId(job.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-sm flex items-center justify-between gap-3 transition-colors duration-150 group cursor-pointer border",
                    selectedJobId === job.id 
                      ? "border-[var(--primary)] bg-[var(--sidebar-accent)] text-[var(--foreground)] font-medium" 
                      : "border-transparent text-[var(--muted-foreground)] hover:border-[var(--border)] hover:text-[var(--foreground)]"
                  )}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span className={cn(
                      "grid size-7 shrink-0 place-items-center border border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] rounded-sm",
                      selectedJobId === job.id && "border-[var(--primary)] text-[var(--primary)]"
                    )}>
                      {job.input_type === 'domain' ? <Globe className="size-3.5" strokeWidth={1.75} /> : <Search className="size-3.5" strokeWidth={1.75} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-xs truncate font-medium",
                        selectedJobId === job.id ? "text-[var(--foreground)]" : "text-[var(--foreground)]/80"
                      )} title={job.input_value}>
                        {job.input_value}
                      </p>
                      <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5 uppercase tracking-wider flex justify-between">
                        <span>{new Date(job.created_at).toLocaleDateString()}</span>
                        <span className={cn(
                          job.status === 'done' ? "text-[var(--ok)]" :
                          job.status === 'failed' ? "text-destructive" : "text-[var(--work)]"
                        )}>{job.status}</span>
                      </p>
                    </div>
                  </div>
                  
                  {/* Additive Per-Site Independent Export Button */}
                  <button
                    onClick={(e) => handleExport(job.id, job.input_value, e)}
                    title={`Export CSV for ${job.input_value} independently`}
                    className="p-1.5 rounded-sm bg-[var(--background)] hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)] text-[var(--muted-foreground)] border border-[var(--border)] transition-colors shrink-0 ml-1"
                  >
                    <Download className="size-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Area: Results Data Table */}
        <div className="flex-1 border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm flex flex-col rounded-sm">
          <div className="p-3 border-b border-[var(--border)] flex gap-3 items-center bg-[var(--muted)]/40 shrink-0 font-mono">
            <Filter className="size-4 text-[var(--muted-foreground)]" />
            <input 
              type="text" 
              placeholder="Filter by company name or industry..." 
              className="flex-1 h-9 px-3 border border-[var(--input)] bg-[var(--background)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--primary)] rounded-sm"
              disabled
            />
            <select className="h-9 px-3 border border-[var(--input)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] rounded-sm" disabled>
              <option>All Statuses</option>
              <option>Cleaned</option>
              <option>Needs Review</option>
            </select>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs whitespace-nowrap font-mono border-collapse">
              <thead className="bg-[var(--background)] text-[var(--muted-foreground)] font-medium uppercase tracking-[0.18em] text-[10px] border-b border-[var(--border)] sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Company</th>
                  <th className="px-5 py-3 font-medium">Industry</th>
                  <th className="px-5 py-3 font-medium">Contact</th>
                  <th className="px-5 py-3 text-right font-medium">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/60">
                {!selectedJobId ? (
                   <tr>
                     <td colSpan={5} className="px-6 py-24 text-center">
                       <Database className="size-10 mx-auto mb-3 opacity-30 text-[var(--muted-foreground)]" />
                       <p className="font-serif text-lg font-medium text-[var(--foreground)]">Select a Search</p>
                       <p className="text-xs mt-1 max-w-sm mx-auto text-[var(--muted-foreground)] font-mono">
                         Click on a job from the left ledger to view its extracted records here.
                       </p>
                     </td>
                   </tr>
                ) : loading && results.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-24 text-center text-[var(--muted-foreground)] font-mono text-xs">
                      <RefreshCw className="size-5 animate-spin mx-auto mb-2 text-[var(--primary)]" />
                      Loading extracted records...
                    </td>
                  </tr>
                ) : results.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-24 text-center">
                      <Database className="size-10 mx-auto mb-3 opacity-30 text-[var(--muted-foreground)]" />
                      <p className="font-serif text-lg font-medium text-[var(--foreground)]">No Data Extracted</p>
                      <p className="text-xs mt-1 max-w-sm mx-auto text-[var(--muted-foreground)] font-mono">
                        No valid structured records were found for this search item.
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
          "hover:bg-[var(--accent)]/50 cursor-pointer transition-colors font-mono border-b border-[var(--border)]/60 align-middle",
          isExpanded && "bg-[var(--sidebar-accent)]"
        )}
      >
        <td className="px-5 py-3">
          {isWarning ? (
            <span className="inline-flex items-center gap-1.5 border border-amber-500/30 bg-amber-500/10 text-amber-700 px-2 py-0.5 rounded-full text-[11px] font-medium">
              <AlertTriangle className="size-3" /> Review
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 border border-[var(--ok)]/30 bg-[var(--ok)]/10 text-[var(--ok)] px-2 py-0.5 rounded-full text-[11px] font-medium">
              <CheckCircle className="size-3" /> Cleaned
            </span>
          )}
        </td>
        
        <td className="px-5 py-3 font-serif text-sm font-semibold text-[var(--foreground)]">
          {result.company_name || 'Unknown Entity'}
        </td>
        
        <td className="px-5 py-3 text-xs text-[var(--muted-foreground)] font-mono">
          {result.industry || '—'}
        </td>
        
        <td className="px-5 py-3 text-xs text-[var(--muted-foreground)] font-mono">
          {result.contact_email || result.website || '—'}
        </td>
        
        <td className="px-5 py-3 text-right font-mono text-xs tabular-nums text-[var(--foreground)]">
          {result.confidence_score ? `${Math.round(result.confidence_score * 100)}%` : '—'}
        </td>
      </tr>
      
      {/* Expanded Detail View */}
      {isExpanded && (
        <tr className="bg-[var(--muted)]/30 border-b border-[var(--border)]">
          <td colSpan={5} className="p-4 font-mono text-xs">
            <div className="p-4 border border-[var(--border)] bg-[var(--card)] rounded-sm space-y-4">
              <div className="flex justify-between items-start border-b border-[var(--border)] pb-3">
                <div>
                  <h4 className="font-serif text-base font-medium text-[var(--foreground)]">{result.company_name}</h4>
                  {result.website && (
                    <a 
                      href={result.website.startsWith('http') ? result.website : `https://${result.website}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[11px] text-[var(--primary)] hover:underline flex items-center gap-1 mt-0.5"
                    >
                      {result.website} <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">Confidence Score</span>
                  <div className="font-bold text-sm text-[var(--foreground)] tabular-nums">{result.confidence_score ? `${Math.round(result.confidence_score * 100)}%` : 'N/A'}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-[var(--muted-foreground)] block uppercase">Email</span>
                  <span className="text-[var(--foreground)]">{result.contact_email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--muted-foreground)] block uppercase">Phone</span>
                  <span className="text-[var(--foreground)]">{result.contact_phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--muted-foreground)] block uppercase">Location</span>
                  <span className="text-[var(--foreground)]">{result.address || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--muted-foreground)] block uppercase">Source Page URL</span>
                  {result.source_url ? (
                    <a href={result.source_url} target="_blank" rel="noreferrer" className="text-[var(--primary)] hover:underline flex items-center gap-1 truncate max-w-[180px]">
                      {result.source_url.replace(/^https?:\/\//, '')} <ExternalLink className="size-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-[var(--muted-foreground)]">N/A</span>
                  )}
                </div>
              </div>

              {result.summary && (
                <div className="pt-2 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)] leading-relaxed">
                  <span className="font-medium text-[var(--foreground)]">Summary: </span>
                  {result.summary}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
